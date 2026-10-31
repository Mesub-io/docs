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
  return withoutStack(await handle(request, options));
};

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
