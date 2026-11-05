import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const directory = new URL('../public/assets/items/', import.meta.url);
const pngBytes = (svg) => Buffer.from(svg.match(/data:image\/png;base64,([^"\s]+)/)[1], 'base64');

test('all eight render copies preserve the original PNG bytes and SVG proportions', async () => {
  const files = (await readdir(directory)).filter((name) => name.endsWith('.svg'));
  assert.equal(files.length, 8);
  for (const name of files) {
    const source = await readFile(new URL(encodeURIComponent(name), directory), 'utf8');
    const rendered = await readFile(
      new URL(`pixelated/${encodeURIComponent(name)}`, directory),
      'utf8',
    );
    assert.deepEqual(pngBytes(rendered), pngBytes(source), `${name}: changed embedded PNG`);
    assert.equal(rendered.match(/<svg\b[^>]*>/)[0], source.match(/<svg\b[^>]*>/)[0]);
    assert.match(rendered, /<image style="image-rendering:pixelated"/);
    assert.doesNotMatch(rendered, /<pattern|<use|transform=/);
  }
});
