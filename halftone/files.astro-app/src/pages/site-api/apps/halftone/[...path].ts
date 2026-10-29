import type {APIRoute} from 'astro';
import {Hono} from 'hono';
import {bodyLimit} from 'hono/body-limit';

import {csrf, problem, sameOrigin} from '../../../../platform/guards';
import {routes} from '../../../../server/apps/halftone/routes';

/** The one route file that mounts the Halftone Site API. Keep the sameOrigin and csrf guards. */
export const prerender = false;

const app = new Hono()
  .basePath('/site-api/apps/halftone')
  .use(sameOrigin)
  .use(csrf)
  .use(bodyLimit({maxSize: 64 * 1024, onError: c => c.json(problem('too_large', 'That is too much to send at once.'), 413)}))
  .route('/', routes);

export const ALL: APIRoute = ({request}) => app.fetch(request);
