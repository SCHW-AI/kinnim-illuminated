import { RichInline } from './RichText';
import type { CasePlayer } from './useCasePlayer';

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className="shrink-0">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BACK = 'M12.5 4.5 7 10l5.5 5.5';
const NEXT = 'M7.5 4.5 13 10l-5.5 5.5';
const REPLAY = 'M4 10a6 6 0 1 0 1.8-4.3M4 3.5v3.2h3.2';

/**
 * Back, Next (or the next step's call to action) and Replay, with the
 * position. Shortcuts: → next, ← back, Home start, End end.
 */
export function StepControls({ player }: { player: CasePlayer }) {
  const { position, last, nextStep, autoPending, next, back, replay } = player;
  const cta = nextStep && nextStep.advance !== 'auto' ? nextStep.advance.cta : undefined;

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-3"
      aria-label="Step controls"
      role="group"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={replay}
          disabled={position === 0}
          className="kn-button kn-button-quiet"
          aria-label="Replay from the start"
          title="Replay from the start (Home)"
        >
          <Icon d={REPLAY} />
          <span className="max-sm:sr-only">Replay</span>
        </button>
        <button
          type="button"
          onClick={back}
          disabled={position === 0}
          className="kn-button"
          title="Back (←)"
        >
          <Icon d={BACK} />
          Back
        </button>
      </div>

      <p className="order-last basis-full text-center text-sm text-ink-soft sm:order-none sm:basis-auto sm:flex-1">
        <span className="tabular-nums">
          {position === 0 ? 'Start' : `Step ${position} of ${last}`}
        </span>
        <span className="kn-dots ml-3 inline-flex align-middle" aria-hidden="true">
          {Array.from({ length: last + 1 }, (_, p) => (
            <span key={p} className={p <= position ? 'kn-dot kn-dot-on' : 'kn-dot'} />
          ))}
        </span>
      </p>

      <button
        type="button"
        onClick={next}
        disabled={!nextStep}
        className={`kn-button kn-button-primary ml-auto sm:ml-0 ${autoPending ? 'kn-auto-pending' : ''}`}
        title={cta ? undefined : 'Next (→)'}
      >
        {cta ? <RichInline value={cta} /> : 'Next'}
        <Icon d={NEXT} />
      </button>
    </div>
  );
}
