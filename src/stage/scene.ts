/**
 * The Scene contract: the stage's only input.
 *
 * A Scene is a purely visual description of what to draw. It knows nothing of
 * halacha beyond generic visual props (a tint, a status marker, emphasis). The
 * engine (or a case's own `project`) turns case state into a Scene; the stage
 * renders it. Motion animates by bird id, so a bird whose `containerId`
 * changes between two Scenes flies to its new container.
 */

/** Text that may be shown in Hebrew, English or both. */
export interface RichLabel {
  /** Hebrew text, rendered right-to-left. */
  he?: string;
  /** English text. */
  en?: string;
}

/** Visual weight of an element relative to the rest of the Scene. */
export type Emphasis = 'none' | 'highlight' | 'dim';

/**
 * The outcome marker drawn on a bird.
 * - `alive`: no ruling yet; drawn plainly.
 * - `kasher`: may be offered.
 * - `pasul`: invalid.
 * - `safek`: of doubtful identity.
 * - `yamus`: must be left to die.
 */
export type BirdStatus = 'alive' | 'kasher' | 'pasul' | 'safek' | 'yamus';

/** A region of the stage that holds birds. */
export interface SceneContainer {
  /** Stable id; birds refer to it via `SceneBird.containerId`. */
  id: string;
  /** Optional caption drawn with the container. A `loose` container draws none. */
  label?: RichLabel;
  /**
   * How the container is drawn:
   * - `kein`: a nest holding a pair;
   * - `pile`: an unordered group of birds;
   * - `mixture`: a group whose members can no longer be told apart;
   * - `zone`: a plain area of the stage;
   * - `loose`: birds that belong to no group (e.g. a lone bird). Drawn with no
   *   outline, caption or emphasis: its birds stand on the stage in the same
   *   slot packing, still a group gap away from every other container.
   */
  kind: 'kein' | 'pile' | 'mixture' | 'zone' | 'loose';
  /** The birds in this container, in display order. */
  birdIds: string[];
  /** Visual weight; defaults to `none`. */
  emphasis?: Emphasis;
}

/** One bird as the stage should draw it. */
export interface SceneBird {
  /** Stable id across Scenes; the key Motion animates by. */
  id: string;
  /** The container the bird is drawn in. */
  containerId: string;
  /** Optional label drawn on or under the bird. */
  label?: RichLabel;
  /**
   * Colour to draw the bird in. `chatas` and `olah` are the two offering
   * colours; `neutral` is an undesignated bird; `unknown` is a colourless bird
   * that gives nothing away.
   */
  tint: 'chatas' | 'olah' | 'neutral' | 'unknown';
  /**
   * Whether the observers know this bird's identity. When false the stage
   * draws the "?" marker. Normally an unrevealed bird has tint `unknown`; a
   * projection may keep the true tint to show the truth beneath the "?".
   */
  revealed: boolean;
  /** Outcome marker drawn on the bird. */
  status: BirdStatus;
  /** Visual weight; defaults to `none`. */
  emphasis?: Emphasis;
}

/** Everything the stage draws for one moment of a case. */
export interface Scene {
  /** Containers, in display order. */
  containers: SceneContainer[];
  /** Every bird on the stage. Each must appear in exactly one container's `birdIds`. */
  birds: SceneBird[];
  /** Optional caption for the whole Scene. */
  caption?: RichLabel;
}
