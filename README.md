# Stringalong

Grammar-based random text generator — based on [Orteil's RandomGen](https://orteil.dashnet.org/randomgen/).

**[Try it out](https://tgies.github.io/stringalong)**

## Installation & Integration

`stringalong` can be installed via package managers, loaded dynamically from CDNs, or vendored locally without dependencies.

### 1. Node.js (NPM)
Install the package:
```bash
npm install stringalong
```

#### ES Modules (ESM)
```javascript
import Stringalong from 'stringalong';
```

#### CommonJS (CJS)
```javascript
const Stringalong = require('stringalong');
```

> [!NOTE]
> Direct CommonJS imports load the raw UMD file where `MegaHal` is not auto-registered. If you want to use MegaHAL lists, manually register the engine beforehand:
> ```javascript
> const Stringalong = require('stringalong');
> const { MegaHal } = require('megahal');
> Stringalong.MegaHal = MegaHal;
> ```

---

### 2. Browser Integration (For Plain HTML Pages)

If you're building a personal website and want a fun button that generates random text (like fortunes, outfits, names, or items), here is a complete copy-pasteable guide to get you up and running in minutes!

#### Quick Start Tutorial
Before hosting your own, you can interactively test and preview any custom generator grammar by pasting it directly into the online playground at **[tgies.github.io/stringalong](https://tgies.github.io/stringalong)**.

To write your own local copy, create a new file on your site (e.g., `generator.html`) and paste this code inside:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Random Generator</title>
  
  <!-- Load the stringalong script from a CDN! -->
  <script src="https://cdn.jsdelivr.net/npm/stringalong/lib/stringalong.js"></script>
  
  <style>
    body {
      font-family: monospace;
      text-align: center;
      padding-top: 50px;
    }
    #result {
      font-size: 20px;
      margin: 20px 0;
      min-height: 1.5em;
    }
  </style>
</head>
<body>

  <h1>🔮 Magic Fortune Teller</h1>
  
  <!-- This is where the generated text will appear -->
  <div id="result">Click the button to see your future...</div>
  
  <!-- Clicking this button runs the roll() function below -->
  <button onclick="roll()">Roll Fortune</button>

  <script>
    // 1. Write your lists and template here!
    // - $name defines a new list of items.
    // - [name] picks a random item from that list.
    // - $>output is the template that puts it all together!
    const grammar = `
$outlook
good
bad
weird
spooky

$fortune
you will find a shiny quarter
a black cat will wink at you
you will stub your toe on a marshmallow
you will accidentally summon a minor demon
an old friend will send you a funny meme

$>output
Your outlook is [outlook], and [fortune].
    `;

    // 2. Load the grammar into stringalong
    const gen = new Stringalong(grammar);

    // 3. Make the button do the magic!
    function roll() {
      // Generate one output
      const outputs = gen.generate();
      
      // Put it on the page
      document.getElementById('result').innerText = outputs[0];
    }
    
    // Roll once automatically when the page loads!
    roll();
  </script>

</body>
</html>
```

#### How it works:
1. **Create a list**: Start a line with `$` followed by the name of the list. Every line below it becomes an item in that list, until you start a new list.
   ```text
   $color
   pink
   neon green
   glittery blue
   ```
2. **Use a list**: Put the list name in square brackets `[color]` to pick a random item from it.
   ```text
   $clothing
   shirt
   socks
   hat
   
   $>output
   You should wear a [color] [clothing] today!
   ```
3. **The Output**: The special list `$>output` (with a `>` arrow) is the main template that gets printed when you generate.

#### Example: Seeded Name Generator

Want a generator where the user types their name and always gets the same result? Use `$seed text` to add a text input, and the entered text becomes the random seed:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quack Scientist Name Generator</title>
  <script src="https://cdn.jsdelivr.net/npm/stringalong/lib/stringalong.js"></script>
  <style>
    body { font-family: monospace; text-align: center; padding-top: 50px; }
    #result { font-size: 20px; margin: 20px 0; min-height: 1.5em; }
    input { font: inherit; padding: 6px 10px; }
  </style>
</head>
<body>

  <h1>🧪 Victorian Quack Scientist Name</h1>

  <p>Enter your name: <input type="text" id="nameInput" placeholder="e.g. Alice"></p>
  <div id="result"></div>

  <script>
    const grammar = `
$seed text : Enter your name:

$honorific
Dr.
Prof.
Sir
Lady
Baron
Baroness
Rev. Dr.

$first
Cornelius
Barnaby
Thaddeus
Percival
Ignatius
Phineas
Theodora
Millicent
Henrietta
Evangeline

$prefix
Throt
Bumble
Crank
Fizzle
Wobble
Grim
Snod
Crump
Bloat
Quib

$suffix
bottom
worth
whistle
shaft
thorpe
hammer
brass
wort
stone
splint

$field
Phrenological
Galvanic
Pneumatic
Phantasmagorical
Etheric
Mesmeric
Magneto-Electric

$specialty
Trepanation
Leech Husbandry
Phlogiston Extraction
Ectoplasm Distillation
Aura Polishing
Tonic Brewing
Corpse Reanimation

$>output
[honorific] [first] [prefix][suffix], Fellow of the Royal Society for [field] [specialty].
    `;

    const gen = new Stringalong(grammar);

    document.getElementById('nameInput').addEventListener('input', function() {
      const name = this.value.trim();
      if (!name) {
        document.getElementById('result').innerText = '';
        return;
      }
      const outputs = gen.generate({ seed: name });
      document.getElementById('result').innerText = outputs[0];
    });
  </script>

</body>
</html>
```

The same name always produces the same scientist. Try it: "Alice" will always be the same quack, and so will "Bob."

#### Advanced CDN Options
If you are comfortable with ESM (ES Modules), you can import `stringalong` directly in a `<script type="module">`:

```html
<script type="module">
  import Stringalong from 'https://esm.sh/stringalong';
  
  const gen = new Stringalong('$phrase\nhello\n$output >\n[phrase]');
  console.log(gen.generate());
</script>
```

---

### 3. Local Vendoring (Zero Dependencies)

If you don't want to rely on any CDNs, you can download the script directly and host it on your own site.

1. Download the file [lib/stringalong.js](https://raw.githubusercontent.com/tgies/stringalong/main/lib/stringalong.js).
2. Save it to your website folder (for example, in a `js/` folder next to your HTML file).
3. Include it in your HTML:
```html
<script src="js/stringalong.js"></script>
<script>
  const gen = new Stringalong('$phrase\nhello\n$output >\n[phrase]');
  console.log(gen.generate());
</script>
```

---

## JavaScript API

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

## CLI

`stringalong` includes a command-line interface for generating text directly from the terminal:

### Usage
```bash
stringalong [file] [options]
```

If the file argument is omitted or set to `-`, the grammar is read from standard input (`stdin`).

### Options
- `-c, --count <number>`    Number of strings to generate (defaults to `$amount` setting, fallback to 1)
- `-s, --seed <string>`     Seed for deterministic random generation (Mulberry32)
- `-r, --root <name>`       Root list to generate from (defaults to the default root list)
- `-v, --version`           Print package version
- `-h, --help`              Display help guidelines

### Examples
Generate 5 items from `grammar.txt` with a seed:
```bash
stringalong grammar.txt --count 5 --seed "my seed"
```

Pipe grammar into `stringalong`:
```bash
cat grammar.txt | stringalong -c 3
```

---

## MegaHAL List Integration

Stringalong integrates `megahal` to generate Markov-chain utterances from list lines instead of picking a single line.

If `megahal` is available, any list declared with the `{megahal}` or `{megahal:order}` attribute will build a MegaHAL brain trained on the items of that list. When the list is referenced (e.g. `[listname]`), stringalong will generate a MegaHAL utterance instead of picking a line.

### Syntax
- `$listname {megahal}` — train MegaHAL with default order 5
- `$listname {megahal:N}` — train MegaHAL with custom Markov order `N`

```text
$chatbot {megahal:4}
Hello there!
The cat sat on the mat.
The dog chased the cat.

$output >
Chatbot says: "[chatbot]"
```

### Integration & Registration

If using ES modules or modern bundlers (`import Stringalong from 'stringalong'`), MegaHAL is automatically imported and registered for you. For other environments:

#### 1. CommonJS (Node.js)
```javascript
const Stringalong = require('stringalong');
const { MegaHal } = require('megahal');
Stringalong.MegaHal = MegaHal;
```

#### 2. Browser script tags
```html
<script type="module">
  import { MegaHal } from 'https://esm.sh/megahal@1.0.1';
  window.MegaHal = MegaHal; // auto-detected by stringalong.js
</script>
<script src="js/stringalong.js"></script>
```

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
- `$listname {key:value}` — set list-level attributes (e.g. `{megahal:5}` to use MegaHAL)

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
[*DEBUG ON*]    no-op (RandomGen compatibility)
[*DEBUG OFF*]   no-op (RandomGen compatibility)
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
[word,bare]          strip leading determiner (a, an, the, my, your, his, her, etc.)
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

**Filter mode (default):** Each item independently rolls against its chance to enter the candidate pool, then one is picked uniformly from whichever passed. `{50%}` means 50% chance of being in the pool. Untagged items always pass. If nothing passes, the full list is used as a fallback. This matches [RandomGen](https://orteil.dashnet.org/randomgen/) behavior.

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

#### Bare nouns

The `bare` modifier strips leading determiners (articles, possessives, demonstratives) from text. Useful for backreferences where the first mention needs "a monk" but later mentions need just "monk":

```
$person
a stranger
my Uber driver
Gary Vee

$>output
[person,#p] told me something.     → "a stranger told me something."
That [#p,bare]? A genius.          → "That stranger? A genius."
```

Recognized determiners: a, an, the, my, your, his, her, its, our, their, this, that, these, those.

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
