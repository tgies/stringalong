import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, '../bin/cli.js');

describe('Stringalong CLI', () => {
  it('should output help message with -h / --help', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('Usage:');
    expect(output).toContain('stringalong [file] [options]');
  });

  it('should output version with -v / --version', () => {
    const output = execSync(`node ${cliPath} --version`, { encoding: 'utf8' }).trim();
    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should process a file correctly', async () => {
    const tempFile = path.resolve(__dirname, 'temp-grammar.txt');
    await fs.writeFile(tempFile, '$list\nhello\n$output >\n[list]\n');
    
    try {
      const output = execSync(`node ${cliPath} ${tempFile} -c 3 -s "seed"`, { encoding: 'utf8' }).trim();
      const lines = output.split('\n');
      expect(lines.length).toBe(3);
      expect(lines.every(l => l === 'hello')).toBe(true);
    } finally {
      await fs.unlink(tempFile);
    }
  });

  it('should support reading grammar from stdin', () => {
    const input = '$list\nhello\n$output >\n[list]\n';
    const output = execSync(`node ${cliPath} - -c 2`, { input, encoding: 'utf8' }).trim();
    const lines = output.split('\n');
    expect(lines.length).toBe(2);
    expect(lines.every(l => l === 'hello')).toBe(true);
  });
});
