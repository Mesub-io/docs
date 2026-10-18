// The built site, served on every address, IPv6 included (#73). Holocron's own
// entry listens on 0.0.0.0, which Fly's private network (IPv6 only, where the
// Cloudflare Tunnel comes from) never reaches. Importing it does not start it.
import { app } from './dist/rsc/index.js';

await app.listen(Number(process.env.PORT || 3000), process.env.HOST || '::');
