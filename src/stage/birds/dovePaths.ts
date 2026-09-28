/*
 * Hand-drawn dove outline shared by the manuscript and gilded styles.
 * Authored facing right in a 100 × 100 box; glyphs mirror it to face left.
 */

/** Head, breast, belly and tail as one closed outline. */
export const DOVE_BODY =
  'M80.4 31C80 29 80.2 26.8 80.8 25.6C79.6 21.8 76.4 20.2 72.6 20.4C68 20.6 65.2 24 65 28.4C64.8 33 62 37.6 55 41.4C45 46.4 28 50.4 6 53.6C4.6 53.8 4 55.2 4.8 56.4L6.6 59.4C7.2 60.2 8.2 60.4 9.4 60.2C22 59 33 60.5 43 65.5C53 71 66 73 75.5 66.5C82.5 61.5 84.5 52 82.6 44.5C81.8 41 80.8 37 80.4 31Z';

/** The folded wing lying along the back. */
export const DOVE_WING =
  'M63 39.5C66.5 47 63 56 52 61C42 65.4 28 63 13 57.5C28 54 42 49.5 53 44.5C57 42.6 60.4 41 63 39.5Z';

/** Primary feather strokes on the wing. */
export const DOVE_FEATHERS = ['M53.5 56.5C45 60 33 60 22 57.8', 'M58.5 50C51 54.6 40 56.4 30 55.8'];

/** Short beak. */
export const DOVE_BEAK = 'M80.6 26.4Q85.5 27.2 88.6 29.4Q85 30.6 80.4 30.2Z';

/** Eye centre. */
export const DOVE_EYE = { cx: 74.4, cy: 26 } as const;

/** Legs and toes. */
export const DOVE_LEGS =
  'M58 71.5L56.6 79.5M56.6 79.5L52.8 80.8M56.6 79.5L59.4 81.4M65.6 70.6L65.8 79.3M65.8 79.3L62.3 80.7M65.8 79.3L68.8 80.9';

/** Mirrors the dove to face left and centres it in the box. */
export const DOVE_FACE_LEFT = 'matrix(-1 0 0 1 96 0)';
