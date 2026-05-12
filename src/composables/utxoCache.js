// Module-level UTXO satoshi-value cache, shared by Build and Sign.
// Persisted to localStorage with a 12-hour TTL so co-signing flows can
// span a refresh or move to a different browser tab without re-fetching.

const STORAGE_KEY = 'fluxmultisig:utxoCache';
const TTL_MS = 12 * 60 * 60 * 1000;

const memory = {};

export function getCache() {
  return memory;
}

export function getValue(key) {
  return memory[key];
}

export function setValue(key, satoshis) {
  memory[key] = satoshis;
}

export function hasValue(key) {
  return key in memory;
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw);
    const now = Date.now();
    Object.keys(stored).forEach((k) => {
      const entry = stored[k];
      if (entry && Number.isFinite(entry.satoshis) && entry.expiresAt > now) {
        memory[k] = entry.satoshis;
      }
    });
  } catch (e) {
    console.log('Failed to load UTXO cache:', e);
  }
}

export function saveToStorage() {
  try {
    const now = Date.now();
    const out = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw);
        Object.keys(stored).forEach((k) => {
          const entry = stored[k];
          if (entry && Number.isFinite(entry.satoshis) && entry.expiresAt > now) {
            out[k] = entry;
          }
        });
      }
    } catch (e) {
      // ignore, will overwrite
    }
    Object.keys(memory).forEach((k) => {
      if (!out[k]) {
        out[k] = { satoshis: memory[k], expiresAt: now + TTL_MS };
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch (e) {
    console.log('Failed to save UTXO cache:', e);
  }
}

export function clearCache() {
  Object.keys(memory).forEach((k) => { delete memory[k]; });
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.log('Failed to clear UTXO cache:', e);
  }
}
