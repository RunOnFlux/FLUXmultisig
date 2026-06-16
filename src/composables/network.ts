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

// Public-facing transaction page on the explorer — both the Flux insight-style
// explorer and the BTC blockbook expose tx detail at /tx/<txid>.
export function txExplorerUrl(
  chain: Chain | string,
  isTestnet: boolean,
  txid: string,
): string {
  if (chain === 'flux') {
    const base = isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    return `${base}/tx/${txid}`;
  }
  const base = isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
  return `${base}/tx/${txid}`;
}

// Public-facing address page on the explorer.
export function addressExplorerUrl(
  chain: Chain | string,
  isTestnet: boolean,
  address: string,
): string {
  if (chain === 'flux') {
    const base = isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    return `${base}/address/${address}`;
  }
  const base = isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
  return `${base}/address/${address}`;
}

// Address summary endpoints. BTC uses blockbook's rich address call (balance +
// recent transactions in one shot); Flux's insight API splits balance and tx
// history across two endpoints.
export function addressInfoEndpoint(
  chain: Chain | string,
  isTestnet: boolean,
  address: string,
): string {
  if (chain === 'flux') {
    const base = isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
    return `${base}/api/addr/${address}`;
  }
  const base = isTestnet ? TESTNET_BTC_BLOCKBOOK : MAINNET_BTC_BLOCKBOOK;
  return `${base}/api/v2/address/${address}?details=txs&pageSize=10`;
}

// Flux insight transaction list (BTC gets txs inline from addressInfoEndpoint).
export function fluxTxsEndpoint(isTestnet: boolean, address: string): string {
  const base = isTestnet ? TESTNET_FLUX_EXPLORER : MAINNET_FLUX_EXPLORER;
  return `${base}/api/txs?address=${address}`;
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

// ---- Wallet summary (balance + recent activity for a single address) --------

export interface WalletTx {
  txid: string;
  time: number | null; // block time, unix seconds (null while unconfirmed)
  confirmations: number;
  deltaSats: number; // signed net effect on this address: + received, − sent
}

export interface WalletSummary {
  address: string;
  balanceSats: number;
  totalReceivedSats: number;
  totalSentSats: number;
  txCount: number;
  txs: WalletTx[];
}

// Net effect of a blockbook transaction on a single address: value landing in
// this address's outputs minus value spent from its inputs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function blockbookDelta(tx: any, address: string): number {
  let received = 0;
  let spent = 0;
  for (const v of tx.vout || []) {
    if (Array.isArray(v.addresses) && v.addresses.includes(address)) received += Number(v.value || 0);
  }
  for (const v of tx.vin || []) {
    if (Array.isArray(v.addresses) && v.addresses.includes(address)) spent += Number(v.value || 0);
  }
  return received - spent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeBlockbookAddress(data: any): WalletSummary {
  const address = data.address;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txs: WalletTx[] = (data.transactions || []).map((tx: any) => ({
    txid: tx.txid,
    time: typeof tx.blockTime === 'number' ? tx.blockTime : null,
    confirmations: Number(tx.confirmations || 0),
    deltaSats: blockbookDelta(tx, address),
  }));
  return {
    address,
    balanceSats: Number(data.balance || 0),
    totalReceivedSats: Number(data.totalReceived || 0),
    totalSentSats: Number(data.totalSent || 0),
    txCount: Number(data.txs ?? txs.length),
    txs,
  };
}

// Net effect of a Flux insight transaction on a single address. Insight reports
// vout values as decimal-coin strings and vin values as decimal-coin numbers,
// so convert to sats explicitly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function insightDelta(tx: any, address: string): number {
  let received = 0;
  let spent = 0;
  for (const v of tx.vout || []) {
    const addrs = v.scriptPubKey?.addresses || [];
    if (addrs.includes(address)) received += Math.round(Number(v.value || 0) * 1e8);
  }
  for (const v of tx.vin || []) {
    if (v.addr === address) {
      spent += v.valueSat != null ? Number(v.valueSat) : Math.round(Number(v.value || 0) * 1e8);
    }
  }
  return received - spent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeInsight(addr: any, txsData: any): WalletSummary {
  const address = addr.addrStr || addr.address || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txs: WalletTx[] = (txsData?.txs || []).map((tx: any) => ({
    txid: tx.txid,
    time: typeof tx.time === 'number' ? tx.time : null,
    confirmations: Number(tx.confirmations || 0),
    deltaSats: insightDelta(tx, address),
  }));
  return {
    address,
    balanceSats: Number(addr.balanceSat ?? Math.round(Number(addr.balance || 0) * 1e8)),
    totalReceivedSats: Number(addr.totalReceivedSat ?? 0),
    totalSentSats: Number(addr.totalSentSat ?? 0),
    txCount: Number(addr.txApperances ?? txs.length),
    txs,
  };
}
