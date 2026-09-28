import { useId, useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { getMishnahText, hebrewRef, type MishnahText } from '../content';
import {
  isRulingShownAt,
  rulingAt,
  sceneAt,
  stateAt,
  type CaseDef,
  type MishnahDef,
} from '../engine';
import { labelText, Stage } from '../stage';
import { CasePicker } from './CasePicker';
import { ExplorePanel } from './ExplorePanel';
import { MishnahTextPanel } from './MishnahTextPanel';
import { NotFound } from './NotFound';
import { useRegistry } from './registry';
import { BilingualLabel } from './RichText';
import { RulingPanel } from './RulingPanel';
import { StepControls } from './StepControls';
import { useCasePlayer, useStepKeys } from './useCasePlayer';
import { useDocumentTitle } from './useDocumentTitle';
import { VariantSwitch } from './VariantSwitch';
import { ViewToggle } from './ViewToggle';

/**
 * `/mishnah/:id` and `/mishnah/:id/:caseId`. An illustrated mishnah without a
 * case redirects to its first case; one not in the registry shows its text
 * only; anything unknown shows the not-found page.
 */
export function MishnahRoute() {
  const { id = '', caseId } = useParams();
  const { search } = useLocation();
  const registry = useRegistry();
  const text = getMishnahText(id);
  const def = registry.get(id);
  if (!text) return <NotFound />;

  if (!def) return caseId === undefined ? <TextOnlyPage text={text} /> : <NotFound />;

  const caseDef = caseId === undefined ? def.cases[0] : def.cases.find((c) => c.id === caseId);
  if (!caseDef) return caseId === undefined ? <TextOnlyPage text={text} /> : <NotFound />;
  if (caseId === undefined)
    return <Navigate to={`/mishnah/${id}/${caseDef.id}${search}`} replace />;

  return <MishnahPage key={def.id} text={text} mishnah={def} caseDef={caseDef} />;
}

function PageHeading({ text, subtitle }: { text: MishnahText; subtitle?: string }) {
  return (
    <header className="mb-6">
      <p className="text-sm">
        <Link to="/" className="kn-link">
          ← All mishnayos
        </Link>
      </p>
      <h1 className="mt-2 flex flex-wrap items-baseline gap-x-3 text-3xl text-ink sm:text-4xl">
        <span className="tracking-wide [font-variant:small-caps]">
          Kinnim {text.chapter}:{text.mishnah}
        </span>
        <span lang="he" dir="rtl" className="text-2xl text-gold-deep sm:text-3xl dark:text-gold">
          {hebrewRef(text.chapter, text.mishnah)}
        </span>
      </h1>
      {subtitle && <p className="mt-1 text-ink-soft italic">{subtitle}</p>}
    </header>
  );
}

/** A mishnah that has not been illustrated yet: its text, and a note saying so. */
function TextOnlyPage({ text }: { text: MishnahText }) {
  useDocumentTitle(`Kinnim ${text.chapter}:${text.mishnah}`);
  return (
    <article className="mx-auto max-w-3xl">
      <PageHeading text={text} />
      <MishnahTextPanel text={text} />
      <aside className="kn-card mt-6 flex gap-4 p-5" aria-label="Not yet illustrated">
        <span className="text-3xl leading-none text-gold-deep dark:text-gold" aria-hidden="true">
          ❧
        </span>
        <div>
          <h2 className="text-lg text-ink">Not yet illustrated</h2>
          <p className="mt-1 text-ink-soft">
            The cases of this mishnah have not been drawn yet. For now, here is its text; the
            illustrated walk-through will be added in a later session.
          </p>
          <p className="mt-3">
            <Link to="/" className="kn-link">
              Browse the other mishnayos
            </Link>
          </p>
        </div>
      </aside>
    </article>
  );
}

/**
 * An illustrated mishnah: text, case tabs, the stage with its step controls
 * (and a variant switch when the case has variants), and the ruling. Once the
 * ruling shows, a case with possibilities can be explored: the stage then
 * plays a hypothetical branch under a "Suppose…" banner.
 */
function MishnahPage({
  text,
  mishnah,
  caseDef,
}: {
  text: MishnahText;
  mishnah: MishnahDef;
  caseDef: CaseDef;
}) {
  const player = useCasePlayer(mishnah, caseDef);
  useStepKeys(player);
  const { resolved, track, trackPosition, viewId, exploring, possibility } = player;
  const panelId = useId();

  const scene = useMemo(
    () => sceneAt(track, trackPosition, viewId),
    [track, trackPosition, viewId],
  );
  // The main line's ruling (also shown at the list of possibilities), never a
  // possibility's: its statuses are on the stage and its outcome in the panel.
  const ruling = useMemo(
    () =>
      !possibility && isRulingShownAt(track, trackPosition)
        ? rulingAt(track, stateAt(track, trackPosition), viewId)
        : undefined,
    [possibility, track, trackPosition, viewId],
  );
  const caseName = labelText(resolved.title);
  useDocumentTitle(`Kinnim ${text.chapter}:${text.mishnah} · ${caseName}`);

  return (
    <article>
      <PageHeading text={text} />
      <MishnahTextPanel text={text} />

      <div className="mt-8">
        <CasePicker
          cases={mishnah.cases}
          value={caseDef.id}
          onChange={player.setCase}
          panelId={panelId}
        />
      </div>

      <div
        id={panelId}
        role={mishnah.cases.length > 1 ? 'tabpanel' : undefined}
        aria-label={labelText(caseDef.title)}
        className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] lg:items-start"
      >
        <div
          className="kn-card kn-stage-card min-w-0 p-3 sm:p-5"
          data-hypothetical={possibility ? 'true' : undefined}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
            <h2 className="text-xl text-ink">
              <span className="sr-only">Case: </span>
              <BilingualLabel label={resolved.title} />
            </h2>
            {caseDef.variants && (
              <VariantSwitch
                variants={caseDef.variants}
                value={player.variantId}
                onChange={player.setVariant}
              />
            )}
          </div>
          {possibility && (
            <p className="kn-suppose" role="note">
              <bdi lang="he" dir="rtl">
                נניח
              </bdi>
              <span aria-hidden="true">/</span>
              <span>Suppose…</span>
            </p>
          )}
          <Stage scene={scene} />
          <div className="mt-3 border-t border-parchment-edge pt-3">
            {exploring && !possibility ? (
              <p className="py-2 text-center text-ink-soft italic">
                Choose a possibility to play it on the stage.
              </p>
            ) : (
              <StepControls player={player} />
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {caseDef.views && caseDef.views.length > 0 && (
            <ViewToggle views={caseDef.views} value={viewId} onChange={player.setView} />
          )}
          {exploring && <ExplorePanel player={player} />}
          {ruling && (
            <RulingPanel ruling={ruling}>
              {!exploring && player.hasPossibilities && (
                <Link
                  to={{ search: player.links.explore([]) }}
                  className="kn-button kn-button-explore"
                >
                  Explore possibilities
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </RulingPanel>
          )}
        </div>
      </div>
    </article>
  );
}
