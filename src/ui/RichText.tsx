import type {
  RichBlock,
  RichInline as RichInlineValue,
  RichLabel,
  RichText as RichTextValue,
} from '../engine';
import { isHebrewOnly, splitHebrewRuns } from '../lib/hebrew';

/**
 * A plain string that may mix Hebrew and English. Each Hebrew run is isolated
 * in its own `<bdi lang="he" dir="rtl">`, so it reads right-to-left without
 * reordering the English (or the punctuation) around it.
 */
function MixedString({ text }: { text: string }) {
  return (
    <>
      {splitHebrewRuns(text).map((run) =>
        run.hebrew ? (
          <bdi key={run.start} lang="he" dir="rtl">
            {run.text}
          </bdi>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

/** The text of an inline run that is Hebrew only (so its block runs right-to-left), else undefined. */
function hebrewOnly(value: RichInlineValue): string | undefined {
  if (typeof value !== 'string') return value.en ? undefined : value.he;
  return isHebrewOnly(value) ? value : undefined;
}

/**
 * A Hebrew/English pair: the English (left-to-right, any Hebrew in it
 * isolated), then the Hebrew, isolated and right-to-left.
 */
export function BilingualLabel({ label }: { label: RichLabel }) {
  return (
    <>
      {label.en && (
        <bdi dir="ltr">
          <MixedString text={label.en} />
        </bdi>
      )}
      {label.en && label.he && ' '}
      {label.he && (
        <bdi lang="he" dir="rtl" className="kn-he-gloss">
          {label.he}
        </bdi>
      )}
    </>
  );
}

/**
 * One run of rich text, rendered inline (no block wrapper). A plain string that
 * is not Hebrew-only belongs to the English flow, so it gets a left-to-right
 * base even when it starts with a Hebrew word.
 */
export function RichInline({ value }: { value: RichInlineValue }) {
  if (typeof value !== 'string') return <BilingualLabel label={value} />;
  return hebrewOnly(value) !== undefined ? (
    <MixedString text={value} />
  ) : (
    <bdi dir="ltr">
      <MixedString text={value} />
    </bdi>
  );
}

/**
 * A block holding one inline run: right-to-left Hebrew for a Hebrew-only run,
 * otherwise left-to-right. Never `dir="auto"`: an English string that starts
 * with a Hebrew word must not flip to a right-to-left base.
 */
function blockDir(value: RichInlineValue) {
  return hebrewOnly(value) !== undefined
    ? ({ lang: 'he', dir: 'rtl' } as const)
    : ({ dir: 'ltr' } as const);
}

function Inline({ value }: { value: RichInlineValue }) {
  // The block sets the base direction, so the run is not isolated again.
  const he = hebrewOnly(value);
  if (he !== undefined) return he;
  return typeof value === 'string' ? (
    <MixedString text={value} />
  ) : (
    <BilingualLabel label={value} />
  );
}

function Block({ block }: { block: RichBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p {...blockDir(block.text)}>
          <Inline value={block.text} />
        </p>
      );
    case 'heading':
      return (
        <h3 {...blockDir(block.text)} className="kn-rich-heading">
          <Inline value={block.text} />
        </h3>
      );
    case 'list':
      return (
        <ul className="kn-rich-list">
          {block.items.map((item, i) => (
            <li key={i} {...blockDir(item)}>
              <Inline value={item} />
            </li>
          ))}
        </ul>
      );
  }
}

/**
 * Verdicts, reasons and outcomes: a single run becomes one paragraph; blocks
 * become paragraphs, `h3` headings and bulleted lists.
 */
export function RichText({ value, className = '' }: { value: RichTextValue; className?: string }) {
  const blocks: RichBlock[] = Array.isArray(value) ? value : [{ type: 'paragraph', text: value }];
  return (
    <div className={`kn-rich ${className}`}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
