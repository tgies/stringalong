import { describe, it, expect } from 'vitest';
import { Stringalong } from '../index.js';

describe('Stringalong Core', () => {
  it('should parse basic grammar and generate text', () => {
    const source = `
$color
red
blue

$output >
[color]
`;
    const gen = new Stringalong(source);
    const result = gen.generate({ count: 1 });
    expect(['red', 'blue']).toContain(result[0]);
  });

  it('should parse list-level attributes', () => {
    const source = `
$list1 {megahal:4} {other:value}
item1
item2
`;
    const gen = new Stringalong(source);
    const list = gen.lists.get('list1');
    expect(list.megahal).toBe(true);
    expect(list.megahalOrder).toBe(4);
    expect(list.attrs.other).toBe('value');
  });

  it('should clear cached brain when list is appended to', () => {
    const source = `
$list1 {megahal:4}
item1

$+list1
item2
`;
    const gen = new Stringalong(source);
    const list = gen.lists.get('list1');
    list.brain = {};
    
    // Call parse again with new content to append
    gen.parse('$+list1\nitem3');
    expect(list.brain).toBeUndefined();
  });
});
