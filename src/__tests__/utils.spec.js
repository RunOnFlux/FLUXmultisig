import { describe, expect, it } from 'vitest';
import { truncateHex, updateTitanNodeMessage } from '../utils';

describe('truncateHex', () => {
  it('returns short strings unchanged', () => {
    expect(truncateHex('')).toBe('');
    expect(truncateHex('abc')).toBe('abc');
    expect(truncateHex('a'.repeat(40))).toBe('a'.repeat(40));
  });

  it('returns null/undefined unchanged', () => {
    expect(truncateHex(null)).toBe(null);
    expect(truncateHex(undefined)).toBe(undefined);
  });

  it('truncates long strings with default 25/25 split', () => {
    const hex = '0123456789abcdef'.repeat(20); // 320 chars
    const out = truncateHex(hex);
    expect(out).toBe(`${hex.slice(0, 25)}…${hex.slice(-25)}`);
    expect(out.length).toBe(25 + 1 + 25); // 51 chars including ellipsis
  });

  it('respects custom prefix/suffix lengths', () => {
    const hex = 'a'.repeat(100);
    expect(truncateHex(hex, 10, 5)).toBe(`${'a'.repeat(10)}…${'a'.repeat(5)}`);
  });

  it('does not truncate when total ≤ prefix + suffix + 1', () => {
    // 51 chars with default split: 25+1+25 = 51 — boundary case, kept as-is
    const hex = 'x'.repeat(51);
    expect(truncateHex(hex)).toBe(hex);
  });
});

describe('updateTitanNodeMessage', () => {
  it('increments the integer after "Titan Node"', () => {
    expect(updateTitanNodeMessage('Titan Node 5')).toBe('Titan Node 6');
    expect(updateTitanNodeMessage('Titan Node 99')).toBe('Titan Node 100');
  });

  it('drops the message when no "Titan Node N" pattern is present', () => {
    expect(updateTitanNodeMessage('just a message')).toBe('');
    expect(updateTitanNodeMessage('Hello 5')).toBe('');
    expect(updateTitanNodeMessage('Titan Node')).toBe(''); // no number after
  });

  it('returns empty for falsy input', () => {
    expect(updateTitanNodeMessage('')).toBe('');
    expect(updateTitanNodeMessage(null)).toBe('');
    expect(updateTitanNodeMessage(undefined)).toBe('');
  });

  it('only replaces the first match — leaves other digits alone', () => {
    // The original bug: a global regex would have touched "1.0" too.
    expect(updateTitanNodeMessage('Titan Node 1 v1.0')).toBe('Titan Node 2 v1.0');
  });

  it('handles surrounding text', () => {
    expect(updateTitanNodeMessage('prefix Titan Node 12 suffix')).toBe('prefix Titan Node 13 suffix');
  });
});
