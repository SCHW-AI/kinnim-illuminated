// The verbatim check reads docs/legacy-scenarios.md from disk (Vitest runs under Node).
/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  finalPosition,
  possibilityAt,
  resolveVariant,
  rulingAt,
  rulingFrom,
  sceneAt,
  stateAt,
  trackFor,
  validateMishnah,
  type BirdStatus,
  type CaseDef,
  type PossibilityDef,
  type ResolvedCase,
  type RichInline,
  type RichText,
  type Track,
} from '../../engine';
import { registry } from '..';
import { BROUGHT, PARTNER_BIRD, SELECTED_BIRD } from './cases/kein-stumah';
import mishnah from './index';

const caseOf = (id: string): CaseDef => {
  const found = mishnah.cases.find((c) => c.id === id);
  if (!found) throw new Error(`no case ${id}`);
  return found;
};

/** A case resolved to a variant; throws if the variant does not exist (no silent fallback). */
const setupOf = (id: string, variantId?: string): ResolvedCase => {
  const caseDef = caseOf(id);
  if (variantId !== undefined && !caseDef.variants?.some((v) => v.id === variantId))
    throw new Error(`no variant ${id}/${variantId}`);
  return resolveVariant(caseDef, variantId);
};

/** Every concrete setup: each case, or each variant of it. */
const setups: ResolvedCase[] = mishnah.cases.flatMap((c) =>
  c.variants ? c.variants.map((v) => resolveVariant(c, v.id)) : [resolveVariant(c)],
);
const nameOf = (r: ResolvedCase) => (r.variantId ? `${r.id}/${r.variantId}` : r.id);

/** Every possibility path under a list, depth-first. */
function pathsOf(list: readonly PossibilityDef[] = [], prefix: string[] = []): string[][] {
  return list.flatMap((p) => [[...prefix, p.id], ...pathsOf(p.possibilities, [...prefix, p.id])]);
}

/** Every track of every setup: the main line and each possibility path. */
const tracks: [string, Track][] = setups.flatMap((r) =>
  [[], ...pathsOf(r.possibilities)].map(
    (path) =>
      [`${nameOf(r)}${path.length ? ` › ${path.join('.')}` : ''}`, trackFor(r, path)] as [
        string,
        Track,
      ],
  ),
);

const finalRuling = (track: Track) => rulingAt(track, stateAt(track, finalPosition(track)));

test('the mishnah validates with no issues and the app registry lists it', () => {
  expect(validateMishnah(mishnah)).toEqual([]);
  expect(registry.list().map((def) => def.id)).toContain('1-2');
  expect(registry.get('1-2')).toBe(mishnah);
  expect(mishnah.cases.map((c) => c.id)).toEqual(['case-a', 'case-b', 'case-c']);
});

describe('rulings at the final position of the main line', () => {
  test('(a) one chatas and one olah: both birds must die', () => {
    const ruling = finalRuling(setupOf('case-a'));
    expect(ruling?.birds).toEqual({ 'chatas-1': 'yamus', 'olah-1': 'yamus' });
    expect(ruling?.counts).toEqual({ yamus: 2 });
  });

  test.each([
    ['chataos', 'chatas', 'olah'],
    ['olos', 'olah', 'chatas'],
  ])('(b) %s: 12 of one kind and 1 of the other, and every bird must die', (variant, many, one) => {
    const setup = setupOf('case-b', variant);
    const designations = Object.values(setup.initial.birds).map((b) => b.designation);
    expect(designations.filter((d) => d === many)).toHaveLength(12);
    expect(designations.filter((d) => d === one)).toHaveLength(1);
    const ruling = finalRuling(setup);
    expect(ruling?.birds).toEqual(
      Object.fromEntries(Object.keys(setup.initial.birds).map((id) => [id, 'yamus'])),
    );
    expect(ruling?.counts).toEqual({ yamus: 13 });
  });

  test.each([
    ['chatas', 'chatas-1'],
    ['olah', 'olah-1'],
  ])(
    '(c) %s: kein stumah + one designated bird: the brought bird is kasher, 2 die',
    (variant, single) => {
      const ruling = finalRuling(setupOf('case-c', variant));
      expect(ruling?.birds).toEqual({
        [SELECTED_BIRD]: 'kasher',
        [PARTNER_BIRD]: 'yamus',
        [single]: 'yamus',
      });
      expect(ruling?.counts).toEqual({ kasher: 1, yamus: 2 });
    },
  );
});

