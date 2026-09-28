> Reference research — not a build spec. Each mishnah's portrayal is designed iteratively with the author.

# Kinnim Chapter 3: Computational Spec for the Scenario Engine

## 0. Summary

1. **Chapter 3 is the after-the-fact version of chapter 1.** Chapter 1 covers what the kohen may do when he asks first (*nimlach*). Chapter 3 covers what counts after a kohen offered on his own. The cases map one to one:

   | Ch. 1–2 (asked first) | Ch. 3 (acted on his own) |
   |---|---|
   | 1:3 (mixed unassigned pairs, equal or unequal) | 3:1–3:2 |
   | 1:2a (designated chatas mixed with designated olah) | 3:3 |
   | 1:4 (R' Yose: pairs bought in partnership) | 3:4 |
   | 1:2b (designated chatas or olah mixed with unassigned pairs) | 3:5 |
   | 2:5 (turtledoves are not paired with pigeons) | 3:6 |

2. **A worst-case brute-force solver reproduces every number in 3:1–3:5.** It enumerates every possible distribution of the unknown birds and takes the minimum number that are valid. Each result was checked by hand and by script (see `solver-prototypes/ch3/`). It works only if you model each owner's unassigned pairs as one interchangeable pool, not pair by pair. The "10 vs 100" case proves this:
   - Owner-pool model: 200 valid, which matches "the larger is valid" (*hamerubeh kasher*).
   - Pair-by-pair model: 110 valid, which contradicts the text.

3. **3:6 (the vow) is not a "how many are valid" problem.** It asks how many new birds the woman must bring so that every possible reality is covered. That is a minimum-cover search over scenarios. With the right rule set it reproduces all eight numbers in the mishnah: 1, 2, 3, 4, 5, 6, 7, and Ben Azzai's 8. It needs extra principles beyond worst case: species matching, conditional stipulation, and doubtful chataos being burned. Two numbers depend on an interpretive switch (§4.6):
   - The 4 needs either the Rambam's rule that a replacement vow bird must match the designated species, or not knowing which pair was the vow. Without either, the solver gives 3, which is exactly Tosafot Yom Tov's objection.
   - Rashi's system (a valid chatas locks the species of the matching olah) reproduces 7 and 8 directly. The Rambam's system reaches 7 through a different branch (a possible rich woman's lamb).

4. **Principles beyond pure worst case** (full list in §2):
   - Unassigned birds become olah or chatas by where the kohen offers them (*ein hakinin mitparshin ela bilkichas be'alim o ba'asiyas kohen*).
   - Live animals are not permanently rejected, so something offered after the fact still counts.
   - Live animals are never nullified by a majority, so no majority rule (*rov*) or nullification (*bitul*) applies.
   - The species-pairing rule (Chachamim vs. Ben Azzai).
   - Partnership kinnim can be assigned by the kohen (R' Yose).
   - "A doubt does not override a certainty" (*ein safek motzi midei vadai*) is never used.

5. **Main interpretive forks to expose as configuration flags:**
   - 3:1–2: Bartenura's worst-case framing vs. the Rambam's (for him, *nimlach* means the owners did not hand the matter to the kohen, and the owner with more birds is "all valid").
   - 3:5: at least four readings (Bartenura; Riva; R' Avraham; the Rambam). R' Avraham's half-above/half-below reading is the only one that is pure worst case for all three numbers.
   - 3:6: Rashi vs. Rambam vs. Bartenura fact patterns.

---

## 1. Sources and conventions

- **Texts fetched from the Sefaria API:**
  - Mishnah Kinnim 1–3, Hebrew (Torat Emet, public domain, vocalized).
  - Bartenura and Tosafot Yom Tov (TYT) on chapter 3.
  - Rambam's Commentary on the Mishnah, chapters 1 and 3.
  - Mishneh Torah, Pesulei HaMukdashin chapters 8–10 (Sefaria title "Sacrifices Rendered Unfit").
- **Quoted inside TYT:** Rashi on Zevachim 67b, "*hamefaresh*" (the commentary printed on Kinnim), Riva, Rabbeinu Avraham, Tosafot, and the Kesef Mishneh citing R' Yosef Korkos.
- **English:** the only English on Sefaria is Kulp (CC-BY). All English below is my own paraphrase.
- **Numbering:** Sefaria numbers chapter 3 as 3:1–3:6, with the aggadic ending (R' Yehoshua; R' Shimon ben Akashya) inside 3:6. Some printed editions split this differently, so check before hard-coding ids.

**Terms**

- **Above / below:** above or below the red line around the altar. A bird chatas is valid only below; a bird olah is valid only above (1:1).
- **Kein:** a pair of birds.
- **Chova (obligation) kein:** one chatas and one olah.
- **Neder / nedavah (vow / freewill) kein:** both birds are olos (1:1).
- **Sethumah:** an unassigned kein. It is not yet decided which bird is chatas and which is olah.
- **Meforeshet:** a kein where each bird's role is already designated.
- **Nimlach:** the kohen asks before offering. Chapter 3's default is a kohen who does not ask.
- **Lot:** a set of birds whose uncertainty behaves as one unit: one owner's (or one obligation-group's) pool of unassigned pairs, or a pile of designated chataos or olos.
- **T / P:** turtledove (*tor*) / young pigeon (*ben yonah*).
- **Notation:** `^` means offered above; `v` means offered below.

---

## 2. Principles (IDs for the engine)

| ID | Principle | Source | Used in |
|---|---|---|---|
| P1 | An unassigned bird's role is set by where it is offered: above makes it an olah, below makes it a chatas. Within one owner's lot, unassigned birds are interchangeable. | Eruvin 37a; MT Pesulei HaMukdashin 8:8; Bartenura 3:1 end ("the kinnim are designated by the kohen's act") | 3:1, 3:2, 3:4, 3:5, 3:6 |
| P2 | Validity by placement: designated chatas valid only below, designated olah valid only above. An unassigned pair yields at most one valid olah and one valid chatas. | 1:1 | all |
| P3 | Worst case: when the identity or placement of birds is unknown, credit only what is valid under every consistent assignment. | Bartenura and Rambam throughout | 3:1–3:5 |
| P4 | Live animals are not permanently rejected, so the "all must die" of chapter 1 is an instruction for before the fact; once offered, what is valid counts. | TYT 3:1 | chapter 3 framing |
| P5 | Live animals are important and are not nullified by a majority ("even one in ten thousand"), so no majority rule or nullification. | Bartenura 1:2 | all |
| P6 | Species pairing: an obligation's olah and chatas must be the same species. Chachamim: the chatas decides. Ben Azzai: the first-offered bird decides. | 2:5 | 3:6 |
| P7 | Partnership: kinnim bought jointly (or with money given to the kohen) may be assigned by the kohen to either owner. The halacha follows R' Yose. | 1:4; MT 8:8 | 3:4, remedies |
| P8 | Conditional joint remedy: when each owner's shortfall type is unknown but the shortfalls are correlated, the owners bring a jointly owned kein with a stipulation. | Bartenura 3:1 | 3:1, 3:2 |
| P9 | Birds brought on doubt: an extra olah becomes a freewill offering (*nedavah*); a chatas brought on doubt is burned, not eaten. | MT 10:5; Rambam 3:6; Bartenura 3:6 | 3:6 |
| P10 | A remedy is a minimum cover: the smallest set of new birds (species plus placement) that completes every obligation in every consistent scenario. | Reconstructed; matches all of 3:6 | 3:6 |
| P11 | A vow may fix the species ("a kein of turtledoves", *kav'ah*). Designating which birds are for the vow (*peirsha*) is a separate act. | 3:6; MT 10:2–3 | 3:6 |

---

## 3. Solvers

### 3.1 Worst-case placement evaluator (after the fact, kohen did not ask)

```
Lot kinds:
  C(k)  = k designated chataos   valid(a) = k - a          (a = birds of this lot that went up)
  O(k)  = k designated olos      valid(a) = a
  S(p)  = p unassigned pairs, one owner-pool (2p birds)
          valid(a) = min(a,p) + min(2p-a, p) = 2p - |a - p|

worstCase(lots, U):              // U = number of birds the kohen put above
  dp = {0: 0}
  for lot in lots:
    ndp = {}
    for (k, v) in dp:
      for a in 0..size(lot):
        ndp[k+a] = min(ndp[k+a] ?? inf, v + valid(lot, a))   // keep back-pointers
    dp = ndp
  return dp[U]                   // plus the adversary's witness a_i per lot
```

The DP is polynomial, so 10 vs 100 is instant.

**Closed form for S-only lots** (checked against brute force on 400 random cases with no mismatch):
- Let N = total pairs and δ = U − N.
- valid_min = 2N − max over subsets S of owners of [ 2·min(n(S), n(Sᶜ)+δ) − δ ].
- For half above / half below (δ = 0): **valid_min = 2·(N − m\*)**, where m\* = max over S of min(n(S), n(Sᶜ)).
- In words: the guaranteed count is the heavier side of the most balanced split of whole owners.
  - If some split is exactly even, you get half ("half valid, half invalid").
  - Otherwise you get more than half. With two women, that is exactly twice the larger woman's pairs (*hamerubeh kasher*).

**Closed form for 3:3 (c designated chataos, o designated olos, U above):** valid_min = |U − c|.

**Per-owner output.** Also compute each owner's worst-case credit (the minimum over scenarios of that owner's valid birds, with the type unknown). Then compute the joint deficit, which gets the conditional joint kein of P8.

### 3.2 Safe plan (before the fact, kohen asked), for contrast with chapter 1

```
safePlan(lots):
  up   = 0 if any C lot else min over S lots of p_i
  down = 0 if any O lot else min over S lots of p_i
```

Brute-force check:
- 1+1 → offer 1 up and 1 down; 1+2 → 1 and 1; 2+3 → 2 and 2. So the smaller woman's count is valid (*hamu'at kasher*, 1:3).
- One chatas mixed with two unassigned pairs → 0 up, 2 down. So only as many as the chataos in the chova (1:2).

### 3.3 Minimum-cover remedy solver (3:6, and remedies generally)

```
Scenario = assignment of all unknowns:
  which birds went up, which kein was the vow, fixed vow species,
  species of the kinnim given, and which of two below-birds counted as the chatas
  (the last is adversarial).

credit(scenario):   // existential: the most favorable crediting consistent with the rules
  vow   <- up birds with role Vow or Unassigned, species = fixed vow species if set, at most 2
  H.olah   <- one up bird of role Obligation/Unassigned
              (forced if an Obligation-designated bird went up)
  H.chatas <- a below bird of role Obligation/Unassigned
              (forced if any; which one is adversarial)
  birds of the wrong fixed species count for nothing

feasible(newBirds, scenario):
  some crediting leaves needs that newBirds can satisfy, where:
    vow needs r olos (species constraint: fixed / designated / free)
    obligation (Chachamim): if a valid chatas of species s exists, the olah MUST be s   [lock]
                            else bring chatas s' plus olah s' (or olah already s')
    obligation (Ben Azzai): the first-offered old bird's species locks the other bird
  extras are fine (P9)

minCover = smallest multiset over {T,P} x {up,down} that is feasible in ALL scenarios
```

The search is tiny: at most 9 birds, 4 bird types, and under 1,000 scenarios.

---

## 4. The mishnayos

### 4.1 Mishnah 3:1

**Hebrew:**
בַּמֶּה דְבָרִים אֲמוּרִים, בְּכֹהֵן נִמְלָךְ. אֲבָל בְּכֹהֵן שֶׁאֵינוֹ נִמְלָךְ, אַחַת לָזוֹ וְאַחַת לָזוֹ, שְׁתַּיִם לָזוֹ וּשְׁתַּיִם לָזוֹ, שָׁלשׁ לָזוֹ וְשָׁלשׁ לָזוֹ, עָשָׂה כֻלָּן לְמַעְלָה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. כֻּלָּן לְמַטָּן, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. חֶצְיָם לְמַעְלָה וְחֶצְיָם לְמַטָּה, אֶת שֶׁלְּמַעְלָה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל, וְאֶת שֶׁלְּמַטָּה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל:

**English (my paraphrase):** The earlier rulings apply when the kohen asks first. If he goes ahead on his own with unassigned obligation pairs of two women mixed together, in equal numbers (1 and 1, 2 and 2, or 3 and 3), the result is always half valid:
- all offered above: half valid;
- all offered below: half valid;
- half above and half below: half of the upper group and half of the lower group are valid.

**Concepts:** P1–P4. "When are these words said" refers back to chapter 1.
- Bartenura (following *hamefaresh*): it refers to 1:2 ("all must die") and 1:3 ("the smaller is valid"). Chapter 1 is before the fact; chapter 3 is after.
- Rambam: it refers to 1:3 ("the smaller is valid"). TYT notes the disagreement.

**Cases** (lots S(n) for Rachel and S(n) for Leah, fully mixed):

| id | n+n | birds | up/down | worst valid | adversary witness |
|---|---|---|---|---|---|
| 3:1-a | 1+1 | 4 | 4/0 | 2 | everything above: each woman has 1 valid olah (min(2,1)) |
| 3:1-b | 1+1 | 4 | 0/4 | 2 | 1 valid chatas each |
| 3:1-c | 1+1 | 4 | 2/2 | 2 | Rachel's pair both up (1 olah valid), Leah's both down (1 chatas valid) |
| 3:1-d/e/f | 2+2 | 8 | 8/0, 0/8, 4/4 | 4, 4, 4 | half/half: one woman's 4 all up → min(4,2) = 2; the other's all down → 2 |
| 3:1-g/h/i | 3+3 | 12 | 12/0, 0/12, 6/6 | 6, 6, 6 | same pattern |

Hand checks:
- 1+1 at 2/2, all three scenarios: (Rachel 2 up, Leah 2 down) → 1+1 = 2; (1/1 and 1/1) → 2+2 = 4; (0 up, 2 up) → 2. Minimum = 2 = half. In that worst scenario exactly 1 of the 2 upper birds and 1 of the 2 lower birds is valid, which is the text's "of the upper, half; of the lower, half."
- Formula: 2·(N − m\*) = 2·(2 − 1) = 2. ✓

**Per-owner credit and remedy:**
- All above: every bird is above, so it is certain that each woman has n valid olos. Each needs n chataos.
- Half/half: each woman's worst case is "all mine on one side". She has half her needs, but does not know which type.
- The shortfalls are correlated: if Rachel is all above, Leah is all below. Bartenura: they bring one kein (per missing pair) in partnership with a stipulation: "if the first valid bird was an olah for Leah, this chatas is Leah's," or the reverse (P8).

**Bartenura's aside:** if in reality the kohen split each pair (one up, one down), everything is valid ("I say the olah went above and the chatas below"). The mishnah's "half" is the guaranteed minimum, not the actual result.

**Solver reproduces the text?** Yes, all 9 cells.

**Visual:** Two colored owner-flocks mix into one gray flock. The user drags birds into an "above" or "below" zone, or uses sliders for counts. On reveal, the adversary animates the worst-case coloring (whole flocks on one side). Valid birds glow; each owner's pie shows "1 of 2, type unknown". A "joint kein" button shows the stipulated remedy.

### 4.2 Mishnah 3:2

**Hebrew:**
אַחַת לָזוֹ, וּשְׁתַּיִם לָזוֹ, וְשָׁלשׁ לָזוֹ, וְעֶשֶׂר לָזוֹ, וּמֵאָה לָזוֹ, עָשָׂה כֻלָּן לְמַעְלָה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. כֻּלָּן לְמַטָּן, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. חֶצְיָן לְמַעְלָן וְחֶצְיָן לְמַטָּן, הַמְרֻבֶּה כָשֵׁר. זֶה הַכְּלָל, כָּל מָקוֹם שֶׁאַתָּה יָכוֹל לַחֲלֹק אֶת הַקִּנִּין וְלֹא יְהוּ מִשֶּׁל אִשָּׁה אַחַת, בֵּין מִלְמַעְלָן בֵּין מִלְּמַטָּן, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. כָּל מָקוֹם שֶׁאֵין אַתָּה יָכוֹל לַחֲלֹק אֶת הַקִּנִּין עַד שֶׁיְּהוּ מִשֶּׁל אִשָּׁה אַחַת, בֵּין מִלְמַעְלָן בֵּין מִלְּמַטָּן, הַמְרֻבֶּה כָשֵׁר:

**English (my paraphrase):** With unequal numbers (1 pair vs. 2, 3, 10 or 100), all above or all below is half valid. Half above and half below makes "the larger" valid. The general rule:
- If the upper and lower groups could each be made up of whole owners (no woman with birds on both sides), half is valid.
- If some woman must have birds on both sides, the larger amount is valid.

**Reading of the list:** Bartenura reads it as two-woman pairings (1 vs 2, 2 vs 3, 10 vs 100). The Rambam (1:3) stresses that the numbers are kinnim, not single birds.

**Cases** (two owners S(n1) and S(n2), half/half unless noted):

| id | n1+n2 | birds | up/down | worst valid | text | witness (Rachel's birds up; the rest follows) |
|---|---|---|---|---|---|---|
| 3:2-a | 1+2 | 6 | 6/0 | 3 | half ✓ | — |
| 3:2-b | 1+2 | 6 | 3/3 | **4** | larger (2 pairs) ✓ | Rachel 0 up (1 chatas valid); Leah 3 up/1 down → 2+1 = 3; total 4 |
| 3:2-c | 1+3 | 8 | 4/4 | **6** | larger ✓ | Rachel 0 up → 1; Leah 4/2 → 3+2 = 5 |
| 3:2-d | 2+3 | 10 | 5/5 | **6** | larger ✓ (Bartenura's example) | 2+3's pool: 0 up; the other 5/1... |
| 3:2-e | 1+10 | 22 | 11/11 | **20** | larger ✓ | |
| 3:2-f | 10+100 | 220 | 110/110 | **200** (20 birds, i.e. 10 kinnim, lost) | larger ✓ (Bartenura: "10 whole kinnim invalid") | |
| 3:2-g | 1+100 | 202 | 101/101 | 200 | larger ✓ | |

Full hand enumeration for 3:2-b (let a = Rachel's birds above):
- a = 0: Rachel 1 valid; Leah 3 up/1 down → 3. Total 4.
- a = 1: Rachel 2; Leah 2/2 → 4. Total 6.
- a = 2: Rachel 1; Leah 1/3 → 3. Total 4.
- Minimum = 4 = 2 kinnim.

The joint deficit is exactly one olah plus one chatas: if Rachel is all above, Rachel needs a chatas and Leah an olah, or the reverse. So one stipulated joint kein covers it (Bartenura).

**General proof for two women** (n1 < n2, half/half): Rachel all on one side gives her n1. Leah then has n2 − n1 on that side and n2 + n1 on the other, giving (n2 − n1) + n2. Total = 2·n2, which is the larger woman's bird count.

**Owner-pool vs. pair-level (a critical modeling decision):**
- Pair-level worst case gives P birds for an even number of pairs P, or P+1 for odd P. For 10+100 that is 110, but the text requires 200.
- So a woman's unassigned kinnim must be one interchangeable pool (P1).
- Caveat: 1:3 says the mixture rule applies "even for one woman", so the pool is really one owner's obligation-group. See uncertainty U2.

**"This is the general rule" (*zeh haklal*) generalized to three or more women:** valid = the heavier side of the most balanced partition of whole owners.
- 1, 2, 3 pairs: {1,2} vs {3} is exactly even → 6 of 12 = half.
- 1, 2, 4 pairs: best split is 3 vs 4 → 8 = twice the largest woman.
- 3, 3, 4 pairs: best split 4 vs 6 → 12. This is not twice the largest woman (8).
- The mishnah never states a case with three or more women. Flag this as an extrapolation that matches the wording "the larger [part]".

**Rambam's alternative framing** (Commentary on 3:1; MT 8:6–7):
- *Nimlach* means the owners did not hand the decision to the kohen. If the kohen then did half/half anyway, the smaller count is valid (MT 8:6, example 4 birds vs 6 birds).
- *Eino nimlach* means the kohen was entrusted, and the larger count is valid "because the majority owner necessarily had birds both above and below, so all her offerings are valid" (MT 8:7).
- The counts match worst case. The attribution does not: in the 1+2 case, worst case gives Leah 3 of her 4 birds, not all 4. Treat "all hers valid" as the Rambam's loose description of the count, or model his attribution separately (U1).
- His "the smaller is valid" for a *nimlach* half/half case is not a worst-case result (it is lower). It rests on the owner's claim "you had no authority". That is chapter 1's domain; implement it as a flag.

**Bartenura's aside on 10/100:** his constructive example (Rachel's whole kein above plus one of Leah's) "can't be found" in 10/100 because the counts are even. He then gives the general worst-case argument. The engine does not need the constructive example.

**Solver reproduces the text?** Yes, every number, under the owner-pool model.

**Visual:** Unequal flocks. A slider sets the number of birds above. A live "can whole flocks fill the upper zone?" indicator lights green (half) or red (larger). The worst case animates the smaller flock onto one side and the leftover of the larger flock splitting. Headline: "valid = 2 × 100 pairs."

### 4.3 Mishnah 3:3

**Hebrew:**
חַטָּאת לָזוֹ, וְעוֹלָה לָזוֹ, עָשָׂה כֻלָּן לְמַעְלָן, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. כֻּלָּן לְמַטָּן, מֱחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. חֶצְיָן לְמַעְלָן וְחֶצְיָן לְמַטָּן, שְׁתֵּיהֶן פָּסוּל, שֶׁאֲנִי אוֹמֵר, חַטָּאת קְרֵבָה לְמַעְלָן וְעוֹלָה לְמַטָּן:

**English (my paraphrase):** One woman's designated chatas and another's designated olah. All above: half valid (the olah). All below: half valid (the chatas). Half and half: both invalid, because we must assume the chatas went up and the olah went down.

**Concepts:**
- Bartenura: this mirrors 1:2 (chatas mixed with olah, "all must die" if he asks). After the fact, each bird is judged by where it actually went (P4).
- Rambam: there is no mixture at all, since a mixture would mean all die. Rather, the kohen does not know which group he offered above.
- MT 8:9: "chataos and olos before him ... he does not know whether it was the chataos he did below ... all invalid."
- Both readings give the same numbers.

**Cases** (lots C(1) and O(1), or C(n) and O(n)):

| id | lots | up/down | worst valid | witness |
|---|---|---|---|---|
| 3:3-a | C1, O1 | 2/0 | 1 | olah valid |
| 3:3-b | C1, O1 | 0/2 | 1 | chatas valid |
| 3:3-c | C1, O1 | 1/1 | **0** | chatas up, olah down ("I say ...") |
| 3:3-d | C3, O3 | 3/3 | 0 | all chataos up |

Closed form: valid_min = |U − c|.

**Remedy:**
- All above: the chatas owner must bring a new chatas; the olah owner is covered.
- Half/half: both must bring again.

**Solver reproduces the text?** Yes.

**Visual:** Two labeled piles, shown as a mixture (Bartenura) or as intact piles of unknown identity (Rambam). The user places them. The reveal flips the labels to the worst case.

### 4.4 Mishnah 3:4

**Hebrew:**
חַטָּאת וְעוֹלָה וּסְתוּמָה וּמְפֹרֶשֶׁת, עָשָׂה כֻלָּן לְמַעְלָן, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. כֻּלָּן לְמַטָּה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. חֶצְיָן לְמַעְלָן וְחֶצְיָן לְמַטָּן, אֵין כָּשֵׁר אֶלָּא סְתוּמָה, וְהִיא מִתְחַלֶּקֶת בֵּינֵיהֶן:

**English (my paraphrase):** There is a chatas, an olah, an unassigned kein and a designated kein. All above or all below: half valid. Half and half: only the unassigned kein is valid, and it is split between the two owners.

**Two fact models:**

- **Bartenura (M-B):**
  - Two women bought three kinnim together. Woman A needs an olah plus a kein; woman B needs a chatas plus a kein.
  - One kein was split up front: its olah bird to A, its chatas bird to B.
  - One kein was left unassigned (*sethumah*).
  - The third kein has its olah and chatas designated, but its owner is not assigned (*meforeshet*).
  - So there are 6 birds: olah-A, chatas-B, sethumah (s1, s2), and meforeshet (mO, mC).
- **Rambam (M-R)** (Commentary; MT 8:10–11):
  - Three piles: chataos, olos, and an unassigned pile (half olah, half chatas).
  - The kohen put one pile up, one pile down, and split the third.
  - He does not know which designated pile went where, nor which owner the unassigned pile belongs to.
  - It is "not a mixture".

**Cases:**

| id | model | up/down | worst valid | text |
|---|---|---|---|---|
| 3:4-a | M-B, bird-level mixture | 6/0 | 3 (olah-A, mO, one of s) | half ✓ |
| 3:4-b | M-B | 0/6 | 3 | half ✓ |
| 3:4-c | M-B | 3/3 | **2** | "only the sethumah" ✓ (as a count) |
| 3:4-c' | M-R, pile-level | chatas pile up, olah pile down (worst), sethumah split | 2 (exactly the sethumah) | ✓ (identity-exact) |

Why 3:4-c cannot go below 2: to get only 1 valid, the adversary must put both sethumah birds on one side, say above. The third upper bird must then be a chatas. That leaves the other chatas below, and it is valid. Minimum = 2. One minimal witness: above = {chatas-B, mC, s1}, below = {olah-A, mO, s2}. The only valid birds are s1 (olah) and s2 (chatas).

**"Split between them":**
- Bartenura: because they bought in partnership (P7), one woman is credited the chatas and the other the olah.
- Rambam: each owner is credited half the sethumah's count, and each completes the rest.
- Under M-B, assigning the olah to A and the chatas to B means each still needs one full kein, so 4 birds in total. That matches 6 − 2.
- TYT citing Tosafot (Zevachim 67): the mishnah only needed the sethumah and the meforeshet; the separate chatas and olah add nothing.

**Solver reproduces the text?** Yes, as a count under M-B (the valid identities vary between worst-case witnesses). Under M-R it is identity-exact. Recommend M-R for the UI: three piles, identities hidden.

**Visual:** Three piles. The user sends one pile up and one down, and splits the third. The reveal shows the two designated piles swapped, the split pile glowing, and its credit halved onto both owners' ledgers.

### 4.5 Mishnah 3:5

**Hebrew:**
חַטָּאת שֶׁנִּתְעָרְבָה בְחוֹבָה, אֵין כָּשֵׁר אֶלָּא מִנְיַן חַטָּאת שֶׁבַּחוֹבָה. חוֹבָה שְׁנַיִם בְּחַטָּאת, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. וְחַטָּאת שְׁנַיִם בְּחוֹבָה, הַמִּנְיָן שֶׁבַּחוֹבָה כָּשֵׁר. וְכֵן עוֹלָה שֶׁנִּתְעָרְבָה בְחוֹבָה, אֵין כָּשֵׁר אֶלָּא מִנְיַן עוֹלוֹת שֶׁבַּחוֹבָה. חוֹבָה שְׁנַיִם בְּעוֹלָה, מֶחֱצָה כָשֵׁר וּמֶחֱצָה פָסוּל. עוֹלָה שְׁנַיִם בְּחוֹבָה, הַמִּנְיָן שֶׁבַּחוֹבָה כָּשֵׁר:

**English (my paraphrase):** When designated chataos are mixed into unassigned obligation pairs, only as many as the chataos inside the obligation are valid.
- If the obligation birds are double the chataos: half valid.
- If the chataos are double the obligation birds: a number equal to the obligation is valid.
- The same three statements hold with a designated olah in place of the chatas.

**Readings (all reported by TYT).** A = chova birds; C = designated chataos.

| Reading | Setup | Clause 1 | "Chova double" | "Chatas double" | Pure worst case? |
|---|---|---|---|---|---|
| **R' Avraham** (recommended as primary) | kohen did half/half, full mixture | C = A (equal): valid = p = chataos in the chova | A = 2C, e.g. C = 2, one owner's 2 pairs (4 birds), 3/3: worst valid 3 of 6 = **half** ✓ | C = 2A, e.g. C = 4, 1 pair, 3/3: worst **2** = size of the chova ✓ | Yes, all three |
| **Riva** | half/half, C = 8 and C = 16 | — | C 8 + 4 pairs (8 birds), 8/8 → **4** = chataos in the chova ("half" of the chova's count) ✓ | C 16 + 4 pairs, 12/12 → **8** = the chova's whole count ✓ | Yes, numbers reproduced; "half" is measured against the chova |
| **Bartenura / *hamefaresh* (first)** | before the fact, one bird of two chova pairs already offered | — | olah already offered: remaining chova slots are 2 chatas + 1 olah, plus 1 designated chatas (4 birds) → safely offer only 2 below → **2 of 4** ✓ | chatas already offered: remaining slots 1 chatas + 2 olos, plus designated chatas → only **1** below (less than half) ✓ | This is the safe-plan solver with partially consumed pools. TYT objects that it teaches nothing new. |
| **Rambam** (Commentary 3:5; MT 8:2–4) | 5 designated chataos + 10 chova birds (5 pairs); kohen splits 10 to one side and 5 to the other | before the fact: only the chova's chatas count (1:2) | "half of the chova is valid" = the chova owner's worst-case credit (5 of 10) | — | Per-owner worst case (see note). MT 8:3 adds his own view ("it seems to me") that the kohen should do all of them below. |

Worked worst case for R' Avraham, "chova double" (2 designated chataos + 2 pairs, 3 up and 3 down). Let x = designated chataos placed up; valid = (2 − x) + min(3 − x, 2) + min(1 + x, 2):
- x = 0 → 2 + 2 + 1 = 5
- x = 1 → 1 + 2 + 2 = 5
- x = 2 → 0 + 1 + 2 = **3**

This matches his own words: "maybe two chataos went up plus an olah of the unassigned; below, two chataos and an olah."

Worked worst case, "chatas double" (4 designated chataos + 1 pair, 3/3). Let x = designated chataos up, x in 1..3; valid = (4 − x) + min(3 − x, 1) + min(x − 1, 1):
- x = 3 → 1 + 0 + 1 = **2**

"Three chataos done above are invalid."

**Note on the Rambam's example:** the total worst case there is 10, not 5. The Rambam's "5" is the chova owner's credit (the designated chataos may all be the ones invalidated). So the engine must report per-owner credit, not only the total.

**Olah version:** symmetric. Solver: 2 olos + 1 pair at 2/2 → 1; 2 olos + 2 pairs at 3/3 → 3; 4 olos + 1 pair at 3/3 → 2.

**Solver reproduces the text?**
- R' Avraham and Riva: yes, worst-case evaluator.
- Bartenura: yes, with the safe-plan solver extended to lots with partially consumed role slots `S(slots: {olah: i, chatas: j})`.
- Rambam: per-owner worst case, plus his own "do all below" suggestion, which is a policy, not a derivation.

**Visual:** A designated-chatas flock (red tags) merges with a gray chova flock. A reading selector switches the setup. The worst case shows the red birds all floating up and dying.

### 4.6 Mishnah 3:6 (the vow; end of the tractate)

**Hebrew:**
הָאִשָּׁה שֶׁאָמְרָה, הֲרֵי עָלַי קֵן כְּשֶׁאֵלֵד זָכָר, יָלְדָה זָכָר, מְבִיאָה שְׁתֵּי קִנִּים, אַחַת לְנִדְרָהּ וְאַחַת לְחוֹבָתָהּ. נְתָנָתַם לַכֹּהֵן, וְהַכֹּהֵן צָרִיךְ לַעֲשׂוֹת שָׁלשׁ פְּרִידִים מִלְמַעְלָן וְאַחַת מִלְּמַטָּן. לֹא עָשָׂה כֵן, אֶלָּא עָשָׂה שְׁתַּיִם לְמַעְלָן וּשְׁתַּיִם לְמַטָּן וְלֹא נִמְלַךְ, צְרִיכָה לְהָבִיא עוֹד פְּרִידָה אַחַת, וְיַקְרִיבֶנָּה לְמַעְלָן, מִמִּין אֶחָד. מִשְּׁנֵי מִינִין, תָּבִיא שְׁתַּיִם. פֵּרְשָׁה נִדְרָהּ, צְרִיכָה לְהָבִיא עוֹד שָׁלשׁ פְּרִידִים, מִמִּין אֶחָד. מִשְּׁנֵי מִינִין, תָּבִיא אַרְבַּע. קָבְעָה נִדְרָהּ, צְרִיכָה לְהָבִיא עוֹד חָמֵשׁ פְּרִידִים, מִמִּין אֶחָד. מִשְּׁנֵי מִינִין, תָּבִיא שֵׁשׁ. נְתָנָתַם לַכֹּהֵן וְאֵין יָדוּעַ מַה נָּתְנָה, הָלַךְ הַכֹּהֵן וְעָשָׂה וְאֵין יָדוּעַ מֶה עָשָׂה, צְרִיכָה לְהָבִיא עוֹד אַרְבַּע פְּרִידִים לְנִדְרָהּ, וּשְׁתַּיִם לְחוֹבָתָהּ, וְחַטָּאת אֶחָת. בֶּן עַזַּאי אוֹמֵר, שְׁתֵּי חַטָּאוֹת. אָמַר רַבִּי יְהוֹשֻׁעַ, זֶה הוּא שֶׁאָמְרוּ, כְּשֶׁהוּא חַי קוֹלוֹ אֶחָד, וּכְשֶׁהוּא מֵת קוֹלוֹ שִׁבְעָה. כֵּיצַד קוֹלוֹ שִׁבְעָה. שְׁתֵּי קַרְנָיו, שְׁתֵּי חֲצוֹצְרוֹת. שְׁתֵּי שׁוֹקָיו, שְׁנֵי חֲלִילִין. עוֹרוֹ, לְתֹף. מֵעָיו, לִנְבָלִים. בְּנֵי מֵעָיו, לְכִנּוֹרוֹת. וְיֵשׁ אוֹמְרִים, אַף צַמְרוֹ לִתְכֵלֶת. רַבִּי שִׁמְעוֹן בֶּן עֲקַשְׁיָא אוֹמֵר, זִקְנֵי עַם הָאָרֶץ, כָּל זְמַן שֶׁמַּזְקִינִין, דַּעְתָּן מִטָּרֶפֶת עֲלֵיהֶן, שֶׁנֶּאֱמַר (איוב יב), מֵסִיר שָׂפָה לְנֶאֱמָנִים וְטַעַם זְקֵנִים יִקָּח. אֲבָל זִקְנֵי תוֹרָה אֵינָן כֵן, אֶלָּא כָל זְמַן שֶׁמַּזְקִינִין, דַּעְתָּן מִתְיַשֶּׁבֶת עֲלֵיהֶן, שֶׁנֶּאֱמַר (שם), בִּישִׁישִׁים חָכְמָה וְאֹרֶךְ יָמִים תְּבוּנָה:

**English (my paraphrase):** A poor woman vowed "a kein if I bear a son" and then bore a son. She owes two kinnim: the vow (two olos) and her birth obligation (an olah and a chatas). So 3 birds should go above and 1 below. The kohen, without asking, did 2 above and 2 below. What she must add:

| Situation | Same species | Two species |
|---|---|---|
| She did not say which kein is which | 1 more bird, above | 2 |
| She designated which kein is the vow (*peirsha*) | 3 | 4 |
| She fixed the vow's species (*kav'ah*) | 5 | 6 |

If nothing is known (what she gave, what the kohen did), she brings 4 for the vow, 2 for the obligation and one chatas. Ben Azzai: two chataos.

R' Yehoshua: this is the saying "alive, the ram has one voice; dead, it has seven": two horns become trumpets, two leg bones become flutes, the hide a drum, the entrails lyres, the small intestines harps. Some add that its wool is used for the blue (*techeles*) garments. R' Shimon ben Akashya: ignorant elders grow more confused with age, while elders of Torah grow more settled (Job 12:20, 12:12).

**Setup** (Bartenura: she is a poor woman; a rich woman would bring a lamb):
- Vow V = 2 olos.
- Obligation H = olah + chatas, same species (P6).
- Four birds: kein X (species x) and kein Y (species y).
- The kohen did 2 up and 2 down; which birds went where is unknown whenever it matters.

**Solver runs** (min-cover, §3.3; Chachamim lock rule unless noted):

| id | text | Fact model | Solver | Cover found | Matches |
|---|---|---|---|---|---|
| 3:6-A | 1 | nothing designated (pool of 4 unassigned), same species | **1** | {T^} (or any species above, since it may go to the vow) | ✓ |
| 3:6-A' | 2 | pool, one T kein + one P kein, placement unknown | **2** | {T^, P^} exactly | ✓ Bartenura and Rambam: one T and one P, both above |
| 3:6-B | 3 | vow kein designated and known, same species | **3** | {T^, T^, Tv} | ✓ |
| 3:6-B' | 4 | vow kein known (TT), H = PP, replacement vow species free | **3** ✗ | {P^, P^, Pv} | reproduces TYT's objection |
| 3:6-B' | 4 | same, but replacement vow birds must be the designated species (MT 10:2) | **4** | {T^, T^, P^, Pv} | ✓ exactly MT: "2 of the vow's species for the vow; 2 of any species for the obligation, one up one down" |
| 3:6-B' | 4 | vow kein unknown, replacement free | **4** | {T^, T^, Tv, P^} and others | ✓ |
| 3:6-C | 5 | vow species fixed and forgotten, vow kein designated, known TT given | **5** | {T^, T^, P^, P^, Tv} | ✓ Bartenura (chatas must be T when the first birds were T) |
| 3:6-C | 5 | same, but not designated which kein is the vow (pool) | **3** | — | confirms the Kesef Mishneh / Korkos point that *kav'ah* only creates doubt if the vow kein was also designated |
| 3:6-C | 5 | Rambam: the four were one unknown species; the vow was brought in its fixed species | **5** | {T^T^P^P^ + Tv} or {T^T^P^P^ + Pv} | ✓ Rambam: "T or P, since we don't know which species the four were" |
| 3:6-C' | 6 | two species, vow brought in its fixed species (unknown), or vow kein known | **6** | {T^T^ P^P^ + P^ Pv} or with a T pair | ✓ Rambam and Bartenura: 4 for the vow + an obligation pair |
| 3:6-C' | 6 | two species, vow kein unknown and designation may be the wrong species | 7 ✗ | — | fact pattern too loose; use the "brought in its fixed species" assumption |
| 3:6-D | 7 | vow species fixed and unknown, species given unknown (TT/TT, PP/PP, TT/PP), placement all up / all down / half, vow kein designated in its species | **7** | {T^T^T^ P^P^P^ + Tv} or {… + Pv} | ✓ Rashi's breakdown: 4 vow + 2 obligation olos (T and P) + 1 chatas of any species |
| 3:6-D (BA) | 8 | same, Ben Azzai rule | **8** | {T^T^T^ P^P^P^ + Tv + Pv} | ✓ "two chataos" of both species |

**Why each number comes out** (hand reasoning; the solver agrees):

- **1 (pool, same species):**
  - The two upper birds are olos, credited to the vow or the obligation as convenient (P1).
  - Of the two lower birds, one is a valid chatas and the other is invalid.
  - Short exactly one olah. Bring 1 above.
- **2 (pool, two species):** placement unknown.
  - TT down, PP up: the chatas is T, which locks the obligation olah to T; PP go to the vow. Short one T olah.
  - PP down: short one P olah.
  - Mixed: short one olah of any species.
  - Cover: {T^, P^}.
- **3 (peirsha, same species):**
  - Vow down, obligation up: the vow birds are invalid; the obligation has an olah but no chatas. Only one bird is valid ("like an olah mixed into chova", Bartenura and Rambam). Short 2 vow olos + 1 chatas.
  - Vow up, obligation down: short one obligation olah.
  - Split: short one vow olah.
  - Cover: 2 above + 1 below. The extras become a freewill olah or a doubtful chatas that is burned (P9).
- **4 (peirsha, two species), vow = TT:**
  - TT down, PP up: short TT (vow) + P chatas.
  - PP down, TT up: short a P olah.
  - With a free-species replacement vow, {P^, P^, Pv} covers every case. That is 3, TYT's challenge, and he says he is "very puzzled" by 4.
  - Getting 4 needs one of:
    - (i) the Rambam's rule that replacement vow birds must be the species she designated;
    - (ii) not knowing which kein was the vow;
    - (iii) Rashi's reading, where *peirsha* means she specified a species when vowing and forgot it.
- **5 (kav'ah, same species):**
  - Vow down, obligation up: the vow is wholly unfulfilled, and its fixed species is unknown, so bring TT and PP above. Also short a chatas.
  - Vow up, obligation down: the vow is fulfilled only if the fixed species was T. The obligation's olah is invalid; one of the new olos covers it.
  - Total 5 (Bartenura spells out the "either way" reasoning).
- **6 (two species):** the valid obligation olah's species is unknown, so a single chatas cannot be matched to it. Bring a fresh obligation pair. Total 4 + 2.
- **7 (natnasam, nothing known):**
  - All down: a valid chatas of unknown species locks the obligation olah to that species. The vow needs 2 of its species. So up to 3 olos of one species may be needed: TTT and PPP.
  - All up: an olah is valid but there is no chatas. Bring a chatas of any species s; a spare new olah of species s completes the pair (Chachamim: the chatas decides). One chatas.
  - Ben Azzai: the olah offered first decides, and its species is unknown, so 2 chataos. Total 8.

**The Rambam's different account of 7** (Commentary; MT 10:4):
- He reads "*kav'ah chovatah*" as possibly a rich woman's obligation: a lamb olah plus a bird chatas.
- So: 4 for the vow + 2 for the obligation (one olah and one chatas of any species) + 1 chatas bird brought with a lamb. That is "7 birds and a lamb".
- Ben Azzai (per the Rambam): 2 chataos (T and P) with the lamb.
- Engine: this matches a solver version with no species lock (a fresh pair may replace a partially valid obligation) giving 6 for the poor case, plus a separate "rich" branch requiring a lamb and a chatas.
- But a naive min-cover would reuse the fresh pair's chatas for the rich branch too. So the Rambam's 7th bird implies that each alternative obligation needs its own chatas. Flag this (U7).
- TYT and the Kesef Mishneh (Korkos) both raise difficulties with it.

**Rashi's alternative across the whole mishnah** (Zevachim 67b, via TYT):
- *Peirsha*: she specified the species when vowing and forgot which. So 3, or 4, all of them olos.
- *Kav'ah*: she fixed the vow to be brought together with her obligation.
- Tosafot calls this unnecessarily forced.
- The engine can run Rashi's fact model with the same solver. Only Rashi's 7 and 8 were fully validated.

**Aggada:**
- 7 voices ↔ the 7 birds of the Tanna Kamma. The Rambam: without the doubts, even a rich woman needed only 1 bird.
- TYT: "some say [add] its wool" (8) fits Ben Azzai's 8.
- Bartenura's own count is 4 + 4.
- No ruling here. It is a closing flourish.

**Visual:**
- A "doubt dashboard" of toggles: designated? species fixed? species given? kohen placement known?
- A scenario grid (every placement × unknown) with each cell showing that scenario's deficit.
- A bird-basket builder where the user tries to add the fewest birds so every cell turns green. Then show the text's answer.
- Close with the ram: a live ram with 1 voice, then 7 instruments appear one by one as the bird count climbs 1 → 7 (and 8 with Ben Azzai and "the wool").

---

## 5. Validation summary (every number in chapter 3)

| Text | Value | Solver | Principles |
|---|---|---|---|
| 3:1 equal pairs, all above / all below / half | ½, ½, ½ | ✓ | P1–P4 |
| 3:2 unequal, all above / all below | ½ | ✓ | |
| 3:2 unequal, half / half | the larger | ✓ 4, 6, 6, 20, 200 | owner-pool model is required |
| 3:2 general rule | half vs. larger | ✓ via partition formula | |
| 3:3 | ½, ½, 0 | ✓ | |
| 3:4 | ½, ½, the sethumah (2) | ✓ count; M-R exact | P7 for the split credit |
| 3:5 ×6 clauses | p, ½, the chova's count | ✓ (R' Avraham / Riva); ✓ safe-plan (Bartenura) | |
| 3:6 | 1, 2, 3, 4, 5, 6, 7, 8 | ✓ all | P6, P9–P11 plus fact assumptions; 4 needs a flag |

Nowhere does a ruling depend on majority, nullification, or "a doubt does not override a certainty". The only extra-logical inputs are P1, P4, P6, P7, P9 and the fact-pattern choices.

---

## 6. Recommended unified domain model (all of Kinnim)

```ts
type Species = 'T' | 'P';
type Role = 'chatas' | 'olah';
type Side = 'above' | 'below';

interface Owner { id: string; name: string; wealth?: 'poor' | 'rich' }

interface Obligation {                       // what an owner needs
  id: string;
  ownerIds: string[];                        // >1 = partnership (P7)
  kind: 'leidah' | 'zivah' | 'neder' | 'nedavah' | 'standalone';
  needs: { olah: number; chatas: number };   // chova (1,1); neder/nedavah (2,0) or (n,0)
  speciesRule: 'matchChatas' | 'matchFirst' | 'free';          // P6 (config: Chachamim / Ben Azzai)
  fixedSpecies?: Species | { unknown: VarId };                 // kav'ah (P11)
  replacementSpecies?: 'free' | 'asDesignated';                // 3:6 flag
}

interface Lot {                              // unit of interchangeability
  id: string;
  obligationIds: string[];                   // candidate obligations (unknown => var)
  kind: 'unassigned' | 'designated';
  roleSlots?: { olah: number; chatas: number };  // unassigned: p,p (may be partly consumed, for Bartenura 3:5)
  designatedRole?: Role;                     // designated pile
  species?: Species | { unknown: VarId };
}

interface Bird {
  id: string; lotId: string; species: Species;
  status: 'alive' | 'dead' | 'flown' | 'offered';
  offered?: { side: Side | { unknown: VarId }; order: number };
  location: ContainerId;                     // which pile/mixture it sits in
}

interface Container { id: string; birdIds: string[]; label?: 'chataos' | 'olos' | 'middle' | 'mixture' }
// Identity of birds within a container is unknown to the actors unless marked known.

type Event =
  | { t: 'mix'; from: ContainerId[]; into: ContainerId }
  | { t: 'fly'; from: ContainerId; to: ContainerId | 'air' | 'dying' }   // unknown which bird => var
  | { t: 'die'; container: ContainerId }
  | { t: 'offer'; container: ContainerId; above: number; below: number; knownWhich: boolean }
  | { t: 'consult' }                          // nimlach flag
  | { t: 'designate'; birds: string[]; role?: Role; obligationId?: string }   // incl. "the one that flew toward the chataos is a chatas" (2:5)
  | { t: 'forget'; fact: VarId };

interface Ruling {
  guaranteedValid: number;                   // min over scenarios
  perObligation: Record<string, { minCredit: { olah: number; chatas: number } | 'typeUnknown' }>;
  witness: Scenario;                         // the adversary's worst assignment, for animation
  safePlan?: { above: number; below: number };     // nimlach, before the fact
  remedy: { birds: { species: Species; side: Side; stipulation: string }[]; joint?: boolean };  // min-cover (P8, P9)
  principles: string[];                      // P1..P11
  interpretation: 'bartenura' | 'rambam' | 'rashi' | 'riva' | 'rAvraham';
}
```

**Engine core:**
1. Collect the unknown variables: bird identities per container, which bird flew, sides when `knownWhich` is false, forgotten facts.
2. Enumerate scenarios, or use DP when the only unknown is counts over lots (§3.1).
3. For each scenario, credit favorably within the rules (P1, P6).
4. The ruling is the minimum over scenarios; the remedy is the minimum cover (§3.3); the safe plan is the maximum guaranteed-safe plan (§3.2).

**How chapters 1–2 fit:**
- 1:2–1:3: the safe plan.
- 2:1–2:3 (a bird flying into another pile invalidates itself and one counterpart; the 7-women chain):
  - `fly` events with an unknown source bird, then a safe-plan evaluation.
  - Each flight into a pile creates one "foreign" bird of unknown role. Worst case, it takes up one olah slot or one chatas slot, which costs one counterpart.
  - This reproduces "one lost going, one lost returning". Not yet validated against `kinnim-ch1-2.md`.
- 2:4: an unassigned bird flying into a designated pile.
- 2:5 (sides and middle): a `designate` event triggered by joining a pure pile.

---

## 7. Hardest mishnayos to model (ranked)

1. **3:6.** Needs the min-cover solver, species-lock semantics, and fact patterns that vary by commentator. The 4 needs a flag, and the Rambam's 7 uses a rich-woman branch.
2. **2:3 (seven women, repeated flights).** Chained uncertainty, and the "some say the seventh lost nothing" dispute.
3. **3:5.** Four incompatible readings of the same words. The UI must show which reading is active.
4. **3:4.** Mixture vs. piles (Bartenura vs. Rambam), plus split credit between partners.
5. **3:1–3:2 vs. 1:3.** The meaning of *nimlach* (Bartenura: whether he asked; Rambam: whether the owners entrusted the kohen), the Rambam's "all of the majority owner's birds valid" attribution, and three-or-more-women extrapolation.
6. **2:5.** Designation by where a bird ends up ("the one that went toward the chataos is a chatas"), and heirs (the woman who died after bringing her chatas).

---

## 8. Uncertainty register

| ID | Issue |
|---|---|
| U1 | Per-owner attribution in 3:2. Worst case gives the counts; the Rambam's "all of her offerings are valid" for the majority owner does not match the worst-case per-owner split. Ship worst case and offer the Rambam as a view. |
| U2 | What exactly is one interchangeable pool: an owner, or an obligation-group of an owner? 1:3 says mixture rules apply "even for one woman". The 10/100 numbers require pooling within each "this one" of the text. |
| U3 | 3:5 reading. R' Avraham is recommended; the others are flags. "Half" in Riva is measured against the chova's count, not the whole mixture. |
| U4 | 3:6 "*peirsha*, two species = 4": needs MT's species-matched replacement, or not knowing which kein was the vow. TYT argues 3. |
| U5 | 3:6 species lock. Rashi's system (a valid chatas locks the olah's species; no fresh pair) gives 7 and 8. The Rambam's system (a fresh pair is allowed) gives 6 plus a lamb branch. |
| U6 | 3:6 *kav'ah* fact pattern. Rambam and Bartenura (via Korkos) need the vow kein designated as well, and for 6 the vow brought in its fixed species. |
| U7 | The Rambam's 7th chatas "with a lamb": why the fresh pair's chatas cannot serve the rich branch is not derivable by min-cover. It needs "a separate chatas per alternative obligation" or similar. The Kesef Mishneh and TYT both find it difficult. |
| U8 | Numbering and edition differences for 3:6 and its aggadic ending. The Tosafot/TYT reading of "entrails / small intestines" differs from the printed text (drum vs. lyres). |
| U9 | Aspects of *hamefaresh* and Bartenura's 3:3 wording ("a kein below and a kein above") are ambiguous. TYT says it means a chatas bird and an olah bird. |
