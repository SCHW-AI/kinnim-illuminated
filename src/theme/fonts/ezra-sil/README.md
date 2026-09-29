# Ezra SIL

The site's Hebrew face, self-hosted.

- **Font:** Ezra SIL, version 2.51 (4 October 2007), by SIL International,
  modelled on the square letters of the Biblia Hebraica Stuttgartensia. Hebrew
  layout intelligence by Ralph Hancock and John Hudson.
- **Source:** SIL's official web package, `EzraSIL-2.51-web.zip`, from
  <https://software.sil.org/ezra/download/>
  (<https://software.sil.org/downloads/r/ezra/EzraSIL-2.51-web.zip>, downloaded
  2026-09-28). SHA-256 of the zip:
  `7c19544c173c91e6ac47f605dae2cfa7e61e428abdafe27cf3f225fec4406357`.
- **Licence:** SIL Open Font License 1.1, with the Reserved Font Names "SIL"
  and "Ezra"; the Hebrew layout intelligence is under the MIT/X11 License.
  `LICENSE` (the package's `Licenses.txt`), `OFL-FAQ.txt` and `FONTLOG.txt` are
  the package's own files, unaltered.

## Files

| File                         | What                                                             |
| ---------------------------- | ---------------------------------------------------------------- |
| `EzraSIL-Regular.woff`       | `web/SILEOT.woff` from the package, byte for byte (63,472 bytes) |
| `ezra-sil.css`               | The `@font-face` rule, imported by `src/index.css`               |
| `LICENSE`                    | Licence (OFL 1.1 and MIT/X11)                                    |
| `OFL-FAQ.txt`, `FONTLOG.txt` | The package's licence FAQ and font log                           |

`EzraSIL-Regular.woff` SHA-256:
`c5b6a195d770b98a576969e550f4395283086ef63769118d4ff5d0a3d28afd2e`. It is
SIL's own web font, not converted or subset here, so it is the Font Software
as released (no Modified Version, and the Reserved Font Names are not an
issue). Its GDEF, GPOS, GSUB, cmap, hmtx and glyf tables are byte-identical to
the package's `SILEOT.ttf`; the GPOS `mark` and `mkmk` features, which place
the nikud, are intact.

## Why Ezra SIL, not Ezra SIL SR

The package also has Ezra SIL SR. It differs only in its style of cantillation
marks, and the mishnah text has vowel marks but no cantillation, so SR adds
nothing.

## One weight

Ezra SIL has only a Regular. `src/index.css` sets `font-synthesis: none` on
Hebrew, so the browser never fakes a bold (a synthetic bold smears the nikud);
Hebrew emphasis is carried by size and colour instead.

`ezra-sil.css` limits the face with `unicode-range` to the font's Hebrew
(U+0591-U+05C7, U+05D0-U+05EA, U+05F0-U+05F4, presentation forms
U+FB1D-U+FB4F) and the spaces, digits and punctuation Hebrew text uses. Latin
letters in a Hebrew run fall through to EB Garamond, the next family in
`--font-hebrew`.
