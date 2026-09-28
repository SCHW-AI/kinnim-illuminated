import { useTheme, type ThemePreference } from './useTheme';

const NEXT_LABEL: Record<ThemePreference, string> = {
  system: 'Theme: follows system. Switch to light',
  light: 'Theme: light. Switch to dark',
  dark: 'Theme: dark. Switch to follow system',
};

const TEXT: Record<ThemePreference, string> = {
  system: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

/** A small button that cycles the theme: system → light → dark. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, resolved, cycle } = useTheme();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={NEXT_LABEL[preference]}
      title={NEXT_LABEL[preference]}
      className={`inline-flex items-center gap-2 rounded-full border border-parchment-edge bg-parchment-deep/70 px-3 py-1 text-sm text-ink-soft shadow-sm transition-colors hover:border-gold hover:text-ink ${className}`}
    >
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        {resolved === 'dark' ? (
          <path
            d="M14.5 12.8A6.5 6.5 0 0 1 7.2 5.5a6.5 6.5 0 1 0 7.3 7.3Z"
            style={{ fill: 'var(--kn-gold)' }}
          />
        ) : (
          <g style={{ stroke: 'var(--kn-gold-deep)', fill: 'var(--kn-gold)' }} strokeWidth="1.3">
            <circle cx="10" cy="10" r="3.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1="10"
                y1="2.2"
                x2="10"
                y2="4.2"
                strokeLinecap="round"
                transform={`rotate(${a} 10 10)`}
              />
            ))}
          </g>
        )}
      </svg>
      <span>{TEXT[preference]}</span>
    </button>
  );
}
