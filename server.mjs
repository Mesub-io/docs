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
app.handle = (request, options) => {
  if (request.headers.get('x-forwarded-proto') !== 'https') return handle(request, options);
  const url = new URL(request.url);
  url.protocol = 'https:';
  return handle(new Request(url, request), options);
};

await app.listen(Number(process.env.PORT || 3000), process.env.HOST || '::');
