import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router';
import {
  finalPosition,
  nextStepAt,
  possibilityAt,
  resolveVariant,
  resolveView,
  trackFor,
  validatePath,
  type CaseDef,
  type MishnahDef,
  type Track,
} from '../engine';

/** The beat before an `auto` step plays on. */
export const AUTO_ADVANCE_MS = 1200;

/** Everything the URL records about where the viewer is in a case. */
interface Place {
  variant?: string;
  /** A dot-joined possibility path; `''` is explore mode at the ruling, before a choice. */
  explore?: string;
  step?: number;
  view?: string;
}

/** `?variant=&explore=&step=&view=`, leaving out what is undefined. */
function searchFor({ variant, explore, step, view }: Place): string {
  const params = new URLSearchParams();
  if (variant !== undefined) params.set('variant', variant);
  if (explore !== undefined) params.set('explore', explore);
  if (step !== undefined) params.set('step', String(step));
  if (view !== undefined) params.set('view', view);
  const search = params.toString();
  return search ? `?${search}` : '';
}

/**
 * History-entry state that marks an entry as reached by forward progression.
 * It lives on the entry itself, so any other navigation (Back, Replay, a view,
 * variant or case change, a possibility chosen, a correction, a deep link)
 * lands on an entry without it.
 */
const FORWARD_STATE = { kinnimForward: true } as const;

function isForwardState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as { kinnimForward?: unknown }).kinnimForward === true
  );
}

/**
 * A case's variant, explore path, position and view, held in the URL
 * (`?variant=&explore=&step=&view=`), and the controls that move them.
 *
 * - The main line: `step` is the position on it.
 * - Explore mode (`explore` present): `explore=` alone is the list of
 *   possibilities at the main line's ruling; `explore=a.b` plays the
 *   possibility at that path, and `step` counts its own steps from its fork
 *   point (0). A path that names no possibility, or explore mode on a case
 *   with none, is stale and is corrected to the main line at its ruling.
 * - Step changes replace the history entry; case changes, entering explore
 *   mode, choosing a possibility and going back to the ruling push one (the
 *   latter three are links). A variant or view change replaces; a variant
 *   change also resets to the start of the main line.
 * - An invalid `variant`, `view`, `step` or `explore` is corrected (replace).
 * - Auto-advance: when the next step is `auto`, it plays after
 *   `AUTO_ADVANCE_MS` only if the current history entry was produced by
 *   moving forward (Next, a CTA, or a previous auto step), which marks the
 *   entry with `FORWARD_STATE`. Everything else navigates without the mark,
 *   and a POP (browser Back/Forward, reload) never auto-advances either. The
 *   viewer cannot get stuck in a loop.
 */
