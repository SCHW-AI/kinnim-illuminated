import { Link } from 'react-router';
import { hebrewNumeral, hebrewRef, listMishnayos, type MishnahText } from '../content';
import { useRegistry } from './registry';

/** The opening words of a mishnah, by which it is traditionally named. */
function incipit(he: string): string {
  return `${he
    .split(' ')
    .slice(0, 4)
    .join(' ')
    .replace(/[,.:;]+$/, '')}…`;
}

function chaptersOf(texts: readonly MishnahText[]): [number, MishnahText[]][] {
  const chapters = new Map<number, MishnahText[]>();
  for (const text of texts)
    chapters.set(text.chapter, [...(chapters.get(text.chapter) ?? []), text]);
  return [...chapters];
}

/** Every mishnah of Kinnim, grouped by chapter; illustrated ones are marked. */
export function Navigator() {
  const registry = useRegistry();
  return (
    <nav aria-label="Mishnayos of Kinnim" className="space-y-10">
      {chaptersOf(listMishnayos()).map(([chapter, texts]) => (
        <section key={chapter} aria-labelledby={`chapter-${chapter}`}>
          <h2
            id={`chapter-${chapter}`}
            className="mb-4 flex items-baseline gap-3 border-b border-parchment-edge pb-2 text-2xl text-ink"
          >
            <span className="tracking-wide [font-variant:small-caps]">Chapter {chapter}</span>
            <span lang="he" dir="rtl" className="text-gold-deep dark:text-gold">
              פרק {hebrewNumeral(chapter)}
            </span>
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {texts.map((text) => {
              const def = registry.get(text.id);
              return (
                <li key={text.id}>
                  <Link
                    to={`/mishnah/${text.id}`}
                    className={`kn-card group flex h-full flex-col gap-2 p-4 no-underline ${def ? 'kn-card-illustrated' : ''}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-sm tabular-nums text-ink-soft">
                        {text.chapter}:{text.mishnah}
                      </span>
                      <span lang="he" dir="rtl" className="text-lg text-ink">
                        {hebrewRef(text.chapter, text.mishnah)}
                      </span>
                    </span>
                    <span lang="he" dir="rtl" className="line-clamp-1 text-ink-soft">
                      {incipit(text.he)}
                    </span>
                    <span className="mt-auto pt-1 text-sm">
                      {def ? (
                        <span className="kn-badge kn-badge-gold">
                          Illustrated · {def.cases.length}{' '}
                          {def.cases.length === 1 ? 'case' : 'cases'}
                        </span>
                      ) : (
                        <span className="italic text-ink-faint">not yet illustrated</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </nav>
  );
}
