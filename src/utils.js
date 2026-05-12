// Pure helper functions extracted from App.vue so they're easy to unit-test
// without spinning up the component (which would drag in bitgo-utxo-lib +
// crypto polyfills via App.vue's other imports).

export function truncateHex(hex, prefix = 25, suffix = 25) {
  if (!hex || hex.length <= prefix + suffix + 1) return hex;
  return `${hex.slice(0, prefix)}…${hex.slice(-suffix)}`;
}

export function updateTitanNodeMessage(message) {
  // Match the integer following "Titan Node" and increment it.
  // Anchoring on the literal label avoids collisions with other digits in
  // the message. Non-Titan messages are dropped on subsequent txs because
  // multi-tx is a Titan-only flow.
  if (!message) return '';
  const match = message.match(/Titan Node (\d+)/);
  if (!match) return '';
  return message.replace(
    /Titan Node \d+/,
    `Titan Node ${parseInt(match[1], 10) + 1}`,
  );
}

// Pure variant of App's getNetwork — takes the bitgotx.networks object so the
// function itself stays unit-testable without importing bitgo-utxo-lib.
export function resolveNetwork(networks, chain, isTestnet) {
  if (chain === 'bitcoin' && !isTestnet) return networks.bitcoin;
  if (chain === 'bitcoin' && isTestnet) return networks.testnet;
  if (chain === 'flux' && isTestnet) return networks.fluxtestnet;
  return networks.zelcash;
}

// Format validators — basic regex matching, NOT cryptographic checks. Catch
// typos and bad pastes before they reach bitgo-utxo-lib's typeforce, which
// otherwise throws cryptic internal errors.

export function isValidHex(s) {
  if (typeof s !== 'string') return false;
  const trimmed = s.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length % 2 !== 0) return false;
  return /^[0-9a-fA-F]+$/.test(trimmed);
}

export function isValidAddress(addr, chain, isTestnet) {
  if (typeof addr !== 'string') return false;
  const trimmed = addr.trim();
  if (trimmed.length < 26 || trimmed.length > 90) return false;
  // base58 alphabet (no 0, O, I, l)
  const base58 = '[1-9A-HJ-NP-Za-km-z]';
  if (chain === 'flux') {
    // Flux mainnet uses Zcash-style transparent addresses: t1 / t3 prefix.
    // Testnet uses tm (P2PKH) or t2 (P2SH).
    if (isTestnet) return new RegExp(`^(tm|t2)${base58}{32,}$`).test(trimmed);
    return new RegExp(`^t[13]${base58}{32,}$`).test(trimmed);
  }
  if (chain === 'bitcoin') {
    if (isTestnet) {
      // Testnet P2PKH: m/n, P2SH: 2, bech32: tb1
      return new RegExp(`^([mn2]${base58}{25,34}|tb1[02-9ac-hj-np-z]{6,87})$`).test(trimmed);
    }
    // Mainnet P2PKH: 1, P2SH: 3, bech32: bc1
    return new RegExp(`^([13]${base58}{25,34}|bc1[02-9ac-hj-np-z]{6,87})$`).test(trimmed);
  }
  return false;
}
