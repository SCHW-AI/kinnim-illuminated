import { Fragment } from 'react';
import { Link } from 'react-router';
import { possibilityAt } from '../engine';
import { Panel } from './Panel';
import { BilingualLabel, RichText } from './RichText';
import type { CasePlayer } from './useCasePlayer';

/**
 * Explore mode: a breadcrumb back up the possibility path, the possibility's
 * outcome once its end is reached, the possibilities to explore from here (the
 * top-level ones at the ruling, else the current one's children), and the way
 * back to the ruling.
 */
export function ExplorePanel({ player }: { player: CasePlayer }) {
  const { resolved, path, possibility, position, last, links } = player;
  const options = (possibility ? possibility.possibilities : resolved.possibilities) ?? [];
  const outcome = possibility && position === last ? possibility.outcome : undefined;

  return (
    <Panel title="Possibilities" he="נניח" className="kn-card-explore">
      <nav aria-label="Breadcrumb">
        <ol className="kn-crumbs">
          <li>
            {path.length ? (
              <Link to={{ search: links.explore([]) }} className="kn-link">
                Ruling
              </Link>
            ) : (
              <span aria-current="page">Ruling</span>
            )}
          </li>
          {path.map((_, i) => {
            const upTo = path.slice(0, i + 1);
            const label = possibilityAt(resolved, upTo)?.label;
            return (
              <Fragment key={upTo.join('.')}>
                <li aria-hidden="true" className="kn-crumb-sep">
                  ›
                </li>
                <li>
                  {label &&
                    (i < path.length - 1 ? (
                      <Link to={{ search: links.explore(upTo) }} className="kn-link">
                        <BilingualLabel label={label} />
                      </Link>
                    ) : (
                      <span aria-current="page">
                        <BilingualLabel label={label} />
                      </span>
                    ))}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      {outcome !== undefined && (
        <section aria-label="Outcome" className="kn-outcome">
          <RichText value={outcome} className="text-ink" />
        </section>
      )}

      {options.length > 0 && (
        <ul className="kn-options" aria-label={possibility ? 'Explore further' : 'Possibilities'}>
          {options.map((option) => (
            <li key={option.id}>
              <Link to={{ search: links.explore([...path, option.id]) }} className="kn-option">
                <BilingualLabel label={option.label} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4">
        <Link to={{ search: links.ruling }} className="kn-button kn-button-quiet">
          ← Back to the ruling
        </Link>
      </p>
    </Panel>
  );
}
