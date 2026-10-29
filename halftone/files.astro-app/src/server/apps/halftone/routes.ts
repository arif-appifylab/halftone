import {Hono} from 'hono';

import {completeUpload, createUpload, publicFileUrl} from '../../../platform/files';
import {problem, requireAuth, requirePermission, withDb, withViewer} from '../../../platform/guards';
import {buildAvailability, locationLabel} from '../../../apps/halftone/shared/booking';
import {googleCalendarUrl} from '../../../apps/halftone/shared/calendar';
import {readingTimeFromDoc, sanitizeDoc} from '../../../apps/halftone/shared/richtext';
import type {BookingConfirmation, PublicBookingPage, Stats} from '../../../apps/halftone/shared/types';
import {addDays, dateInTz, tzLabel, zonedToUtc} from '../../../apps/halftone/shared/tz';
import settings from '../../../apps/halftone/settings.json';
import {
  getAvailabilityLine,
  getBookingSettings,
  liveBookings,
  overLimit,
  seedOnce,
  setSetting,
  toBooking,
  toInquiry,
  toPost,
} from './store';
import {
  bookingSchema,
  bookingSettingsSchema,
  bookingUpdateSchema,
  idOf,
  INQUIRY_STATUSES,
  inquirySchema,
  inquiryUpdateSchema,
  json,
  postSchema,
  settingsSchema,
  uploadSchema,
} from './validate';

/**
 * Who may use the Halftone admin screens (/admin/*). Owners hold
 * every permission; give it to other roles in Dashboard → Roles once the owner's
 * AI has added it to the site's catalogue (see APP.md).
 */
export const HALFTONE_MANAGE = 'site:halftone:manage';

const PAGE = 50;
const INQUIRY_PAGE = 200;
const DAY = 86_400_000;
const notFound = (what: string) => problem('not_found', `${what} not found.`);
const slotTaken = problem('slot_taken', 'Someone just booked that slot. Please pick another.');
const isUniqueViolation = (err: unknown) => String((err as Error)?.message ?? err).includes('23505') || String(err).includes('Unique constraint');

/* ── Public ──────────────────────────────────────────────── */

