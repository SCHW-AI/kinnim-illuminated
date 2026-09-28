> Reference research — not a build spec. Each mishnah's portrayal is designed iteratively with the author.

# Kinnim Chapters 1–2: Computational Spec for the Scenario Engine

## 0. Sources and how I checked them

- **Hebrew Mishnah:** Sefaria API v3, `Mishnah_Kinnim.1` and `.2`, version "Torat Emet 357", vocalized. It is reproduced below with the Vilna page markers removed.
- **English:** the only Sefaria English is Kulp's *Mishnah Yomit*. I did not copy it. Every English rendering below is my own paraphrase.
- **Commentaries, fetched in full:**
  - Bartenura on Kinnim 1 and 2, plus 3:1 (needed because it controls how ch. 1 is read)
  - Rambam's Commentary on the Mishnah (Vilna)
  - Tosafot Yom Tov (TYT)
  - Mishneh Torah, Hilchot Pesulei HaMukdashin (Sefaria: "Sacrifices Rendered Unfit") ch. 8, 9, 10
- **Checking by computer:** I did not only check the rulings by hand. I wrote a brute-force "possible-worlds + adversary" solver in Python and ran every numerical case in the text through it. The scripts are in `docs/reference/solver-prototypes/`. The results are in §2.4 and in each mishnah's section.

---

## 1. Glossary (Ashkenazi/Yeshivish transliteration)

