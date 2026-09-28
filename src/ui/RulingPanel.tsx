import type { ReactNode } from 'react';
import type { Ruling } from '../engine';
import { Panel } from './Panel';
import { RichText } from './RichText';

/**
 * Each count chip reads as the number and the Hebrew status alone, e.g.
 * "2 ימות": no transliteration, in the text or the accessible name.
 */
const COUNT_LABEL: Record<string, string> = {
  alive: 'חי',
  kasher: 'כשר',
  pasul: 'פסול',
  safek: 'ספק',
  yamus: 'ימות',
};

/** The ruling: verdict, tallies and reasons, then any actions (`children`). */
export function RulingPanel({ ruling, children }: { ruling: Ruling; children?: ReactNode }) {
  const counts = Object.entries(ruling.counts ?? {});
  return (
    <Panel title="Ruling" he="דין" className="kn-card-ruling">
      <RichText value={ruling.verdict} className="kn-verdict text-xl leading-snug text-ink" />
      {counts.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Counts">
          {counts.map(([key, n]) => {
            const label = COUNT_LABEL[key];
            return (
              <li key={key} className={`kn-badge kn-count-${key}`}>
                <span className="font-semibold tabular-nums">{n}</span>{' '}
                {label ? (
                  <bdi lang="he" dir="rtl">
                    {label}
                  </bdi>
                ) : (
                  key
                )}
              </li>
            );
          })}
        </ul>
      )}
      {ruling.reasons !== undefined && (
        <RichText
          value={ruling.reasons}
          className="mt-4 border-t border-parchment-edge pt-3 text-ink-soft"
        />
      )}
      {children && <div className="mt-4 border-t border-parchment-edge pt-4">{children}</div>}
    </Panel>
  );
}
