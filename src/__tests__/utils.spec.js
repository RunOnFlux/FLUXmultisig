import { describe, expect, it } from 'vitest';
import {
  truncateHex,
  updateTitanNodeMessage,
  resolveNetwork,
  isValidHex,
  isValidAddress,
} from '../utils';

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

describe('resolveNetwork', () => {
  // Use simple sentinel strings instead of real bitgotx network objects so
  // the test stays decoupled from bitgo-utxo-lib.
  const networks = {
    bitcoin: 'bitcoin-mainnet',
    testnet: 'bitcoin-testnet',
    zelcash: 'flux-mainnet',
    fluxtestnet: 'flux-testnet',
  };

  it('returns the correct network for each chain x isTestnet combination', () => {
    expect(resolveNetwork(networks, 'bitcoin', false)).toBe('bitcoin-mainnet');
    expect(resolveNetwork(networks, 'bitcoin', true)).toBe('bitcoin-testnet');
    expect(resolveNetwork(networks, 'flux', false)).toBe('flux-mainnet');
    expect(resolveNetwork(networks, 'flux', true)).toBe('flux-testnet');
  });

  it('defaults to flux mainnet for unknown chain', () => {
    expect(resolveNetwork(networks, 'unknown-chain', false)).toBe('flux-mainnet');
  });
});

describe('isValidHex', () => {
  it('accepts even-length hex strings', () => {
    expect(isValidHex('0a')).toBe(true);
    expect(isValidHex('0123456789abcdef')).toBe(true);
    expect(isValidHex('DEADBEEF')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(isValidHex('  0a  ')).toBe(true);
    expect(isValidHex('\n0a\n')).toBe(true);
  });

  it('rejects odd-length strings', () => {
    expect(isValidHex('a')).toBe(false);
    expect(isValidHex('abc')).toBe(false);
  });

  it('rejects empty and falsy input', () => {
    expect(isValidHex('')).toBe(false);
    expect(isValidHex('   ')).toBe(false);
    expect(isValidHex(null)).toBe(false);
    expect(isValidHex(undefined)).toBe(false);
    expect(isValidHex(42)).toBe(false);
  });

  it('rejects strings with non-hex characters', () => {
    expect(isValidHex('xyz')).toBe(false);
    expect(isValidHex('0g')).toBe(false);
    expect(isValidHex('0a-bc')).toBe(false);
  });
});

describe('isValidAddress', () => {
  describe('flux mainnet', () => {
    it('accepts t1 and t3 prefixed addresses', () => {
      expect(isValidAddress('t3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ', 'flux', false)).toBe(true);
      expect(isValidAddress('t1S9USrJGCkLZgmA1Cv7P1fe5qraz2oqT5e', 'flux', false)).toBe(true);
    });

    it('rejects testnet addresses', () => {
      expect(isValidAddress('tmABCDEFGHIJKLMNOPQRSTUVWXYZ123456', 'flux', false)).toBe(false);
    });

    it('rejects bitcoin-shaped addresses', () => {
      expect(isValidAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'flux', false)).toBe(false);
      expect(isValidAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'flux', false)).toBe(false);
    });
  });

  describe('bitcoin mainnet', () => {
    it('accepts legacy (1...) addresses', () => {
      expect(isValidAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', 'bitcoin', false)).toBe(true);
    });

    it('accepts P2SH (3...) addresses', () => {
      expect(isValidAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'bitcoin', false)).toBe(true);
    });

    it('accepts bech32 (bc1...) addresses', () => {
      expect(isValidAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'bitcoin', false)).toBe(true);
    });

    it('rejects flux addresses', () => {
      expect(isValidAddress('t3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ', 'bitcoin', false)).toBe(false);
    });
  });

  it('rejects empty, short, and non-string input', () => {
    expect(isValidAddress('', 'flux', false)).toBe(false);
    expect(isValidAddress('short', 'flux', false)).toBe(false);
    expect(isValidAddress(null, 'flux', false)).toBe(false);
    expect(isValidAddress(undefined, 'bitcoin', false)).toBe(false);
    expect(isValidAddress(12345, 'flux', false)).toBe(false);
  });

  it('rejects unknown chain', () => {
    expect(isValidAddress('t3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ', 'dogecoin', false)).toBe(false);
  });
});
