import { useId } from 'react';
import type { VariantDef } from '../engine';
import { BilingualLabel } from './RichText';

/** The reverse switch: chooses which setup of the case is shown. */
export function VariantSwitch({
  variants,
  value,
  onChange,
}: {
  variants: readonly VariantDef[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="kn-segmented kn-variant-switch">
      <legend className="sr-only">Variant</legend>
      {variants.map((variant) => (
        <label key={variant.id} className="kn-segment">
          <input
            type="radio"
            name={name}
            value={variant.id}
            checked={variant.id === value}
            onChange={() => onChange(variant.id)}
            className="sr-only"
          />
          <span>
            <BilingualLabel label={variant.label} />
          </span>
        </label>
      ))}
    </fieldset>
  );
}
