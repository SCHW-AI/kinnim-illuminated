# Hadasim CLM

The site's Hebrew face, self-hosted.

- **Font:** Hadasim CLM, version 0.140, by Yoram Gnat (2010), inspired by
  Henri Friedlander's Hadassah; OpenType features by Maxim Iorsh (2023). Part
  of the Culmus project.
- **Source:** the official Culmus release, <https://culmus.sourceforge.io/>,
  file `culmus-0.140.tar.gz` from
  <https://sourceforge.net/projects/culmus/files/culmus/0.140/> (released
  2 August 2024, downloaded 2026-09-28). SHA-256
  `6daed104481007752a76905000e71c0093c591c8ef3017d1b18222c277fc52e3`; its
  SHA-1 (`09a43dff4ed32cf1f0676ba325cff4668e261fb8`) and MD5 match the values
  SourceForge publishes.
- **Licence:** GNU General Public License version 2, with the Culmus font
  exception (a document that embeds the font is not thereby covered by the
  GPL). `LICENSE` (the copyright notices and the exception) and `GNU-GPL` (the
  licence text) are the package's own files, unaltered.
- **Corresponding source:** the fonts' editable sources are in
  `culmus-src-0.140.tar.gz` on the same release page.

## Files

| File                       | What                                                |
| -------------------------- | --------------------------------------------------- |
| `HadasimCLM-Regular.woff2` | `HadasimCLM-Regular.otf` from the package, as WOFF2 |
| `HadasimCLM-Bold.woff2`    | `HadasimCLM-Bold.otf` from the package, as WOFF2    |
| `hadasim-clm.css`          | The `@font-face` rules, imported by `src/index.css` |
| `LICENSE`, `GNU-GPL`       | Licence                                             |

Source OTF SHA-256: Regular
`950cbb40f332b2dfaa36d71461caa385245a4f33ae3478ef03c7e6bb0d960a0c` (47,724
bytes), Bold `6966208f183ad903b4155db069300733bbdf9f9c6afe5acbfe1657ff4d879ce5`
(51,664 bytes).

The package also has Regular Oblique and Bold Oblique. They are not shipped:
the site sets all Hebrew upright, even inside italic English.

## How the WOFF2 was made

With fontTools 4 and brotli (`fontTools.ttLib.woff2.compress`), from the OTFs.
**Not subset:** every glyph and every table is kept. CFF, GDEF, GPOS, GSUB,
OS/2, cmap, hhea, hmtx, maxp, name and post decompress byte-identical to the
OTFs'. In `head` only the checksum and the WOFF2 "lossless conversion" flag
differ. The GPOS `mark` and `mkmk` features, which place the nikud, are intact.
The files are 21,592 bytes (Regular) and 24,624 bytes (Bold), so subsetting
would save little.

`hadasim-clm.css` limits the faces with `unicode-range` to the fonts' Hebrew
(U+0591-U+05C7, U+05D0-U+05EA, U+05F0-U+05F4, presentation forms
U+FB1D-U+FB4F) and the spaces, digits and punctuation Hebrew text uses. Latin
letters in a Hebrew run fall through to EB Garamond, the next family in
`--font-hebrew`.
