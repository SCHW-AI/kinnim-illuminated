import { expect, test } from 'vitest';
import { createRegistry, EngineError, type MishnahDef } from '.';
import { mishnahOf, threeBirdCase } from './__fixtures__/cases';

const moduleOf = (def: MishnahDef) => ({ default: def });
const mishnah = (chapter: number, n: number) => mishnahOf(chapter, n, [threeBirdCase()]);

test('lists mishnayos sorted by chapter then mishnah, and looks them up by id', () => {
  const registry = createRegistry({
    './2-1/index.ts': moduleOf(mishnah(2, 1)),
    './1-10/index.ts': moduleOf(mishnah(1, 10)),
    './1-2/index.ts': moduleOf(mishnah(1, 2)),
  });

  expect(registry.list().map((def) => def.id)).toEqual(['1-2', '1-10', '2-1']);
  expect(registry.get('1-10')?.ref).toEqual({ chapter: 1, mishnah: 10 });
  expect(registry.has('2-1')).toBe(true);
  expect(registry.has('3-1')).toBe(false);
  expect(registry.get('3-1')).toBeUndefined();
});

test('an empty set of modules gives an empty registry', () => {
  expect(createRegistry({}).list()).toEqual([]);
});

test('rejects duplicate mishnah ids, naming both modules', () => {
  expect(() =>
    createRegistry({
      'a/1-2/index.ts': moduleOf(mishnah(1, 2)),
      'b/1-2/index.ts': moduleOf(mishnah(1, 2)),
    }),
  ).toThrow(/b\/1-2\/index\.ts: duplicate mishnah id "1-2" \(also in a\/1-2\/index\.ts\)/);
});

test.each<[string, () => Record<string, { default: MishnahDef }>, RegExp]>([
  [
    'an invalid mishnah',
    () => {
      const def = mishnah(1, 2);
      def.cases[0]!.steps[1]!.id = 'mix';
      return { './1-2/index.ts': moduleOf(def) };
    },
    /\.\/1-2\/index\.ts:\n {2}- cases\[0\]\.steps\[1\]\.id: Duplicate step id/,
  ],
  [
    'a folder that does not match the id',
    () => ({ './1-3/index.ts': moduleOf(mishnah(1, 2)) }),
    /\.\/1-3\/index\.ts:\n {2}- id: Mishnah id "1-2" does not match its folder "1-3"/,
  ],
])('rejects %s, naming the module and the issue', (_name, modules, message) => {
  expect(() => createRegistry(modules())).toThrow(EngineError);
  expect(() => createRegistry(modules())).toThrow(message);
});
