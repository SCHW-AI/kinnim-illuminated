/**
 * Authoring checks for mishnah and case definitions. Every check reports a
 * `ValidationIssue` with a path into the definition, e.g.
 * `cases[0].steps[1].events[0]`, instead of throwing.
 *
 * Every author text the UI or stage renders (titles, labels, captions, CTAs,
 * verdicts, reasons, outcomes) is checked against its contract type
 * (`checkRichLabel`, `checkRichText`), and every other value they render (a
 * ruling's statuses and counts, a case's own projected Scene) against its
 * contract, so a definition that validates clean cannot crash rendering.
 *
 * An optional field is absent only when it is `undefined`. Any other value,
 * even a falsy one such as `project: false`, is checked against its contract
 * type (`checkOptional`), never skipped for being falsy.
 *
 * That promise is for plain data: object and array literals, and `ruling` /
 * `project` functions that return such literals. Every list is walked index by
 * index, so a hole (`[a, , b]`) is reported, not skipped. Exotic objects are
 * out of contract: non-enumerable properties, accessor getters, proxies and
 * prototype tricks. Validation never throws on them, but it does not promise
 * that rendering agrees with its verdict on them.
 */

import { applyEvent, eventTypes, type EventOf, type EventType } from './events';
import type { Emphasis, SceneBird, SceneContainer } from '../stage/scene';
import { describeThrown, EngineError } from './errors';
import { isRulingShownAt } from './resolve';
import type {
  BirdId,
  BirdStatus,
  CaseDef,
  CaseState,
  ContainerKind,
  Designation,
  EngineEvent,
  Knowledge,
  MishnahDef,
  PossibilityDef,
  ResolvedCase,
  RichBlock,
  Ruling,
  Scene,
  StepDef,
  Track,
} from './scenario';
import { finalPosition } from './timeline';
import { branchTrack, resolvedOf, resolveVariant, trackFor, walkPath } from './tracks';

/** One problem in a definition: where it is and what is wrong. */
export interface ValidationIssue {
  /** Path into the definition, e.g. `cases[0].initial.containers.left.birdIds[1]`. */
  path: string;
  /** What is wrong, in plain words. */
  message: string;
}

/** Thrown by `assertValid`; carries every issue found. */
export class ValidationError extends EngineError {
  override name = 'ValidationError';
  readonly issues: readonly ValidationIssue[];

  constructor(subject: string, issues: readonly ValidationIssue[]) {
    super(`${subject} is invalid:\n${formatIssues(issues)}`);
    this.issues = issues;
  }
}

/** Formats issues one per line as `  - path: message`. */
export function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues.map((issue) => `  - ${issue.path}: ${issue.message}`).join('\n');
}

type Report = (path: string, message: string) => void;

/**
 * Every author-chosen id must be a slug. Ids key plain-object records, so this
 * also keeps out names such as `__proto__` that a record cannot hold as an entry.
 */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const SAFE_ID_RULE =
  'ids must start with a letter or digit and contain only letters, digits, "-" or "_"';
/**
 * A canonical array index such as "0" or "12". JavaScript enumerates such keys
 * before every other key, so one would jump to the front of a record whose
 * insertion order is the display order.
 */
const PLAIN_NUMBER = /^(0|[1-9]\d*)$/;

/** Reports `id` at `path` unless it is a safe id; returns whether it is. */
function checkId(id: unknown, path: string, report: Report): boolean {
  if (typeof id === 'string' && SAFE_ID.test(id) && !PLAIN_NUMBER.test(id)) return true;
  report(
    path,
    typeof id !== 'string'
      ? `id must be a string, not ${typeof id}: ${SAFE_ID_RULE}`
      : PLAIN_NUMBER.test(id)
        ? `id ${JSON.stringify(id)} is not allowed: ids must not be plain numbers, because they would reorder the display`
        : `id ${JSON.stringify(id)} is not allowed: ${SAFE_ID_RULE}`,
  );
  return false;
}

/** The runtime values of the string unions a definition uses; `satisfies` keeps each complete. */
const CONTAINER_KINDS = {
  kein: true,
  pile: true,
  mixture: true,
  zone: true,
  loose: true,
} satisfies Record<ContainerKind, true>;
const DESIGNATIONS = { chatas: true, olah: true, unassigned: true } satisfies Record<
  Designation,
  true
>;
const KNOWLEDGE = { known: true, unknown: true } satisfies Record<Knowledge, true>;
const BIRD_STATUSES = {
  alive: true,
  kasher: true,
  pasul: true,
  safek: true,
  yamus: true,
} satisfies Record<BirdStatus, true>;
const SCENE_KINDS = {
  kein: true,
  pile: true,
  mixture: true,
  zone: true,
  loose: true,
} satisfies Record<SceneContainer['kind'], true>;
const TINTS = { chatas: true, olah: true, neutral: true, unknown: true } satisfies Record<
  SceneBird['tint'],
  true
>;
const EMPHASES = { none: true, highlight: true, dim: true } satisfies Record<Emphasis, true>;

