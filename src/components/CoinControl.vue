<template>
  <section class="panel">
    <header class="panel__head">
      <span class="panel__num">03</span>
      <h2 class="panel__title">
        Coin control
      </h2>
    </header>
    <p class="panel__desc">
      Inspect spendable UTXOs for an address and select which outputs to include in the next build.
    </p>
    <div class="panel__body">
      <div class="field">
        <label class="field__label">Address</label>
        <input
          v-model="coinControl.address"
          class="input"
        >
        <div
          v-if="addressError"
          class="field__error"
        >
          {{ addressError }}
        </div>
      </div>
      <div class="actions">
        <button
          class="btn btn--primary"
          :disabled="coinControl.loading"
          @click="fetchUtxoSet"
        >
          {{ coinControl.loading ? 'Fetching' : 'View spendable transactions' }}<span
            v-if="coinControl.loading"
            class="dots"
          />
        </button>
      </div>
      <div
        v-if="coinControl.errorMsg"
        class="alert alert--err"
      >
        {{ coinControl.errorMsg }}
      </div>
      <div v-if="coinControl.show">
        <div
          v-if="amountGroups.length"
          class="amount-groups"
        >
          <div class="amount-groups__head">
            Duplicate amounts <span class="amount-groups__hint">(groups of 10+)</span>
          </div>
          <div class="amount-groups__list">
            <span
              v-for="g in amountGroups"
              :key="g.amount"
              class="amount-groups__chip"
            >
              <strong class="amount-groups__count">{{ g.count }}</strong>
              <span class="amount-groups__times">×</span>
              <span class="amount-groups__amt">{{ g.amount }}</span>
              <span class="amount-groups__unit">{{ chain === 'flux' ? 'FLUX' : 'BTC' }}</span>
            </span>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th />
                <th>Conf.</th>
                <th>Txid</th>
                <th>Vout</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in coinControl.getrows"
                :key="index"
              >
                <td>{{ (coinControl.currentPage - 1) * 10 + index }}</td>
                <td>
                  <input
                    v-model="coinControl.selected[(coinControl.currentPage - 1) * 10 + index]"
                    type="checkbox"
                    class="cb"
                    aria-label="Select UTXO"
                    @change="onCheckbox(($event.target as HTMLInputElement).checked, (coinControl.currentPage - 1) * 10 + index)"
                  >
                </td>
                <td>{{ item.confirmations }}</td>
                <td class="td-clip">
                  {{ item.txid }}
                </td>
                <td>{{ item.vout }}</td>
                <td>{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="coinControl.numpages > 1"
          class="pag"
        >
          <button
            class="pag__num pag__nav"
            :disabled="coinControl.currentPage === 1"
            aria-label="Previous page"
            @click="changePage(coinControl.currentPage - 1)"
          >
            ‹
          </button>
          <button
            v-for="(item, idx) in pagItems"
            :key="idx"
            class="pag__num"
            :class="{
              'pag__num--active': item === coinControl.currentPage,
              'pag__num--gap': item === '…',
            }"
            :disabled="item === '…'"
            @click="typeof item === 'number' && changePage(item)"
          >
            {{ item }}
          </button>
          <button
            class="pag__num pag__nav"
            :disabled="coinControl.currentPage === coinControl.numpages"
            aria-label="Next page"
            @click="changePage(coinControl.currentPage + 1)"
          >
            ›
          </button>
          <span class="pag__count">{{ coinControl.currentPage }} / {{ coinControl.numpages }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, inject, type PropType } from 'vue';
import axios from 'axios';
import {
  utxoEndpoint,
  normalizeUtxo,
  type Chain,
  type Utxo,
} from '../composables/network';
import { isValidAddress } from '../utils';

export interface CoinControlState {
  address: string;
  utxos: Utxo[];
  selected: boolean[];
  errorMsg: string;
  currentPage: number;
  getrows: Utxo[];
  numpages: number;
  show: boolean;
  selectedValueSats: number;
  selectedValueAmount: number | string;
  loading: boolean;
}

export default defineComponent({
  name: 'CoinControl',
  props: {
    chain: { type: String as PropType<Chain>, required: true },
    isTestnet: { type: Boolean, required: true },
  },
  setup() {
    const coinControl = inject<CoinControlState>('coinControl');
    if (!coinControl) throw new Error('coinControl injection missing');
    return { coinControl };
  },
  computed: {
    addressError(): string {
      const a = this.coinControl.address;
      if (!a) return '';
      return isValidAddress(a, this.chain, this.isTestnet)
        ? ''
        : `Invalid ${this.chain} ${this.isTestnet ? 'testnet ' : ''}address`;
    },
    pagItems(): (number | '…')[] {
      const total = this.coinControl.numpages;
      const current = this.coinControl.currentPage;
      if (!total || total < 1) return [];
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const items: (number | '…')[] = [];
      const range = 1;
      const left = Math.max(2, current - range);
      const right = Math.min(total - 1, current + range);
      items.push(1);
      if (left > 2) items.push('…');
      for (let i = left; i <= right; i += 1) items.push(i);
      if (right < total - 1) items.push('…');
      items.push(total);
      return items;
    },
    amountGroups(): { amount: string; count: number }[] {
      const utxos: Utxo[] = this.coinControl.utxos || [];
      const groups: Record<string, number> = {};
      utxos.forEach((u) => {
        groups[u.amount] = (groups[u.amount] || 0) + 1;
      });
      return Object.entries(groups)
        .filter(([, count]) => count >= 10)
        .sort(([, a], [, b]) => b - a)
        .map(([amount, count]) => ({ amount, count }));
    },
  },
  methods: {
    async fetchUtxoSet(): Promise<void> {
      this.coinControl.loading = true;
      try {
        this.coinControl.selectedValueSats = 0;
        this.coinControl.selectedValueAmount = 0;
        this.coinControl.errorMsg = '';
        this.coinControl.currentPage = 1;
        this.coinControl.selected = [];
        const utx = await axios.get(utxoEndpoint(this.chain, this.isTestnet, this.coinControl.address));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.coinControl.utxos = utx.data.map((x: any) => normalizeUtxo(this.chain, x));
        this.coinControl.numpages = Math.ceil(this.coinControl.utxos.length / 10);
        this.refreshRows();
        this.coinControl.show = true;
      } catch (e) {
        console.log(e);
        this.coinControl.errorMsg = e instanceof Error ? e.message : String(e);
      } finally {
        this.coinControl.loading = false;
      }
    },
    refreshRows(): void {
      const start = (this.coinControl.currentPage - 1) * 10;
      this.coinControl.getrows = this.coinControl.utxos.slice(start, start + 10);
    },
    changePage(page: number): void {
      this.coinControl.currentPage = page;
      this.refreshRows();
    },
    onCheckbox(checked: boolean, index: number): void {
      if (checked) {
        this.coinControl.selectedValueSats += this.coinControl.utxos[index].satoshis;
      } else {
        this.coinControl.selectedValueSats -= this.coinControl.utxos[index].satoshis;
      }
      this.coinControl.selectedValueAmount = Number(this.coinControl.selectedValueSats * 1e-8).toFixed(8);
    },
  },
});
</script>