const publicRoutes = new Hono()
  .get('/settings', withDb, async c => {
    c.header('Cache-Control', 'public, max-age=60');
    return c.json({availability: await getAvailabilityLine(c.var.db)});
  })
  .get('/posts', withDb, async c => {
    await seedOnce(c.var.db);
    const rows = await c.var.db.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM app_halftone_posts WHERE published = true ORDER BY published_at DESC, id DESC LIMIT ${PAGE}`;
    c.header('Cache-Control', 'public, max-age=60');
    return c.json(rows.map(toPost));
  })
  .get('/posts/:slug', withDb, async c => {
    await seedOnce(c.var.db);
    const slug = c.req.param('slug').slice(0, 80);
    const rows = await c.var.db.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM app_halftone_posts WHERE slug = ${slug} AND published = true LIMIT 1`;
    if (!rows[0]) return c.json(notFound('Post'), 404);
    c.header('Cache-Control', 'public, max-age=60');
    return c.json(toPost(rows[0]));
  })
  .post('/inquiries', json(inquirySchema), withDb, async c => {
    const data = c.req.valid('json');
    // Honeypot filled → pretend success, store nothing.
    if (data.website) return c.json({ok: true}, 201);
    if (await overLimit(c, c.var.db, 'inquiry', 8, 60 * 60 * 1000)) {
      return c.json(problem('rate_limited', 'Too many messages from here. Try again in an hour.'), 429);
    }
    const estimate = data.estimate ? JSON.stringify(data.estimate) : null;
    await c.var.db.$executeRaw`
      INSERT INTO app_halftone_inquiries (name, email, company, budget, services, message, estimate)
      VALUES (${data.name}, ${data.email}, ${data.company}, ${data.budget}, ${JSON.stringify(data.services)}::jsonb,
        ${data.message}, ${estimate}::jsonb)`;
    return c.json({ok: true}, 201);
  })
  .get('/bookings/availability', withDb, async c => {
    const db = c.var.db;
    const booking = await getBookingSettings(db);
    const asked = Number(c.req.query('duration'));
    const duration = booking.durations.includes(asked) ? asked : booking.durations[0];
    const today = dateInTz(new Date(), booking.timezone);
    const days = buildAvailability(booking, await liveBookings(db, addDays(today, -1), addDays(today, booking.windowDays + 1)), duration);
    const {type, address} = booking.location;
    const page: PublicBookingPage = {
      name: booking.name,
      description: booking.description,
      durations: booking.durations,
      duration,
      timezone: booking.timezone,
      timezoneLabel: tzLabel(booking.timezone),
      location: {type, label: locationLabel(type), address: type === 'in_person' ? address : ''},
      questions: booking.questions,
      acceptingBookings: booking.acceptingBookings,
      days,
    };
    c.header('Cache-Control', 'no-store');
    return c.json(page);
  })
  .post('/bookings', json(bookingSchema), withDb, async c => {
    const db = c.var.db;
    const data = c.req.valid('json');
    const booking = await getBookingSettings(db);
    if (!booking.acceptingBookings) return c.json(problem('bookings_paused', 'Bookings are paused right now.'), 400);
    if (!booking.durations.includes(data.duration)) return c.json(problem('bad_duration', 'That meeting length isn’t offered.'), 400);
    for (const [field, value, label] of [
      ['phone', data.phone, 'phone number'],
      ['company', data.company, 'company'],
      ['notes', data.note, 'note'],
    ] as const) {
      if (booking.questions[field] === 'required' && !value) return c.json(problem('invalid_input', `Please add your ${label}.`), 422);
    }
    if (await overLimit(c, db, 'booking', 6, 60 * 60 * 1000)) {
      return c.json(problem('rate_limited', 'Too many bookings from here. Try again in an hour.'), 429);
    }
    // Re-check against the live schedule: never trust the client's calendar.
    const today = dateInTz(new Date(), booking.timezone);
    const days = buildAvailability(booking, await liveBookings(db, addDays(today, -1), addDays(today, booking.windowDays + 1)), data.duration);
    const slot = days.find(d => d.date === data.date)?.slots.find(s => s.time === data.time);
    if (!slot) return c.json(problem('not_bookable', 'That time isn’t bookable.'), 400);
    if (!slot.available) return c.json(slotTaken, 409);

    const {type, customUrl, address} = booking.location;
    const meetingUrl = type === 'custom' ? customUrl : '';
    const where = type === 'in_person' ? address : '';
    try {
      await db.$executeRaw`
        INSERT INTO app_halftone_bookings (date, time, duration, name, email, phone, company, note, guest_tz, location_type, meeting_url, address)
        VALUES (${data.date}, ${data.time}, ${data.duration}, ${data.name}, ${data.email},
          ${booking.questions.phone === 'hidden' ? '' : data.phone},
          ${booking.questions.company === 'hidden' ? '' : data.company},
          ${booking.questions.notes === 'hidden' ? '' : data.note},
          ${validTz(data.timezone)}, ${type}, ${meetingUrl}, ${where})`;
    } catch (err) {
      if (isUniqueViolation(err)) return c.json(slotTaken, 409);
      throw err;
    }

    const start = zonedToUtc(data.date, data.time, booking.timezone);
    const end = new Date(start.getTime() + data.duration * 60_000);
    const confirmation: BookingConfirmation = {
      date: data.date,
      time: data.time,
      duration: data.duration,
      timezoneLabel: tzLabel(booking.timezone, start),
      locationType: type,
      locationLabel: locationLabel(type),
      meetingUrl,
      address: where,
      calendarUrl: googleCalendarUrl({
        start,
        end,
        title: `${booking.name} · ${settings.name}`,
        details: `${data.duration}-minute ${booking.name.toLowerCase()} with ${settings.name}.${meetingUrl ? `\n\nJoin: ${meetingUrl}` : ''}`,
        location: (where || meetingUrl) || undefined,
      }),
    };
    return c.json({ok: true, confirmation}, 201);
  });

function validTz(tz?: string) {
  if (!tz) return '';
  try {
    new Intl.DateTimeFormat('en-US', {timeZone: tz});
    return tz;
  } catch {
    return '';
  }
}

/* ── Admin (/admin/*) ───────────────────────── */

type Db = Parameters<typeof getBookingSettings>[0];
const count = async (db: Db, query: Promise<{n: bigint}[]>) => Number((await query)[0]?.n ?? 0);

async function bookingSummary(db: Db) {
  const booking = await getBookingSettings(db);
  const today = dateInTz(new Date(), booking.timezone);
  const days = buildAvailability(booking, await liveBookings(db, addDays(today, -1), addDays(today, booking.windowDays + 1)), booking.durations[0]);
  return {
    settings: booking,
    timezoneLabel: tzLabel(booking.timezone),
    preview: {days: days.length, openSlots: days.reduce((n, d) => n + d.slots.filter(x => x.available).length, 0), next: days[0] ?? null},
  };
}