/** Reports `value` at `path` unless it is one of `allowed`'s keys; returns whether it is. */
function checkOneOf(
  value: unknown,
  allowed: Readonly<Record<string, true>>,
  path: string,
  report: Report,
): boolean {
  if (typeof value === 'string' && Object.hasOwn(allowed, value)) return true;
  report(
    path,
    `Must be one of ${Object.keys(allowed).join(', ')}, not ${String(JSON.stringify(value))}`,
  );
  return false;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeValue(value: unknown): string {
  if (value === null) return 'null';
  return Array.isArray(value) ? 'a list' : typeof value;
}

const isFunction = (value: unknown) => typeof value === 'function';
const isBoolean = (value: unknown) => typeof value === 'boolean';
const isString = (value: unknown) => typeof value === 'string';
const isList = (value: unknown) => Array.isArray(value);
const isNonNegativeInteger = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;

/**
 * The one rule for an optional author field: it is absent only when it is
 * `undefined`. Any other value, falsy ones included (`false`, `null`, `0`,
 * `''`), must pass `is`, else it is reported at `path` as not `expected`.
 * Returns whether the field is absent or well-typed; callers skip the checks
 * that would consume a mistyped one, so it is reported once.
 */
function checkOptional(
  value: unknown,
  path: string,
  report: Report,
  is: (value: unknown) => boolean,
  expected: string,
): boolean {
  if (value === undefined || is(value)) return true;
  const shown =
    typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string'
      ? JSON.stringify(value)
      : describeValue(value);
  report(path, `Must be ${expected} or left out, not ${shown}`);
  return false;
}

/**
 * Visits every index of an author list, unlike `forEach`, which skips holes
 * (`[a, , b]`, `Array(1)`): reports a hole, or a `null` / `undefined` entry,
 * at `path[i]`, and calls `fn` (if given) with each other entry and its path.
 * Returns whether every entry was present.
 */
function eachIndex<T>(
  list: readonly T[],
  path: string,
  report: Report,
  fn?: (item: NonNullable<T>, at: string, i: number) => void,
): boolean {
  let present = true;
  for (let i = 0; i < list.length; i++) {
    const at = `${path}[${i}]`;
    const item = list[i];
    if (!(i in list) || item === undefined || item === null) {
      report(
        at,
        i in list
          ? `Missing entry: the list holds ${String(item)} here`
          : 'Missing entry: the list has a hole here (e.g. two commas in a row)',
      );
      present = false;
    } else fn?.(item, at, i);
  }
  return present;
}

/**
 * Reports `value` at `path` (or `path.he` / `path.en`) unless it is a
 * `RichLabel`: an object whose supplied `he` and `en` are strings, with at
 * least one of them; returns whether it is.
 */
function checkRichLabel(value: unknown, path: string, report: Report): boolean {
  if (!isObject(value)) {
    report(
      path,
      `A label must be an object with "he" and/or "en" text, not ${describeValue(value)}`,
    );
    return false;
  }
  let ok = true;
  for (const lang of ['he', 'en'] as const) {
    const text = value[lang];
    if (text !== undefined && typeof text !== 'string') {
      report(`${path}.${lang}`, `"${lang}" must be a string, not ${describeValue(text)}`);
      ok = false;
    }
  }
  if (value.he === undefined && value.en === undefined) {
    report(path, 'A label must have "he" or "en" text');
    return false;
  }
  return ok;
}

/** Reports `value` at `path` unless it is a `RichInline`: a string or a `RichLabel`. */
function checkRichInline(value: unknown, path: string, report: Report): void {
  if (typeof value === 'string') return;
  if (isObject(value)) checkRichLabel(value, path, report);
  else
    report(
      path,
      `Text must be a string or an object with "he" and/or "en" text, not ${describeValue(value)}`,
    );
}

const BLOCK_TYPES = { paragraph: true, heading: true, list: true } satisfies Record<
  RichBlock['type'],
  true
>;

/**
 * Reports each defect in `value` unless it is a `RichText`: a `RichInline`, or
 * a list of blocks (`paragraph` / `heading` with a `RichInline` `text`, `list`
 * with a list of `RichInline` `items`), e.g. at `path[0].items[1]`.
 */
function checkRichText(value: unknown, path: string, report: Report): void {
  if (!Array.isArray(value)) {
    checkRichInline(value, path, report);
    return;
  }
  eachIndex(value as unknown[], path, report, (block, at) => {
    if (!isObject(block)) {
      report(at, `A text block must be an object with a "type", not ${describeValue(block)}`);
      return;
    }
    if (!checkOneOf(block.type, BLOCK_TYPES, `${at}.type`, report)) return;
    if (block.type !== 'list') checkRichInline(block.text, `${at}.text`, report);
    else if (!Array.isArray(block.items))
      report(`${at}.items`, `"items" must be a list of text, not ${describeValue(block.items)}`);
    else
      eachIndex(block.items as unknown[], `${at}.items`, report, (item, itemAt) =>
        checkRichInline(item, itemAt, report),
      );
  });
}

/** The field checks an event's shape check uses; each reports at `<event path>.<field>`. */
interface EventFields {
  /** A safe id. */
  id(field: string, value: unknown): void;
  /** A list of safe ids. */
  ids(field: string, value: unknown): void;
  /** One of `allowed`'s keys. */
  oneOf(field: string, value: unknown, allowed: Readonly<Record<string, true>>): void;
  /** An object (`shape` names its fields in the message); returns whether it is one. */
  object(field: string, value: unknown, shape: string): boolean;
  /** A list (`shape` names its entries in the message); returns whether it is one. */
  list(field: string, value: unknown, shape: string): boolean;
  /** Each entry of a list, at `<field>[i]`, with no holes (see `eachIndex`). */
  each(field: string, list: readonly unknown[], fn: (item: unknown, field: string) => void): void;
  /** An optional `RichLabel`. */
  label(field: string, value: unknown): void;
}

/**
 * The runtime shape of each event type: required fields present, ids safe,
 * lists that are lists and enum values that are valid. Keyed by event type,
 * so a new event type must declare its shape check.
 */
const eventShapes = {
  mix: (e, f) => {
    f.ids('from', e.from);
    f.id('into', e.into);
    f.label('label', e.label);
  },
  move: (e, f) => {
    f.id('bird', e.bird);
    f.id('to', e.to);
  },
  reveal: (e, f) => {
    if (e.birds !== 'all') f.ids('birds', e.birds);
  },
  conceal: (e, f) => {
    if (e.birds !== 'all') f.ids('birds', e.birds);
  },
  create: (e, f) => {
    if (f.object('container', e.container, '{ id, kind, label? }')) {
      f.id('container.id', e.container.id);
      f.oneOf('container.kind', e.container.kind, CONTAINER_KINDS);
      f.label('container.label', e.container.label);
    }
    if (e.after !== undefined) f.id('after', e.after);
  },
  designate: (e, f) => {
    if (!f.list('birds', e.birds, '{ bird, designation }')) return;
    f.each('birds', e.birds, (entry, at) => {
      if (!f.object(at, entry, '{ bird, designation }')) return;
      const { bird, designation } = entry as (typeof e.birds)[number];
      f.id(`${at}.bird`, bird);
      f.oneOf(`${at}.designation`, designation, DESIGNATIONS);
    });
  },
} satisfies { [K in EventType]: (event: EventOf<K>, fields: EventFields) => void };

/**
 * Checks an event's runtime shape (see `eventShapes`) before it is applied,
 * reporting each defect at `at` or `at.<field>`; returns whether it is sound.
 */
function checkEvent(event: unknown, at: string, report: Report): boolean {
  const type = isObject(event) ? event.type : undefined;
  if (typeof type !== 'string' || !Object.hasOwn(eventShapes, type)) {
    report(
      at,
      isObject(event)
        ? `Unknown event type ${JSON.stringify(type)}; known types: ${eventTypes.join(', ')}`
        : `An event must be an object with a "type", not ${describeValue(event)}`,
    );
    return false;
  }
  let ok = true;
  const fail = (field: string, message: string) => {
    report(`${at}.${field}`, message);
    ok = false;
  };
  const fields: EventFields = {
    id: (field, value) => {
      if (!checkId(value, `${at}.${field}`, report)) ok = false;
    },
    list: (field, value, shape) => {
      if (Array.isArray(value)) return true;
      fail(field, `"${field}" must be a list of ${shape}, not ${describeValue(value)}`);
      return false;
    },
    each: (field, list, fn) => {
      const present = eachIndex(list, `${at}.${field}`, report, (item, _path, k) =>
        fn(item, `${field}[${k}]`),
      );
      if (!present) ok = false;
    },
    ids: (field, value) => {
      if (fields.list(field, value, 'ids'))
        fields.each(field, value as unknown[], (id, entry) => fields.id(entry, id));
    },
    oneOf: (field, value, allowed) => {
      if (!checkOneOf(value, allowed, `${at}.${field}`, report)) ok = false;
    },
    object: (field, value, shape) => {
      if (isObject(value)) return true;
      fail(field, `"${field}" must be ${shape}, not ${describeValue(value)}`);
      return false;
    },
    label: (field, value) => {
      if (value !== undefined && !checkRichLabel(value, `${at}.${field}`, report)) ok = false;
    },
  };
  (eventShapes[type as EventType] as (e: unknown, f: EventFields) => void)(event, fields);
  return ok;
}

/**
 * Runs one check, reporting at `path` instead of throwing if the definition is
 * too malformed to check (e.g. a missing record); returns whether it completed.
 */
function guarded(path: string, report: Report, check: () => void): boolean {
  try {
    check();
    return true;
  } catch (error) {
    report(path, `Malformed definition: ${describeThrown(error)}`);
    return false;
  }
}

/**
 * Reports each missing entry (see `eachIndex`) and each unsafe or duplicate id
 * in `items`; returns whether every entry was present, so that a caller can
 * then walk the list with `forEach`.
 */
function checkUniqueIds(
  items: readonly { id: string }[],
  path: string,
  noun: string,
  report: Report,
): boolean {
  const firstIndex = new Map<string, number>();
  return eachIndex(items, path, report, (item, _at, i) => {
    checkId(item.id, `${path}[${i}].id`, report);
    const first = firstIndex.get(item.id);
    if (first === undefined) firstIndex.set(item.id, i);
    else
      report(
        `${path}[${i}].id`,
        `Duplicate ${noun} id "${item.id}" (first used at ${path}[${first}])`,
      );
  });
}

/**
 * Reports each step's `advance` unless it is `'auto'` or `{ cta }` with a
 * `RichLabel` cta, and its optional `showRuling` unless it is a boolean.
 */
function checkSteps(steps: readonly StepDef[], path: string, report: Report) {
  steps.forEach((step, i) => {
    checkOptional(step.showRuling, `${path}[${i}].showRuling`, report, isBoolean, 'true or false');
    const at = `${path}[${i}].advance`;
    if (step.advance === 'auto') return;
    if (isObject(step.advance)) checkRichLabel(step.advance.cta, `${at}.cta`, report);
    else
      report(
        at,
        `"advance" must be "auto" or { cta }, not ${String(JSON.stringify(step.advance))}`,
      );
  });
}

function checkState(state: CaseState, path: string, report: Report) {
  // Ids that key a record: an unsafe one makes the rest of the state unreliable.
  let safe = true;
  for (const key of Object.keys(state.birds))
    safe = checkId(key, `${path}.birds.${key}`, report) && safe;
  for (const key of Object.keys(state.containers))
    safe = checkId(key, `${path}.containers.${key}`, report) && safe;
  if (!safe) return;

  for (const [key, bird] of Object.entries(state.birds)) {
    if (bird.id !== key)
      report(`${path}.birds.${key}.id`, `Bird id "${bird.id}" does not match its key "${key}"`);
    checkOneOf(bird.designation, DESIGNATIONS, `${path}.birds.${key}.designation`, report);
    for (const field of ['keinId', 'ownerId'] as const)
      checkOptional(bird[field], `${path}.birds.${key}.${field}`, report, isString, 'a string');
  }

  const placedIn = new Map<BirdId, string>();
  for (const [key, container] of Object.entries(state.containers)) {
    if (container.id !== key) {
      report(
        `${path}.containers.${key}.id`,
        `Container id "${container.id}" does not match its key "${key}"`,
      );
    }
    checkOneOf(container.kind, CONTAINER_KINDS, `${path}.containers.${key}.kind`, report);
    if (container.label !== undefined)
      checkRichLabel(container.label, `${path}.containers.${key}.label`, report);
    if (!Array.isArray(container.birdIds)) {
      report(
        `${path}.containers.${key}.birdIds`,
        `"birdIds" must be a list of ids, not ${describeValue(container.birdIds)}`,
      );
      continue;
    }
    eachIndex(container.birdIds, `${path}.containers.${key}.birdIds`, report, (birdId, at) => {
      const previous = placedIn.get(birdId);
      if (!Object.hasOwn(state.birds, birdId)) report(at, `Unknown bird "${birdId}"`);
      else if (previous !== undefined)
        report(at, `Bird "${birdId}" is already in container "${previous}"`);
      else placedIn.set(birdId, key);
    });
  }

  for (const key of Object.keys(state.birds)) {
    if (!placedIn.has(key)) report(`${path}.birds.${key}`, `Bird "${key}" is not in any container`);
    if (!Object.hasOwn(state.knowledge, key)) {
      report(`${path}.knowledge.${key}`, `No knowledge entry for bird "${key}"`);
    }
  }
  for (const [key, value] of Object.entries(state.knowledge)) {
    if (!Object.hasOwn(state.birds, key))
      report(`${path}.knowledge.${key}`, `Knowledge entry for unknown bird "${key}"`);
    else checkOneOf(value, KNOWLEDGE, `${path}.knowledge.${key}`, report);
  }
}

/**
 * Why a state breaks the placement invariant (every bird in exactly one
 * container, every container entry a bird); empty when it holds.
 */
function placementProblems(state: CaseState): string[] {
  const problems: string[] = [];
  const placedIn = new Map<BirdId, string>();
  for (const [key, container] of Object.entries(state.containers)) {
    for (const birdId of container.birdIds) {
      const previous = placedIn.get(birdId);
      if (!Object.hasOwn(state.birds, birdId))
        problems.push(`container "${key}" holds unknown bird "${birdId}"`);
      else if (previous !== undefined)
        problems.push(`bird "${birdId}" is in both "${previous}" and "${key}"`);
      else placedIn.set(birdId, key);
    }
  }
  for (const birdId of Object.keys(state.birds)) {
    if (!placedIn.has(birdId)) problems.push(`bird "${birdId}" is not in any container`);
  }
  return problems;
}

/**
 * Why an event's result breaks the container-record invariant (every container
 * that should still exist does, and every key equals its container's id);
 * empty when it holds. Only `mix` removes containers: its sources, other than
 * `into`, which it must add. `create` must add its container.
 */
function containerProblems(before: CaseState, event: EngineEvent, after: CaseState): string[] {
  const expected = new Set(Object.keys(before.containers));
  if (event.type === 'mix') {
    for (const id of event.from) expected.delete(id);
    expected.add(event.into);
  }
  if (event.type === 'create') expected.add(event.container.id);
  const problems: string[] = [];
  for (const id of expected) {
    if (!Object.hasOwn(after.containers, id)) problems.push(`container "${id}" is missing`);
  }
  for (const [key, container] of Object.entries(after.containers)) {
    if (container.id !== key)
      problems.push(`container key "${key}" holds container id "${container.id}"`);
  }
  return problems;
}

/**
 * Replays `steps` from `initial` and returns each position's state
 * (`states[0]` is `initial`), or undefined after reporting, at
 * `<stepsPath>[i].events[j]`, the first event that is malformed (see
 * `checkEvent`), that fails, or that breaks the container-record or placement
 * invariant.
 */
function simulate(
  initial: CaseState,
  steps: readonly StepDef[],
  stepsPath: string,
  report: Report,
): CaseState[] | undefined {
  let state = initial;
  const states = [state];
  for (const [i, step] of steps.entries()) {
    if (!Array.isArray(step.events)) {
      report(
        `${stepsPath}[${i}].events`,
        `"events" must be a list of events, not ${describeValue(step.events)}`,
      );
      return undefined;
    }
    if (!eachIndex(step.events, `${stepsPath}[${i}].events`, report)) return undefined;
    for (const [j, event] of step.events.entries()) {
      const at = `${stepsPath}[${i}].events[${j}]`;
      const before = state;
      try {
        if (!checkEvent(event, at, report)) return undefined;
        state = applyEvent(state, event);
      } catch (error) {
        report(at, describeThrown(error));
        return undefined;
      }
      const problems = [...containerProblems(before, event, state), ...placementProblems(state)];
      if (problems.length > 0) {
        report(at, `After this event, ${problems.join('; ')}`);
        return undefined;
      }
    }
    states.push(state);
  }
  return states;
}

/** Reports a ruling's optional `counts` unless it is an object of non-negative integers. */
function checkCounts(counts: unknown, path: string, report: Report) {
  if (counts === undefined) return;
  if (!isObject(counts)) {
    report(path, `"counts" must be an object of counts, not ${describeValue(counts)}`);
    return;
  }
  for (const [key, n] of Object.entries(counts)) {
    if (typeof n === 'number' && Number.isInteger(n) && n >= 0) continue;
    const shown = typeof n === 'number' ? String(n) : describeValue(n);
    report(`${path}.${key}`, `A count must be a non-negative integer, not ${shown}`);
  }
}

/**
 * Checks a track's ruling at every position where it is shown, under every
 * view (or once with no view): it must not throw, must give a valid status to
 * exactly the birds present there, its verdict and reasons must be
 * `RichText`, and its optional counts non-negative integers. Paths name the track position and the view, e.g.
 * `ruling(position 2, view "rambam").birds.a`.
 */
function checkRuling(track: Track, states: readonly CaseState[], at: string, report: Report) {
  const { ruling } = track;
  // Absent. A mistyped one is reported by `checkOptional`, which skips this check.
  if (ruling === undefined) return;
  const viewIds = track.views?.length ? track.views.map((view) => view.id) : [undefined];
  for (let position = 0; position < states.length; position++) {
    if (!isRulingShownAt(track, position)) continue;
    const state = states[position]!;
    for (const viewId of viewIds) {
      const under =
        viewId === undefined
          ? `position ${position}`
          : `position ${position} under view "${viewId}"`;
      const path =
        viewId === undefined
          ? `${at}(position ${position})`
          : `${at}(position ${position}, view "${viewId}")`;
      let result: Ruling;
      let statuses: Record<BirdId, unknown>;
      try {
        result = ruling(state, viewId);
        statuses = result.birds;
      } catch (error) {
        report(path, `Throws at ${under}: ${describeThrown(error)}`);
        continue;
      }
      checkRichText(result.verdict, `${path}.verdict`, report);
      if (result.reasons !== undefined) checkRichText(result.reasons, `${path}.reasons`, report);
      checkCounts(result.counts, `${path}.counts`, report);
      if (!isObject(statuses)) {
        report(
          `${path}.birds`,
          `"birds" must be an object of bird statuses, not ${describeValue(statuses)}`,
        );
        continue;
      }
      for (const [birdId, status] of Object.entries(statuses))
        checkOneOf(status, BIRD_STATUSES, `${path}.birds.${birdId}`, report);
      for (const birdId of Object.keys(state.birds)) {
        if (!Object.hasOwn(statuses, birdId))
          report(`${path}.birds.${birdId}`, `No status for bird "${birdId}" at ${under}`);
      }
      for (const birdId of Object.keys(statuses)) {
        if (!Object.hasOwn(state.birds, birdId))
          report(`${path}.birds.${birdId}`, `Status for unknown bird "${birdId}" at ${under}`);
      }
    }
  }
}

/**
 * Reports each way `scene` breaks the Scene contract (see `stage/scene.ts`),
 * at paths under `path`: `containers` and `birds` are lists; containers have
 * safe, unique ids, a valid kind and emphasis, a `RichLabel` label and a list
 * of `birdIds`; birds have unique, non-empty string ids, a valid tint, status
 * and emphasis, a boolean `revealed` and a `RichLabel` label; every bird is in
 * exactly one container's `birdIds`, the one its `containerId` names, and
 * every `birdIds` entry names a bird. The caption is a `RichLabel`.
 */
function checkScene(scene: unknown, path: string, report: Report) {
  if (!isObject(scene)) {
    report(path, `A Scene must be an object, not ${describeValue(scene)}`);
    return;
  }
  if (scene.caption !== undefined) checkRichLabel(scene.caption, `${path}.caption`, report);
  const optionalOneOf = (value: unknown, allowed: Readonly<Record<string, true>>, at: string) => {
    if (value !== undefined) checkOneOf(value, allowed, at, report);
  };
  const listAt = (list: 'containers' | 'birds'): unknown[] | undefined => {
    const items: unknown = scene[list];
    if (Array.isArray(items)) return items;
    report(`${path}.${list}`, `"${list}" must be a list of ${list}, not ${describeValue(items)}`);
    return undefined;
  };
  const containers = listAt('containers');
  const birds = listAt('birds');

  // The index of the first container and bird with each id; a later one is a duplicate.
  const containerAt = new Map<string, number>();
  const containerBirdIds: unknown[][] = [];
  if (containers)
    eachIndex(containers, `${path}.containers`, report, (item, at, i) => {
      if (!isObject(item)) {
        report(at, `A container must be an object, not ${describeValue(item)}`);
        return;
      }
      const { id } = item;
      if (checkId(id, `${at}.id`, report)) {
        const first = containerAt.get(id as string);
        if (first === undefined) containerAt.set(id as string, i);
        else
          report(
            `${at}.id`,
            `Duplicate container id "${id as string}" (first used at containers[${first}])`,
          );
      }
      checkOneOf(item.kind, SCENE_KINDS, `${at}.kind`, report);
      optionalOneOf(item.emphasis, EMPHASES, `${at}.emphasis`);
      if (item.label !== undefined) checkRichLabel(item.label, `${at}.label`, report);
      if (Array.isArray(item.birdIds)) containerBirdIds[i] = item.birdIds;
      else
        report(
          `${at}.birdIds`,
          `"birdIds" must be a list of ids, not ${describeValue(item.birdIds)}`,
        );
    });

  const birdAt = new Map<string, number>();
  const homeOf = new Map<string, unknown>();
  if (birds)
    eachIndex(birds, `${path}.birds`, report, (item, at, i) => {
      if (!isObject(item)) {
        report(at, `A bird must be an object, not ${describeValue(item)}`);
        return;
      }
      const { id } = item;
      if (typeof id !== 'string' || id === '')
        report(`${at}.id`, `A bird id must be a non-empty string, not ${describeValue(id)}`);
      else {
        const first = birdAt.get(id);
        if (first === undefined) {
          birdAt.set(id, i);
          homeOf.set(id, item.containerId);
        } else report(`${at}.id`, `Duplicate bird id "${id}" (first used at birds[${first}])`);
      }
      checkOneOf(item.tint, TINTS, `${at}.tint`, report);
      if (typeof item.revealed !== 'boolean')
        report(
          `${at}.revealed`,
          `"revealed" must be true or false, not ${describeValue(item.revealed)}`,
        );
      checkOneOf(item.status, BIRD_STATUSES, `${at}.status`, report);
      optionalOneOf(item.emphasis, EMPHASES, `${at}.emphasis`);
      if (item.label !== undefined) checkRichLabel(item.label, `${at}.label`, report);
    });

  // Placement is checked only when both lists are lists.
  if (!containers || !birds) return;
  const placedIn = new Map<string, string>();
  for (const [containerId, i] of containerAt) {
    const birdIds = containerBirdIds[i];
    if (!birdIds) continue;
    eachIndex(birdIds, `${path}.containers[${i}].birdIds`, report, (birdId, at) => {
      if (typeof birdId !== 'string' || !birdAt.has(birdId)) {
        report(at, `Unknown bird ${String(JSON.stringify(birdId))}`);
        return;
      }
      const previous = placedIn.get(birdId);
      if (previous !== undefined)
        report(at, `Bird "${birdId}" is already in container "${previous}"`);
      else placedIn.set(birdId, containerId);
    });
  }
  for (const [birdId, i] of birdAt) {
    const at = `${path}.birds[${i}]`;
    const home = homeOf.get(birdId);
    const placed = placedIn.get(birdId);
    if (typeof home !== 'string' || !containerAt.has(home))
      report(`${at}.containerId`, `No container ${String(JSON.stringify(home))}`);
    else if (placed !== undefined && placed !== home)
      report(
        `${at}.containerId`,
        `Bird "${birdId}" has containerId "${home}" but is in container "${placed}"`,
      );
    if (placed === undefined) report(at, `Bird "${birdId}" is not in any container's birdIds`);
  }
}

/**
 * Why `scene` breaks the Scene contract (see `checkScene`), one
 * `path: message` line per defect with paths under `scene`; empty when it holds.
 */
export function sceneProblems(scene: unknown): string[] {
  const problems: string[] = [];
  checkScene(scene, 'scene', (path, message) => problems.push(`${path}: ${message}`));
  return problems;
}

/**
 * Checks the Scene a case's own `project` gives at every position the track
 * shows (from its `start`), with the ruling where it is shown, under every
 * view: it must not throw, and it must meet the Scene contract, text included
 * (see `checkScene`). Paths are like `ruling`'s, e.g.
 * `project(position 2).containers[0].label`. The default projection needs no
 * check: it meets the contract by construction for a state that validates.
 */
function checkProjection(track: Track, states: readonly CaseState[], at: string, report: Report) {
  const { project, ruling } = track;
  // Absent. A mistyped one is reported by `checkOptional`, which skips this check.
  if (project === undefined) return;
  const allViews = track.views?.length ? track.views.map((view) => view.id) : [undefined];
  for (let position = track.start ?? 0; position < states.length; position++) {
    const state = states[position]!;
    const shown = ruling !== undefined && isRulingShownAt(track, position);
    for (const viewId of shown ? allViews : [undefined]) {
      const under =
        viewId === undefined
          ? `position ${position}`
          : `position ${position} under view "${viewId}"`;
      const path =
        viewId === undefined
          ? `${at}(position ${position})`
          : `${at}(position ${position}, view "${viewId}")`;
      let shownRuling: Ruling | undefined;
      try {
        shownRuling = shown ? ruling(state, viewId) : undefined;
      } catch {
        continue; // Reported by `checkRuling`.
      }
      let scene: Scene;
      try {
        scene = project(state, shownRuling);
      } catch (error) {
        report(path, `Throws at ${under}: ${describeThrown(error)}`);
        continue;
      }
      checkScene(scene, path, report);
    }
  }
}

/**
 * Reports a body's optional `ruling` unless it is a function and its optional
 * `possibilities` unless they are a list (see `checkOptional`), at
 * `<prefix>ruling` and `<prefix>possibilities`; returns whether both are sound.
 * Checked on the author's own object: `resolvedOf` would drop a falsy one.
 */
function checkBodyFields(
  body: { ruling?: unknown; possibilities?: unknown },
  prefix: string,
  report: Report,
): boolean {
  const ruling = checkOptional(body.ruling, `${prefix}ruling`, report, isFunction, 'a function');
  const possibilities = checkOptional(
    body.possibilities,
    `${prefix}possibilities`,
    report,
    isList,
    'a list of possibilities',
  );
  return ruling && possibilities;
}

/**
 * Checks the possibilities forking from a track, recursively: safe, unique ids
 * per level, a label and optional outcome that are text, an optional `from`
 * that is a non-negative integer within the parent track, an optional ruling
 * that is a function and nested possibilities that are a list (a mistyped one
 * skips the rest of that possibility's checks), safe, unique step ids, CTA
 * labels and boolean `showRuling` flags, events that replay cleanly from the
 * fork point, a ruling that covers exactly the birds present wherever it is
 * shown on the possibility's track, and the case's own projection there (see
 * `checkProjection`).
 */
function checkPossibilities(
  parent: Track,
  parentStates: readonly CaseState[],
  possibilities: readonly PossibilityDef[],
  at: string,
  report: Report,
) {
  if (!checkUniqueIds(possibilities, at, 'possibility', report)) return;
  possibilities.forEach((possibility, k) => {
    const path = `${at}[${k}]`;
    checkRichLabel(possibility.label, `${path}.label`, report);
    if (possibility.outcome !== undefined)
      checkRichText(possibility.outcome, `${path}.outcome`, report);
    const fromOk = checkOptional(
      possibility.from,
      `${path}.from`,
      report,
      isNonNegativeInteger,
      'a non-negative integer (a position on the parent track)',
    );
    if (!checkBodyFields(possibility, `${path}.`, report) || !fromOk) return;
    const last = finalPosition(parent);
    const from = possibility.from ?? last;
    if (from > last) {
      report(
        `${path}.from`,
        `Fork position ${from} is not an integer in 0..${last} (the parent track's positions)`,
      );
      return;
    }
    const stepsPath = `${path}.steps`;
    let stepsPresent = false;
    if (
      !guarded(stepsPath, report, () => {
        stepsPresent = checkUniqueIds(possibility.steps, stepsPath, 'step', report);
        if (stepsPresent) checkSteps(possibility.steps, stepsPath, report);
      }) ||
      !stepsPresent
    )
      return;
    const own = simulate(parentStates[from]!, possibility.steps, stepsPath, report);
    if (!own) return;
    const track = branchTrack(parent, possibility);
    const states = [...parentStates.slice(0, from), ...own];
    guarded(`${path}.ruling`, report, () => checkRuling(track, states, `${path}.ruling`, report));
    guarded(`${path}.project`, report, () =>
      checkProjection(track, states, `${path}.project`, report),
    );
    guarded(`${path}.possibilities`, report, () =>
      checkPossibilities(
        track,
        states,
        possibility.possibilities ?? [],
        `${path}.possibilities`,
        report,
      ),
    );
  });
}

/**
 * Checks one concrete setup (a case, or one variant of it) with paths under
 * `prefix`: safe, unique step ids, a consistent initial state with safe ids
 * and text labels, CTA labels and boolean `showRuling` flags, that every
 * event is well-formed (safe ids, text labels), applies when replayed, keeps
 * every container it should and leaves every bird in exactly one container,
 * that the ruling covers exactly the birds present at every position where it
 * is shown, under every view, the case's own projection (see
 * `checkProjection`), and every possibility path (see `checkPossibilities`).
 * The caller has checked the body's own optional fields (see
 * `checkBodyFields`).
 */
function checkBody(body: ResolvedCase, prefix: string, report: Report) {
  let count = 0;
  const counted: Report = (path, message) => {
    count++;
    report(path, message);
  };
  const stepsOk = guarded(`${prefix}steps`, counted, () =>
    checkUniqueIds(body.steps, `${prefix}steps`, 'step', counted),
  );
  guarded(`${prefix}initial`, counted, () => checkState(body.initial, `${prefix}initial`, counted));
  // Replaying a malformed initial state would only add follow-on noise.
  if (count > 0 || !stepsOk) return;
  guarded(`${prefix}steps`, report, () => checkSteps(body.steps, `${prefix}steps`, report));

  let states: CaseState[] | undefined;
  guarded(`${prefix}steps`, report, () => {
    states = simulate(body.initial, body.steps, `${prefix}steps`, report);
  });
  if (!states) return;
  const replayed = states;
  const track = trackFor(body, []);
  guarded(`${prefix}ruling`, report, () => checkRuling(track, replayed, `${prefix}ruling`, report));
  guarded(`${prefix}project`, report, () =>
    checkProjection(track, replayed, `${prefix}project`, report),
  );
  guarded(`${prefix}possibilities`, report, () =>
    checkPossibilities(track, replayed, body.possibilities ?? [], `${prefix}possibilities`, report),
  );
}

function checkCase(caseDef: CaseDef, report: Report) {
  guarded('title', report, () => checkRichLabel(caseDef.title, 'title', report));
  // Shared by every setup: a mistyped one skips the setups, which consume them.
  const viewsOk = checkOptional(caseDef.views, 'views', report, isList, 'a list of views');
  const projectOk = checkOptional(caseDef.project, 'project', report, isFunction, 'a function');
  const variantsOk = checkOptional(
    caseDef.variants,
    'variants',
    report,
    isList,
    'a list of variants',
  );
  if (viewsOk && caseDef.views !== undefined) {
    const { views } = caseDef;
    guarded('views', report, () => {
      if (!checkUniqueIds(views, 'views', 'view', report)) return;
      views.forEach((view, i) => checkRichLabel(view.label, `views[${i}].label`, report));
    });
  }
  if (!viewsOk || !projectOk || !variantsOk) return;
  if (caseDef.variants === undefined) {
    if (checkBodyFields(caseDef, '', report)) checkBody(caseDef, '', report);
    return;
  }
  guarded('variants', report, () => {
    const { variants } = caseDef;
    if (variants.length === 0) report('variants', 'A case with variants must list at least one');
    if (!checkUniqueIds(variants, 'variants', 'variant', report)) return;
    variants.forEach((variant, i) => {
      checkRichLabel(variant.label, `variants[${i}].label`, report);
      if (variant.title !== undefined)
        checkRichLabel(variant.title, `variants[${i}].title`, report);
      if (checkBodyFields(variant, `variants[${i}].`, report))
        checkBody(resolvedOf(caseDef, variant), `variants[${i}].`, report);
    });
  });
}

/**
 * Checks one case: a title label, safe, unique view ids with labels and, for a
 * case with variants, at least one variant, with safe, unique variant ids,
 * labels and optional titles; then every setup (the case itself, or each
 * variant under `variants[i].`) with `checkBody`.
 *
 * Never throws, whatever it is given (even `null` or a number): a definition
 * too malformed to check is reported as an issue. The root's path is `''`.
 * A clean result means rendering will not crash only for plain data; exotic
 * objects (non-enumerable properties, getters, proxies, prototype tricks) are
 * out of contract (see the module comment).
 */
export function validateCase(caseDef: CaseDef): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const report: Report = (path, message) => issues.push({ path, message });
  if (!isObject(caseDef)) report('', `A case must be an object, not ${describeValue(caseDef)}`);
  else guarded('', report, () => checkCase(caseDef, report));
  return issues;
}

