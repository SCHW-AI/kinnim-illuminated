/**
 * Scenario contracts: the types a mishnah is authored in.
 *
 * Types only, no logic. Pure TypeScript with no React; the only outside
 * dependency is a type-only import of the stage's Scene contract, which a case
 * may target through `CaseDef.project`.
 *
 * Truth vs. knowledge: the engine always holds the truth about every bird
 * (`Bird.designation`). What the observers know is tracked separately
 * (`CaseState.knowledge`). Mixing birds changes knowledge, never truth; the
 * stage shows knowledge (a "?" for an unknown bird), and a reveal may show the
 * truth.
 */

import type { BirdStatus, RichLabel, Scene } from '../stage/scene';

export type { BirdStatus, RichLabel, Scene };

/** Identifies a bird within a case. */
export type BirdId = string;

/** Identifies a container within a case. */
export type ContainerId = string;

/**
 * What a bird truly is.
 * - `chatas` / `olah`: designated as that offering.
 * - `unassigned`: not yet designated (e.g. a bird of a קן סתומה).
 */
export type Designation = 'chatas' | 'olah' | 'unassigned';

/** Whether the observers know a bird's designation. */
export type Knowledge = 'known' | 'unknown';

/** A bird, as the truth. */
export interface Bird {
  /** Stable id, shared with the bird's `SceneBird`. */
  id: BirdId;
  /** The bird's true designation. This is the truth, whatever the observers know. */
  designation: Designation;
  /** The kein (pair) the bird was brought in, if any. */
  keinId?: string;
  /** The owner who brought the bird, if the case tracks owners. */
  ownerId?: string;
}

/**
 * How a container groups its birds. Projected 1:1 onto `SceneContainer.kind` by default.
 * - `kein`: a pair brought together;
 * - `pile`: an unordered group of birds;
 * - `mixture`: birds that can no longer be told apart;
 * - `zone`: an area birds are moved into;
 * - `loose`: birds that belong to no group, such as a lone bird. The stage
 *   draws no outline or caption for it.
 */
export type ContainerKind = 'kein' | 'pile' | 'mixture' | 'zone' | 'loose';

/** A group of birds in the case's world. */
export interface Container {
  /** Stable id, shared with the container's `SceneContainer`. */
  id: ContainerId;
  /** How the container groups its birds. */
  kind: ContainerKind;
  /** Optional caption. */
  label?: RichLabel;
  /** The birds in this container, in order. */
  birdIds: BirdId[];
}

/** The full state of a case at one point in its timeline. */
export interface CaseState {
  /** Every bird, keyed by id. `designation` is the truth. */
  birds: Record<BirdId, Bird>;
  /** Every container, keyed by id. */
  containers: Record<ContainerId, Container>;
  /** What the observers know about each bird. Changes on mix/reveal/conceal; the truth does not. */
  knowledge: Record<BirdId, Knowledge>;
}

/**
 * Something that happens in a step. A discriminated union on `type`; new
 * members are added when a mishnah needs them.
 */
export type EngineEvent =
  /** Merge containers into one; the merged birds become unknown to the observers. */
  | { type: 'mix'; from: ContainerId[]; into: ContainerId; label?: RichLabel }
  /** Move one bird to another container. */
  | { type: 'move'; bird: BirdId; to: ContainerId }
  /** Let the observers know these birds' designations. */
  | { type: 'reveal'; birds: BirdId[] | 'all' }
  /** Hide these birds' designations from the observers. */
  | { type: 'conceal'; birds: BirdId[] | 'all' }
  /**
   * Add a new, empty container, shown after `after` in display order (or at
   * the end). Its id must not exist yet. Lets an area appear only once it
   * becomes relevant, e.g. the zone a bird is brought into.
   */
  | {
      type: 'create';
      container: { id: ContainerId; kind: ContainerKind; label?: RichLabel };
      after?: ContainerId;
    }
  /**
   * Change the TRUTH of the listed birds, e.g. the kohen's act fixes a bird of
   * a קן סתומה as a חטאת and so its partner as an עולה. Knowledge is
   * unchanged: use `reveal` to show it. Which birds to designate is authored
   * per case; the engine infers nothing.
   */
  | { type: 'designate'; birds: { bird: BirdId; designation: Designation }[] };

/** A run of text: a plain string (may mix Hebrew and English) or a Hebrew/English pair. */
export type RichInline = string | RichLabel;

/** One block of structured text. */
export type RichBlock =
  /** A paragraph. */
  | { type: 'paragraph'; text: RichInline }
  /** A sub-heading, e.g. "Why 1 חטאת can be brought:". */
  | { type: 'heading'; text: RichInline }
  /** A bulleted list. */
  | { type: 'list'; items: RichInline[] };

/** Verdicts, reasons and outcomes: a single run of text, or a sequence of blocks. */
export type RichText = RichInline | RichBlock[];

/** One side of a machlokes (e.g. Bartenura / Rambam) a case can be viewed under. */
export interface ViewDef {
  /** Stable id, e.g. "rambam"; used in URLs. */
  id: string;
  /** Name shown on the view toggle. */
  label: RichLabel;
}

/** The halachic outcome of a case state. */
export interface Ruling {
  /** The headline result, e.g. "Both are ספיקות - They must die". */
  verdict: RichText;
  /** The status of every bird under this ruling. */
  birds: Record<BirdId, BirdStatus>;
  /** Named tallies, e.g. `{ kasher: 1, yamus: 2 }`. */
  counts?: Record<string, number>;
  /** The explanation of the ruling. */
  reasons?: RichText;
}

