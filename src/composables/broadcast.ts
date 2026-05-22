// Shared transaction-broadcast helpers used by SubmitTx and FinaliseTx.
//
// FinaliseTx grew an inline "Submit" button so the user can broadcast without
// scrolling — both call sites need the same per-chain endpoint logic and the
// same result shape, so it lives here.

import axios, { type AxiosResponse } from 'axios';
import {
  TESTNET_FLUX_EXPLORER,
  MAINNET_BTC_BLOCKBOOK,
  TESTNET_BTC_BLOCKBOOK,
  type Chain,
} from './network';

export interface SubmitResult {
  ok: boolean;
  status: number | null;
  data: unknown;
}

export function broadcastRawTx(
  chain: Chain,
  isTestnet: boolean,
  txHex: string,
): Promise<AxiosResponse> {
  if (chain === 'flux' && !isTestnet) {
    return axios({
      method: 'post',
      url: 'https://api.runonflux.io/daemon/sendrawtransaction/',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: { hexstring: txHex, allowhighfees: true },
    });
  }
  if (chain === 'flux' && isTestnet) {
    return axios({
      method: 'post',
      url: `${TESTNET_FLUX_EXPLORER}/api/tx/send`,
      data: { rawtx: txHex },
    });
  }
  const url = isTestnet
    ? `${TESTNET_BTC_BLOCKBOOK}/api/v2/sendtx/`
    : `${MAINNET_BTC_BLOCKBOOK}/api/v2/sendtx/`;
  return axios({ method: 'post', url, data: txHex });
}

export async function broadcastMany(
  chain: Chain,
  isTestnet: boolean,
  txs: string[],
  onProgress?: (current: number) => void,
): Promise<SubmitResult[]> {
  let completed = 0;
  const bump = () => {
    completed += 1;
    if (onProgress) onProgress(completed);
  };
  const promises = txs.map((tx, index) => {
    console.log('Submitting tx:', index + 1, '/', txs.length);
    return broadcastRawTx(chain, isTestnet, tx).finally(bump);
  });
  const results = await Promise.allSettled(promises);
  return results.map((result): SubmitResult => {
    if (result.status === 'fulfilled') {
      const body = result.value.data;
      const fluxStyleError = body
        && typeof body === 'object'
        && (body as { status?: string }).status === 'error';
      return {
        ok: !fluxStyleError,
        status: result.value.status,
        data: body,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = result.reason as any;
    const httpStatus = (err && err.response && err.response.status) || null;
    const errData = (err && err.response && err.response.data) || (err && err.message) || String(err);
    return { ok: false, status: httpStatus, data: errData };
  });
}