/**
 * Checks a mishnah: its id matches its ref, its case ids are unique, and every
 * case is valid (see `validateCase`).
 *
 * Never throws, whatever it is given (even `null` or a number): a definition
 * too malformed to check is reported as an issue. The root's path is `''`.
 * As with `validateCase`, a clean result is a promise about plain data only.
 */
export function validateMishnah(def: MishnahDef): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const report: Report = (path, message) => issues.push({ path, message });
  if (!isObject(def)) {
    report('', `A mishnah must be an object, not ${describeValue(def)}`);
    return issues;
  }

  guarded('id', report, () => {
    if (!checkId(def.id, 'id', report)) return;
    const expectedId = `${def.ref.chapter}-${def.ref.mishnah}`;
    if (def.id !== expectedId)
      report('id', `Mishnah id "${def.id}" should be "${expectedId}" to match its ref`);
  });
  guarded('cases', report, () => {
    if (!checkUniqueIds(def.cases, 'cases', 'case', report)) return;
    def.cases.forEach((caseDef, i) => {
      for (const issue of validateCase(caseDef))
        report(issue.path ? `cases[${i}].${issue.path}` : `cases[${i}]`, issue.message);
    });
  });
  return issues;
}

/** Throws a `ValidationError` listing every issue if the mishnah is invalid. */
export function assertValid(def: MishnahDef): void {
  const issues = validateMishnah(def);
  if (issues.length > 0) throw new ValidationError(`Mishnah "${def.id}"`, issues);
}