/** One step of a case's timeline. */
export interface StepDef {
  /** Stable id within the case; used in URLs. */
  id: string;
  /** Events applied, in order, when this step is reached. */
  events: EngineEvent[];
  /** `auto` plays straight on; `{ cta }` waits for the viewer to press a button with this label. */
  advance: 'auto' | { cta: RichLabel };
  /**
   * Show the case's ruling from this step on (i.e. from the position this step
   * leads to). If several steps set it, the earliest wins. If none does, the
   * ruling is shown only at the final position, after the last step.
   */
  showRuling?: boolean;
}

/** Derives the ruling from a state under the active view. */
export type RulingFn = (state: CaseState, viewId?: string) => Ruling;

/**
 * What a case (or one of its variants) plays: a starting state, a timeline of
 * steps, a ruling, and the hypothetical branches that can be explored from it.
 */
export interface CaseBody {
  /** State before the first step. */
  initial: CaseState;
  /**
   * The timeline. Position 0 is `initial`; position i + 1 is `initial` with
   * steps 0..i folded in, so the state *after* step i is at position i + 1
   * (see `engine/timeline.ts`).
   */
  steps: StepDef[];
  /** Derives the ruling from a state under the active view. */
  ruling?: RulingFn;
  /** Hypothetical branches, explored after the ruling (see `PossibilityDef`). */
  possibilities?: PossibilityDef[];
}

/** What every case has, with or without variants. */
interface CaseCommon {
  /** Stable id within the mishnah; used in URLs. */
  id: string;
  /** Name shown in the case picker, and in the case header unless the variant has its own. */
  title: RichLabel;
  /** Views of a machlokes, if the case has one. Shared by every variant. */
  views?: ViewDef[];
  /** Overrides the default CaseState + Ruling to Scene projection. Shared by every variant. */
  project?: (state: CaseState, ruling?: Ruling) => Scene;
}

/** A case with a single setup. */
export interface PlainCaseDef extends CaseCommon, CaseBody {
  variants?: undefined;
}

/**
 * A case whose setup can be flipped (the "reverse switch"), e.g. many חטאות
 * and one עולה ⇄ many עולות and one חטאת. Each variant is a complete body, so
 * the case itself has no initial state, steps, ruling or possibilities.
 */
export interface VariedCaseDef extends CaseCommon {
  /** The variants, in switch order; the first is the default. */
  variants: VariantDef[];
  initial?: never;
  steps?: never;
  ruling?: never;
  possibilities?: never;
}

/** One case of a mishnah: a single setup, or several variants of one. */
export type CaseDef = PlainCaseDef | VariedCaseDef;

/** One setup of a case with variants: a complete body, a switch label and an optional title. */
export interface VariantDef extends CaseBody {
  /** Stable id within the case; used in URLs (`?variant=`). */
  id: string;
  /** Name shown on the variant switch. */
  label: RichLabel;
  /** The case header's title while this variant is shown; defaults to the case's title. */
  title?: RichLabel;
}

/**
 * A hypothetical branch ("suppose we took…"): it forks from a position on its
 * parent's track and plays its own steps from there. Top-level possibilities
 * fork from the case's main line; nested ones from their parent possibility's
 * track (see `trackFor`).
 */
export interface PossibilityDef {
  /** Stable id among its siblings; paths join ids with "." in URLs (`?explore=`). */
  id: string;
  /** Name shown in the list of possibilities and the breadcrumb. */
  label: RichLabel;
  /** The position on the PARENT track to fork from; defaults to the parent's final position. */
  from?: number;
  /** The branch's own steps, played from the fork point. */
  steps: StepDef[];
  /** Shown when the branch's final position is reached. */
  outcome?: RichText;
  /**
   * Governs the birds' statuses at the branch's final position (or from its
   * earliest `showRuling` step). Without one, every bird stays `alive`.
   */
  ruling?: RulingFn;
  /** Branches forking from this one's track. */
  possibilities?: PossibilityDef[];
}

/**
 * A linear timeline to play: the main line of a case, or the track of one
 * possibility path (see `trackFor`). The timeline, ruling and scene functions
 * take a track; a resolved case is the track of its own main line.
 */
export interface Track {
  /** State at position 0. */
  initial: CaseState;
  /** Every step, from position 0. */
  steps: readonly StepDef[];
  /** Views the ruling may be derived under. */
  views?: readonly ViewDef[];
  /** The ruling that governs this track, if any. */
  ruling?: RulingFn;
  /** Overrides the default projection. */
  project?: (state: CaseState, ruling?: Ruling) => Scene;
  /**
   * The first position the ruling is shown at. When omitted it is derived
   * from the steps (see `rulingFrom`); `trackFor` always sets it.
   */
  rulingFrom?: number;
  /** The position where the track's own steps begin: 0 on the main line, the fork point on a possibility. */
  start?: number;
}

/**
 * A case with its variant chosen (see `resolveVariant`): a single concrete
 * setup. Every downstream function (timeline, scenes, rulings, validation)
 * consumes one.
 */
export interface ResolvedCase extends CaseCommon, CaseBody {
  /** The chosen variant's id, if the case has variants. */
  variantId?: string;
}

/** A mishnah and its cases. */
export interface MishnahDef {
  /** "chapter-mishnah", e.g. "1-2"; used in URLs. */
  id: string;
  /** Where the mishnah is in the masechta. */
  ref: { chapter: number; mishnah: number };
  /** The cases, in order. */
  cases: CaseDef[];
}
