# Stringalong

Grammar-based random text generator — based on [Orteil's RandomGen](https://orteil.dashnet.org/randomgen/).

**[Try it out](https://tgies.github.io/stringalong)**

## JavaScript API

### Installation

Include `lib/stringalong.js` via script tag, `require()`, or `import`. It exports a single `Stringalong` class (UMD).

### `new Stringalong(source, opts?)`

Parse a grammar source string and create a generator.

```js
const gen = new Stringalong(sourceText, {
  maxNesting: 50,      // recursion limit (default 50)
  onWarn: msg => {}    // callback for warnings (missing identifiers, etc.)
});
```

### `gen.generate({ count?, seed?, root? })`

Returns an array of generated strings.

```js
gen.generate({ count: 5 })                   // 5 random results
gen.generate({ count: 3, seed: 'hello' })    // deterministic output
gen.generate({ root: 'phrase' })             // pick from specific root list
```

- `count` — number of results (default: `$amount` or 1, max 999)
- `seed` — string for deterministic PRNG (Mulberry32). `null` for `Math.random`.
- `root` — list name to generate from. Default: last defined root list.

### `gen.getRoots()`

Returns array of root list names (lists marked with `>` or all lists if `$all roots` is set).

### `gen.meta`

Object with parsed metadata: `name`, `author`, `description`, `picture`, `button`, `amount`, `seedText`, `forceUnique`, `allRoots`, `weightedChances`, `includes`.

### `gen.parse(source)`

Parse additional source text into the same instance (for appending lists).

### Static exports

- `Stringalong.pluralize(word)` — pluralize a word
- `Stringalong.seedRng(seed)` — create a seeded PRNG function

---

## DSL Reference

### Comments

```
// line comment
/* block comment */
$[note] inline note (ignored)
```

### Metadata

Lines starting with `$key : value` set generator options:

```
$name : My Generator
$author : Your Name
$description : What it does
$picture : url/to/image
$button : Roll!
$amount : 5
$seed text : Enter a name:
```

### Directives

```
$force unique       prevent duplicate picks (default)
$allow duplicates   allow duplicate picks
$all roots          expose all lists in root dropdown
$weighted chances   use weighted chance model (see below)
$include file.txt   prepend external file
```

### Lists

Define a list with `$listname`. Lines that follow become items.

```
$color
red
blue
green
```

- `$>listname` or `$listname >` — mark as root (appears in output dropdown)
- `$+listname` — append items to an existing list

### Item attributes

Items can have metadata in `{}` at the end of the line:

```
$pet
cat {plural:cats}{sound:meow}
dog {plural:dogs}{sound:woof}
unicorn {5%}{sound:neigh}
```

- `{50%}` — chance value (behavior depends on chance mode, see below)
- `{key:value}` — named attribute, accessible via `as`

### Tags

Tags are bracket expressions that expand during generation.

#### List reference

```
[color]         pick random item from $color
[Color]         pick and capitalize first letter
[COLOR]         pick and uppercase
```

Case of the tag name is detected and applied to the output.

#### Inline choice

```
[a|b|c]         pick one at random
```

#### Number range

```
[1-100]         random integer in range
[-50-50]        negative bounds ok
```

#### Special

```
[/]             line break (<br>)
[ ]             literal space
[seed]          current seed value
[game's name]   $name value
[author's name] $author value
[*CLEAR*]       clear all stored identifiers
```

### Tag modifiers

Modifiers are comma-separated after the tag name: `[tag,modifier,modifier]`.

#### Casing

```
[list,title]    Title Case Every Word
[list,upper]    UPPERCASE
[list,lower]    lowercase
```

#### Attribute access

```
[pet,as sound]       get the "sound" attribute
[pet,as #key]        dynamic attribute name from identifier
[pet,as sound,or ?]  fallback if attribute missing
```

#### Identifiers (variables)

```
[pet,#p]          pick and store as identifier "p"
[#p]              recall stored value
[#p,as sound]     get attribute from stored item
[#p,or unknown]   fallback if identifier not set
```

#### Repeat

```
[word,x3]       repeat 3 times
[word,x2-5]     repeat 2-5 times
```

#### Text processing

```
[word,compress]      remove all spaces
[word,hidden]        evaluate but output nothing
[word,first part]    first third of text
[word,middle part]   middle third
[word,last part]     last third
[word,written]       store final rendered text (not raw item) when combined with #id
```

#### Uniqueness

```
[list,unique]    force unique pick (no repeats)
[list,mundane]   allow repeats for this pick
```

#### Character iteration

`each` processes resolved text character-by-character. For each character, the `[_]` list is set to that character, then the named list is evaluated.

```
$sep
 _
/

$glitch
[_]
[_]
[_][sep]

$>output
[word,upper,each glitch]
```

Each character has a 1-in-3 chance of getting a separator appended. Result: `HE_LLO` or `H/EL_LO`.

Modifier order: casing and compress are applied at their natural points — casing before `each`, compress after.

### Chance modes

The `{N%}` tag on items has two modes:

**Filter mode (default):** Each item independently rolls against its chance to enter the candidate pool, then one is picked uniformly from whoever passed. `{50%}` means 50% chance of being in the pool. Untagged items always pass. If nothing passes, the full list is used as a fallback. This matches [RandomGen](https://orteil.dashnet.org/randomgen/) behavior.

```
$loot
sword
shield
diamond sword {20%}
```

The diamond sword has a 20% chance of being in the pool each time. When it makes it in, it competes equally with the others.

**Weighted mode (`$weighted chances`):** Chance values are proportional weights. `{90%}` means the item occupies 90% of the picks. Untagged items split whatever remains equally. If explicit percentages exceed 100%, they are normalized proportionally.

```
$weighted chances

$creature
common {60%}
uncommon {30%}
rare {10%}
```

`common` appears ~60% of the time, `uncommon` ~30%, `rare` ~10%.

### Smart grammar

#### Articles

```
[a] cat         → "a cat"
[a] [animal]    → "a dog" or "an owl"
```

`[a]` and `[an]` look ahead at the next letter and choose the correct form. Case-aware: `[A]` → `A`/`An`.

#### Pluralization

```
cat[s]          → "cats"
[pet][s]        → "dogs"
```

`[s]` pluralizes the preceding word using English pluralization rules (handles irregulars, Latin forms, etc.).

### Template parameters

Pass values into list items with `%n`:

```
$greet
Hello, %1! You have %2 coins.

$>output
[greet,%Alice,%100]
```

Result: `Hello, Alice! You have 100 coins.`

### Verb conjugation pattern

Attributes work well for verb forms:

```
$verb
dissolve {ing:dissolving}{past:dissolved}
burn {ing:burning}{past:burned}
collapse {ing:collapsing}{past:collapsed}

$>output
The city is [verb,as ing].     → "The city is burning."
The tower [verb,as past].      → "The tower collapsed."
```
