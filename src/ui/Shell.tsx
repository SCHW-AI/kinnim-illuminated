import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { textSource } from '../content';
import { ThemeToggle } from '../theme';

/** The site frame: a header linking home with the theme toggle, the page, and the source attribution. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-parchment-edge/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex items-baseline gap-2 text-ink no-underline"
            aria-label="Kinnim Illuminated, home"
          >
            <span lang="he" dir="rtl" className="text-xl text-gold-deep dark:text-gold">
              קִנִּים
            </span>
            <span className="text-lg tracking-wide [font-variant:small-caps] group-hover:text-gold-deep sm:text-xl dark:group-hover:text-gold-bright">
              Kinnim Illuminated
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 sm:px-6 sm:pt-10">
        {children}
      </main>

      <footer className="border-t border-parchment-edge/80">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-ink-faint sm:px-6">
          Hebrew text:{' '}
          <a
            href="https://www.sefaria.org/Mishnah_Kinnim"
            className="text-ink-soft underline decoration-parchment-edge underline-offset-4 hover:decoration-gold"
          >
            {textSource}
          </a>
          . Hebrew font: Hadasim CLM, from the{' '}
          <a
            href="https://culmus.sourceforge.io/"
            className="text-ink-soft underline decoration-parchment-edge underline-offset-4 hover:decoration-gold"
          >
            Culmus project
          </a>{' '}
          (GPL-2 with font exception;{' '}
          <a
            href="https://sourceforge.net/projects/culmus/files/culmus/0.140/"
            className="text-ink-soft underline decoration-parchment-edge underline-offset-4 hover:decoration-gold"
          >
            source
          </a>
          ).
        </p>
      </footer>
    </div>
  );
}
