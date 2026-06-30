#!/usr/bin/env node

import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { Stringalong } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getVersion() {
  const pkgPath = path.resolve(__dirname, '../package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  return pkg.version;
}

function printHelp() {
  console.log(`
Stringalong CLI — Grammar-based random text generator

Usage:
  stringalong [file] [options]
  cat grammar.txt | stringalong [options]

Arguments:
  [file]                  Path to the grammar file (defaults to stdin or '-')

Options:
  -c, --count <number>    Number of iterations to generate (defaults to file setting or 1)
  -s, --seed <string>     Seed for deterministic random generation
  -r, --root <name>       Root list to generate from (defaults to the last list in the file)
  -h, --help              Show help information
  -v, --version           Show version information

Examples:
  stringalong radiohead.txt -c 5 -s "in rainbows"
  stringalong radiohead.txt --root title
  cat radiohead.txt | stringalong -c 3
`);
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let content = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      content += chunk;
    });
    process.stdin.on('end', () => {
      resolve(content);
    });
    process.stdin.on('error', err => {
      reject(err);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  let file = null;
  let count = null;
  let seed = null;
  let root = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-') {
      if (file !== null) {
        console.error(`Error: Multiple input files specified (${file} and ${arg})`);
        process.exit(1);
      }
      file = arg;
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      const version = await getVersion();
      console.log(version);
      process.exit(0);
    } else if (arg === '-c' || arg === '--count') {
      const val = args[++i];
      if (!val) {
        console.error('Error: --count requires a value');
        process.exit(1);
      }
      count = parseInt(val, 10);
      if (isNaN(count) || count < 1) {
        console.error('Error: count must be a positive integer');
        process.exit(1);
      }
    } else if (arg === '-s' || arg === '--seed') {
      seed = args[++i];
      if (seed === undefined) {
        console.error('Error: --seed requires a value');
        process.exit(1);
      }
    } else if (arg === '-r' || arg === '--root') {
      root = args[++i];
      if (!root) {
        console.error('Error: --root requires a value');
        process.exit(1);
      }
    } else if (arg.startsWith('-')) {
      console.error(`Error: Unknown option ${arg}`);
      printHelp();
      process.exit(1);
    } else {
      if (file !== null) {
        console.error(`Error: Multiple input files specified (${file} and ${arg})`);
        process.exit(1);
      }
      file = arg;
    }
  }

  let source = '';
  const isPiped = !process.stdin.isTTY;
  
  if (file === '-' || (file === null && isPiped)) {
    try {
      source = await readStdin();
    } catch (err) {
      console.error('Error reading from stdin:', err.message);
      process.exit(1);
    }
  } else if (file === null) {
    console.error('Error: No grammar file specified and stdin is not a pipe.');
    printHelp();
    process.exit(1);
  } else {
    try {
      source = await fs.readFile(file, 'utf8');
    } catch (err) {
      console.error(`Error reading file ${file}:`, err.message);
      process.exit(1);
    }
  }

  if (!source.trim()) {
    console.error('Error: Grammar source is empty.');
    process.exit(1);
  }

  try {
    const generator = new Stringalong(source, {
      onWarn: (msg) => {
        console.warn(`Warning: ${msg}`);
      }
    });
    
    const results = generator.generate({
      count: count ?? undefined,
      seed: seed ?? undefined,
      root: root ?? undefined
    });
    
    for (const line of results) {
      console.log(line.replace(/<br>/g, '\n'));
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
