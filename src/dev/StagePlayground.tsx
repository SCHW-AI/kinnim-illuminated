import { useEffect, useState, type ReactNode } from 'react';
import {
  BIRD_STYLE,
  BIRD_STYLE_NAMES,
  BIRD_STYLES,
  BirdArt,
  Stage,
  type BirdStyle,
} from '../stage';
import type { SceneBird } from '../stage/scene';
import { setThemePreference, ThemeToggle } from '../theme';
import { containerKinds, densityScenes, flightSteps, STATUSES, TINTS } from './sampleScenes';

const STYLE_ORDER: BirdStyle[] = ['manuscript', 'gilded', 'geometric'];

const RATIONALE: Record<BirdStyle, string> = {
  manuscript:
    'An inked outline over a pale wash, the wing laid in with colour. The most “drawn” and delicate. The app default, chosen by the author.',
  gilded:
    'Not the default; kept for comparison. A solid body in the offering colour with a burnished gold-leaf wing; reads as a painted miniature.',
  geometric:
    'Not the default; kept for comparison. Compass-and-rule shapes, crisp and iconic at 32 px; the least period-flavoured.',
};

const TINT_HEAD: Record<SceneBird['tint'], { en: string; he?: string }> = {
  chatas: { en: 'chatas', he: 'חטאת' },
  olah: { en: 'olah', he: 'עולה' },
  neutral: { en: 'neutral' },
  unknown: { en: 'unknown' },
};

const breakout = 'min(1200px, calc(100vw - 2rem))';

