// Persistent library of labelled redeem/witness scripts. Scoped by
// chain + testnet so Build/Sign/Finalise only surface entries that match
// the user's current context.

const STORAGE_KEY = 'fluxmultisig:redeemScripts';

export interface SavedRedeemScript {
  id: string;
  label: string;
  script: string;
  chain: 'flux' | 'bitcoin';
  isTestnet: boolean;
  address?: string;
  createdAt: number;
}

function readAll(): SavedRedeemScript[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SavedRedeemScript[]) : [];
  } catch (_e) {
    return [];
  }
}

function persist(items: SavedRedeemScript[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.log('Failed to save redeem-script library:', e);
  }
}

export function listRedeemScripts(): SavedRedeemScript[] {
  return readAll();
}

export function listRedeemScriptsFor(chain: string, isTestnet: boolean): SavedRedeemScript[] {
  return readAll().filter((r) => r.chain === chain && r.isTestnet === isTestnet);
}

export function findByScript(
  script: string,
  chain: string,
  isTestnet: boolean,
): SavedRedeemScript | undefined {
  return readAll().find((r) => r.script === script && r.chain === chain && r.isTestnet === isTestnet);
}

export function saveRedeemScript(
  entry: Omit<SavedRedeemScript, 'id' | 'createdAt'>,
): SavedRedeemScript {
  const items = readAll();
  const existing = items.find(
    (r) => r.script === entry.script && r.chain === entry.chain && r.isTestnet === entry.isTestnet,
  );
  if (existing) {
    existing.label = entry.label;
    if (entry.address) existing.address = entry.address;
    persist(items);
    return existing;
  }
  const newEntry: SavedRedeemScript = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...entry,
  };
  items.push(newEntry);
  persist(items);
  return newEntry;
}

export function removeRedeemScript(id: string): void {
  persist(readAll().filter((r) => r.id !== id));
}
