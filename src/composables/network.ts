// Thin wrappers around bitgo-utxo-lib so the rest of the app interacts with
// a small typed-ish surface and tests can mock this module if needed.

import bitgotx from 'bitgo-utxo-lib';
import { resolveNetwork } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bitgo: any = bitgotx;

export type Chain = 'flux' | 'bitcoin';

// bitgotx network objects have no public type — returning `any` lets the
// callers pass the result to bitgotx APIs without casts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNetwork(chain: Chain | string, isTestnet: boolean): any {
  return resolveNetwork(bitgotx.networks, chain, isTestnet);
}

export const MAINNET_FLUX_EXPLORER = 'https://explorer.runonflux.io';
export const TESTNET_FLUX_EXPLORER = 'https://testnet.runonflux.io';
export const MAINNET_BTC_BLOCKBOOK = 'https://blockbookbitcoin.app.runonflux.io';
export const TESTNET_BTC_BLOCKBOOK = 'https://blockbookbitcointestnet.app.runonflux.io';

export function utxoEndpoint(
  chain: Chain | string,
  isTestnet: boolean,
  address: string,
): string {
  if (chain === 'flux') {
    const base = isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    return `${base}/api/addr/${address}/utxo`;
  }
  const base = isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
  return `${base}/api/v2/utxo/${address}`;
}

export interface Utxo {
  txid: string;
  vout: number;
  scriptPubKey: string;
  satoshis: number;
  amount: string;
  confirmations: number;
  coinbase: boolean;
}

// Normalize utxos from either explorer/blockbook into a single shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeUtxo(chain: Chain | string, x: any): Utxo {
  const sats = chain === 'flux' ? Number(x.satoshis) : Number(x.value);
  return {
    txid: x.txid,
    vout: x.vout,
    scriptPubKey: chain === 'flux' ? x.scriptPubKey : '',
    satoshis: sats,
    amount: (sats * 1e-8).toFixed(8),
    confirmations: x.confirmations,
    coinbase: x.coinbase || false,
  };
}