const adminRoutes = new Hono()
  .use(withViewer, requireAuth, requirePermission(HALFTONE_MANAGE), withDb)
  .get('/stats', async c => {
    const db = c.var.db;
    await seedOnce(db);
    const {timezone} = await getBookingSettings(db);
    const today = dateInTz(new Date(), timezone);
    const since = new Date(Date.now() - 13 * DAY);
    since.setUTCHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * DAY);

    const [perDay, open, total, fresh, last7, upcoming, todayCount, published, drafts, recent, next] = await Promise.all([
      db.$queryRaw<{d: string; n: bigint}[]>`
        SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS d, COUNT(*) AS n
        FROM app_halftone_inquiries WHERE created_at >= ${since} GROUP BY d`,
      // Pipeline = sum of attached estimates on open leads.
      db.$queryRaw<{sum: number | null}[]>`
        SELECT SUM(COALESCE((estimate->>'estimate')::numeric, 0))::float8 AS sum FROM app_halftone_inquiries
        WHERE status IN ('new', 'contacted', 'proposal') AND estimate IS NOT NULL`,
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_inquiries`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_inquiries WHERE status = 'new'`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_inquiries WHERE created_at >= ${weekAgo}`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_bookings WHERE status = 'confirmed' AND date >= ${today}`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_bookings WHERE status = 'confirmed' AND date = ${today}`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_posts WHERE published = true`),
      count(db, db.$queryRaw`SELECT COUNT(*) AS n FROM app_halftone_posts WHERE published = false`),
      db.$queryRaw<Record<string, unknown>[]>`SELECT * FROM app_halftone_inquiries ORDER BY created_at DESC, id DESC LIMIT 5`,
      db.$queryRaw<Record<string, unknown>[]>`
        SELECT * FROM app_halftone_bookings WHERE status = 'confirmed' AND date >= ${today} ORDER BY date, time LIMIT 5`,
    ]);
    const series = Array.from({length: 14}, (_, i) => {
      const key = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
      return {date: key, count: Number(perDay.find(r => r.d === key)?.n ?? 0)};
    });
    const stats: Stats = {
      inquiries: {total, new: fresh, last7},
      bookings: {upcoming, today: todayCount},
      pipeline: open[0]?.sum ?? 0,
      posts: {published, drafts},
      series,
      recentInquiries: recent.map(toInquiry),
      upcomingBookings: next.map(toBooking),
    };
    return c.json(stats);
  })

  /* Inquiries: newest first, keyset paged (`before` = the last id seen). */
  .get('/inquiries', async c => {
    const db = c.var.db;
    const status = c.req.query('status') ?? '';
    const q = (c.req.query('q') ?? '').trim().slice(0, 100);
    const before = Number(c.req.query('before')) || null;
    const byStatus = (INQUIRY_STATUSES as readonly string[]).includes(status) ? status : null;
    const like = q ? `%${q.replace(/[\\%_]/g, m => `\\${m}`)}%` : null;
    const rows = await db.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM app_halftone_inquiries
      WHERE (${byStatus}::text IS NULL OR status = ${byStatus})
        AND (${like}::text IS NULL OR name ILIKE ${like} OR email ILIKE ${like} OR company ILIKE ${like} OR message ILIKE ${like})
        AND (${before}::bigint IS NULL OR id < ${before})
      ORDER BY id DESC LIMIT ${INQUIRY_PAGE + 1}`;
    const counts = await db.$queryRaw<{status: string; n: bigint}[]>`
      SELECT status, COUNT(*) AS n FROM app_halftone_inquiries GROUP BY status`;
    const items = rows.slice(0, INQUIRY_PAGE).map(toInquiry);
    return c.json({
      items,
      counts: Object.fromEntries(counts.map(r => [r.status, Number(r.n)])),
      nextBefore: rows.length > INQUIRY_PAGE ? items.at(-1)!.id : null,
    });
  })
  .patch('/inquiries/:id', json(inquiryUpdateSchema), async c => {
    const id = idOf(c);
    if (!id) return c.json(notFound('Inquiry'), 404);
    const data = c.req.valid('json');
    const rows = await c.var.db.$queryRaw<Record<string, unknown>[]>`
      UPDATE app_halftone_inquiries
      SET status = COALESCE(${data.status ?? null}, status), notes = COALESCE(${data.notes ?? null}, notes), updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return rows[0] ? c.json(toInquiry(rows[0])) : c.json(notFound('Inquiry'), 404);
  })
  .delete('/inquiries/:id', async c => {
    const id = idOf(c);
    const n = id ? await c.var.db.$executeRaw`DELETE FROM app_halftone_inquiries WHERE id = ${id}` : 0;
    return n ? c.json({ok: true}) : c.json(notFound('Inquiry'), 404);
  })

  /* Bookings: the latest 500, newest first; the admin splits upcoming / past / cancelled. */
  .get('/bookings', async c => {
    const rows = await c.var.db.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM app_halftone_bookings ORDER BY date DESC, time DESC LIMIT 500`;
    return c.json(rows.map(toBooking));
  })
  .patch('/bookings/:id', json(bookingUpdateSchema), async c => {
    const db = c.var.db;
    const id = idOf(c);
    if (!id) return c.json(notFound('Booking'), 404);
    const data = c.req.valid('json');
    try {
      const rows = await db.$queryRaw<Record<string, unknown>[]>`
        UPDATE app_halftone_bookings
        SET status = COALESCE(${data.status ?? null}, status),
            meeting_url = COALESCE(${data.meetingUrl ?? null}, meeting_url),
            address = COALESCE(${data.address ?? null}, address)
        WHERE id = ${id} RETURNING *`;
      return rows[0] ? c.json(toBooking(rows[0])) : c.json(notFound('Booking'), 404);
    } catch (err) {
      // Re-confirming a cancelled booking whose slot was taken since.
      if (isUniqueViolation(err)) return c.json(problem('slot_taken', 'That slot has been booked by someone else.'), 409);
      throw err;
    }
  })
  .delete('/bookings/:id', async c => {
    const id = idOf(c);
    const n = id ? await c.var.db.$executeRaw`DELETE FROM app_halftone_bookings WHERE id = ${id}` : 0;
    return n ? c.json({ok: true}) : c.json(notFound('Booking'), 404);
  })

  /* Journal */
  .get('/posts', async c => {
    await seedOnce(c.var.db);
    const rows = await c.var.db.$queryRaw<Record<string, unknown>[]>`
      SELECT id, slug, title, excerpt, category, author, reading_time, palette, cover, '{"type":"doc","content":[]}'::jsonb AS body,
        published, published_at, created_at, updated_at
      FROM app_halftone_posts ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT 200`;
    return c.json(rows.map(toPost));
  })
  .get('/posts/:id', async c => {
    const id = idOf(c);
    const rows = id ? await c.var.db.$queryRaw<Record<string, unknown>[]>`SELECT * FROM app_halftone_posts WHERE id = ${id}` : [];
    return rows[0] ? c.json(toPost(rows[0])) : c.json(notFound('Post'), 404);
  })
  .post('/posts', json(postSchema), async c => {
    const saved = await savePost(c.var.db, null, c.req.valid('json'));
    return c.json(saved.body, saved.status);
  })
  .put('/posts/:id', json(postSchema), async c => {
    const id = idOf(c);
    if (!id) return c.json(notFound('Post'), 404);
    const saved = await savePost(c.var.db, id, c.req.valid('json'));
    return c.json(saved.body, saved.status);
  })
  .delete('/posts/:id', async c => {
    const id = idOf(c);
    const n = id ? await c.var.db.$executeRaw`DELETE FROM app_halftone_posts WHERE id = ${id}` : 0;
    return n ? c.json({ok: true}) : c.json(notFound('Post'), 404);
  })

  /* Images (post covers, images in posts): the platform's file storage, PUBLIC files. */
  .post('/uploads', json(uploadSchema), async c => {
    const input = c.req.valid('json');
    const name = input.name.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'image';
    // No Site Key (a local copy without the platform): storage can't be reached at all.
    const grant = await createUpload(c.req.url, {name, contentType: input.contentType, size: input.size, visibility: 'public'}).catch(
      () => ({ok: false, status: 503, code: 'E_STORAGE_UNAVAILABLE', message: ''}) as const
    );
    if (!grant.ok) return c.json(problem(grant.code, storageMessage(grant.code, grant.message)), grant.status === 402 ? 402 : 400);
    await c.var.db.$executeRaw`
      INSERT INTO app_halftone_uploads (file_id, name, content_type, size, uploaded_by)
      VALUES (${grant.data.file.id}, ${name}, ${input.contentType}, ${input.size}, ${c.var.viewer.id ?? null})`;
    return c.json({fileId: grant.data.file.id, upload: grant.data.upload}, 201);
  })
  .post('/uploads/:fileId/complete', async c => {
    const fileId = c.req.param('fileId').slice(0, 32);
    const rows = await c.var.db.$queryRaw<{name: string}[]>`SELECT name FROM app_halftone_uploads WHERE file_id = ${fileId}`;
    if (!rows[0]) return c.json(notFound('Upload'), 404);
    const done = await completeUpload(c.req.url, fileId).catch(
      () => ({ok: false, status: 503, code: 'E_STORAGE_UNAVAILABLE', message: 'Storage did not answer. Try again.'}) as const
    );
    if (!done.ok) return c.json(problem(done.code, done.message), 400);
    await c.var.db.$executeRaw`UPDATE app_halftone_uploads SET ready = true WHERE file_id = ${fileId}`;
    return c.json({url: publicFileUrl({id: fileId, name: rows[0].name})});
  })

  /* Settings */
  .get('/settings', async c => c.json({availability: await getAvailabilityLine(c.var.db)}))
  .put('/settings', json(settingsSchema), async c => {
    const {availability} = c.req.valid('json');
    await setSetting(c.var.db, 'availability', availability);
    return c.json({availability});
  })
  .get('/booking-settings', async c => c.json(await bookingSummary(c.var.db)))
  .put('/booking-settings', json(bookingSettingsSchema), async c => {
    await setSetting(c.var.db, 'booking', c.req.valid('json'));
    return c.json(await bookingSummary(c.var.db));
  });

type PostInput = ReturnType<typeof postSchema.parse>;

/** Storage errors in words for the studio (docs/agent/files.md). */
function storageMessage(code: string, fallback: string) {
  if (code === 'E_STORAGE_NEEDS_PACK' || code === 'E_STORAGE_OFF' || code === 'E_STORAGE_UNAVAILABLE') {
    return 'Image uploads need file storage: turn on Storage for this site in your EzyStudio dashboard. Until then, paste an image link instead.';
  }
  if (code === 'E_STORAGE_LIMIT') return 'Your storage is full. Delete files or add storage, or paste an image link instead.';
  return fallback;
}

/** Creates (`id` null) or updates a post; the answer's body and status. */
async function savePost(db: Db, id: number | null, p: PostInput): Promise<{body: object; status: 200 | 201 | 404 | 409}> {
  const clash = await db.$queryRaw<{id: bigint}[]>`SELECT id FROM app_halftone_posts WHERE slug = ${p.slug} AND id <> ${id ?? 0} LIMIT 1`;
  if (clash[0]) {
    return {body: {...problem('invalid_input', 'Another post already uses that slug.'), fields: {slug: 'Another post already uses that slug.'}}, status: 409};
  }
  const doc = sanitizeDoc(p.body);
  const body = JSON.stringify(doc);
  const palette = JSON.stringify(p.palette);
  const readingTime = readingTimeFromDoc(doc);
  if (id) {
    // First time it goes live, stamp the publish date; unpublishing keeps the original date.
    const rows = await db.$queryRaw<Record<string, unknown>[]>`
      UPDATE app_halftone_posts SET slug = ${p.slug}, title = ${p.title}, excerpt = ${p.excerpt}, category = ${p.category},
        author = ${p.author}, reading_time = ${readingTime}, palette = ${palette}::jsonb, cover = ${p.cover}, body = ${body}::jsonb,
        published = ${p.published}, published_at = CASE WHEN ${p.published} THEN COALESCE(published_at, now()) ELSE published_at END,
        updated_at = now()
      WHERE id = ${id} RETURNING *`;
    return rows[0] ? {body: toPost(rows[0]), status: 200} : {body: notFound('Post'), status: 404};
  }
  const rows = await db.$queryRaw<Record<string, unknown>[]>`
    INSERT INTO app_halftone_posts (slug, title, excerpt, category, author, reading_time, palette, cover, body, published, published_at)
    VALUES (${p.slug}, ${p.title}, ${p.excerpt}, ${p.category}, ${p.author}, ${readingTime}, ${palette}::jsonb, ${p.cover},
      ${body}::jsonb, ${p.published}, CASE WHEN ${p.published} THEN now() ELSE NULL END)
    RETURNING *`;
  return {body: toPost(rows[0]), status: 201};
}

/** The app's Site API, mounted at /site-api/apps/halftone/* (src/pages/site-api/apps/halftone/). */
export const routes = new Hono()
  .route('/', publicRoutes)
  .route('/admin', adminRoutes)
  .notFound(c => c.json(problem('not_found', 'No such Halftone endpoint.'), 404))
  .onError((err, c) => {
    console.error(`halftone ${c.req.method} ${new URL(c.req.url).pathname}: ${(err as Error).message}`);
    return c.json(problem('server_error', 'Something went wrong on our side. Try again.'), 500);
  });
