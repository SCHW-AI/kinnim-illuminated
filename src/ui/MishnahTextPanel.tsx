import { hebrewRef, type MishnahText } from '../content';

/** The mishnah's vocalized Hebrew, right-to-left, opening word gilded. */
export function MishnahTextPanel({ text }: { text: MishnahText }) {
  const space = text.he.indexOf(' ');
  const first = space === -1 ? text.he : text.he.slice(0, space);
  const rest = space === -1 ? '' : text.he.slice(space);
  return (
    <section className="kn-folio" aria-label={`Text of Kinnim ${text.chapter}:${text.mishnah}`}>
      <p className="mb-3 flex items-baseline justify-between gap-3 border-b border-gold/40 pb-2 text-sm text-ink-soft">
        <span className="tracking-[0.12em] uppercase">The Mishnah</span>
        <span lang="he" dir="rtl" className="text-base text-gold-deep dark:text-gold">
          {hebrewRef(text.chapter, text.mishnah)}
        </span>
      </p>
      <p lang="he" dir="rtl" className="kn-mishnah-text">
        <span className="kn-opening-word">{first}</span>
        {rest}
      </p>
    </section>
  );
}
