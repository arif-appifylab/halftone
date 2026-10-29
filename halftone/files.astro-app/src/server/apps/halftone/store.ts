import type {Context} from 'hono';

import {config} from '../../../platform/config';
import type {PrismaClient} from '../../../platform/db';
import {subjectHash} from '../../../platform/auth/keys';
import {defaultBookingSettings, type BookingSettings} from '../../../apps/halftone/shared/booking';
import {blocksToDoc, markdownToDoc, readingTimeFromDoc, sanitizeDoc, type RichDoc} from '../../../apps/halftone/shared/richtext';
import type {Booking, Inquiry, Post} from '../../../apps/halftone/shared/types';
import {seedPosts} from '../../../apps/halftone/site/data/journal';
import settings from '../../../apps/halftone/settings.json';

/**
 * Data access for the Halftone app. Its tables come from its own migration
 * (prisma/migrations/*_app_halftone_init); the site's Prisma schema doesn't
 * model them, so they are read and written with tagged SQL (parameters are
 * escaped). Every list is bounded.
 */

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? '' : String(v));
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? '' : new Date(String(v)).toISOString());
/** JSONB arrives parsed from one database driver and as text from another: accept both. */
const json = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return (v ?? fallback) as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};
const bool = (v: unknown) => v === true || v === 't' || v === 'true' || v === 1;