export function useCasePlayer(mishnah: MishnahDef, caseDef: CaseDef) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawVariant = params.get('variant');
  const rawExplore = params.get('explore');
  const rawStep = params.get('step');
  const rawView = params.get('view');

  const resolved = useMemo(
    () => resolveVariant(caseDef, rawVariant ?? undefined),
    [caseDef, rawVariant],
  );
  const { variantId } = resolved;
  const urlVariantId = rawVariant === null ? undefined : variantId;
  const viewId = resolveView(caseDef, rawView ?? undefined)?.id;
  const urlViewId = rawView === null ? undefined : viewId;

  const main = useMemo(() => trackFor(resolved), [resolved]);
  const mainLast = finalPosition(main);
  const hasPossibilities = (resolved.possibilities?.length ?? 0) > 0;
  const path = useMemo(() => (rawExplore ? rawExplore.split('.') : []), [rawExplore]);
  const stale =
    rawExplore !== null && (!hasPossibilities || validatePath(resolved, path).length > 0);
  const exploring = rawExplore !== null && !stale;

  // At the list of possibilities, the main line's end, with no steps of its own.
  const track: Track = useMemo(() => {
    if (!exploring) return main;
    return path.length === 0 ? { ...main, start: mainLast } : trackFor(resolved, path);
  }, [exploring, main, mainLast, path, resolved]);
  const start = track.start ?? 0;
  const last = finalPosition(track) - start;
  const clampLocal = useCallback(
    (p: number) => (Number.isNaN(p) ? 0 : Math.min(Math.max(Math.trunc(p), 0), last)),
    [last],
  );
  const position = rawStep === null ? 0 : clampLocal(Number(rawStep));
  const explore = exploring ? (rawExplore ?? undefined) : undefined;

  const needsCorrection =
    stale ||
    (rawStep !== null && rawStep !== String(position)) ||
    (rawView !== null && rawView !== viewId) ||
    (rawVariant !== null && rawVariant !== variantId);
  const correction = stale
    ? searchFor({ variant: urlVariantId, step: mainLast, view: urlViewId })
    : searchFor({ variant: urlVariantId, explore, step: position, view: urlViewId });

  useEffect(() => {
    if (needsCorrection) void navigate({ search: correction }, { replace: true });
  }, [needsCorrection, navigate, correction]);

  // Forward progression marks the entry it produces; a POP (browser
  // Back/Forward, reload) onto a marked entry must not auto-advance.
  const location = useLocation();
  const navigationType = useNavigationType();
  const reachedForward = navigationType !== 'POP' && isForwardState(location.state);

  const go = useCallback(
    (target: number, forward: boolean) => {
      const search = searchFor({
        variant: urlVariantId,
        explore,
        step: clampLocal(target),
        view: urlViewId,
      });
      void navigate(
        { search },
        forward ? { replace: true, state: FORWARD_STATE } : { replace: true },
      );
    },
    [clampLocal, explore, navigate, urlVariantId, urlViewId],
  );

  const nextStep = nextStepAt(track, start + position);
  const autoPending = nextStep?.advance === 'auto' && reachedForward;

  useEffect(() => {
    if (!autoPending) return;
    const timer = setTimeout(() => go(position + 1, true), AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [autoPending, go, position]);

  const next = useCallback(() => {
    if (position < last) go(position + 1, true);
  }, [go, last, position]);
  const back = useCallback(() => go(position - 1, false), [go, position]);
  const replay = useCallback(() => go(0, false), [go]);
  const end = useCallback(() => go(last, false), [go, last]);

  const setView = useCallback(
    (id: string) => {
      const search = searchFor({ variant: urlVariantId, explore, step: position, view: id });
      void navigate({ search }, { replace: true });
    },
    [explore, navigate, position, urlVariantId],
  );

  const setVariant = useCallback(
    (id: string) => {
      void navigate(
        { search: searchFor({ variant: id, step: 0, view: urlViewId }) },
        { replace: true },
      );
    },
    [navigate, urlViewId],
  );

  const setCase = useCallback(
    (id: string) => {
      const target = mishnah.cases.find((c) => c.id === id);
      const keepView = urlViewId !== undefined && target?.views?.some((v) => v.id === urlViewId);
      void navigate(`/mishnah/${mishnah.id}/${id}${keepView ? `?view=${urlViewId}` : ''}`);
    },
    [mishnah, navigate, urlViewId],
  );

  /** Link targets (searches) for explore mode: each is a push. */
  const links = useMemo(
    () => ({
      /** The possibility at `path`, from its fork point; `[]` is the list at the ruling. */
      explore: (to: readonly string[]) =>
        searchFor({
          variant: urlVariantId,
          explore: to.join('.'),
          step: to.length ? 0 : undefined,
          view: urlViewId,
        }),
      /** The main line at its ruling. */
      ruling: searchFor({ variant: urlVariantId, step: mainLast, view: urlViewId }),
    }),
    [mainLast, urlVariantId, urlViewId],
  );

  return {
    resolved,
    variantId,
    viewId,
    /** The track being played: the main line, or the possibility at `path`. */
    track,
    /** In explore mode (a valid `explore`), at the list (`path` empty) or in a possibility. */
    exploring,
    /** The possibility path being explored; empty on the main line and at the list. */
    path: exploring ? path : [],
    /** The possibility being played, if any. */
    possibility: exploring ? possibilityAt(resolved, path) : undefined,
    /** The position on `track` (`start` + `position`). */
    trackPosition: start + position,
    /** The position within the track's own steps (0 at a possibility's fork point). */
    position,
    last,
    nextStep,
    autoPending,
    hasPossibilities,
    links,
    next,
    back,
    replay,
    end,
    setView,
    setVariant,
    setCase,
  };
}

export type CasePlayer = ReturnType<typeof useCasePlayer>;

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') !==
      null
  );
}

/**
 * Keyboard shortcuts: → next (including a CTA), ← back, Home to the start,
 * End to the final position. The arrows follow the page's left-to-right
 * English layout. Ignored while typing and with modifier keys.
 */
export function useStepKeys({ next, back, replay, end }: CasePlayer) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey || isTyping(event.target)) return;
      const actions: Record<string, () => void> = {
        ArrowRight: next,
        ArrowLeft: back,
        Home: replay,
        End: end,
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, back, replay, end]);
}