describe('possibilities of case (c)', () => {
  // The birds each supposition brings, with the status the author's reasoning
  // gives them; every other bird stays alive.
  test.each<[string, string, Record<string, BirdStatus>]>([
    ['chatas', 'take-defined', { 'chatas-1': 'kasher' }],
    ['chatas', 'take-stumah', { 'kein-1': 'kasher' }],
    ['chatas', 'take-stumah.second-chatas', { 'kein-1': 'kasher', 'kein-2': 'pasul' }],
    ['chatas', 'take-as-olah', { 'chatas-1': 'pasul' }],
    ['olah', 'take-defined', { 'olah-1': 'kasher' }],
    ['olah', 'take-stumah', { 'kein-1': 'kasher' }],
    ['olah', 'take-stumah.second-olah', { 'kein-1': 'kasher', 'kein-2': 'pasul' }],
    ['olah', 'take-as-chatas', { 'olah-1': 'pasul' }],
  ])('%s › %s: its ruling governs the stage at its end', (variant, path, ruled) => {
    const track = trackFor(setupOf('case-c', variant), path.split('.'));
    const scene = sceneAt(track, finalPosition(track));
    const alive = Object.fromEntries(scene.birds.map((b) => [b.id, 'alive']));
    expect(Object.fromEntries(scene.birds.map((b) => [b.id, b.status]))).toEqual({
      ...alive,
      ...ruled,
    });
  });

  test.each([
    ['chatas', 'olah'],
    ['olah', 'chatas'],
  ])(
    '%s › take-stumah: bringing a kein bird fixes it and its partner, whom the viewer then sees',
    (offering, other) => {
      const track = trackFor(setupOf('case-c', offering), ['take-stumah']);
      const end = stateAt(track, finalPosition(track));
      expect(end.birds[SELECTED_BIRD]?.designation).toBe(offering);
      expect(end.birds[PARTNER_BIRD]?.designation).toBe(other);
      const partner = sceneAt(track, finalPosition(track)).birds.find((b) => b.id === PARTNER_BIRD);
      expect(partner).toMatchObject({ containerId: 'mixture', revealed: true, tint: other });
      // The main line is untouched: its kein birds are never designated.
      const main = stateAt(track, track.start ?? 0);
      expect(main.birds[PARTNER_BIRD]?.designation).toBe('unassigned');
    },
  );

  test("every possibility forks after the mix, and its outcome is a verbatim piece of its variant's explanation", () => {
    for (const setup of setups.filter((s) => s.possibilities)) {
      const reasons = normalize(flatten(finalRuling(setup)!.reasons!));
      for (const path of pathsOf(setup.possibilities)) {
        const context = `${nameOf(setup)} › ${path.join('.')}`;
        const track = trackFor(setup, path);
        if (path.length === 1) expect(track.start, context).toBe(1);
        const outcome = possibilityAt(setup, path)?.outcome;
        if (!outcome) throw new Error(`${context}: no outcome`);
        expect(reasons, context).toContain(normalize(flatten(outcome)));
        expect(finalRuling(track)?.verdict, context).toBe(outcome);
      }
    }
  });
});

test.each(setups.map((s) => [nameOf(s), s] as const))(
  '%s: every bird is alive before the ruling shows, and has its ruled status from then on',
  (_name, setup) => {
    const from = rulingFrom(setup);
    expect(from).toBe(finalPosition(setup));
    for (let p = 0; p < from; p++) {
      const statuses = new Set<BirdStatus>(sceneAt(setup, p).birds.map((b) => b.status));
      expect([...statuses]).toEqual(['alive']);
    }
    const ruled = finalRuling(setup)?.birds;
    const scene = sceneAt(setup, from);
    expect(Object.fromEntries(scene.birds.map((b) => [b.id, b.status]))).toEqual(ruled);
  },
);

test.each(setups.map((s) => [nameOf(s), s] as const))(
  '%s: birds are known before the mix and unrevealed after it, to the end',
  (_name, setup) => {
    expect(sceneAt(setup, 0).birds.every((b) => b.revealed && b.tint !== 'unknown')).toBe(true);
    for (let p = 1; p <= finalPosition(setup); p++) {
      const scene = sceneAt(setup, p);
      expect(scene.birds.every((b) => !b.revealed && b.tint === 'unknown' && !b.label)).toBe(true);
    }
    // Knowledge changed; the truth did not.
    const after = stateAt(setup, finalPosition(setup));
    for (const [id, bird] of Object.entries(setup.initial.birds)) {
      expect(after.birds[id]?.designation).toBe(bird.designation);
    }
  },
);

test.each(['chatas', 'olah'])(
  'case-c/%s: the brought zone appears only at the select step, which moves one bird into it',
  (variant) => {
    const setup = setupOf('case-c', variant);
    const ids = (p: number) => sceneAt(setup, p).containers.map((c) => c.id);
    expect(ids(0)).toEqual(['kein', variant]);
    expect(ids(1)).toEqual(['mixture']);

    const scene = sceneAt(setup, finalPosition(setup));
    const byId = Object.fromEntries(scene.containers.map((c) => [c.id, c.birdIds]));
    expect(scene.containers.map((c) => c.id)).toEqual(['mixture', BROUGHT]);
    expect(byId[BROUGHT]).toEqual([SELECTED_BIRD]);
    expect(byId.mixture).toHaveLength(2);
  },
);

