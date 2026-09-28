#!/usr/bin/env node
/**
 * Fetches the vocalized Hebrew of Mishnah Kinnim (chapters 1-3) from the
 * Sefaria API, Torat Emet 357 edition (public domain), and writes
 * src/content/mishnah-text.json. Hebrew only: no translation is fetched.
 *
 * Usage: npm run fetch:text
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const VERSION = 'Torat Emet 357';
const CHAPTERS = [1, 2, 3];
const OUT = fileURLToPath(new URL('../src/content/mishnah-text.json', import.meta.url));

/** Removes editorial markup: page markers and footnotes (with their contents), then any tag. */
function clean(html) {
  return html
    .replace(/<i\b[^>]*data-overlay[^>]*>.*?<\/i>/gs, '')
    .replace(/<sup\b[^>]*>.*?<\/sup>\s*<i\b[^>]*class="footnote"[^>]*>.*?<\/i>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchChapter(chapter, attempt = 1) {
  const url = `https://www.sefaria.org/api/v3/texts/Mishnah_Kinnim.${chapter}?version=${encodeURIComponent(`hebrew|${VERSION}`)}`;
  const response = await fetch(url);
  if (response.status >= 500 && attempt < 4) {
    await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    return fetchChapter(chapter, attempt + 1);
  }
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const body = await response.json();
  const version = body.versions?.find((v) => v.versionTitle === VERSION);
  if (!version || !Array.isArray(version.text)) {
    throw new Error(`${url}: no "${VERSION}" text in the response`);
  }
  return {
    chapter,
    mishnayos: version.text.map((he, i) => ({ mishnah: i + 1, he: clean(he) })),
  };
}

const chapters = [];
for (const chapter of CHAPTERS) chapters.push(await fetchChapter(chapter));

for (const { chapter, mishnayos } of chapters) {
  for (const { mishnah, he } of mishnayos) {
    if (!he || /[<>]/.test(he)) throw new Error(`Kinnim ${chapter}:${mishnah}: bad text "${he}"`);
  }
}

const data = { source: `Sefaria — ${VERSION} (public domain)`, chapters };
await writeFile(OUT, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(
  `Wrote ${OUT}: ${chapters.map((c) => `ch. ${c.chapter} = ${c.mishnayos.length}`).join(', ')}`,
);
