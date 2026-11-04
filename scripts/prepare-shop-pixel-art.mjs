import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Keep the exported SVGs and embedded PNG bytes untouched. The copies only
// change how the SVG renderer samples its embedded raster image.
const sourceDirectory = new URL('../public/assets/items/', import.meta.url);
const outputDirectory = new URL('pixelated/', sourceDirectory);
await mkdir(outputDirectory, { recursive: true });
for (const filename of await readdir(sourceDirectory)) {
  if (!filename.endsWith('.svg')) continue;
  const source = await readFile(new URL(encodeURIComponent(filename), sourceDirectory), 'utf8');
  if (!source.includes('<image ')) throw new Error(`No embedded image: ${filename}`);
  const root = source.match(/<svg\b[^>]*>/)?.[0];
  const image = source.match(/<image\b[^>]*\/>/)?.[0];
  if (!root || !image) throw new Error(`Unsupported SVG structure: ${filename}`);
  // Figma's pattern/use wrapper contains rounded fractional transforms, which
  // can still soften edges. These exports have a full-size single bitmap, so
  // render that same image directly in the unchanged native viewBox.
  const rendered = `${root}\n${image.replace('<image ', '<image style="image-rendering:pixelated" ')}\n</svg>\n`;
  await writeFile(new URL(encodeURIComponent(filename), outputDirectory), rendered);
}
console.log(`Prepared pixel-art SVG copies in ${fileURLToPath(outputDirectory)}`);