| Hebrew | Translit. | One-line definition |
|---|---|---|
| קֵן / קִנִּים | kein / kinnim | A pair of birds (2 turtledoves or 2 young pigeons) brought as a unit. Plural "kinnim" (vocalized with chirik). |
| פְּרִידָה | preidah | A single bird of a kein. |
| קָרְבָּנוֹת | korbanos | Offerings. |
| מִזְבֵּחַ | mizbe'ach | The outer altar. |
| חוּט הַסִּקְרָא | chut hasikra | The red line around the middle of the mizbe'ach. It separates "above" (לְמַעְלָה) from "below" (לְמַטָּה). |
| חַטַּאת הָעוֹף | chatas ha'of | Bird sin-offering. Neck is nipped (melikah), blood is sprinkled (haza'ah) on the lower wall, the rest is drained (mitzui) to the yesod. Must be done **below** the line. |
| עוֹלַת הָעוֹף | olas ha'of | Bird burnt-offering. Melikah and mitzui (draining blood on the wall), then burned on top. Must be done **above** the line. |
| מְלִיקָה | melikah | Nipping the neck with the kohen's thumbnail (no knife). |
| הַזָּאָה / מִצּוּי | haza'ah / mitzui | Sprinkling / pressing the blood out against the wall. |
| חוֹבָה | chovah | An obligatory kein. The standard one is 1 chatas + 1 olah (yoledes, zav/zavah, korban oleh v'yored, etc.). |
| נְדָרִים וּנְדָבוֹת | nedarim u'nedavos | Voluntary offerings. Birds brought voluntarily are always olos, since birds are never shelamim. |
| נֶדֶר | neder | "הֲרֵי עָלַי עוֹלָה" ("I take upon myself an olah"). A personal obligation: if the bird dies or is stolen, it must be replaced. |
| נְדָבָה | nedavah | "הֲרֵי זוֹ עוֹלָה" ("this one is an olah"). The specific bird is consecrated; no replacement is owed if it is lost. |
| אַחֲרָיוּת | achrayus | Liability to replace. |
| קֵן סְתוּמָה / קִנִּים סְתוּמוֹת | kein stumah | An "unspecified" kein: neither bird has been designated as chatas or olah yet. |
| קֵן מְפֹרֶשֶׁת | kein mefureshes | A kein whose birds were designated at purchase (this one chatas, that one olah). |
| לְקִיחַת בְּעָלִים / עֲשִׂיַּת כֹּהֵן | lekichas ba'alim / asiyas kohen | The only two moments at which a stumah bird's role gets fixed: the owner designates it at purchase, or the kohen's act does. So offering a stumah bird above *makes* it an olah (Rav Chisda; TYT 1:4; Rambam MT 8:8). |
| תַּעֲרֹבֶת | ta'aroves | A mixture of birds that can no longer be told apart. |
| פָּרַח / פְּרִיחָה | parach / pirchah | A bird flew away (from one pile to another, into the air, etc.). |
| חָזַר | chazar | "Returned": **a** bird flew back. Rambam stresses it is not necessarily the same bird. |
| הַקְּרֵבוֹת | hakreivos | Birds that are going to be offered (live, valid kinnim). |
| הַמֵּתוֹת | hameisos | Birds condemned to be left to die (e.g., a chatas–olah mixture). |
| יָמוּתוּ | yamusu | "They are left to die." They cannot be offered or redeemed. |
| כָּשֵׁר / פָּסוּל | kasher / pasul | Valid / invalid. |
| רוֹב / בִּטּוּל | rov / bitul | Majority / nullification. Explicitly **not** applied here: live animals are significant and never nullified (בַּעֲלֵי חַיִּים חֲשִׁיבֵי וְלָא בָּטְלֵי). |
| מִשֵּׁם אֶחָד / מִשְּׁנֵי שֵׁמוֹת | mishem echad / mishnei sheimos | "Same name / two names": same obligation type (birth + birth, zivah + zivah) vs different types (birth + zivah). |
| לֵידָה / זִיבָה | leidah / zivah | Childbirth / flux (zavah). The two standard women's kein obligations. |
| תּוֹר / בֶּן יוֹנָה | tor / ben yonah | Turtledove / young pigeon. The two permitted species. |
| גּוֹזָל | gozal | A fledgling (used in ch. 2 for the bird that flies). |
| כֹּהֵן נִמְלָךְ | kohen nimlach | A kohen who asks before acting. Chapter 1 (and 2) rulings assume this (Bartenura 3:1: ch. 1 is *lechatchilah*, ch. 3 is *bedi'eved*). |
| זוּג | zug | A mate. "יִקַּח זוּג לַשֵּׁנִי" = buy a new partner bird for the survivor. |

---

## 2. Engine core: data model, semantics, and the general algorithm

### 2.1 Entities

```ts
type Side = 'above' | 'below';            // relative to chut hasikra
type Species = 'tor' | 'benYonah';

// A "chovah group" is the unit the Mishnah calls "זו". It is one owner's set of
// stumah kinnim for one obligation-set (bought together). Inside a group the kohen
// may freely decide which birds are chata'os and which are olos.
interface Group {
  id: string; owner: string;               // e.g. 'Rachel'
  name: 'leidah' | 'zivah' | 'other';      // "shem"
  chatasSlots: number;                      // usually = number of kinnim
  olahSlots: number;                        // usually = number of kinnim (Rambam: may differ, see 1:1)
  partnership?: boolean;                    // R' Yose 1:4: merge with partner's group
}

type BirdType =
  | { kind: 'stumah'; group: string }       // role fixed only when offered
  | { kind: 'chatas'; owner?: string }      // fixed/designated chatas (or all-chatas pile)
  | { kind: 'olah'; owner?: string }        // fixed olah / neder / nedavah
  | { kind: 'meisah' };                     // condemned; invalid anywhere

interface Bird { id: string; type: BirdType; species: Species; }
type Pile = Bird[];     // birds in one pile cannot be told apart from each other
```

### 2.2 The validity rules everything derives from

1. **Location (1:1).** A chatas offered above is pasul. An olah offered below is pasul.
2. **Designation by the kohen's act (Rav Chisda, via TYT 1:4 and Rambam MT 8:8).** A stumah bird offered above becomes an olah of its group, and offered below becomes a chatas of its group. It is valid **iff** the group still has a free slot of that kind.
3. **Pool semantics (Bartenura 2:2; TYT 2:2).** Within one group of *n* kinnim, **any** *n* birds may be the chata'os. The birds are not physically paired. "אין דין שני קנין אלא בשתי חטאות ושתי עולות."
4. **Groups are distinct units even for the same woman (1:3 end, 1:4; Rambam MT 8:5).** Two separate chovos of one woman, of the same name or of different names, behave exactly like two different women.
5. **No nullification (1:2; Bartenura).** One bad bird among 10,000 still contaminates the whole pile.
6. **A meisah (condemned) bird is invalid wherever it is offered.**

### 2.3 What "kasher N" means: two framings that agree numerically

**Framing A: Bartenura/Rashi, *lechatchilah*.** This is the one I recommend for the engine.
- N is the **largest number of birds the kohen may offer such that every offered bird is certainly valid**, whatever the hidden identities turn out to be.
- The rest are left to die.
- Bartenura 3:1 says explicitly that all of ch. 1 is lechatchilah.

**Framing B: Rambam's commentary and MT, "offer everything, count what is certainly valid."**
- The kohen offers every bird, splitting each pile above/below in some way.
- N is the number guaranteed valid in the worst case.

These two framings give **identical totals** on every case in ch. 1–2. They can differ in **which pile or woman** the valid birds are credited to (see 2:1 and 2:2).

**The Mishnah's "kasher" counts birds, not owner-credit.** TYT 1:3: "אנן לא קיימין אלא בפרידות גופייהו כמה כשרים וכמה פסולים מצד עצמן." So the engine should report counts of valid birds. Which owner is thereby atoned for is *not* determined by the text. I flag it wherever it matters.

### 2.4 The general algorithm (framing A): possible worlds plus an adversary

```
State = Set<World>;  World = Map<PileId, Multiset<BirdType>>

mix(p, q): merge the piles (identities are lost by construction).

fly(state, from, to, knownType?):
   next = {}
   for w in state:
     for t in distinctTypes(w[from]) (or only knownType if the flier is identified):
        w' = w with one t moved from `from` to `to`   // `to` may be AIR (removed)
        next.add(w')
   return next

isSafe(state, groups, plan: Map<PileId,{above:int, below:int}>):
   for p: require above_p + below_p <= min_{w} |w[p]|
   for w in state:
     for p:
       if above_p>0 and (w[p] has 'chatas' or 'meisah'): return false
       if below_p>0 and (w[p] has 'olah'   or 'meisah'): return false
     for g in groups:
       A = Σ_p min(count_g(w[p]), above_p)   // adversary packs g-birds on top
       B = Σ_p min(count_g(w[p]), below_p)
       if A > g.olahSlots or B > g.chatasSlots: return false
   return true

maxSafe(state) = argmax over safe plans of Σ_p (above_p + below_p)
   // Monotone: if a plan is unsafe, every larger plan is unsafe. So DFS with pruning works.
   // "above" and "below" constraints are independent except through above_p+below_p <= |pile|.
```

Why the adversary is computed per (group, side) independently: a single violated slot already makes the plan unsafe, and for a fixed side and group, the worst choice in each pile is simply to take as many of that group's birds as fit.

**Closed forms this solver reduces to (all verified):**

| Situation | Max safe above | Max safe below | Total kasher |
|---|---|---|---|
| Fixed chatas + fixed olah in one pile | 0 | 0 | 0 |
| ≥1 fixed chatas + one group (c, o) | 0 | c | **c** |
| ≥1 fixed olah + one group (c, o) | o | 0 | **o** |
| Groups g₁…gₘ (stumos only), m ≥ 2 | min oₖ | min cₖ | **2·min k** ("hamu'at kasher"; equal sizes give half) |
| Merged partnership pool (R' Yose) | k | k | 2k (nothing lost) |

**Performance.** The 2:3 case produces 2,293 worlds after round 1 and 57,577 after round 2. Python took about 1 minute and about 4 minutes respectively. For interactive use, either restrict to small inputs or use the Mishnah counting rule (§5.3) and keep the solver for offline tests.

---

## 3. Chapter 1

### Mishnah 1:1

**Hebrew:**
חַטַּאת הָעוֹף נַעֲשֵׂית לְמַטָּה, וְחַטַּאת בְּהֵמָה לְמַעְלָה. עוֹלַת הָעוֹף נַעֲשֵׂית לְמַעְלָה, וְעוֹלַת הַבְּהֵמָה לְמַטָּה. אִם שִׁנָּה בָּזֶה וּבָזֶה, פָּסוּל. סֵדֶר קִנִּים כָּךְ הוּא. הַחוֹבָה, אֶחָד חַטָּאת וְאֶחָד עוֹלָה. בִּנְדָרִים וּנְדָבוֹת, כֻּלָּן עוֹלוֹת. אֵיזֶהוּ נֶדֶר, הָאוֹמֵר הֲרֵי עָלַי עוֹלָה. וְאֵיזוֹ הִיא נְדָבָה, הָאוֹמֵר הֲרֵי זוֹ עוֹלָה. מַה בֵּין נְדָרִים לִנְדָבוֹת. אֶלָּא שֶׁהַנְּדָרִים, מֵתוּ אוֹ נִגְנְבוּ, חַיָּבִים בְּאַחֲרָיוּתָם. וּנְדָבוֹת, מֵתוּ אוֹ נִגְנְבוּ, אֵין חַיָּבִים בְּאַחֲרָיוּתָן:

**English (my paraphrase):**
- A bird chatas is done below the red line; an animal chatas above it.
- A bird olah is done above; an animal olah below.
- Reversing either makes it invalid.
- The order of kinnim: an obligatory kein is one chatas and one olah. Vowed or freewill birds are all olos.
- A vow is "I take upon myself an olah." A freewill gift is "This one is an olah."
- The only difference: if a vowed bird dies or is stolen, the person must replace it; a freewill bird need not be replaced.

**Concepts:** the chut hasikra; bird vs animal procedures are reversed; the chovah composition; neder vs nedavah; achrayus.

**Reasoning:**
- **Bartenura:**
  - Chatas ha'of goes below because its leftover blood must drain to the yesod (Vayikra 5:9). From the upper wall it could drain onto the sovev instead.
  - Chatas beheimah goes on the horns (the "karnos").
  - Olah ha'of goes above: melikah and mitzui are compared to burning, which is at the top.
  - Olah beheimah goes below because the yesod is mentioned for it.
- **Bartenura on "shinah… pasul":** for chatas ha'of the disqualification is specifically **haza'ah** above. Melikah of a chatas anywhere on the mizbe'ach is valid. Olah ha'of has only mitzui, and doing it below is pasul.
- **Bartenura and Rambam on the ger's kein:** it is chovah but both birds are olos. The Mishnah ignores it because it is rare. Engine: support it as a group with `chatasSlots: 0, olahSlots: 2`, flagged as outside the Mishnah.
- **Rambam, important for the engine:** a chovah is 1:1 only at its origin. A person may owe, for example, 20 olos and 10 chata'os, because some were already brought. That is why the Mishnah says "the *number* of chata'os in the chovah" rather than "half". **Model chatasSlots and olahSlots separately.**

**Cases:**

| id | Initial state | Event | Ruling |
|---|---|---|---|
| 1:1-a | 1 chatas ha'of | haza'ah below | kasher |
| 1:1-b | 1 chatas ha'of | haza'ah above | pasul (melikah location does not matter, per Bartenura) |
| 1:1-c | 1 olah ha'of | melikah + mitzui above | kasher |
| 1:1-d | 1 olah ha'of | done below | pasul |
| 1:1-e | chatas beheimah / olah beheimah | above / below | kasher (reversed: pasul). Contrast only. |
| 1:1-f | owner declares a chovah kein | — | 1 chatas + 1 olah |
| 1:1-g | owner declares neder/nedavah birds | — | all olos (birds are never shelamim) |
| 1:1-h | neder bird ("harei alai") | dies or is stolen | owner must replace it |
| 1:1-i | nedavah bird ("harei zo") | dies or is stolen | no replacement needed |

```
validLocation(type, side, species='bird') =
   bird:   chatas→below, olah→above
   animal: chatas→above, olah→below
   (for bird chatas, only the haza'ah location is checked)
```

**Visual:** a mizbe'ach with the red line. The user drags a chatas or olah to the upper or lower half. It glows green or red. A toggle switches bird/animal to show the inversion. Separately, a "declaration" card: "harei alai" vs "harei zo", with a bird dying to show whether a replacement bird appears.

---

### Mishnah 1:2

**Hebrew:**
חַטָּאת שֶׁנִּתְעָרְבָה בְעוֹלָה וְעוֹלָה בְחַטָּאת, אֲפִלּוּ אֶחָד בְּרִבּוֹא, יָמוּתוּ כֻלָּם. חַטָּאת שֶׁנִּתְעָרְבָה בְחוֹבָה, אֵין כָּשֵׁר אֶלָּא כְמִנְיַן חַטָּאוֹת שֶׁבַּחוֹבָה. וְכֵן עוֹלָה שֶׁנִּתְעָרְבָה בְחוֹבָה, אֵין כָּשֵׁר אֶלָּא כְמִנְיַן עוֹלוֹת שֶׁבַּחוֹבָה, בֵּין שֶׁהַחוֹבָה מְרֻבָּה וְהַנְּדָבָה מְמֻעֶטֶת, בֵּין שֶׁהַנְּדָבָה מְרֻבָּה וְהַחוֹבָה מְמֻעֶטֶת, בֵּין שֶׁשְּׁתֵּיהֶן שָׁווֹת:

**English (paraphrase):**
- If a designated chatas gets mixed with a designated olah, or the reverse, all of them are left to die, even one in ten thousand.
- If a designated chatas is mixed into unspecified obligatory kinnim, only as many are valid as the number of chata'os in the obligation.
- Likewise for a designated olah mixed into obligatory kinnim: only the number of olos in the obligation.
- This holds whether the obligatory birds outnumber the voluntary ones, the voluntary ones outnumber the obligatory, or they are equal.

**Concepts:** fixed chatas + fixed olah means total loss, with no bitul; a fixed bird in a stumah pool caps validity at the matching slot count; the proportion is irrelevant.

**Reasoning:**
- **All die (TYT citing Rashi; Bartenura):** every bird might be an olah (pasul below) or a chatas (pasul above). Live animals are never nullified by majority.
- **Chatas + chovah (Bartenura):** example of 1 chatas + 2 stumah kinnim = 5 birds.
  - He may offer only 2, both below.
  - A third below might be a third stumah bird, and the group has only 2 chatas slots.
  - Nothing may be offered above, since it might be the chatas.
- **"Nedavah" (Bartenura):** here it means designated olos, since all voluntary birds are olos.
- **Rambam's example:** 100 chovah birds + 1 chatas gives 50 kasher, 51 pasul. 100 designated chata'os + 10 chovah birds gives 5 kasher, 105 pasul.
- **MT 8:3–4:** "It seems to me he does them all below" (for a chatas mixture), and all above for an olah mixture.

**Cases:**

| id | Initial pile | Rule | Expected (solver-verified) |
|---|---|---|---|
| 1:2-a | 1 FC + 10,000 FO (any ratio ≥1:≥1) | chatas–olah mixture | kasher 0, all yamusu |
| 1:2-b | 1 FC + group R (2 kinnim) = 5 birds | count of chata'os | kasher 2 (0 above, 2 below); pasul 3 |
| 1:2-c | 1 FC + group (1 kein) | " | kasher 1 below |
| 1:2-d | 1 FC + 100 chovah birds (50 kinnim) | " | kasher 50, pasul 51 (Rambam) |
| 1:2-e | 100 FC + 5 kinnim | " | kasher 5, pasul 105 (Rambam) |
| 1:2-f | 2 FO (a nedavah kein) + many stumah kinnim ("chovah merubah") | count of olos | kasher = number of kinnim, all above |
| 1:2-g | 1 stumah kein + many FO ("nedavah merubah") | " | kasher 1 above |
| 1:2-h | FO + equal numbers | " | kasher = o |

```
if pile has FC and FO:  kasher = 0
elif pile has FC and exactly one group g: kasher = g.chatasSlots  (all below; 0 above)
elif pile has FO and exactly one group g: kasher = g.olahSlots    (all above; 0 below)
pasul = |pile| - kasher
```

**Checked against the text:** a (0), b (2 of 5), d (50/51), e (5/105), f and g (o), and the unbalanced chovah (c=2, o=1: +FO gives 1, +FC gives 2). All match.

**Flags:**
- **(U1) Multi-owner chovah.** If the "chovah" contains groups of *different* owners, pure logic gives `min(c_g)`, not `Σc_g`. Example: FC + Rachel 1 kein + Leah 1 kein gives 1, not 2. Bartenura's example is a single woman's kinnim. Rambam's "100 chovah birds" is ambiguous on this. Recommendation: the Mishnah formula for a single group; the solver for multi-group, labelled "extrapolation".
- **(U2) Credit for the fixed bird's owner.** Rambam counts the mixed-in fixed bird among the pasul (51 pasul). Bird-intrinsically, a fixed chatas offered below would be valid, but its owner cannot know whether his bird was among those offered. The engine should report 50 kasher / 51 pasul and **not** credit the fixed bird's owner (say "must bring another"; this is my inference, not explicit in the text).
- **(U3) Owner-credit in general.** Per TYT, "kasher" counts birds, not atonement per owner.

**Visual:** a pile of identical birds, each secretly tagged. The user drags one red-tagged (chatas) bird into a pile of grey (stumah) pairs. The UI "hides" the tags. A slider chooses how many to offer above and below. The engine shows the worst-case assignment (the adversary reveal) that would break an unsafe plan. The kasher count equals the number of red slots.

---

### Mishnah 1:3

**Hebrew:**
בַּמֶּה דְבָרִים אֲמוּרִים, בְּחוֹבָה וּבִנְדָבָה. אֲבָל בְּחוֹבָה שֶׁנִּתְעָרְבָה זוֹ בָזוֹ, אַחַת לָזוֹ וְאַחַת לָזוֹ, שְׁתַּיִם לָזוֹ וּשְׁתַּיִם לָזוֹ, שָׁלשׁ לָזוֹ וְשָׁלשׁ לָזוֹ, מֶחֱצָה כָּשֵׁר וּמֶחֱצָה פָּסוּל. אַחַת לָזוֹ וּשְׁתַּיִם לָזוֹ, וְשָׁלשׁ לָזוֹ, וְעֶשֶׂר לָזוֹ, וּמֵאָה לָזוֹ, הַמֻּעָט כָּשֵׁר, בֵּין מִשֵּׁם אֶחָד, בֵּין מִשְּׁנֵי שֵׁמוֹת, בֵּין מֵאִשָּׁה אַחַת, בֵּין מִשְּׁתֵּי נָשִׁים:

**English (paraphrase):**
- The previous rule is for obligatory mixed with voluntary.
- When obligatory kinnim of different parties mix with each other:
  - Equal amounts (1 and 1, 2 and 2, 3 and 3): half are valid and half invalid.
  - Unequal amounts (1 against 2, 3, 10, or 100): the smaller amount is what remains valid.
- This is so whether it is one "name" or two, one woman or two.

**Concepts:** mixture of stumah groups; half for equal; hamu'at kasher; the count is in **kinnim** (Rambam: "lazo achas" means one kein, i.e., 2 birds); the group, not the woman, is the unit.

**Reasoning:**
- **Bartenura, equal 1+1:** from the 4 birds offer 2, one above and one below. Two above might both be from the same group.
- **Bartenura, unequal (1 vs 2–3):** only one kein is offered (1 above, 1 below), since 2 above might be the small group's pair. Likewise 10 among 100 gives only 10 kinnim offered.
- **Rambam** frames it as offering everything:
  - All above or all below gives half valid.
  - Half above and half below gives "miut kasher" when nimlach, and "merubah kasher" when the kohen did not consult. That second part is ch. 3:1.
- **TYT:** all of this assumes kohen nimlach.

**Cases (birds; k = kinnim):**

| id | Groups | Kasher (birds) | Above / below | Pasul |
|---|---|---|---|---|
| 1:3-a | R1, L1 | 2 of 4 | 1 / 1 | 2 |
| 1:3-b | R2, L2 | 4 of 8 | 2 / 2 | 4 |
| 1:3-c | R3, L3 | 6 of 12 | 3 / 3 | 6 |
| 1:3-d | R1, L2 | 2 of 6 | 1 / 1 | 4 |
| 1:3-e | R1, L3 | 2 of 8 | 1 / 1 | 6 |
| 1:3-f | R1, L10 | 2 of 22 | 1 / 1 | 20 |
| 1:3-g | R1, L100 | 2 of 202 | 1 / 1 | 200 |
| 1:3-h | R10, L100 (Bartenura) | 20 of 220 | 10 / 10 | 200 |
| 1:3-i | R2, L3 (extra test) | 4 of 10 | 2 / 2 | 6 |
| 1:3-j | same woman, two chovos (e.g., leidah 1 kein + zivah 2 kinnim) | identical to d | | |

```
stumosMixture(groups):          // groups not merged by partnership
   a = min_g g.olahSlots; b = min_g g.chatasSlots
   kasher = a + b               // = 2·min k when balanced
   // equal sizes → exactly half
```

**Checked:** all rows match the text or the commentary and were solver-verified.

**Flags:**
- **(U4)** "אַחַת לָזוֹ וּשְׁתַּיִם לָזוֹ וְשָׁלשׁ לָזוֹ וְעֶשֶׂר… וּמֵאָה" can be read as a list of pairwise alternatives (1 vs 2, 1 vs 3…) or as a single five-way mixture. The formula `2·min k` gives "one kein kasher" under both readings. Recommend supporting N groups.
- **(U5)** These results assume **kohen nimlach**. Under 3:1, a kohen who did not consult and offered half above and half below gets "merubah kasher". The engine should carry `kohenNimlach: true` as the default for ch. 1–2.

**Visual:** two or more coloured "owner baskets" (Rachel = blue, Leah = orange). The user drags them into one mixing bowl, and colours fade to grey. The user sets the above/below counts. The engine reveals the worst case (for example, two blue birds both on top when blue has only one olah slot). A caption shows "the smaller governs".

---

### Mishnah 1:4

**Hebrew:**
כֵּיצַד מִשֵּׁם אֶחָד, לֵידָה וְלֵידָה, זִיבָה וְזִיבָה, מִשֵּׁם אֶחָד. מִשְּׁנֵי שֵׁמוֹת, לֵידָה וְזִיבָה. כֵּיצַד שְׁתֵּי נָשִׁים, עַל זוֹ לֵידָה וְעַל זוֹ לֵידָה, עַל זוֹ זִיבָה וְעַל זוֹ זִיבָה, מִשֵּׁם אֶחָד. מִשְּׁנֵי שֵׁמוֹת, עַל זוֹ לֵידָה וְעַל זוֹ זִיבָה. רַבִּי יוֹסֵי אוֹמֵר, שְׁתֵּי נָשִׁים שֶׁלָּקְחוּ קִנֵּיהֶן בְּעֵרוּב, אוֹ שֶׁנָּתְנוּ דְמֵי קִנֵּיהֶן לַכֹּהֵן, לְאֵיזוֹ שֶׁיִּרְצֶה כֹהֵן יַקְרִיב חַטָּאת, וּלְאֵיזוֹ שֶׁיִּרְצֶה כֹהֵן יַקְרִיב עוֹלָה, בֵּין מִשֵּׁם אֶחָד, בֵּין מִשְּׁנֵי שֵׁמוֹת:

**English (paraphrase):**
- "One name" means birth + birth, or zivah + zivah. "Two names" means birth + zivah.
- For two women: both for births, or both for zivah, is one name; one birth and one zivah is two names.
- R' Yose: if two women bought their kinnim jointly, or gave the money to the kohen, the kohen may offer any bird as a chatas for either woman and any as an olah, whether one name or two.

**Concepts:** "shem" is the obligation type; partnership or stipulation merges the pools.

**Reasoning:**
- **Bartenura:** R' Yose is not relying on breirah. The Gemara (Eruvin 36b–37a) places his case where they **stipulated at purchase** that the kohen may assign any kein to either woman. Halachah follows R' Yose (Bartenura, Rambam, MT 8:8).
- **TYT:** gives the alternative that each kein was assigned at purchase and only the money was mixed, and the chiddush is that we don't decree "stipulated" because of "not stipulated". Also Rav Chisda's principle that designation happens only at lekichah or asiyah.
- **Rambam:** the Mishnah uses women's examples because women are obligated in more kinnim (yoledes) and zivah is more common among women.

**Cases:**

| id | Setup | Ruling |
|---|---|---|
| 1:4-a | Rachel leidah (1) + Leah leidah (2), separate purchases, mixed | 1:3 applies: kasher 2 of 6 |
| 1:4-b | Rachel leidah (1) + Leah zivah (2), mixed | same: kasher 2 of 6 (the name doesn't matter) |
| 1:4-c | One woman: leidah (1) + zivah (2) chovos, mixed | same: kasher 2 of 6 |
| 1:4-d | Rachel + Leah bought be'eruv (1 + 2), **R' Yose**, mixed | merged pool (3,3): kasher 6 of 6 (solver-verified) |
| 1:4-e | Money given to the kohen, who buys (R' Yose) | same as d |

```
if groupA.partnership && groupB.partnership && samePartnership:
     merged = {chatasSlots: A.c+B.c, olahSlots: A.o+B.o}
```

**Flags:**
- **(U6)** Is R' Yose disputing the tanna kamma or adding a case? Bartenura's "halachah k'R' Yose" implies a dispute. The engine can expose a toggle `followRYose` (default true).
- **(U7)** Whether the merge applies when the names differ (leidah + zivah): the text says yes ("bein mishem echad bein mishnei sheimos").

**Visual:** a "purchase" step where two women either buy separately (two colours) or together (one striped colour). Mixing shows no loss in the striped case.

---

## 4. Chapter 2

### Mishnah 2:1

**Hebrew:**
קֵן סְתוּמָה שֶׁפָּרַח מִמֶּנָּה גוֹזָל לָאֲוִיר, אוֹ שֶׁפָּרַח בֵּין הַמֵּתוֹת, אוֹ שֶׁמֵּת אַחַד מֵהֶן, יִקַּח זוּג לַשֵּׁנִי. פָּרַח לְבֵין הַקְּרֵבוֹת, פָּסוּל וּפוֹסֵל אֶחָד כְּנֶגְדּוֹ, שֶׁהַגּוֹזָל הַפּוֹרֵחַ, פָּסוּל וּפוֹסֵל אֶחָד כְּנֶגְדּוֹ:

**English (paraphrase):**
- If a bird from an unspecified kein flies off into the open, or flies in among condemned birds, or one of the pair dies, the owner buys a new mate for the survivor.
- If it flew in among birds that are to be offered, it is itself invalid and it invalidates one other bird against it.

**Concepts:** a lost bird does not harm its stumah partner; a flight into kreivos costs 2 birds in total.

**Reasoning:**
- **Bartenura:** the chiddush is for *stumah*. One might think the pair is bound together, but it is not. For a mefureshes it is obvious.
- **Bartenura:** "hameisos" means birds that are to die, e.g., a chatas–olah mixture.
- **Bartenura:** it only disqualifies one against it because it is unspecified. If it were a designated chatas, the rule of 1:2 would apply instead.
- **TYT (from the Tosafos):** a designated bird flying among kreivos would fall under 1:2 ("count of olos"). It is noted in the Nazir 12a Gemara that a mefureshes whose flier is unknown "has no remedy".
- **Rambam, example with 100 chovah birds + the flier:**
  - 51 above / 50 below: if the flier went above, all 100 are fine; if below, 99.
  - The flier itself is pasul, because whichever way it is offered it "might have needed to be" the other role.
- **MT 9:2:** flier + 10 stumos, 6 above / 5 below: 5 olos + 4 chata'os = 9 kasher.

**Cases:**

| id | Initial | Event | Ruling |
|---|---|---|---|
| 2:1-a | kein stumah R (2) | 1 bird flies to AIR | the survivor is kasher; buy a mate; no pesul |
| 2:1-b | kein R (2) + meisos pile | 1 flies into meisos | same as a (the flier is lost among the dead) |
| 2:1-c | kein R (2) | 1 dies | same as a |
| 2:1-d | kein R (2) + L pile of 5 kinnim (10) | 1 R flies into L | 2 original birds lost; 10 of 12 remain valid (solver: max safe 10) |
| 2:1-e | MT 9:2: flier into 10 stumos | offer 6 above / 5 below | 9 of the 10 destination birds kasher; the flier pasul |

**Where the lost bird is attributed (the total of 2 lost is certain):**
- *Rambam:* the flier plus one at the destination. The source survivor takes a new mate (implied, not explicit).
- *Bartenura (per his 2:2 wording):* one "from the place it left" (the partner, which must not be offered) plus the flier or another at the destination.
- The solver confirms that under framing A, if the source partner **is** offered, the destination becomes unsafe on that side. So it is optimal to abandon the partner. That is Bartenura's attribution.

**Flag (U8):** this is exactly the framing difference in §2.3. Default to Bartenura (framing A); show Rambam's as an alternative explanation.

**Visual:** a single pair flies away. Branch buttons: "to the sky", "into the condemned pen", "dies", "into another woman's pile". For the last one, show a −1 marker on the flier and a −1 marker "against it".

---

### Mishnah 2:2

**Hebrew:**
כֵּיצַד. שְׁתֵּי נָשִׁים, לָזוֹ שְׁתֵּי קִנִּים וְלָזוֹ שְׁתֵּי קִנִּים, פָּרַח מִזּוֹ לָזוֹ, פּוֹסֵל אֶחָד בַּהֲלִיכָתוֹ. חָזַר, פּוֹסֵל אֶחָד בַּחֲזִירָתוֹ. פָּרַח וְחָזַר, פָּרַח וְחָזַר, לֹא הִפְסִיד כְּלוּם, שֶׁאֲפִלּוּ הֵן מְעֹרָבוֹת, אֵין פָּחוֹת מִשְּׁתָּיִם:

**English (paraphrase):**
- Two women each have two kinnim.
- A bird flies from one to the other: its going costs one.
- A bird flies back: its return costs one more.
- Further flights back and forth cost nothing more, because even if everything were fully mixed there would still be no fewer than two [kinnim valid].

**Concepts:** loss per departure and per arrival; "chazar" means *a* bird, not necessarily the same one (Rambam); a floor equal to the full-mixture result (1:3).

**Reasoning:**
- **Bartenura, after the going (A has 3 R; B has 4 L + 1 R):**
  - From A offer only 1 olah and 1 chatas. Two olos from A would force the flier to be a chatas, and then B could offer only 2 chata'os (1:2 logic).
  - From B, 2 + 2.
- **Bartenura, after the return (worlds: the R bird came back, or an L bird came):** each side offers 1 above and 1 below.
- **Rambam's alternative split:** after the going, R's 3 are kasher and L has 3 of 5. After the return, 2 and 2.
- **Both:** if it is known that the *same* bird returned, nothing at all is lost.
- **Rambam's general principle:** every flier is pasul and posel one against it, until what remains is half of the mixed total.

**Cases (solver-verified totals):**

| id | Event sequence | Kasher total (birds) | Distribution |
|---|---|---|---|
| 2:2-a | initial R2 / L2, no flight | 8 | 4 / 4 |
| 2:2-b | A→B | 6 | Bartenura A2 / B4 (solver's plan: A1+1, B2+2); Rambam A3 / B3 |
| 2:2-c | A→B, B→A (unknown bird) | 4 | 2 / 2 (solver found an equivalent A0 / B4 plan) |
| 2:2-d | then another go and return | 4 | unchanged |
| 2:2-e | three go-and-return rounds | 4 | unchanged |
| 2:2-f | A→B, then the *same identified* bird returns | 8 | nothing lost |

Solver-derived tests beyond the text (use as regression tests, labelled "logic"):

| Groups | Rounds | Logic total |
|---|---|---|
| R3 / L3 | 1 | 8 |
| R3 / L3 | 2+ | 6 (floor = half) |
| R2 / L3 | 1 | 6 |
| R2 / L3 | 2 | 6 |
| R2 / L3 | 3 | 4 |
| R1 / L2 | 1 | 4 |
| R1 / L2 | 2 | 2 |

**Visual:** two baskets side by side; animate one bird hopping over and one hopping back, with a question mark on the returning bird ("same one?"). A counter drops 8 → 6 → 4 and then stays at 4. A ghost overlay shows the "full mixture floor = 4".

---

### Mishnah 2:3

**Hebrew:**
לָזוֹ אַחַת, לָזוֹ שְׁתַּיִם, לָזוֹ שָׁלשׁ, לָזוֹ אַרְבַּע, לָזוֹ חָמֵשׁ, לָזוֹ שֵׁשׁ, לָזוֹ שֶׁבַע. פָּרַח מִן הָרִאשׁוֹנָה לַשְּׁנִיָּה, לַשְּׁלִישִׁית, לָרְבִיעִית, לַחֲמִישִׁית, לַשִּׁשִּׁית, לַשְּׁבִיעִית, חָזַר, פּוֹסֵל אֶחָד בַּהֲלִיכָתוֹ וְאֶחָד בַּחֲזִירָתוֹ. הָרִאשׁוֹנָה וְהַשְּׁנִיָּה אֵין לָהֶם כְּלוּם, הַשְּׁלִישִׁית יֶשׁ לָהּ אַחַת, הָרְבִיעִית יֶשׁ לָהּ שְׁתַּיִם, הַחֲמִישִׁית יֶשׁ לָהּ שָׁלשׁ, הַשִּׁשִּׁית יֶשׁ לָהּ אַרְבַּע, הַשְּׁבִיעִית יֶשׁ לָהּ שֵׁשׁ. פָּרַח וְחָזַר, פּוֹסֵל אֶחָד בַּהֲלִיכָתוֹ וְאֶחָד בַּחֲזִירָתוֹ. הַשְּׁלִישִׁית וְהָרְבִיעִית אֵין לָהֶם כְּלוּם, הַחֲמִישִׁית יֶשׁ לָהּ אַחַת, הַשִּׁשִּׁית יֶשׁ לָהּ שְׁתַּיִם, הַשְּׁבִיעִית יֶשׁ לָהּ חָמֵשׁ. פָּרַח וְחָזַר, פּוֹסֵל אֶחָד בַּהֲלִיכָתוֹ וְאֶחָד בַּחֲזִירָתוֹ, הַחֲמִישִׁית וְהַשִּׁשִּׁית אֵין לָהֶם כְּלוּם, הַשְּׁבִיעִית יֶשׁ לָהּ אַרְבַּע. וְיֵשׁ אוֹמְרִים, הַשְּׁבִיעִית לֹא הִפְסִידָה כְלוּם. וְאִם פָּרַח מִבֵּין הַמֵּתוֹת לְכֻלָּם, הֲרֵי כֻלָּם יָמוּתוּ:

**English (paraphrase):**
- Seven women have 1, 2, 3, 4, 5, 6, and 7 kinnim.
- A bird flies from the first to the second, then one from there to the third, and so on to the seventh. Then one flies back along the same chain. Each going costs one and each return costs one.
- **After round 1:** the first and second have nothing; the third has 1; the fourth 2; the fifth 3; the sixth 4; the seventh 6.
- **Round 2:** another go and return. The third and fourth have nothing; the fifth 1; the sixth 2; the seventh 5.
- **Round 3:** another go and return. The fifth and sixth have nothing; the seventh 4.
- Some say the seventh lost nothing in that last round.
- If a bird from the condemned ones flew into all of them, all must die.

**Concepts:** chained flights; per-pile loss accounting; a **rabbinic decree** (gezeirah) that each go-and-return costs 2 kinnim even where logic would lose less; the meisos contaminating everything.

**Reasoning:**
- **Bartenura:** gives step-by-step logic for each pile.
- **Bartenura raises the question:** why does the 3rd lose two kinnim, when the birds that flew back into the 2nd will never be offered (the 2nd has nothing)? He answers: we decree that every go-and-return costs two kinnim, "גזרינן בכל פריחה וחזרה שני קנין". He asks the same about the 5th in round 2 ("it could have offered 3 olos and 3 chata'os").
- **Bartenura:** round 2 starts from the **3rd**, not the 1st. The 1st and 2nd are now meisos, and a bird from them would make everyone die.
- **Rambam:** every pile loses one bird per arrival and one per departure. So a middle pile loses a kein per pass, the 7th only one bird per pass, and the 1st its single kein.
- **Yesh omrim (Bartenura; TYT citing ha-Mefaresh):** the 7th keeps 5 in round 3. Since the 6th is dead, no decree is made for the 7th's return. They do *not* mean the 7th gets all 7 (TYT: the wording is "lost nothing *in this round*"). Halachah is not like the yesh omrim (Bartenura, Rambam).

**Cases (kinnim per woman):**

| Round | W1 | W2 | W3 | W4 | W5 | W6 | W7 | Total |
|---|---|---|---|---|---|---|---|---|
| start | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 28 |
| R1 (1→…→7→…→1) | 0 | 0 | 1 | 2 | 3 | 4 | 6 | 16 |
| R2 (3→…→7→…→3) | 0 | 0 | 0 | 0 | 1 | 2 | 5 | 8 |
| R3 (5→…→7→…→5) | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 4 |
| R3, yesh omrim | | | | | 0 | 0 | 5 | 5 |

**Mishnah rule (the counting rule):** reproduces every number above exactly. Verified by script.

```
lossBirds[p] += 1 on every departure from p and every arrival into p
validBirds[p] = max(0, 2*k_p - lossBirds[p]);  validKinnim = validBirds/2
after a round, any pile with 0 → its birds become 'meisah'
if a meisah bird flies into a pile → that pile: all yamusu
yeshOmrim option: in a round where the final pile's neighbour ends at 0,
                  the final pile does not lose for the return
```

**Pure-logic solver versus the Mishnah:** this directly confirms the gezeirah.

| Round | Mishnah (safe?) | Logic maximum | Where logic exceeds the Mishnah |
|---|---|---|---|
| R1 | 16 kinnim (the Mishnah's plan **is** safe) | **17** | W3 could have 2 (Bartenura's question exactly) |
| R2 | 8 (safe) | **10** | W5 could have 3 (Bartenura: "הוה יכול להקריב בחמישית שלש") |
| R3 | 4 (safe); yesh omrim's 5 also safe | **7** | W7 could keep all 7 (the reading TYT rejects for the yesh omrim) |

- In R1, holding the other piles at the Mishnah's values, W2 alone could also get 1 (a trade-off against W3).
- The world counts were 2,293, 57,577, and 9,313.

**Flags:**
- **(U9) Implement the counting rule as the Mishnah's ruling.** Offer the solver's number only as a "strict logic without the decree" overlay.
- **(U10) Where round 2 starts.** Rambam's MT 9:5 describes round 2 as going "until it returned to the first", while Bartenura starts it at the 3rd. The per-pile numbers are the same under the counting rule. The difference is only whether birds from dead W1/W2 are involved; under Bartenura that would kill everything. Recommend Bartenura's chain (3→7→3, then 5→7→5).
- **(U11) Floor.** The counting rule needs a floor (from 2:2): losses stop once the full-mixture result is reached. For two equal piles the floor is k birds each. For the general case, Rambam states the principle ("until the remainder is half of the mixed count") without a per-pile algorithm. Pure logic (R2/L3, 2 rounds, gives 6) shows the floor is not simply `2·min k`. **Recommendation:** in free-play mode, limit flights to (i) two-pile back-and-forth (use the counting rule with floor = half for equal piles, otherwise the solver) or (ii) the Mishnah's exact 2:3 chains. Or run the solver and label it.
- **(U12) Timing of meisah status.** In round 1 the return passes through W2 into W1 before anyone is "declared" dead. The status should be applied at round boundaries.

**Visual:** seven baskets in a row, sized 1…7. "Play round" animates the relay of hops out and back. Each pile shows −1 per hop in or out, with the kinnim counter updating to the Mishnah's numbers. A toggle "strict logic" shows the solver's numbers with the decree annotated ("decree: +1 lost here"). A "yesh omrim" toggle applies to round 3. A final button: "a condemned bird flies into everyone" makes everything die.

---

### Mishnah 2:4

**Hebrew:**
קֵן סְתוּמָה וְקֵן מְפֹרֶשֶׁת, פָּרַח מִן הַסְּתוּמָה לַמְפֹרֶשֶׁת, יִקַּח זוּג לַשֵּׁנִי. חָזַר, אוֹ שֶׁפָּרַח מִן הַמְפֹרֶשֶׁת רִאשׁוֹן, הֲרֵי כֻלָּן יָמוּתוּ:

**English (paraphrase):**
- An unspecified kein and a specified kein. A bird flew from the unspecified one to the specified one: buy a mate for the one left behind.
- If one then flew back, or if in the first place a bird flew from the specified kein, all must die.

**Concepts:** a mefureshes whose own two birds became indistinguishable is a chatas–olah mixture, i.e., meisos.

**Reasoning:**
- **Bartenura:** the case must be that the mefureshes's two birds became mixed with each other, so it is unknown which is which. Otherwise, why would all die? That makes the mefureshes pile meisos.
  - The stumah bird flying in is "flew among the meisos" (2:1), so buy a mate.
  - A bird flying from that pile into the stumah is "from the meisos into the kreivos", so all die.
- **Rambam:** the rule assumes it is unknown whether the flier was the chatas or the olah. If known, apply 1:2 (a chatas flew in: count of chata'os in the stumah pile; an olah: count of olos).
  - Rambam also says the stumah bird that entered the mefureshes is itself pasul but does not disqualify another, because the chatas and olah there are known.
- **MT 9:6:** all the birds in the stumah pile die, because an olah among them makes the chata'os pasul, and a chatas makes the olos pasul.

**Cases (solver-verified), with S = stumah pile of 2 and M = {FC, FO} mutually mixed:**

| id | Event | Ruling |
|---|---|---|
| 2:4-a | S→M | S's remaining bird is fine; buy a mate. M (3 birds) dies. Solver: 1 safe in S |
| 2:4-b | S→M, then M→S | all die (solver: 0) |
| 2:4-c | M→S first | all die (solver: 0) |
| 2:4-d (Rambam variant) | the identified FC flies into intact S | 1:2 applies: 1 kasher below |
| 2:4-e (Rambam variant) | the identified FO flies into S | 1 kasher above |

**Flag (U13):** Rambam's claim that the entering stumah bird "doesn't disqualify another" presupposes the mefureshes birds are still distinguishable. Bartenura presupposes they are not. **Recommended default:** Bartenura (M is internally mixed), with a toggle `mefureshesInternallyMixed`.

**Visual:** a grey pair next to a red/green pair that shuffles itself (the tags fade to a "?"). A grey bird hops in; the survivor gets a new partner. Then a "?" bird hops back and everything turns to "yamusu".

---

### Mishnah 2:5

**Hebrew:**
חַטָּאת מִיכָּן וְעוֹלָה מִיכָּן וּסְתוּמָה בָאֶמְצַע, פָּרַח מִן הָאֶמְצַע לַצְּדָדִין, אֶחָד הֵלָךְ וְאֶחָד הֵלָךְ, לֹא הִפְסִיד כְּלוּם, אֶלָּא יֹאמַר, זֶה שֶׁהָלַךְ אֵצֶל חַטָּאוֹת, חַטָּאת. וְזֶה שֶׁהָלַךְ אֵצֶל עוֹלוֹת, עוֹלָה. חָזַר לָאֶמְצַע, הָאֶמְצָעִיִּים יָמוּתוּ, אֵלּוּ יִקְרְבוּ חַטָּאוֹת, וְאֵלּוּ יִקְרְבוּ עוֹלוֹת. חָזַר אוֹ שֶׁפָּרַח מִן הָאֶמְצַע לַצְּדָדִין, הֲרֵי כֻלָּן יָמוּתוּ. אֵין מְבִיאִין תּוֹרִין כְּנֶגֶד בְּנֵי יוֹנָה, וְלֹא בְנֵי יוֹנָה כְּנֶגֶד תּוֹרִין. כֵּיצַד. הָאִשָּׁה שֶׁהֵבִיאָה חַטָּאתָהּ תּוֹר, וְעוֹלָתָהּ בֶּן יוֹנָה, תִּכְפֹּל וְתָבִיא עוֹלָתָהּ תּוֹר. עוֹלָתָהּ תּוֹר, וְחַטָּאתָהּ בֶּן יוֹנָה, תִּכְפֹּל וְתָבִיא עוֹלָתָהּ בֶּן יוֹנָה. בֶּן עַזַּאי אוֹמֵר, הוֹלְכִין אַחַר הָרִאשׁוֹן. הָאִשָּׁה שֶׁהֵבִיאָה חַטָּאתָהּ וּמֵתָה, יָבִיאוּ הַיּוֹרְשִׁין עוֹלָתָהּ. עוֹלָתָהּ וּמֵתָה, לֹא יָבִיאוּ הַיּוֹרְשִׁין חַטָּאתָהּ:

**English (paraphrase):**
- **Three piles:** designated chata'os on one side, designated olos on the other, and an unspecified kein in the middle.
  - One middle bird flew to each side: nothing is lost. The one that joined the chata'os is declared a chatas, and the one that joined the olos an olah.
  - Then one from each side flew back to the middle: the middle ones die, while each side is still offered according to its kind.
  - If birds then flew again [from the middle] out to the sides, all die.
- **Species:** turtledoves may not be paired with young pigeons, nor the reverse.
  - If a woman's chatas was a turtledove and her olah a pigeon, she brings another olah, a turtledove.
  - If her olah was a turtledove and her chatas a pigeon, she brings another olah, a pigeon.
  - Ben Azzai: follow the first one brought.
- **Death of the owner:** a woman who brought her chatas and died: her heirs bring her olah. If she brought her olah and died, her heirs do not bring her chatas.

**Concepts:** a stumah bird can be "absorbed" into a pile of one fixed type; mixing across types kills; species matching within a kein; the chatas is primary (tanna kamma) vs first-brought (Ben Azzai); a chatas whose owner died goes to die; the olah is a lien on the estate.

**Reasoning:**
- **Bartenura:** the stumah bird among the chata'os is made a chatas, not an olah, since the olah taken might be the designated chatas. The reverse holds on the olah side.
- **Bartenura:** on the return, the two middle birds are a chatas and an olah mixed, so they die, and the sides are unaffected.
- **Rambam:** "או שפרח" means one flew to one side and from there to the other side, so there is a chatas–olah mixture and all die.
- **TYT:** Bartenura and ha-Mefaresh apparently lack "או שפרח". MT 9:7 has "pirchah from the middle to the sides" without "chazar". TYT also offers the alternative reason that the middle birds were condemned (meisos) and flew among the others.
- **Species (Bartenura, Rambam):** the chatas is the essential one, whether it was set aside first or last. Ben Azzai: whichever was first. Halachah per the tanna kamma. The olah-first order follows the verse's reading order only (TYT on Toras Kohanim).
- **Death (Bartenura; TYT citing Kiddushin 13b):**
  - Heirs bring the olah because it is a Torah-level lien, even if it was never set aside.
  - They don't bring the chatas because "a chatas whose owner died goes to die".
  - Otherwise order would not matter: the chatas precedes the olah only lechatchilah.

**Cases (C = n fixed chata'os, O = n fixed olos, M = stumah kein R(1,1); solver-verified with n = 3):**

| id | Event | Ruling |
|---|---|---|
| 2:5-a | M→C and M→O (one each) | nothing lost: C all below (n+1), O all above (n+1). Solver 8 of 8 |
| 2:5-b | a, then C→M and O→M | the middle 2 die; C (n) below, O (n) above. Solver 6 |
| 2:5-c | b, then M→C and M→O | all die (solver 0) |
| 2:5-d (Rambam's "או שפרח") | M→C, then C→O | Rambam: all die. **Logic: only the olah side dies.** C stays safe below (3), and M's remaining bird can go above (1). Flag U14 |
| 2:5-e (extrapolation) | both M birds → C | C: only 1 safe below (1:2: count of chata'os in a chovah of 1). Not in text |
| 2:5-f | woman: chatas tor, olah ben yonah | T"K: bring another olah, a **tor**. Ben Azzai (chatas brought first): same |
| 2:5-g | woman: olah tor, chatas ben yonah | T"K: bring another olah, a **ben yonah**. Ben Azzai (olah first): her chatas should have been a tor, so she brings a chatas tor (my inference from Bartenura's "bein shehayah harishon chatas bein olah"). Halachah per T"K |
| 2:5-h | chatas offered, then the owner dies | heirs bring the olah |
| 2:5-i | olah offered, then the owner dies | heirs do not bring the chatas |

```
requiredSpeciesForReplacement(chatasSpecies, olahSpecies, order):
   T"K:       target = chatasSpecies            // the chatas governs
   Ben Azzai: target = species of first-brought
   if mismatch: bring another of the missing role in `target` species
      (T"K: always a new olah; Ben Azzai: a new second-brought item)

heirsObligation(offered):  'chatas' → bring olah;  'olah' → nothing (chatas → dies)
```

**Flags:**
- **(U14)** Rambam's "all die" in 2:5-d is stricter than logic. Possible readings: a stringency, "all" meaning the affected piles, or a scenario where a bird went in each direction. MT 9:7's reason, "perhaps an olah mixed into the chata'os and a chatas into the olos", implies birds went both ways. Recommend modelling "או שפרח" only as flights in both directions, which logic also gives as all die.
- **(U15)** Whether the mismatched earlier olah (e.g., a pigeon olah alongside a tor chatas) is wasted or counts as a nedavah is not stated. The engine should only output "bring an additional X".
- **(U16)** Ben Azzai for case g is my reading of the one-line position via Bartenura.

**Visual:** three pens (red, grey, green). The user drags grey birds sideways, and they adopt the colour of the pen. Arrows back to the middle trigger a "mixed middle" warning; a further flight out turns everything to "yamusu". Separate mini-game: choose the species for the chatas and olah; a mismatch prompts "bring another ___" with a T"K/Ben Azzai toggle. Owner-death timeline: offer one, then the owner dies, then show what the heirs owe.

---

## 5. Consolidated engine rules

### 5.1 Defaults
`kohenNimlach = true`, `followRYose = true`, `framing = 'bartenura'` (lechatchilah max-safe), `halachahTK_speciesRule = true`, `yeshOmrim = false`, `mefureshesInternallyMixed = true`.

### 5.2 Static mixture resolution (one pile, no flights)
1. If the pile has a meisah, or has both FC and FO: 0 kasher.
2. If it has FC and exactly one group g: `g.chatasSlots` kasher, all below.
3. If it has FO and exactly one group g: `g.olahSlots` kasher, all above.
4. Stumah-only groups (after merging R' Yose partnerships): `min(olahSlots) + min(chatasSlots)`.
5. Any other composition (multi-group plus a fixed bird, etc.): use the solver and label the result "extrapolation".

### 5.3 Flights
- Into AIR, among meisos, or death: the source loses that bird and the survivor gets a mate (2:1).
- Into kreivos:
  - Canonical patterns (2:1, 2:2, 2:3): use the counting rule (−1 per arrival, −1 per departure) with the 2:2 floor and meisah contamination.
  - Otherwise: the solver.
- A meisah bird entering a pile: that pile all die.
- A flier of known fixed type: apply 1:2 at the destination (Rambam 2:4). Of unknown fixed type (chatas or olah): the destination all die.

### 5.4 Test vectors (all hand- and solver-checked)
1:2-a…h; 1:3-a…j; 1:4-d; 2:1-d; 2:2-a…f; 2:3 table (both rounds and the yesh omrim row); 2:4-a…c; 2:5-a…c.

---

## 6. Open uncertainties (collected)

- **U1:** "Count of chata'os in the chovah" when the chovah has several owners. Logic gives min, not sum.
- **U2 / U3:** Owner-credit for the mixed-in fixed bird, and "kasher" as bird-count vs atonement per owner (TYT: bird-count).
- **U4:** 1:3's list read as pairwise alternatives or as one multi-way mixture. The formula covers both.
- **U5:** Ch. 1–2 assume kohen nimlach. 3:1 reverses "miut" to "merubah" for a non-consulting kohen who splits half above and half below. See `kinnim-ch3.md`.
- **U6 / U7:** R' Yose: dispute vs addition; applies across names.
- **U8:** 2:1 and 2:2: which pile absorbs the loss (Bartenura: source; Rambam: destination). The totals agree.
- **U9:** The 2:3 numbers include a gezeirah. Pure logic gives 17 / 10 / 7, not 16 / 8 / 4. Use the counting rule for the ruling.
- **U10:** Where round 2 of 2:3 starts (Bartenura: the 3rd; Rambam MT: "to the first").
- **U11:** A general floor rule for arbitrary multi-pile flight patterns is not given by the text.
- **U12:** When "meisah" status attaches (recommend: at round boundaries).
- **U13:** 2:4: whether the mefureshes birds were already internally mixed (Bartenura) or distinguishable (Rambam).
- **U14:** 2:5: Rambam's "או שפרח" reading gives "all die", stricter than logic. Text variant: Bartenura lacks it.
- **U15 / U16:** Species-mismatch leftovers; applying Ben Azzai to the reversed case.
- **Transliteration and translation:** all English above is my own paraphrase. No copyrighted translation was reproduced.
