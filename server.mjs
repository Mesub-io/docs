// The built site, served on every address, IPv6 included (#73). Holocron's own
// entry listens on 0.0.0.0, which Fly's private network (IPv6 only, where the
// Cloudflare Tunnel comes from) never reaches. Importing it does not start it.
import { app } from './dist/rsc/index.js';

// Holocron writes the sitemap and each page's og:url from the request's
// address, which its server always builds as http://<host>: the tunnel reaches
// us over plain http (#92). Cloudflare says how the reader came in with
// X-Forwarded-Proto, set on every request whatever the client sent. listen()
// serves app.handle, so the swap takes effect there.
const handle = app.handle;
app.handle = async (request, options) => {
  if (request.headers.get('x-forwarded-proto') === 'https') {
    const url = new URL(request.url);
    url.protocol = 'https:';
    request = new Request(url, request);
  }
  return withCanonical(request, await withoutStack(await handle(request, options)));
};

// Every page names its one address (#119): Search Console found 55 pages it
// saw twice, mostly their http copies, and Holocron writes no
// <link rel="canonical">. Google reads the same thing from this header, on the
// page's own response, without touching Holocron's HTML. Pages only: an asset,
// a redirect or an error names nothing.
const CANONICAL_ORIGIN = 'https://docs.mesub.io';

function withCanonical(request, response) {
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.append('Link', `<${CANONICAL_ORIGIN}${new URL(request.url).pathname}>; rel="canonical"`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// spiceflow answers an error with its stack trace in the JSON body, whatever
// NODE_ENV says: file paths and line numbers a reader has no use for (#94). The
// message and the status stay; the log keeps the stack.
async function withoutStack(response) {
  if (response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    return response;
  }
  const body = await response.clone().json().catch(() => null);
  if (!body || typeof body !== 'object' || !('stack' in body)) return response;
  const { stack, ...rest } = body;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(JSON.stringify(rest), { status: response.status, headers });
}

await app.listen(Number(process.env.PORT || 3000), process.env.HOST || '::');
