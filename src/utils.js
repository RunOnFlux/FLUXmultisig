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