export const toInquiry = (r: Row): Inquiry => ({
  id: Number(r.id),
  name: s(r.name),
  email: s(r.email),
  company: s(r.company),
  budget: s(r.budget),
  services: json<unknown[]>(r.services, []).map(String),
  message: s(r.message),
  estimate: json<Inquiry['estimate']>(r.estimate, null),
  status: s(r.status) as Inquiry['status'],
  notes: s(r.notes),
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

export const toBooking = (r: Row): Booking => ({
  id: Number(r.id),
  date: s(r.date),
  time: s(r.time),
  duration: Number(r.duration ?? 30),
  name: s(r.name),
  email: s(r.email),
  phone: s(r.phone),
  company: s(r.company),
  note: s(r.note),
  status: s(r.status) as Booking['status'],
  locationType: (s(r.location_type) || 'later') as Booking['locationType'],
  meetingUrl: s(r.meeting_url),
  address: s(r.address),
  guestTz: s(r.guest_tz),
  createdAt: iso(r.created_at),
});

export const toPost = (r: Row): Post => ({
  id: Number(r.id),
  slug: s(r.slug),
  title: s(r.title),
  excerpt: s(r.excerpt),
  category: s(r.category) as Post['category'],
  author: s(r.author),
  readingTime: s(r.reading_time),
  palette: json<Post['palette']>(r.palette, ['#c8f53c', '#8e7cff']),
  cover: s(r.cover),
  body: parseBody(r.body),
  published: bool(r.published),
  publishedAt: r.published_at ? iso(r.published_at) : null,
  createdAt: iso(r.created_at),
  updatedAt: iso(r.updated_at),
});

/** Rich JSON body (sanitised again on read); a legacy markdown string is upgraded. */
function parseBody(raw: unknown): RichDoc {
  if (typeof raw === 'string') {
    const parsed = json<unknown>(raw, null);
    return parsed && typeof parsed === 'object' ? sanitizeDoc(parsed) : markdownToDoc(raw);
  }
  return sanitizeDoc(raw);
}

/* ── Settings ────────────────────────────────────────────── */

export async function getSetting<T>(db: PrismaClient, key: string, fallback: T): Promise<T> {
  const rows = await db.$queryRaw<{value: unknown}[]>`SELECT value FROM app_halftone_settings WHERE key = ${key}`;
  if (!rows[0]) return fallback;
  const value = rows[0].value;
  // A text setting (the availability line) is a JSON string: parsed already ("Booking…") or raw ('"Booking…"').
  if (typeof fallback === 'string' && typeof value === 'string') {
    const parsed = json<unknown>(value, value);
    return (typeof parsed === 'string' ? parsed : value) as T;
  }
  return json<T>(value, fallback);
}

export async function setSetting(db: PrismaClient, key: string, value: unknown) {
  const json = JSON.stringify(value);
  await db.$executeRaw`
    INSERT INTO app_halftone_settings (key, value) VALUES (${key}, ${json}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

export const getAvailabilityLine = (db: PrismaClient) => getSetting(db, 'availability', settings.availability);

export async function getBookingSettings(db: PrismaClient): Promise<BookingSettings> {
  const base = defaultBookingSettings(settings.timezone);
  const raw = await getSetting<Partial<BookingSettings>>(db, 'booking', {});
  const merged: BookingSettings = {
    ...base,
    ...raw,
    location: {...base.location, ...raw.location},
    questions: {...base.questions, ...raw.questions},
  };
  // A custom link with no URL can't be booked: the studio sends the link instead.
  if (merged.location.type === 'custom' && !merged.location.customUrl) merged.location = {...merged.location, type: 'later'};
  return merged;
}

/** Live (non-cancelled) bookings in a date range. */
export function liveBookings(db: PrismaClient, from: string, to: string) {
  return db.$queryRaw<{date: string; time: string; duration: number}[]>`
    SELECT date, time, duration FROM app_halftone_bookings
    WHERE status <> 'cancelled' AND date BETWEEN ${from} AND ${to}
    LIMIT 5000`;
}

/* ── First run ───────────────────────────────────────────── */

/**
 * The journal's starter posts, written once. The `seeded` marker is set only
 * after they are in, and a slug is never inserted twice, so two first requests
 * (or a retry after a failure) are harmless. Owners can edit or delete them.
 */
export async function seedOnce(db: PrismaClient) {
  const done = await db.$queryRaw<{key: string}[]>`SELECT key FROM app_halftone_settings WHERE key = 'seeded'`;
  if (done[0]) return;
  for (const p of seedPosts) {
    const doc = blocksToDoc(p.body);
    const parsed = new Date(`${p.date} 09:00 UTC`);
    const at = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    await db.$executeRaw`
      INSERT INTO app_halftone_posts
        (slug, title, excerpt, category, author, reading_time, palette, cover, body, published, published_at, created_at, updated_at)
      VALUES (${p.slug}, ${p.title}, ${p.excerpt}, ${p.category}, ${p.author}, ${readingTimeFromDoc(doc)},
        ${JSON.stringify(p.palette)}::jsonb, ${p.cover}, ${JSON.stringify(doc)}::jsonb, true, ${at}, ${at}, ${at})
      ON CONFLICT (slug) DO NOTHING`;
  }
  await db.$executeRaw`
    INSERT INTO app_halftone_settings (key, value) VALUES ('seeded', 'true'::jsonb) ON CONFLICT (key) DO NOTHING`;
}

/* ── Rate limits ─────────────────────────────────────────── */

/**
 * True when this visitor made `max` or more `bucket` attempts in the last
 * `windowMs`; otherwise records this attempt. Keyed by a one-way hash of the IP.
 */
export async function overLimit(c: Context, db: PrismaClient, bucket: string, max: number, windowMs: number) {
  const ip = c.req.header('cf-connecting-ip') ?? 'local';
  const key = await subjectHash(config.jwtSecret ?? 'halftone', 'ip', `halftone:${bucket}:${ip}`);
  const since = new Date(Date.now() - windowMs);
  const rows = await db.$queryRaw<{n: bigint}[]>`
    SELECT COUNT(*) AS n FROM (
      SELECT 1 FROM app_halftone_attempts WHERE key = ${key} AND created_at >= ${since} LIMIT ${max}
    ) recent`;
  if (Number(rows[0]?.n ?? 0) >= max) return true;
  await db.$executeRaw`INSERT INTO app_halftone_attempts (key) VALUES (${key})`;
  // Old attempts are forgotten a little at a time, never in one big delete.
  const dayAgo = new Date(Date.now() - 86_400_000);
  await db.$executeRaw`
    DELETE FROM app_halftone_attempts WHERE id IN (
      SELECT id FROM app_halftone_attempts WHERE created_at < ${dayAgo} LIMIT 100
    )`;
  return false;
}
