import type { CaseDef } from '../engine';
import { BilingualLabel } from './RichText';

/** Tabs for a mishnah's cases; hidden when there is only one. */
export function CasePicker({
  cases,
  value,
  onChange,
  panelId,
}: {
  cases: readonly CaseDef[];
  value: string;
  onChange: (id: string) => void;
  panelId: string;
}) {
  if (cases.length < 2) return null;
  return (
    <div role="tablist" aria-label="Cases" className="kn-tabs">
      {cases.map((c, i) => {
        const selected = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => {
              if (!selected) onChange(c.id);
            }}
            className="kn-tab"
          >
            <span className="kn-tab-number" aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <BilingualLabel label={c.title} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
