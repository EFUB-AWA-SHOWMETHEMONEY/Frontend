import { readFile, mkdir, writeFile } from 'node:fs/promises';

// Extract only the embedded static scene, never the full SVG screen or its UI paths.
const source = new URL('../design-reference/screens/경매장_public.svg', import.meta.url);
const svg = await readFile(source, 'utf8');
const image = svg.match(
  /<image\b[^>]*id="image0_[^"]+"[^>]*width="1920"[^>]*height="1080"[^>]*xlink:href="data:image\/png;base64,([^"]+)"/,
);
if (!image) throw new Error('Expected separate 1920×1080 scene PNG was not found.');
const destination = new URL('../public/assets/auction/', import.meta.url);
await mkdir(destination, { recursive: true });
await writeFile(new URL('room-scene.png', destination), Buffer.from(image[1], 'base64'));
