import settings from './settings.json';
import {projects} from './site/data/projects';

/**
 * What the server says about a Halftone URL before the React app draws it: title,
 * description, canonical path and status (404 for unknown paths, noindex for /admin).
 * `path` has no leading or trailing slash: '', 'work', 'work/quillon', 'admin/bookings'…
 */
export function halftonePage(rawPath: string) {
  const path = rawPath.replace(/^\/+|\/+$/g, '');
  const [section = '', slug, extra] = path.split('/');
  const name = settings.name;
  const PAGES: Record<string, {title: string; description: string}> = {
    '': {title: `${name} — ${settings.tagline}`, description: settings.description},
    work: {title: `Work · ${name}`, description: `Selected case studies from ${name}: brand, product and web.`},
    studio: {title: `Studio · ${name}`, description: `The people, principles and places behind ${name}.`},
    pricing: {title: `Pricing · ${name}`, description: `Plans and a live estimate for working with ${name}.`},
    journal: {title: `Journal · ${name}`, description: `Notes on process and craft from the ${name} studio.`},
    contact: {title: `Contact · ${name}`, description: `Tell ${name} about your project.`},
  };
  if (section === 'admin') {
    return {status: 200, title: `Admin · ${name}`, description: settings.description, canonical: null, noindex: true};
  }
  const project = section === 'work' && slug ? projects.find(p => p.slug === slug) : undefined;
  const known =
    !extra &&
    section in PAGES &&
    (!slug || (section === 'work' && !!project) || (section === 'journal' && /^[a-z0-9-]{1,80}$/.test(slug)));
  if (!known) return {status: 404, title: `Not found · ${name}`, description: settings.description, canonical: null, noindex: true};
  return {
    status: 200,
    title: project ? `${project.client} · ${name}` : PAGES[section].title,
    description: PAGES[section].description,
    canonical: path ? `/${path}/` : '/',
    noindex: false,
  };
}
