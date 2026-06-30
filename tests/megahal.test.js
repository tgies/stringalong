import { describe, it, expect, vi } from 'vitest';
import { Stringalong } from '../index.js';
import { MegaHal } from 'megahal';

describe('Stringalong MegaHAL Integration', () => {
  it('should generate an utterance using MegaHAL when list has {megahal}', () => {
    const source = `
$chat {megahal}
Hello world.
The cat sat on the mat.
The dog chased the cat.

$output >
[chat]
`;
    const gen = new Stringalong(source);
    
    expect(Stringalong.MegaHal).toBe(MegaHal);

    const result = gen.generate({ count: 5, seed: 'test' });
    expect(result.length).toBe(5);
    expect(result[0]).toBeTypeOf('string');
    expect(result[0].length).toBeGreaterThan(0);
  });

  it('should fall back to default picking if MegaHal is not registered', () => {
    const source = `
$chat {megahal}
Hello world.
The cat sat on the mat.

$output >
[chat]
`;
    const originalMegaHal = Stringalong.MegaHal;
    Stringalong.MegaHal = undefined;
    
    const warnSpy = vi.fn();
    const gen = new Stringalong(source, { onWarn: warnSpy });
    
    const result = gen.generate({ count: 1 });
    expect(['Hello world.', 'The cat sat on the mat.']).toContain(result[0]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('MegaHal is not loaded'));
    
    Stringalong.MegaHal = originalMegaHal;
  });

  it('should generate deterministically given a seed', () => {
    const source = `
$chat {megahal}
Hello world.
The cat sat on the mat.
The dog chased the cat.

$output >
[chat]
`;
    const gen1 = new Stringalong(source);
    const gen2 = new Stringalong(source);
    
    const results1 = gen1.generate({ count: 5, seed: 'same-seed' });
    const results2 = gen2.generate({ count: 5, seed: 'same-seed' });
    
    expect(results1).toEqual(results2);
  });
});
