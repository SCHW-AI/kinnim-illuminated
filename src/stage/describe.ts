import type { BirdStatus, RichLabel, Scene, SceneBird } from './scene';

/** A RichLabel as one plain string (English first, then Hebrew). */
export function labelText(label: RichLabel | undefined): string {
  if (!label) return '';
  return [label.en, label.he].filter(Boolean).join(' / ');
}

const TINT_TEXT: Record<SceneBird['tint'], string> = {
  chatas: 'chatas',
  olah: 'olah',
  neutral: 'undesignated',
  unknown: 'unknown',
};

export const STATUS_TEXT: Record<BirdStatus, string> = {
  alive: 'alive',
  kasher: 'kasher',
  pasul: 'pasul',
  safek: 'safek (in doubt)',
  yamus: 'yamus (left to die)',
};

/** One-line description of a bird: its label, what is known of it, and its status. */
export function describeBird(bird: SceneBird): string {
  const who = labelText(bird.label);
  const identity = bird.revealed ? TINT_TEXT[bird.tint] : 'identity unknown (?)';
  const extra = bird.emphasis === 'highlight' ? ', highlighted' : '';
  return `${who ? `${who}: ` : ''}${identity}, ${STATUS_TEXT[bird.status]}${extra}`;
}

/** Accessible name of the whole stage. */
export function describeScene(scene: Scene): string {
  return labelText(scene.caption) || 'Offering stage';
}

/** Longer accessible description: each container and what it holds. */
export function summarizeScene(scene: Scene): string {
  const byId = new Map(scene.birds.map((b) => [b.id, b]));
  return scene.containers
    .map((c) => {
      const birds = c.birdIds.flatMap((id) => {
        const b = byId.get(id);
        return b ? [describeBird(b)] : [];
      });
      // Loose birds are no group: just the birds, as the stage draws them.
      if (c.kind === 'loose') return birds.length ? `${birds.join('; ')}.` : '';
      const name = labelText(c.label) || c.kind;
      const count = `${birds.length} bird${birds.length === 1 ? '' : 's'}`;
      return `${name} (${c.kind}, ${count})${birds.length ? `: ${birds.join('; ')}` : ''}.`;
    })
    .filter(Boolean)
    .join(' ');
}
