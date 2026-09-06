// Same-origin proxy for Sleeper CDN images (headshots, team logos, avatars)
// used only by the Trade History image-export feature: html2canvas can't
// read pixels from a cross-origin image unless the remote server sends
// CORS headers, and Sleeper's CDN doesn't. Fetching it here (server-side,
// no CORS restriction) and re-serving it with an explicit
// Access-Control-Allow-Origin lets the browser draw it onto a canvas and
// actually export the result. Locked to sleepercdn.com only -- this is not
// a general-purpose proxy.
export default async function handler(req, res) {
  const { url } = req.query;
  if (typeof url !== 'string') {
    res.status(400).send('Missing url');
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    res.status(400).send('Invalid url');
    return;
  }
  if (parsed.hostname !== 'sleepercdn.com' && !parsed.hostname.endsWith('.sleepercdn.com')) {
    res.status(400).send('Only sleepercdn.com is allowed');
    return;
  }

  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      res.status(upstream.status).send('Upstream error');
      return;
    }
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(502).send('Fetch failed');
  }
}