function Section({
  title,
  he,
  note,
  children,
}: {
  title: string;
  he?: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-12">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-parchment-edge pb-2">
        <h2 className="text-2xl font-medium tracking-wide text-ink [font-variant:small-caps]">
          {title}
        </h2>
        {he && (
          <span lang="he" dir="rtl" className="text-lg text-gold-deep">
            {he}
          </span>
        )}
        {note && <p className="basis-full text-sm italic text-ink-soft">{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border border-parchment-edge bg-parchment-deep/40 p-4 shadow-[0_1px_0_var(--kn-parchment-edge),0_10px_30px_-18px_rgb(60_40_10/0.35)] ${className}`}
    >
      {children}
    </div>
  );
}

function BirdCell({ bird, style }: { bird: SceneBird; style: BirdStyle }) {
  return (
    <svg viewBox="-36 -36 72 72" width={60} height={60} aria-hidden="true" className="mx-auto">
      <BirdArt bird={bird} size={46} birdStyle={style} />
    </svg>
  );
}

function BirdMatrix({ style }: { style: BirdStyle }) {
  const rows: { key: string; label: string; make: (t: SceneBird['tint']) => SceneBird }[] = [
    ...STATUSES.map((status) => ({
      key: status,
      label: status,
      make: (tint: SceneBird['tint']): SceneBird => ({
        id: `${status}-${tint}`,
        containerId: 'x',
        tint,
        revealed: true,
        status,
      }),
    })),
    {
      key: 'hidden',
      label: 'revealed: false',
      make: (tint: SceneBird['tint']): SceneBird => ({
        id: `hidden-${tint}`,
        containerId: 'x',
        tint,
        revealed: false,
        status: 'alive',
      }),
    },
  ];
  return (
    <table className="w-full border-collapse text-center">
      <thead>
        <tr>
          <th className="w-20" />
          {TINTS.map((t) => (
            <th key={t} className="pb-1 align-bottom text-xs font-normal text-ink-soft">
              {TINT_HEAD[t].he && (
                <span lang="he" dir="rtl" className="block text-sm text-ink">
                  {TINT_HEAD[t].he}
                </span>
              )}
              <span className="italic">{TINT_HEAD[t].en}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-parchment-edge/60">
            <th className="pr-2 text-right text-xs font-normal italic text-ink-soft">{r.label}</th>
            {TINTS.map((t) => (
              <td key={t} className="py-0.5">
                <BirdCell bird={r.make(t)} style={style} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SizeStrip({ style }: { style: BirdStyle }) {
  const Glyph = BIRD_STYLES[style];
  return (
    <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
      {[32, 48, 72].map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <div className="flex items-end">
            <Glyph tint="chatas" size={s} />
            <Glyph tint="olah" size={s} />
          </div>
          <span className="text-[11px] text-ink-faint">{s}px</span>
        </div>
      ))}
      <div className="flex basis-full flex-col items-center gap-1">
        <div className="flex items-end">
          <Glyph tint="chatas" size={120} />
          <Glyph tint="olah" size={120} />
        </div>
        <span className="text-[11px] text-ink-faint">120px</span>
      </div>
    </div>
  );
}

function StyleButtons({ value, onChange }: { value: BirdStyle; onChange: (s: BirdStyle) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Bird style for the stages"
      className="flex flex-wrap gap-1.5"
    >
      {STYLE_ORDER.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          onClick={() => onChange(s)}
          className={`rounded-full border px-2.5 py-0.5 text-sm transition-colors sm:px-3 sm:py-1 ${
            value === s
              ? 'border-gold bg-gold/15 text-ink'
              : 'border-parchment-edge text-ink-soft hover:border-gold hover:text-ink'
          }`}
        >
          {BIRD_STYLE_NAMES[s]}
        </button>
      ))}
    </div>
  );
}

function FlightDemo({ style, rtl }: { style: BirdStyle; rtl: boolean }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = flightSteps.length - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setStep((s) => (s >= last ? 0 : s + 1)), 2200);
    return () => clearInterval(t);
  }, [playing, last]);

  const current = flightSteps[step] ?? flightSteps[0]!;
  const btn =
    'rounded-md border border-parchment-edge px-3 py-1 text-sm text-ink-soft transition-colors hover:border-gold hover:text-ink disabled:opacity-40 disabled:hover:border-parchment-edge';
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Back
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => setStep((s) => Math.min(last, s + 1))}
          disabled={step === last}
        >
          Next →
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
        >
          {playing ? 'Pause' : 'Auto-play'}
        </button>
        <span className="ml-auto text-sm text-ink-soft">
          <span className="text-gold-deep">
            {step + 1} / {flightSteps.length}
          </span>{' '}
          · <span className="italic">{current.title}</span>
        </span>
      </div>
      <Stage scene={current.scene} birdStyle={style} direction={rtl ? 'rtl' : 'ltr'} />
    </Card>
  );
}

/** Dev-only gallery of the stage primitives (route: /dev/stage). */
/** `?theme=light|dark` pins the theme (handy for screenshots). */
function useThemeParam() {
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('theme');
    if (t === 'light' || t === 'dark') setThemePreference(t);
  }, []);
}

export default function StagePlayground() {
  useThemeParam();
  const [style, setStyle] = useState<BirdStyle>(BIRD_STYLE);
  const [rtl, setRtl] = useState(false);
  const [sandbox, setSandbox] = useState(100);
  const direction = rtl ? 'rtl' : 'ltr';
  const dense = densityScenes;

  return (
    <div
      className="pb-24"
      style={{ width: breakout, marginInline: `calc((100% - ${breakout}) / 2)` }}
    >
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-double border-gold pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold-deep">Dev · Phase 3</p>
          <h2 className="text-4xl font-medium text-ink">Stage playground</h2>
          <p className="mt-1 max-w-xl text-ink-soft italic">
            The stage primitives in isolation. Everything here is provisional and for the author to
            react to.
          </p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
          <ThemeToggle />
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={rtl}
              onChange={(e) => setRtl(e.target.checked)}
              className="accent-[var(--kn-gold)]"
            />
            Right-to-left flow
          </label>
        </div>
      </header>

      <Section
        title="Bird candidates"
        he="ציפורים"
        note="The manuscript line-art dove is the default; the other two are kept only for comparison. Each is shown across tints and statuses. On the stage each revealed bird carries its word label; the ח lozenge / ע roundel shown here stands in only for an unlabelled bird."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {STYLE_ORDER.map((s) => (
            <Card key={s} className={s === style ? 'ring-1 ring-gold' : ''}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h3 className="text-xl text-ink">{BIRD_STYLE_NAMES[s]}</h3>
                {s === BIRD_STYLE && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-gold-deep">
                    default
                  </span>
                )}
              </div>
              <p className="mb-4 text-sm text-ink-soft">{RATIONALE[s]}</p>
              <SizeStrip style={s} />
              <div className="mt-4">
                <BirdMatrix style={s} />
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <div className="sticky top-0 z-10 mt-12 flex flex-wrap items-center gap-3 border-y border-parchment-edge bg-parchment/90 py-2 backdrop-blur">
        <span className="hidden text-sm italic text-ink-soft sm:inline">Stages below use:</span>
        <StyleButtons value={style} onChange={setStyle} />
      </div>

      <Section
        title="Containers"
        he="קינים ותערובות"
        note="Plain box outlines, no fills: kein (solid ink) · pile (thin faint line) · mixture (double purple line) · zone (dashed gold) · loose (no box: a lone bird is not a group), and a highlighted and a dimmed kein. Captions sit under each box."
      >
        <Card>
          <Stage scene={containerKinds} birdStyle={style} direction={direction} />
        </Card>
      </Section>

      <Section
        title="Flight"
        he="פריחה"
        note="Birds are keyed by id: when a bird changes container it flies to its new slot. Mixed birds lose their colour to the observer."
      >
        <FlightDemo style={style} rtl={rtl} />
      </Section>

      <Section
        title="Density"
        note="1, 5, 12 and 40 birds. Containers wrap into rows; birds pack into a grid that grows with the count."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {dense.slice(0, 2).map(({ count, scene }) => (
            <Card key={count}>
              <p className="mb-2 text-sm text-gold-deep">
                {count} bird{count === 1 ? '' : 's'}
              </p>
              <Stage scene={scene} birdStyle={style} direction={direction} />
            </Card>
          ))}
        </div>
        {dense.slice(2).map(({ count, scene }) => (
          <Card key={count} className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gold-deep">{count} birds</p>
              {count === 12 && (
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  Width
                  <input
                    type="range"
                    min={30}
                    max={100}
                    value={sandbox}
                    onChange={(e) => setSandbox(Number(e.target.value))}
                    className="accent-[var(--kn-gold)]"
                  />
                  <span className="w-10 tabular-nums">{sandbox}%</span>
                </label>
              )}
            </div>
            <div style={{ width: count === 12 ? `${sandbox}%` : '100%' }} className="mx-auto">
              <Stage scene={scene} birdStyle={style} direction={direction} />
            </div>
          </Card>
        ))}
      </Section>
    </div>
  );
}
