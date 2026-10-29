import type {Context} from 'hono';
import {validator} from 'hono/validator';
import {z} from 'zod';

import {problem} from '../../../platform/guards';
import {DURATION_OPTIONS} from '../../../apps/halftone/shared/booking';
import {isSafeImageSrc} from '../../../apps/halftone/shared/richtext';
import {isValidTz} from '../../../apps/halftone/shared/tz';

/**
 * Every body the Halftone Site API accepts, checked with zod. A bad body is
 * answered `422 {error: 'invalid_input', message, fields}`, never repaired.
 */
export function json<T extends z.ZodType>(schema: T) {
  return validator('json', (value, c) => {
    const result = schema.safeParse(value);
    if (result.success) return result.data as z.infer<T>;
    return invalid(c, result.error);
  });
}

function invalid(c: Context, error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  const first = error.issues[0];
  const field = first.path.join('.');
  return c.json({...problem('invalid_input', field ? `${field}: ${first.message}` : first.message), fields}, 422);
}

/** A positive integer `:id`, or null. */
export const idOf = (c: Context) => {
  const id = Number(c.req.param('id'));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const text = (max: number) => z.string().trim().max(max);

export const inquirySchema = z.object({
  name: text(120).min(2, 'Tell us who you are'),
  email: z.email('Enter a valid email').max(200),
  company: text(160).default(''),
  budget: text(60).default(''),
  services: z.array(text(40)).min(1, 'Pick at least one').max(10),
  message: text(5000).min(20, 'A little more detail, please (20+ characters)'),
  estimate: z
    .object({
      plan: text(40),
      seats: text(4).nullish(),
      commitment: text(40).nullish(),
      estimate: z.number().nonnegative().max(10_000_000).nullish(),
      extras: z.array(text(60)).max(10).optional(),
    })
    .nullish(),
  website: z.string().max(200).optional(), // honeypot
});

export const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  name: text(120).min(2, 'Enter your name'),
  email: z.email('Enter a valid email').max(200),
  duration: z.number().int().positive().max(240),
  phone: text(40).default(''),
  company: text(160).default(''),
  note: text(2000).default(''),
  /** Guest's IANA timezone (from the browser). */
  timezone: z.string().max(64).optional(),
});

export const INQUIRY_STATUSES = ['new', 'contacted', 'proposal', 'won', 'lost'] as const;

export const inquiryUpdateSchema = z
  .object({
    status: z.enum(INQUIRY_STATUSES).optional(),
    notes: text(10_000).optional(),
  })
  .refine(v => v.status !== undefined || v.notes !== undefined, 'Nothing to update');

const meetingUrl = z
  .string()
  .trim()
  .max(500)
  .refine(v => v === '' || /^https:\/\/[^\s]+$/i.test(v), 'Use a full https:// link');

export const bookingUpdateSchema = z
  .object({
    status: z.enum(['confirmed', 'completed', 'cancelled']).optional(),
    meetingUrl: meetingUrl.optional(),
    address: text(300).optional(),
  })
  .refine(v => v.status || v.meetingUrl !== undefined || v.address !== undefined, 'Nothing to update');

export const POST_CATEGORIES = ['Process', 'Craft', 'Studio', 'Notes'] as const;

export const postSchema = z.object({
  title: text(200).min(3, 'Title is too short'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes'),
  excerpt: text(400).default(''),
  category: z.enum(POST_CATEGORIES),
  author: text(120).min(2, 'Add the author'),
  palette: z.tuple([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.string().regex(/^#[0-9a-fA-F]{6}$/)]),
  cover: text(500)
    .default('')
    .refine(v => v === '' || isSafeImageSrc(v), 'Use an https:// image link or an Unsplash id (photo-…)'),
  body: z.unknown(), // sanitised structurally by sanitizeDoc on save
  published: z.boolean(),
});

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'] as const;

/** An image the admin is about to upload (the bytes go straight to file storage). */
export const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contentType: z.enum(IMAGE_TYPES, 'Use a PNG, JPEG, WebP, GIF or AVIF image'),
  size: z.number().int().min(1).max(8 * 1024 * 1024, 'That image is too large (max 8 MB)'),
});

export const settingsSchema = z.object({
  availability: text(120).min(3, 'Use at least 3 characters'),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

/** Ranges must start before they end and not overlap; returned sorted. */
const ranges = z
  .array(z.object({start: hhmm, end: hhmm.or(z.literal('24:00'))}))
  .max(12)
  .superRefine((rs, ctx) => {
    const sorted = [...rs].sort((a, b) => a.start.localeCompare(b.start));
    sorted.forEach((r, i) => {
      if (toMin(r.end) <= toMin(r.start)) ctx.addIssue({code: 'custom', message: `${r.start}–${r.end}: end must be after start`});
      if (i > 0 && toMin(r.start) < toMin(sorted[i - 1].end)) ctx.addIssue({code: 'custom', message: 'Hours overlap on the same day'});
    });
  })
  .transform(rs => [...rs].sort((a, b) => a.start.localeCompare(b.start)));

const question = z.enum(['hidden', 'optional', 'required']);

export const bookingSettingsSchema = z
  .object({
    name: text(80).min(2, 'Give the meeting a name'),
    description: text(1000).default(''),
    durations: z
      .array(z.number().int().refine(d => (DURATION_OPTIONS as readonly number[]).includes(d), 'Unsupported duration'))
      .min(1, 'Pick at least one duration')
      .max(DURATION_OPTIONS.length)
      .transform(d => [...new Set(d)].sort((a, b) => a - b)),
    acceptingBookings: z.boolean(),
    timezone: z.string().max(64).refine(isValidTz, 'Unknown timezone'),
    weekly: z.array(ranges).length(7),
    overrides: z
      .array(z.object({date: isoDate, unavailable: z.boolean(), ranges}))
      .max(366)
      .transform(o => [...new Map(o.map(x => [x.date, x])).values()].sort((a, b) => a.date.localeCompare(b.date))),
    bufferBefore: z.number().int().min(0).max(240),
    bufferAfter: z.number().int().min(0).max(240),
    minNoticeHours: z.number().int().min(0).max(24 * 30),
    windowDays: z.number().int().min(1, 'At least 1 day').max(365, 'At most 365 days'),
    maxPerDay: z.number().int().min(1).max(100).nullable(),
    slotInterval: z.number().int().min(5).max(240).nullable(),
    location: z.object({
      type: z.enum(['later', 'in_person', 'custom']),
      customUrl: meetingUrl,
      address: text(300),
    }),
    questions: z.object({phone: question, company: question, notes: question}),
  })
  .superRefine((s, ctx) => {
    if (s.location.type === 'custom' && !s.location.customUrl) ctx.addIssue({code: 'custom', path: ['location', 'customUrl'], message: 'Add the meeting link'});
    if (s.location.type === 'in_person' && !s.location.address) ctx.addIssue({code: 'custom', path: ['location', 'address'], message: 'Add the address'});
  });
