<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">04</span>
      <h2 class="panel__title">
        Build unsigned transaction
      </h2>
    </header>
    <p class="panel__desc">
      Construct an unsigned transaction from selected UTXOs.
    </p>
    <div class="panel__body">
      <div class="actions actions--row">
        <button
          class="btn btn--toggle"
          :class="{ 'btn--toggle-on': isAdvanced }"
          @click="toggleAdvanced"
        >
          <span class="btn__dot" />
          {{ isAdvanced ? 'Advanced features ON' : 'Advanced features OFF' }}
        </button>
      </div>

      <div
        v-show="isAdvanced"
        class="advanced"
      >
        <div class="advanced__head">
          Advanced
        </div>
        <div class="advanced__body">
          <label class="check">
            <input
              v-model="avoidFluxNodeAmounts"
              type="checkbox"
              class="cb"
              :disabled="fillHotWalletWithRewards || fillHotWalletFromDesposit || createCollateralTx || consolidateRewards"
            >
            <span>Avoid Flux node collateral amounts</span>
          </label>
          <label class="check">
            <input
              v-model="sendAllFlux"
              type="checkbox"
              class="cb"
              :disabled="multipleTxes || createCollateralTx || consolidateRewards"
            >
            <span>Select all Flux <em>(ignores amount, max 2000 inputs)</em></span>
          </label>
          <label class="check">
            <input
              v-model="fillHotWalletWithRewards"
              type="checkbox"
              class="cb"
              @change="onFillHotWalletWithRewards(($event.target as HTMLInputElement).checked)"
            >
            <span>Fill hot wallet from collateral rewards</span>
          </label>
          <label class="check">
            <input
              v-model="fillHotWalletFromDesposit"
              type="checkbox"
              class="cb"
              @change="onFillHotWalletFromDeposit(($event.target as HTMLInputElement).checked)"
            >
            <span>Fill hot wallet from deposit address</span>
          </label>
          <label class="check">
            <input
              v-model="createCollateralTx"
              type="checkbox"
              class="cb"
              @change="onCreateCollateralTx(($event.target as HTMLInputElement).checked)"
            >
            <span>Create Titan collateral transaction</span>
          </label>
          <label class="check">
            <input
              v-model="consolidateRewards"
              type="checkbox"
              class="cb"
              @change="onConsolidateRewards(($event.target as HTMLInputElement).checked)"
            >
            <span>Consolidate Titan collateral rewards</span>
          </label>
          <div class="check-inline">
            <label class="check">
              <input
                v-model="enableMaxUtxoSize"
                type="checkbox"
                class="cb"
              >
              <span>Limit max UTXO amount</span>
            </label>
            <input
              v-model="maxUtxoSize"
              class="input input--small"
              :disabled="!enableMaxUtxoSize"
              placeholder="amount"
            >
          </div>
        </div>
      </div>

      <div
        v-show="coinControl.selectedValueSats"
        class="alert alert--ok"
      >
        Coin control active · <strong>{{ coinControl.selectedValueAmount }}</strong>
      </div>

      <div class="field">
        <label class="field__label">My address</label>
        <input
          v-model="unsignedTx.myAddress"
          class="input"
          :disabled="createCollateralTx || fillHotWalletFromDesposit || fillHotWalletWithRewards || consolidateRewards"
        >
        <div
          v-if="myAddressError"
          class="field__error"
        >
          {{ myAddressError }}
        </div>
      </div>
      <div class="field">
        <label class="field__label">Receiver address</label>
        <input
          v-model="unsignedTx.receiver"
          class="input"
          :disabled="createCollateralTx || fillHotWalletFromDesposit || fillHotWalletWithRewards || consolidateRewards"
        >
        <div
          v-if="receiverAddressError"
          class="field__error"
        >
          {{ receiverAddressError }}
        </div>
      </div>
      <div class="field">
        <label class="field__label">Amount to send</label>
        <input
          v-model="unsignedTx.amount"
          class="input"
          :disabled="sendAllFlux || createCollateralTx"
        >
      </div>
      <div
        v-if="chain === 'bitcoin'"
        class="field"
      >
        <label class="field__label">Fee to send</label>
        <input
          v-model="unsignedTx.fee"
          class="input"
        >
      </div>
      <div class="field">
        <label class="field__label">Message <span class="field__hint">(optional, OP_RETURN)</span></label>
        <input
          v-model="unsignedTx.message"
          class="input"
        >
      </div>

      <div
        v-show="isAdvanced"
        class="advanced advanced--inline"
      >
        <div class="advanced__head">
          Multi-tx
        </div>
        <div class="advanced__body">
          <label class="check">
            <input
              v-model="multipleTxes"
              type="checkbox"
              class="cb"
              @change="onGenerateMultiTxes(($event.target as HTMLInputElement).checked)"
            >
            <span>Generate multiple transactions <em>(can't combine with select all)</em></span>
          </label>
          <div
            v-if="multipleTxes"
            class="field field--inline"
          >
            <label class="field__label">Transactions to build</label>
            <input
              v-model.number="nTxLoopCount"
              type="number"
              min="1"
              max="30"
              value="5"
              class="input input--small"
            >
          </div>
        </div>
      </div>

      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="loading"
          @click="build"
        >
          {{ actionLabel }}<span
            v-if="loading"
            class="dots"
          />
        </button>
      </div>

      <ProgressBar
        v-if="loading && progress.total > 1"
        :current="progress.current"
        :total="progress.total"
      />

      <div
        v-if="buildError"
        class="alert alert--err"
      >
        {{ buildError }}
      </div>

      <div
        v-if="txinfoList.length"
        class="info-list"
      >
        <div
          v-for="(item, index) in txinfoList"
          :key="index"
          class="info-list__row"
        >
          <span class="info-list__num">#{{ index }}</span>
          <span class="info-list__txt">{{ item }}</span>
        </div>
      </div>

      <div
        v-if="unsignedTxList.length === 1"
        class="kv"
      >
        <div class="kv__row">
          <span class="kv__label">Raw transaction</span>
          <code class="kv__val">{{ truncateHex(unsignedTxList[0].hex) }}</code>
          <button
            class="btn btn--ghost btn--micro"
            @click="copyToClipboard(unsignedTxList[0].hex)"
          >
            Copy
          </button>
        </div>
        <div class="kv__row tx-size">
          <span class="kv__label">Size</span>
          <span
            class="tx-size__val"
            :class="{ 'tx-size__val--warn': sizeStats.max > TX_SIZE_WARN_BYTES }"
          >{{ formatBytes(sizeStats.max) }}</span>
        </div>
      </div>
      <div
        v-if="unsignedTxList.length > 1"
        class="multi"
      >
        <div class="tx-size tx-size--multi">
          <span>Avg size <strong>{{ formatBytes(sizeStats.avg) }}</strong></span>
          <span>Max <strong>{{ formatBytes(sizeStats.max) }}</strong></span>
          <span>Total <strong>{{ formatBytes(sizeStats.total) }}</strong></span>
          <span
            v-if="sizeStats.oversized"
            class="tx-size__warn"
          >⚠ {{ sizeStats.oversized }} over {{ formatBytes(TX_SIZE_WARN_BYTES) }}</span>
        </div>
        <button
          class="btn btn--primary"
          @click="copyToClipboard(JSON.stringify(unsignedTxList.map((x) => x.hex)))"
        >
          Copy all as JSON array
        </button>
        <details class="expand">
          <summary class="expand__summary">
            <span class="expand__chevron">›</span>
            {{ unsignedTxList.length }} transactions
            <span class="expand__hint">click to expand</span>
          </summary>
          <div class="expand__body">
            <div
              v-for="(item, index) in unsignedTxList"
              :key="index"
              class="kv__row"
            >
              <span class="kv__label">Tx {{ index }}</span>
              <code class="kv__val">{{ truncateHex(item.hex) }}</code>
              <span
                class="tx-size__val"
                :class="{ 'tx-size__val--warn': hexByteSize(item.hex) > TX_SIZE_WARN_BYTES }"
              >{{ formatBytes(hexByteSize(item.hex)) }}</span>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(item.hex)"
              >
                Copy
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import axios from 'axios';
import ProgressBar from './ProgressBar.vue';
import {
  bitgo,
  getNetwork,
  utxoEndpoint,
  normalizeUtxo,
  type Chain,
  type Utxo,
} from '../composables/network';
import type { CoinControlState } from './CoinControl.vue';
import {
  setValue, saveToStorage,
} from '../composables/utxoCache';
import { copyToClipboard } from '../composables/copyToast';
import {
  truncateHex,
  updateTitanNodeMessage,
  isValidAddress,
  hexByteSize,
  formatBytes,
  txSizeStats,
  TX_SIZE_WARN_BYTES,
} from '../utils';

const FLUX_COLLATERAL_AMOUNTS = new Set([4000000000000, 1250000000000, 100000000000]);

interface UnsignedTx {
  myAddress: string;
  receiver: string;
  amount: number | string;
  fee: number | string;
  message: string;
  hex: string;
}

interface Recipient { address: string; satoshis: number }

interface HistoryUtxo { txid: string; vout: number; scriptPubKey: string; satoshis: number }

interface Progress { current: number; total: number }

interface Data {
  unsignedTx: UnsignedTx;
  unsignedTxList: UnsignedTx[];
  txinfoList: string[];
  buildError: string;
  isAdvanced: boolean;
  avoidFluxNodeAmounts: boolean;
  enableMaxUtxoSize: boolean;
  maxUtxoSize: string;
  sendAllFlux: boolean;
  multipleTxes: boolean;
  nTxLoopCount: number;
  createCollateralTx: boolean;
  fillHotWalletFromDesposit: boolean;
  fillHotWalletWithRewards: boolean;
  consolidateRewards: boolean;
  loading: boolean;
  progress: Progress;
}

export default defineComponent({
  name: 'BuildTx',
  components: { ProgressBar },
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  setup() {
    const coinControl = inject<CoinControlState>('coinControl');
    if (!coinControl) throw new Error('coinControl injection missing');
    return { coinControl };
  },
  data(): Data {
    return {
      unsignedTx: {
        myAddress: '', receiver: '', amount: 0, fee: 0, message: '', hex: '',
      },
      unsignedTxList: [],
      txinfoList: [],
      buildError: '',
      isAdvanced: false,
      avoidFluxNodeAmounts: false,
      enableMaxUtxoSize: false,
      maxUtxoSize: '',
      sendAllFlux: false,
      multipleTxes: false,
      nTxLoopCount: 5,
      createCollateralTx: false,
      fillHotWalletFromDesposit: false,
      fillHotWalletWithRewards: false,
      consolidateRewards: false,
      loading: false,
      progress: { current: 0, total: 0 },
    };
  },
  computed: {
    actionLabel(): string {
      if (!this.loading) return 'Build';
      if (this.progress.total > 1) return `Building ${this.progress.current}/${this.progress.total}`;
      return 'Building';
    },
    addressErrorLabel(): string {
      return `Invalid ${this.chain} ${this.isTestnet ? 'testnet ' : ''}address`;
    },
    myAddressError(): string {
      const a = this.unsignedTx.myAddress;
      if (!a) return '';
      return isValidAddress(a, this.chain, this.isTestnet) ? '' : this.addressErrorLabel;
    },
    receiverAddressError(): string {
      const a = this.unsignedTx.receiver;
      if (!a) return '';
      return isValidAddress(a, this.chain, this.isTestnet) ? '' : this.addressErrorLabel;
    },
    sizeStats() {
      return txSizeStats(this.unsignedTxList.map((t) => t.hex));
    },
    TX_SIZE_WARN_BYTES() {
      return TX_SIZE_WARN_BYTES;
    },
  },
  watch: {
    chain(val: string): void {
      if (val === 'bitcoin') {
        if (!this.unsignedTx.fee || Number(this.unsignedTx.fee) === 0) {
          this.unsignedTx.fee = 0.00001;
        }
      } else {
        this.unsignedTx.fee = 0;
      }
    },
  },
  methods: {
    copyToClipboard,
    truncateHex,
    formatBytes,
    hexByteSize,
    toggleAdvanced(): void {
      this.isAdvanced = !this.isAdvanced;
      this.avoidFluxNodeAmounts = this.isAdvanced;
    },
    onCreateCollateralTx(cb: boolean): void {
      if (cb) {
        this.avoidFluxNodeAmounts = false;
        this.fillHotWalletFromDesposit = false;
        this.fillHotWalletWithRewards = false;
        this.consolidateRewards = false;
        this.sendAllFlux = false;
        this.unsignedTx.myAddress = 't3a6HnypgaJf5xHMA8PrnfJBR6PpTithbeC';
        this.unsignedTx.receiver = 't3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ';
        this.unsignedTx.amount = 40000;
      } else {
        this.unsignedTx.myAddress = '';
        this.unsignedTx.receiver = '';
        this.unsignedTx.amount = 0;
      }
    },
    onGenerateMultiTxes(cb: boolean): void {
      if (cb) this.sendAllFlux = false;
    },
    onFillHotWalletFromDeposit(cb: boolean): void {
      if (cb) {
        this.avoidFluxNodeAmounts = false;
        this.createCollateralTx = false;
        this.fillHotWalletWithRewards = false;
        this.consolidateRewards = false;
        this.unsignedTx.myAddress = 't3a6HnypgaJf5xHMA8PrnfJBR6PpTithbeC';
        this.unsignedTx.receiver = 't1S9USrJGCkLZgmA1Cv7P1fe5qraz2oqT5e';
        this.unsignedTx.amount = 0;
      } else {
        this.unsignedTx.myAddress = '';
        this.unsignedTx.receiver = '';
        this.unsignedTx.amount = 0;
      }
    },
    onFillHotWalletWithRewards(cb: boolean): void {
      if (cb) {
        this.avoidFluxNodeAmounts = true;
        this.createCollateralTx = false;
        this.fillHotWalletFromDesposit = false;
        this.consolidateRewards = false;
        this.unsignedTx.myAddress = 't3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ';
        this.unsignedTx.receiver = 't1S9USrJGCkLZgmA1Cv7P1fe5qraz2oqT5e';
        this.unsignedTx.amount = 0;
      } else {
        this.unsignedTx.myAddress = '';
        this.unsignedTx.receiver = '';
        this.unsignedTx.amount = 0;
      }
    },
    onConsolidateRewards(cb: boolean): void {
      if (cb) {
        this.avoidFluxNodeAmounts = true;
        this.createCollateralTx = false;
        this.fillHotWalletFromDesposit = false;
        this.fillHotWalletWithRewards = false;
        this.sendAllFlux = false;
        this.enableMaxUtxoSize = true;
        this.maxUtxoSize = '50';
        this.unsignedTx.myAddress = 't3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ';
        this.unsignedTx.receiver = 't3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ';
        this.unsignedTx.amount = 2000;
      } else {
        this.unsignedTx.myAddress = '';
        this.unsignedTx.receiver = '';
        this.unsignedTx.amount = 0;
      }
    },
    async build(): Promise<void> {
      this.loading = true;
      // Loop is multi-tx only when both flags are on; otherwise we exit after 1
      this.progress = {
        current: 0,
        total: this.multipleTxes && !this.sendAllFlux ? this.nTxLoopCount : 1,
      };
      try {
        this.buildError = '';
        this.unsignedTxList = [];
        this.txinfoList = [];
        const network = getNetwork(this.chain, this.isTestnet);
        const utx = await axios.get(utxoEndpoint(this.chain, this.isTestnet, this.unsignedTx.myAddress));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const utxos: Utxo[] = utx.data.map((x: any) => normalizeUtxo(this.chain, x));

        const satoshisToSend = Math.round(Number(this.unsignedTx.amount.toString().replace(',', '.')) * 1e8);
        const satoshisfeesToSend = Math.round(Number(this.unsignedTx.fee.toString().replace(',', '.')) * 1e8);
        const maxUtxoStr = (this.maxUtxoSize || '').toString().replace(',', '.').trim();
        const maxUtxoSatoshis = (this.enableMaxUtxoSize && maxUtxoStr) ? Math.round(Number(maxUtxoStr) * 1e8) : 0;

        const selectedCoins = new Set<string>();
        const usedUtxos = new Set<string>();

        for (let loop = 0; loop < this.nTxLoopCount; loop += 1) {
          this.progress.current = loop + 1;
          // Yield to the browser so the progress bar can repaint between
          // synchronous iterations (the per-tx work below has no awaits).
          // eslint-disable-next-line no-await-in-loop
          if (loop > 0) await new Promise<void>((r) => { setTimeout(r, 0); });
          console.log('TX Loop:', loop);
          let history: HistoryUtxo[] = [];
          let satoshisSoFar = 0;
          let recipients: Recipient[] = [{
            address: this.unsignedTx.receiver,
            satoshis: satoshisToSend,
          }];
          let count = 0;
          selectedCoins.clear();
          const addressFrom = this.unsignedTx.myAddress;
          const addressTo = this.unsignedTx.receiver;
          const { amount } = this.unsignedTx;
          let { message } = this.unsignedTx;
          if (loop > 0) {
            message = updateTitanNodeMessage(message);
          }
          this.unsignedTx = {
            myAddress: addressFrom,
            receiver: addressTo,
            amount,
            message,
            hex: '',
            fee: this.unsignedTx.fee,
          };

          if (this.coinControl.selectedValueSats > 0) {
            for (let j = 0; j < this.coinControl.selected.length; j += 1) {
              if (this.coinControl.selected[j] === true) {
                selectedCoins.add(this.coinControl.utxos[j].txid + this.coinControl.utxos[j].vout);
              }
            }
          }

          /* eslint-disable no-continue */
          for (let i = 0; i < utxos.length; i += 1) {
            if (!(utxos[i].confirmations > 0)) continue;
            if (this.avoidFluxNodeAmounts && FLUX_COLLATERAL_AMOUNTS.has(+utxos[i].satoshis)) continue;
            if (maxUtxoSatoshis > 0 && +utxos[i].satoshis > maxUtxoSatoshis) continue;
            if (this.coinControl.selectedValueSats > 0 && !selectedCoins.has(utxos[i].txid + utxos[i].vout)) continue;
            if (usedUtxos.has(utxos[i].txid + utxos[i].vout)) continue;

            usedUtxos.add(utxos[i].txid + utxos[i].vout);
            setValue(utxos[i].txid + utxos[i].vout, utxos[i].satoshis);

            history = history.concat({
              txid: utxos[i].txid,
              vout: utxos[i].vout,
              scriptPubKey: utxos[i].scriptPubKey,
              satoshis: utxos[i].satoshis,
            });
            satoshisSoFar += utxos[i].satoshis;
            count += 1;
            if (this.sendAllFlux) {
              if (count >= 2000) break;
              continue;
            } else if (satoshisSoFar >= satoshisToSend + satoshisfeesToSend) {
              break;
            }
          }
          /* eslint-enable no-continue */

          if (this.sendAllFlux) {
            recipients[0].satoshis = satoshisSoFar;
          } else {
            const refundSatoshis = satoshisSoFar - satoshisToSend - satoshisfeesToSend;
            if (refundSatoshis > 0) {
              recipients = recipients.concat({
                address: this.unsignedTx.myAddress,
                satoshis: refundSatoshis,
              });
            }
            if (refundSatoshis < 0) {
              this.buildError = this.unsignedTxList.length > 0
                ? `Insufficient amount on tx ${this.unsignedTxList.length} (${this.unsignedTxList.length} tx(s) built so far)`
                : 'Insufficient amount';
              return;
            }
          }

          const txb = new bitgo.TransactionBuilder(network, satoshisfeesToSend);
          if (this.chain === 'flux') {
            txb.setVersion(4);
            txb.setVersionGroupId(0x892F2085);
          }
          if (this.chain === 'bitcoin') {
            const RBFsequence = 0xffffffff - 2;
            history.forEach((x) => txb.addInput(x.txid, x.vout, RBFsequence));
          } else {
            history.forEach((x) => txb.addInput(x.txid, x.vout));
          }
          recipients.forEach((x) => txb.addOutput(x.address, x.satoshis));
          if (this.unsignedTx.message !== '') {
            const data = Buffer.from(this.unsignedTx.message, 'utf8');
            const dataScript = bitgo.script.nullData.output.encode(data);
            txb.addOutput(dataScript, 0);
          }
          const tx = txb.buildIncomplete();
          let txinfo = '';
          if ('outs' in tx) {
            if (tx.outs.length >= 1) {
              const destination = bitgo.address.fromOutputScript(tx.outs[0].script, network);
              const amountSending = Number(tx.outs[0].value * 1e-8).toFixed(8);
              txinfo = `Sending ${amountSending} ${this.chain === 'flux' ? 'FLUX' : 'BTC'} to ${destination}`;
            }
            if (tx.outs.length >= 2) {
              if (tx.outs[1].script[0] !== 0x6a) {
                const change = bitgo.address.fromOutputScript(tx.outs[1].script, network);
                const amountChange = Number(tx.outs[1].value * 1e-8).toFixed(8);
                txinfo += ` and sending back as change ${amountChange} ${this.chain === 'flux' ? 'FLUX' : 'BTC'} to ${change}`;
              }
            }
          }
          this.txinfoList.push(txinfo);
          this.unsignedTx.hex = tx.toHex();
          this.unsignedTxList.push({ ...this.unsignedTx });
          if (this.sendAllFlux || !this.multipleTxes) break;
        }
        console.log('All transactions built');
        saveToStorage();
      } catch (e) {
        console.log(e);
        this.buildError = e instanceof Error ? e.message : String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>
