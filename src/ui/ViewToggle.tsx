import type { ViewDef } from '../engine';
import { BilingualLabel } from './RichText';

/** Chooses the side of the machlokes the case is shown under. */
export function ViewToggle({
  views,
  value,
  onChange,
}: {
  views: readonly ViewDef[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="kn-card flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <legend className="sr-only">View</legend>
      <span
        aria-hidden="true"
        className="text-sm tracking-[0.12em] text-gold-deep uppercase dark:text-gold"
      >
        View
      </span>
      <div className="kn-segmented">
        {views.map((view) => (
          <label key={view.id} className="kn-segment">
            <input
              type="radio"
              name="view"
              value={view.id}
              checked={view.id === value}
              onChange={() => onChange(view.id)}
              className="sr-only"
            />
            <span>
              <BilingualLabel label={view.label} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