test('lone birds are not boxed: case-a starts with no boxes, and case-b boxes only its uncaptioned many', () => {
  const kinds = (setup: ResolvedCase) =>
    sceneAt(setup, 0).containers.map(({ kind, label }) => ({ kind, label }));
  const loose = { kind: 'loose', label: undefined };
  expect(kinds(setupOf('case-a'))).toEqual([loose, loose]);
  for (const variant of ['chataos', 'olos'])
    expect(kinds(setupOf('case-b', variant))).toEqual([{ kind: 'pile', label: undefined }, loose]);
});

test('stage labels are Hebrew only, and no caption repeats a label of a bird inside it, on every track at every position', () => {
  expect(tracks.length).toBeGreaterThan(setups.length);
  for (const [name, track] of tracks) {
    for (let p = 0; p <= finalPosition(track); p++) {
      const scene = sceneAt(track, p);
      const birds = new Map(scene.birds.map((b) => [b.id, b]));
      const labels = [...scene.containers, ...scene.birds].flatMap((x) => x.label ?? []);
      for (const label of labels) expect(label, `${name} @${p}`).not.toHaveProperty('en');
      for (const container of scene.containers) {
        const caption = container.label?.he;
        if (!caption) continue;
        for (const id of container.birdIds) {
          const context = `${name} @${p}: ${container.id} / ${id}`;
          expect(birds.get(id)?.label?.he, context).not.toBe(caption);
        }
      }
    }
  }
});

// --- Verbatim check against docs/legacy-scenarios.md -------------------------

/** Strips markdown bold and bullet markers and collapses whitespace; keeps every word, arrow and hyphen. */
function normalize(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/^\s*- /gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const inline = (text: RichInline) =>
  typeof text === 'string' ? text : [text.he, text.en].filter(Boolean).join(' ');

function flatten(text: RichText): string {
  return typeof text === 'string' || !Array.isArray(text)
    ? inline(text)
    : text
        .map((block) =>
          block.type === 'list' ? block.items.map(inline).join(' ') : inline(block.text),
        )
        .join(' ');
}

interface DocCase {
  title: string;
  resultTitle: string;
  explanation: string;
}

function readDocCases(): Map<string, DocCase> {
  const path = join(process.cwd(), 'docs', 'legacy-scenarios.md');
  const doc = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const cases = new Map<string, DocCase>();
  const sections = doc.split(/^## Case \(([a-d])\): (.+)$/m);
  for (let i = 1; i < sections.length; i += 3) {
    const [letter, title, body] = [sections[i], sections[i + 1], sections[i + 2]] as [
      string,
      string,
      string,
    ];
    const section = (name: string) => {
      const match = new RegExp(`^### ${name}\\n([\\s\\S]*?)(?=^### |^---|(?![\\s\\S]))`, 'm').exec(
        body,
      );
      if (!match?.[1]) throw new Error(`Case (${letter}) has no "${name}" section`);
      return normalize(match[1]);
    };
    cases.set(letter, {
      title: normalize(title),
      resultTitle: section('Result title'),
      explanation: section('Explanation'),
    });
  }
  return cases;
}

/** Where each legacy case now lives: a case, or a case and one of its variants. */
const LEGACY: Record<string, [string, string?]> = {
  a: ['case-a'],
  b: ['case-b', 'chataos'],
  c: ['case-c', 'chatas'],
  d: ['case-c', 'olah'],
};

test('each legacy case title, verdict and explanation equals the legacy doc, verbatim', () => {
  const docCases = readDocCases();
  expect([...docCases.keys()]).toEqual(Object.keys(LEGACY));
  for (const [letter, [caseId, variantId]] of Object.entries(LEGACY)) {
    const doc = docCases.get(letter);
    const setup = setupOf(caseId, variantId);
    const ruling = finalRuling(setup);
    if (!doc || !ruling?.reasons) throw new Error(`(${letter}): missing doc text or reasons`);
    expect(normalize(inline(setup.title)), letter).toBe(doc.title);
    expect(normalize(flatten(ruling.verdict)), letter).toBe(doc.resultTitle);
    expect(normalize(flatten(ruling.reasons)), letter).toBe(doc.explanation);
  }
});

test("case-b's reverse variant keeps case (b)'s verbatim text, and its title is the author's own phrase", () => {
  const doc = readDocCases().get('b')!;
  const setup = setupOf('case-b', 'olos');
  const ruling = finalRuling(setup)!;
  expect(normalize(flatten(ruling.verdict))).toBe(doc.resultTitle);
  expect(normalize(flatten(ruling.reasons!))).toBe(doc.explanation);
  expect(doc.explanation.toLowerCase()).toContain(normalize(inline(setup.title)).toLowerCase());
});