/**
 * Checks a possibility path (ids from the top level down) against a resolved
 * case; reports the first id that names no possibility at its level, at `path[i]`.
 */
export function validatePath(resolved: ResolvedCase, path: readonly string[]): ValidationIssue[] {
  const walked = walkPath(resolved, path);
  if (!('missing' in walked)) return [];
  const i = walked.missing;
  const under = i === 0 ? 'at the top level' : `under "${path.slice(0, i).join('.')}"`;
  return [
    {
      path: `path[${i}]`,
      message: `Case "${resolved.id}" has no possibility "${path[i]}" ${under}`,
    },
  ];
}

/** A link into a mishnah, as authored content or a deep link would name it. */
export interface MishnahLink {
  caseId: string;
  variantId?: string;
  /** A possibility path; `position` then counts that possibility's own steps. */
  path?: readonly string[];
  position?: number;
  viewId?: string;
}

/**
 * Checks that a link names an existing case, one of its variants, a
 * possibility path, a position within that track's own steps and one of its
 * views. The engine itself falls back on bad variant, view and position values
 * (see `resolveVariant`, `resolveView`, `clampPosition`); this reports them.
 */
export function validateLink(def: MishnahDef, link: MishnahLink): ValidationIssue[] {
  const caseDef = def.cases.find((c) => c.id === link.caseId);
  if (!caseDef)
    return [{ path: 'caseId', message: `Mishnah "${def.id}" has no case "${link.caseId}"` }];

  const issues: ValidationIssue[] = [];
  const { variantId, path = [], position, viewId } = link;
  if (variantId !== undefined && !caseDef.variants?.some((v) => v.id === variantId)) {
    issues.push({
      path: 'variantId',
      message: `Case "${caseDef.id}" has no variant "${variantId}"`,
    });
  }
  const resolved = resolveVariant(caseDef, variantId);
  const pathIssues = validatePath(resolved, path);
  issues.push(...pathIssues);
  if (pathIssues.length === 0 && position !== undefined) {
    const track = trackFor(resolved, path);
    const last = finalPosition(track) - (track.start ?? 0);
    if (!(Number.isInteger(position) && position >= 0 && position <= last)) {
      issues.push({
        path: 'position',
        message: `Position ${position} is not an integer in 0..${last}`,
      });
    }
  }
  if (viewId !== undefined && !caseDef.views?.some((view) => view.id === viewId)) {
    issues.push({ path: 'viewId', message: `Case "${caseDef.id}" has no view "${viewId}"` });
  }
  return issues;
}
