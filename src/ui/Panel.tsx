import type { ReactNode } from 'react';

/** A framed page section with a small-caps title and an optional Hebrew gloss. */
export function Panel({
  title,
  he,
  children,
  className = '',
  ...rest
}: {
  title: string;
  he?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`kn-card p-4 sm:p-5 ${className}`} aria-label={title} {...rest}>
      <h2 className="mb-2 flex items-baseline gap-2 text-sm tracking-[0.12em] text-gold-deep uppercase dark:text-gold">
        <span>{title}</span>
        {he && (
          <span lang="he" dir="rtl" className="tracking-normal normal-case">
            {he}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}
