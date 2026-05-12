<template>
  <div
    id="app"
    class="app"
    :class="{ 'app--testnet': isTestnet, 'app--light': theme === 'light' }"
  >
    <div
      class="grain"
      aria-hidden="true"
    />

    <div
      v-if="isTestnet"
      class="testnet-stripe"
      role="alert"
    >
      <span class="testnet-stripe__txt">
        <span class="testnet-stripe__mark">▲</span>
        Testnet mode — not real funds
        <span class="testnet-stripe__mark">▲</span>
      </span>
    </div>

    <transition name="toast">
      <div
        v-if="copyToast"
        class="copy-toast"
        role="status"
        aria-live="polite"
      >
        <span class="copy-toast__check">✓</span>
        Copied to clipboard
      </div>
    </transition>

    <header class="topbar">
      <div class="topbar__inner">
        <div class="topbar__brand">
          <span class="topbar__mark">FLUX</span>
          <span class="topbar__slash">//</span>
          <span class="topbar__sub">Multisig</span>
        </div>
        <div class="topbar__toggles">
          <button
            class="pill pill--theme"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <span class="pill__glyph">{{ theme === 'dark' ? '☾' : '☀' }}</span>
            {{ theme === 'dark' ? 'Dark' : 'Light' }}
          </button>
          <button
            class="pill"
            :class="{ 'pill--warn': isTestnet }"
            @click="isTestnet = !isTestnet"
          >
            <span class="pill__dot" />
            {{ isTestnet ? 'Testnet' : 'Mainnet' }}
          </button>
          <button
            class="pill"
            @click="toggleChain"
          >
            <span class="pill__dot pill__dot--accent" />
            {{ chain === 'flux' ? 'Flux' : 'Bitcoin' }}
          </button>
        </div>
      </div>
    </header>

    <main class="container">
      <section class="hero">
        <h1 class="hero__title">
          Multi&shy;signature<br>
          <em>operations.</em>
        </h1>
        <p class="hero__lede">
          Generate keys, derive M-of-N addresses, build, sign, finalize and
          broadcast transactions on Flux and Bitcoin.
        </p>
      </section>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">01</span>
          <h2 class="panel__title">
            Keypair generation
          </h2>
        </header>
        <p class="panel__desc">
          Generate a fresh elliptic-curve keypair for use in a multi-signature address.
        </p>
        <div class="panel__body">
          <div class="actions">
            <button
              class="btn btn--primary"
              @click="generateKeypair"
            >
              Generate keypair
            </button>
          </div>
          <div class="kv">
            <div class="kv__row">
              <span class="kv__label">Public key</span>
              <code class="kv__val">{{ keypair.publickey || '—' }}</code>
              <button
                v-if="keypair.publickey"
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(keypair.publickey)"
              >
                Copy
              </button>
            </div>
            <div class="kv__row">
              <span class="kv__label">Private key</span>
              <code class="kv__val">{{ keypair.privatekey ? (showPrivateKey ? keypair.privatekey : '••••••••••••••••••••••') : '—' }}</code>
              <button
                v-if="keypair.privatekey"
                class="btn btn--ghost btn--micro"
                @click="showPrivateKey = !showPrivateKey"
              >
                {{ showPrivateKey ? 'Hide' : 'Show' }}
              </button>
              <button
                v-if="keypair.privatekey"
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(keypair.privatekey)"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">02</span>
          <h2 class="panel__title">
            Multisig address
          </h2>
        </header>
        <p class="panel__desc">
          Combine N public keys and a required-signature threshold to derive a multisignature address.
        </p>
        <div class="panel__body">
          <div
            v-for="n in inputs"
            :key="n"
            class="field"
          >
            <label class="field__label">Public key {{ n }}</label>
            <input
              v-model="publickeys[n-1]"
              class="input"
            >
          </div>
          <div class="actions actions--row">
            <button
              class="btn btn--ghost"
              @click="addPubKey"
            >
              + Add public key
            </button>
          </div>
          <div class="field field--inline">
            <label class="field__label">Signatures needed</label>
            <input
              v-model="reqsig"
              class="input input--small"
            >
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              @click="generateMultisig"
            >
              Generate multisig address
            </button>
          </div>
          <div class="kv">
            <div class="kv__row">
              <span class="kv__label">Address</span>
              <code class="kv__val">{{ multisig.address || '—' }}</code>
              <button
                v-if="multisig.address"
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(multisig.address)"
              >
                Copy
              </button>
            </div>
            <div class="kv__row">
              <span class="kv__label">Redeem script</span>
              <code class="kv__val">{{ multisig.redeemScript || '—' }}</code>
              <button
                v-if="multisig.redeemScript"
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(multisig.redeemScript)"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </section>

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
              v-model="coincontrol.address"
              class="input"
            >
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              :disabled="loading.fetchUtxos"
              @click="fetchUtxoSet"
            >
              {{ loading.fetchUtxos ? 'Fetching' : 'View spendable transactions' }}<span
                v-if="loading.fetchUtxos"
                class="dots"
              />
            </button>
          </div>
          <div
            v-if="coincontrol.errorMsg"
            class="alert alert--err"
          >
            {{ coincontrol.errorMsg }}
          </div>
          <div v-if="coincontrol.show">
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
                    v-for="(item, index) in coincontrol.getrows"
                    :key="index"
                  >
                    <td>{{ (coincontrol.currentPage - 1) * 10 + index }}</td>
                    <td>
                      <input
                        v-model="coincontrol.selected[(coincontrol.currentPage - 1) * 10 + index]"
                        type="checkbox"
                        class="cb"
                        aria-label="Select UTXO"
                        @change="checkboxClicked($event.target.checked, (coincontrol.currentPage - 1) * 10 + index);"
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
              v-if="coincontrol.numpages > 1"
              class="pag"
            >
              <button
                class="pag__num pag__nav"
                :disabled="coincontrol.currentPage === 1"
                aria-label="Previous page"
                @click="change_page(coincontrol.currentPage - 1)"
              >
                ‹
              </button>
              <button
                v-for="(item, idx) in pagItems"
                :key="idx"
                class="pag__num"
                :class="{
                  'pag__num--active': item === coincontrol.currentPage,
                  'pag__num--gap': item === '…',
                }"
                :disabled="item === '…'"
                @click="typeof item === 'number' && change_page(item)"
              >
                {{ item }}
              </button>
              <button
                class="pag__num pag__nav"
                :disabled="coincontrol.currentPage === coincontrol.numpages"
                aria-label="Next page"
                @click="change_page(coincontrol.currentPage + 1)"
              >
                ›
              </button>
              <span class="pag__count">{{ coincontrol.currentPage }} / {{ coincontrol.numpages }}</span>
            </div>
          </div>
        </div>
      </section>

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
              :class="{ 'btn--toggle-on': isTitan }"
              @click="isTitan = !isTitan; avoidFluxNodeAmounts = isTitan;"
            >
              <span class="btn__dot" />
              {{ isTitan ? 'Advanced features ON' : 'Advanced features OFF' }}
            </button>
          </div>

          <div
            v-show="isTitan"
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
                  @change="fillHotWalletWithRewardsCheckboxClicked($event.target.checked);"
                >
                <span>Fill hot wallet from collateral rewards</span>
              </label>
              <label class="check">
                <input
                  v-model="fillHotWalletFromDesposit"
                  type="checkbox"
                  class="cb"
                  @change="fillHotWalletFromDepositCheckboxClicked($event.target.checked);"
                >
                <span>Fill hot wallet from deposit address</span>
              </label>
              <label class="check">
                <input
                  v-model="createCollateralTx"
                  type="checkbox"
                  class="cb"
                  @change="createCollateralTxCheckboxClicked($event.target.checked);"
                >
                <span>Create Titan collateral transaction</span>
              </label>
              <label class="check">
                <input
                  v-model="consolidateRewards"
                  type="checkbox"
                  class="cb"
                  @change="consolidateRewardsCheckboxClicked($event.target.checked);"
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
            v-show="coincontrol.selectedValueSats"
            class="alert alert--ok"
          >
            Coin control active · <strong>{{ coincontrol.selectedValueAmount }}</strong>
          </div>

          <div class="field">
            <label class="field__label">My address</label>
            <input
              v-model="unsignedTx.myAddress"
              class="input"
              :disabled="createCollateralTx || fillHotWalletFromDesposit || fillHotWalletWithRewards || consolidateRewards"
            >
          </div>
          <div class="field">
            <label class="field__label">Receiver address</label>
            <input
              v-model="unsignedTx.receiver"
              class="input"
              :disabled="createCollateralTx || fillHotWalletFromDesposit || fillHotWalletWithRewards || consolidateRewards"
            >
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
            v-show="isTitan"
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
                  @change="generateMultiTxesCheckboxClicked($event.target.checked);"
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
              :disabled="loading.build"
              @click="buildUnsignedRawTx"
            >
              {{ loading.build ? 'Building' : 'Build' }}<span
                v-if="loading.build"
                class="dots"
              />
            </button>
          </div>

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
              <code class="kv__val">{{ unsignedTxList[0].hex }}</code>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(unsignedTxList[0].hex)"
              >
                Copy
              </button>
            </div>
          </div>
          <div
            v-if="unsignedTxList.length > 1"
            class="multi"
          >
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
                  <code class="kv__val">{{ item.hex }}</code>
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

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">05</span>
          <h2 class="panel__title">
            Decode transaction
          </h2>
        </header>
        <p class="panel__desc">
          Display a human-readable summary of a transaction hex.
        </p>
        <div class="panel__body">
          <div class="field">
            <label class="field__label">Transaction to decode</label>
            <textarea
              v-model="decodeRawHex"
              aria-label="Transaction to decode"
              class="textarea"
              rows="4"
            />
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              @click="decodeRawTransaction"
            >
              Decode
            </button>
          </div>
          <pre
            v-if="decodedInfoString"
            class="output"
          >{{ decodedInfoString }}</pre>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">06</span>
          <h2 class="panel__title">
            Sign transaction
          </h2>
        </header>
        <p class="panel__desc">
          Sign a transaction from a multisig address with your private key.
          <span class="muted">(Fee is 0 satoshis on Flux.)</span>
        </p>
        <div class="panel__body">
          <div class="field">
            <label class="field__label">My private key</label>
            <div class="input-wrap">
              <input
                v-model="signedTx.privatekey"
                :type="showPrivateKey ? 'text' : 'password'"
                class="input"
              >
              <button
                class="btn btn--ghost btn--micro"
                @click="showPrivateKey = !showPrivateKey"
              >
                {{ showPrivateKey ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
          <div class="field">
            <label class="field__label">My multisig {{ chain === 'flux' ? 'redeem script' : 'witness script' }}</label>
            <textarea
              v-model="signedTx.redeemScript"
              :aria-label="chain === 'flux' ? 'Redeem Script' : 'Witness Script'"
              class="textarea"
              rows="3"
            />
          </div>
          <div class="field">
            <label class="field__label">Transaction to sign</label>
            <textarea
              v-model="signedTx.rawtx"
              aria-label="Transaction to sign"
              class="textarea"
              rows="4"
            />
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              :disabled="loading.sign"
              @click="signTransaction"
            >
              {{ loading.sign ? 'Signing' : 'Sign' }}<span
                v-if="loading.sign"
                class="dots"
              />
            </button>
          </div>
          <div
            v-if="signedTx.hex"
            class="alert alert--err"
          >
            {{ signedTx.hex }}
          </div>
          <div
            v-if="signedTxList.length === 1"
            class="kv"
          >
            <div class="kv__row">
              <span class="kv__label">Signed transaction</span>
              <code class="kv__val">{{ signedTxList[0] }}</code>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(signedTxList[0])"
              >
                Copy
              </button>
            </div>
          </div>
          <div
            v-if="signedTxList.length > 1"
            class="multi"
          >
            <button
              class="btn btn--primary"
              @click="copyToClipboard(JSON.stringify(signedTxList))"
            >
              Copy all as JSON array
            </button>
            <details class="expand">
              <summary class="expand__summary">
                <span class="expand__chevron">›</span>
                {{ signedTxList.length }} signed transactions
                <span class="expand__hint">click to expand</span>
              </summary>
              <div class="expand__body">
                <div
                  v-for="(hex, index) in signedTxList"
                  :key="index"
                  class="kv__row"
                >
                  <span class="kv__label">Tx {{ index }}</span>
                  <code class="kv__val">{{ hex }}</code>
                  <button
                    class="btn btn--ghost btn--micro"
                    @click="copyToClipboard(hex)"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">07</span>
          <h2 class="panel__title">
            Finalise transaction
          </h2>
        </header>
        <p class="panel__desc">
          Combine collected signatures into a final, broadcast-ready transaction.
        </p>
        <div class="panel__body">
          <div class="field">
            <label class="field__label">Transaction to finalise</label>
            <textarea
              v-model="finalisedTx.rawtx"
              aria-label="Transaction to finalise"
              class="textarea"
              rows="4"
            />
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              @click="finaliseTransaction"
            >
              Finalise
            </button>
          </div>
          <div
            v-if="finalisedTx.hex"
            class="alert alert--err"
          >
            {{ finalisedTx.hex }}
          </div>
          <div
            v-if="finalisedTxList.length === 1"
            class="kv"
          >
            <div class="kv__row">
              <span class="kv__label">Finalised transaction</span>
              <code class="kv__val">{{ finalisedTxList[0] }}</code>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(finalisedTxList[0])"
              >
                Copy
              </button>
            </div>
          </div>
          <div
            v-if="finalisedTxList.length > 1"
            class="multi"
          >
            <button
              class="btn btn--primary"
              @click="copyToClipboard(JSON.stringify(finalisedTxList))"
            >
              Copy all as JSON array
            </button>
            <details class="expand">
              <summary class="expand__summary">
                <span class="expand__chevron">›</span>
                {{ finalisedTxList.length }} finalised transactions
                <span class="expand__hint">click to expand</span>
              </summary>
              <div class="expand__body">
                <div
                  v-for="(hex, index) in finalisedTxList"
                  :key="index"
                  class="kv__row"
                >
                  <span class="kv__label">Tx {{ index }}</span>
                  <code class="kv__val">{{ hex }}</code>
                  <button
                    class="btn btn--ghost btn--micro"
                    @click="copyToClipboard(hex)"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      <section class="panel">
        <header class="panel__head">
          <span class="panel__num">08</span>
          <h2 class="panel__title">
            Submit transaction
          </h2>
        </header>
        <p class="panel__desc">
          Broadcast one or more finalized transactions to the network.
        </p>
        <div class="panel__body">
          <div class="field">
            <label class="field__label">Transaction to submit</label>
            <textarea
              v-model="submitedTx.rawtx"
              aria-label="Transaction to submit"
              class="textarea"
              rows="4"
            />
          </div>
          <div class="actions">
            <button
              class="btn btn--primary"
              :disabled="loading.submit"
              @click="submitTransaction"
            >
              {{ loading.submit ? 'Submitting' : 'Submit' }}<span
                v-if="loading.submit"
                class="dots"
              />
            </button>
          </div>
          <div
            v-if="submitedTx.hex"
            class="alert alert--err"
          >
            {{ submitedTx.hex }}
          </div>
          <div
            v-if="submitedTxList.length"
            class="response-list"
          >
            <div
              v-for="(item, index) in submitedTxList"
              :key="index"
              class="response-list__row"
            >
              <span class="response-list__label">
                Response{{ submitedTxList.length > 1 ? ` ${index}` : '' }}
              </span>
              <span
                class="response-list__status"
                :class="item.ok ? 'response-list__status--ok' : 'response-list__status--fail'"
              >
                <span class="response-list__dot" />
                <span class="response-list__code">{{ item.status || '—' }}</span>
                <span>{{ item.ok ? 'OK' : 'Failed' }}</span>
              </span>
              <button
                class="btn btn--ghost btn--micro"
                @click="copyToClipboard(typeof item.data === 'string' ? item.data : JSON.stringify(item.data))"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer class="foot">
        <span class="foot__mark">FLUX // Multisig</span>
        <span class="foot__sep">·</span>
        <span class="foot__txt">Open-source multi-signature tooling for Flux and Bitcoin.</span>
      </footer>
    </main>
  </div>
</template>

<script>

const bitgotx = require('bitgo-utxo-lib');
const axios = require('axios');

let utxosUsedInCurrentTransaction = {};

const UTXO_CACHE_KEY = 'fluxmultisig:utxoCache';
const UTXO_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export default {
  name: 'App',
  data() {
    return {
      keypair: {
        publickey: '',
        privatekey: '',
      },
      multisig: {
        address: '',
        redeemScript: '',
      },
      txinfo: '',
      txinfoList: [],
      publickeys: [],
      inputs: 1,
      reqsig: 1,
      nTxLoopCount: 5,
      unsignedTx: {
        myAddress: '',
        receiver: '',
        amount: 0,
        fee: 0,
        message: '',
        hex: '',
      },
      unsignedTxList: [],
      buildError: '',
      signedTx: {
        rawtx: '',
        privatekey: '',
        redeemScript: '',
        hex: '',
      },
      signedTxList: [],
      finalisedTx: {
        rawtx: '',
        hex: '',
      },
      finalisedTxList: [],
      submitedTx: {
        rawtx: '',
        hex: '',
      },
      submitedTxList: [],
      coincontrol: {
        address: '',
        utxos: [],
        selected: [],
        errorMsg: '',
        currentPage: 1,
        elementsPerPage: 10,
        getrows: 0,
        numpages: 0,
        show: false,
        selectedValueSats: 0,
        selectedValueAmount: 0,
      },
      avoidFluxNodeAmounts: false,
      enableMaxUtxoSize: false,
      maxUtxoSize: '',
      sendAllFlux: false,
      isTestnet: false,
      chain: 'flux',
      isTitan: false,
      multipleTxes: false,
      createCollateralTx: false,
      fillHotWalletFromDesposit: false,
      fillHotWalletWithRewards: false,
      consolidateRewards: false,
      decodeRawHex: '',
      decodedInfo: {
        inputs: {
          count: 0,
        },
        outputs: [],
      },
      decodedInfoString: '',
      showPrivateKey: false,
      theme: 'dark',
      copyToast: false,
      loading: {
        fetchUtxos: false,
        build: false,
        sign: false,
        submit: false,
      },
      mainnetExplorer: 'https://explorer.runonflux.io',
      testnetExplorer: 'https://testnet.runonflux.io',
      bitcoinBlockbook: 'https://blockbookbitcoin.app.runonflux.io',
      testnetBitcoinBlockbook: 'https://blockbookbitcointestnet.app.runonflux.io',
    };
  },
  computed: {
    pagItems() {
      const total = this.coincontrol.numpages;
      const current = this.coincontrol.currentPage;
      if (!total || total < 1) return [];
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      const items = [];
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
  },
  watch: {
    publickeys: {
      handler() { this.saveMultisigSetup(); },
      deep: true,
    },
    inputs() { this.saveMultisigSetup(); },
    reqsig() { this.saveMultisigSetup(); },
  },
  mounted() {
    try {
      const saved = localStorage.getItem('fluxmultisig:multisigSetup');
      if (saved) {
        const data = JSON.parse(saved);
        if (Array.isArray(data.publickeys)) this.publickeys = data.publickeys;
        if (Number.isFinite(data.inputs)) this.inputs = data.inputs;
        if (data.reqsig !== undefined) this.reqsig = data.reqsig;
      }
    } catch (e) {
      console.log('Failed to load multisig setup:', e);
    }
    try {
      const t = localStorage.getItem('fluxmultisig:theme');
      if (t === 'light' || t === 'dark') this.theme = t;
    } catch (e) {
      console.log('Failed to load theme:', e);
    }
    this.loadUtxoCache();
  },
  methods: {
    saveMultisigSetup() {
      try {
        localStorage.setItem('fluxmultisig:multisigSetup', JSON.stringify({
          publickeys: this.publickeys,
          inputs: this.inputs,
          reqsig: this.reqsig,
        }));
      } catch (e) {
        console.log('Failed to save multisig setup:', e);
      }
    },
    toggleChain() {
      if (this.chain === 'flux') {
        this.chain = 'bitcoin';
        if (!this.unsignedTx.fee || Number(this.unsignedTx.fee) === 0) {
          this.unsignedTx.fee = 0.00001;
        }
      } else {
        this.chain = 'flux';
        this.unsignedTx.fee = 0;
      }
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('fluxmultisig:theme', this.theme);
      } catch (e) {
        console.log('Failed to save theme:', e);
      }
    },
    loadUtxoCache() {
      try {
        const raw = localStorage.getItem(UTXO_CACHE_KEY);
        if (!raw) return;
        const stored = JSON.parse(raw);
        const now = Date.now();
        Object.keys(stored).forEach((k) => {
          const entry = stored[k];
          if (entry && Number.isFinite(entry.satoshis) && entry.expiresAt > now) {
            utxosUsedInCurrentTransaction[k] = entry.satoshis;
          }
        });
      } catch (e) {
        console.log('Failed to load UTXO cache:', e);
      }
    },
    saveUtxoCache() {
      try {
        const now = Date.now();
        const out = {};
        // Re-read what's persisted so older entries keep their original TTL,
        // and merge in any new keys from the in-memory cache with a fresh TTL.
        try {
          const raw = localStorage.getItem(UTXO_CACHE_KEY);
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
        Object.keys(utxosUsedInCurrentTransaction).forEach((k) => {
          if (!out[k]) {
            out[k] = {
              satoshis: utxosUsedInCurrentTransaction[k],
              expiresAt: now + UTXO_CACHE_TTL_MS,
            };
          }
        });
        localStorage.setItem(UTXO_CACHE_KEY, JSON.stringify(out));
      } catch (e) {
        console.log('Failed to save UTXO cache:', e);
      }
    },
    clearUtxoCache() {
      utxosUsedInCurrentTransaction = {};
      try {
        localStorage.removeItem(UTXO_CACHE_KEY);
      } catch (e) {
        console.log('Failed to clear UTXO cache:', e);
      }
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.copyToast = true;
        clearTimeout(this.copyToastTimer);
        this.copyToastTimer = setTimeout(() => { this.copyToast = false; }, 1400);
      } catch (e) {
        console.log('Copy failed:', e);
      }
    },
    getNetwork() {
      let network = bitgotx.networks.zelcash;
      if (this.chain === 'bitcoin' && !this.isTestnet) {
        network = bitgotx.networks.bitcoin;
      } else if (this.chain === 'bitcoin' && this.isTestnet) {
        network = bitgotx.networks.testnet;
      } else if (this.chain === 'flux' && !this.isTestnet) {
        network = bitgotx.networks.zelcash;
      } else if (this.chain === 'flux' && this.isTestnet) {
        network = bitgotx.networks.fluxtestnet;
      }
      return network;
    },
    generateKeypair() {
      const network = this.getNetwork();
      const keyPair = bitgotx.ECPair.makeRandom({ network });
      const pubKey = keyPair.getPublicKeyBuffer().toString('hex');

      this.keypair.publickey = pubKey;
      this.keypair.privatekey = keyPair.toWIF();
    },
    generateMultisig() {
      try {
        const filteredPK = this.publickeys.filter((el) => el != null && el !== '' && el !== undefined);

        const pubKeysBuffer = filteredPK.map((hex) => Buffer.from(hex, 'hex'));

        if (this.chain === 'flux') {
          const redeemScript = bitgotx.script.multisig.output.encode(Number(this.reqsig), pubKeysBuffer);
          const redeemScriptHex = redeemScript.toString('hex');
          const scriptPubKey = bitgotx.script.scriptHash.output.encode(bitgotx.crypto.hash160(redeemScript));

          const network = this.getNetwork();
          const address = bitgotx.address.fromOutputScript(scriptPubKey, network);
          this.multisig.address = address;
          this.multisig.redeemScript = redeemScriptHex;
        } else {
          const witnessScript = bitgotx.script.multisig.output.encode(Number(this.reqsig), pubKeysBuffer);
          const witnessScriptHex = witnessScript.toString('hex');
          const scriptPubKey = bitgotx.script.witnessScriptHash.output.encode(
            bitgotx.crypto.sha256(witnessScript),
          );
          const network = this.getNetwork();
          const address = bitgotx.address.fromOutputScript(scriptPubKey, network);
          this.multisig.address = address;
          this.multisig.redeemScript = witnessScriptHex;
        }
      } catch (e) {
        console.log(e);
        this.multisig.address = e.message;
        this.multisig.redeemScript = e.message;
      }
    },
    addPubKey() {
      this.inputs += 1;
    },
    num_pages() {
      this.coincontrol.numpages = Math.ceil(this.coincontrol.utxos.length / this.coincontrol.elementsPerPage);
    },
    get_rows() {
      const start = (this.coincontrol.currentPage - 1) * this.coincontrol.elementsPerPage;
      const end = start + this.coincontrol.elementsPerPage;

      this.coincontrol.getrows = this.coincontrol.utxos.slice(start, end);
    },
    change_page(page) {
      this.coincontrol.currentPage = page;
      this.get_rows();
    },
    checkboxClicked(cb, index) {
      if (cb) {
        this.coincontrol.selectedValueSats += this.coincontrol.utxos[index].satoshis;
      } else {
        this.coincontrol.selectedValueSats -= this.coincontrol.utxos[index].satoshis;
      }
      this.coincontrol.selectedValueAmount = Number(this.coincontrol.selectedValueSats * 1e-8).toFixed(8);
    },
    createCollateralTxCheckboxClicked(cb) {
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
    generateMultiTxesCheckboxClicked(cb) {
      if (cb) {
        this.sendAllFlux = false;
      }
    },
    fillHotWalletFromDepositCheckboxClicked(cb) {
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
    fillHotWalletWithRewardsCheckboxClicked(cb) {
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
    consolidateRewardsCheckboxClicked(cb) {
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

    async fetchUtxoSet() {
      this.loading.fetchUtxos = true;
      try {
        this.coincontrol.selectedValueSats = 0;
        this.coincontrol.selectedValueAmount = 0;
        this.coincontrol.errorMsg = '';
        this.coincontrol.currentPage = 1;
        this.coincontrol.selected = [];
        if (this.chain === 'flux') {
          const explorer = this.isTestnet ? this.testnetExplorer : this.mainnetExplorer;
          const utx = await axios.get(`${explorer}/api/addr/${this.coincontrol.address}/utxo`);
          const fetchedUtxos = utx.data;
          const utxos = fetchedUtxos.map((x) => {
            const sats = Number(x.satoshis);
            return {
              txid: x.txid,
              vout: x.vout,
              scriptPubKey: x.scriptPubKey,
              satoshis: sats,
              amount: (sats * 1e-8).toFixed(8),
              confirmations: x.confirmations,
              coinbase: x.coinbase || false,
            };
          });
          this.coincontrol.utxos = utxos;
        } else {
          const blockbook = this.isTestnet ? this.testnetBitcoinBlockbook : this.bitcoinBlockbook;
          const utx = await axios.get(`${blockbook}/api/v2/utxo/${this.coincontrol.address}`);
          const fetchedUtxos = utx.data;
          const utxos = fetchedUtxos.map((x) => {
            const sats = Number(x.value);
            return {
              txid: x.txid,
              vout: x.vout,
              scriptPubKey: '', // that is fine, not needed
              satoshis: sats,
              amount: (sats * 1e-8).toFixed(8),
              confirmations: x.confirmations,
              coinbase: x.coinbase || false,
            };
          });
          this.coincontrol.utxos = utxos;
        }
        this.num_pages();
        this.get_rows();
        this.coincontrol.show = true;
      } catch (e) {
        console.log(e);
        this.coincontrol.errorMsg = e.message;
      } finally {
        this.loading.fetchUtxos = false;
      }
    },
    async buildUnsignedRawTx() {
      this.loading.build = true;
      try {
        this.buildError = '';
        this.unsignedTxList = [];
        this.txinfoList = [];
        const network = this.getNetwork();
        let utxos = [];
        if (this.chain === 'flux') {
          const explorer = this.isTestnet ? this.testnetExplorer : this.mainnetExplorer;
          const utx = await axios.get(`${explorer}/api/addr/${this.unsignedTx.myAddress}/utxo`);
          const fetchedUtxos = utx.data;
          utxos = fetchedUtxos.map((x) => ({
            txid: x.txid,
            vout: x.vout,
            scriptPubKey: x.scriptPubKey,
            satoshis: Number(x.satoshis),
            confirmations: x.confirmations,
            coinbase: x.coinbase || false,
          }));
        } else {
          const blockbook = this.isTestnet ? this.testnetBitcoinBlockbook : this.bitcoinBlockbook;
          const utx = await axios.get(`${blockbook}/api/v2/utxo/${this.unsignedTx.myAddress}`);
          const fetchedUtxos = utx.data;
          utxos = fetchedUtxos.map((x) => ({
            txid: x.txid,
            vout: x.vout,
            scriptPubKey: '', // that is fine, not needed
            satoshis: Number(x.value),
            confirmations: x.confirmations,
            coinbase: x.coinbase || false,
          }));
        }
        let satoshisSoFar = 0;
        let history = [];
        const satoshisToSend = Math.round(Number(this.unsignedTx.amount.toString().replace(',', '.')) * 1e8);
        const satoshisfeesToSend = Math.round(Number(this.unsignedTx.fee.toString().replace(',', '.')) * 1e8);
        const maxUtxoStr = (this.maxUtxoSize || '').toString().replace(',', '.').trim();
        const maxUtxoSatoshis = (this.enableMaxUtxoSize && maxUtxoStr) ? Math.round(Number(maxUtxoStr) * 1e8) : 0;
        let recipients = [{
          address: this.unsignedTx.receiver,
          satoshis: satoshisToSend,
        }];
        let count = 0;

        const selectedCoins = new Set();
        const usedUtxos = new Set();

        for (let loop = 0; loop < this.nTxLoopCount; loop += 1) {
          console.log('TX Loop:', loop);
          history = [];
          satoshisSoFar = 0;
          recipients = [{
            address: this.unsignedTx.receiver,
            satoshis: satoshisToSend,
          }];
          count = 0;
          selectedCoins.clear();
          const addressFrom = this.unsignedTx.myAddress;
          const addressTo = this.unsignedTx.receiver;
          const { amount } = this.unsignedTx;
          let { message } = this.unsignedTx;

          // if this isn't the first tx, update the message
          if (loop > 0) {
            message = this.updateTitanNodeMessage(message);
          }

          this.unsignedTx = {
            myAddress: addressFrom,
            receiver: addressTo,
            amount,
            message,
            hex: '',
            fee: this.unsignedTx.fee,
          };

          if (this.coincontrol.selectedValueSats > 0) {
            for (let j = 0; j < this.coincontrol.selected.length; j += 1) {
              if (this.coincontrol.selected[j] === true) {
                selectedCoins.add(this.coincontrol.utxos[j].txid + this.coincontrol.utxos[j].vout);
              }
            }
          }

          for (let i = 0; i < utxos.length; i += 1) {
            if (utxos[i].confirmations > 0) {
              if (this.avoidFluxNodeAmounts && (+utxos[i].satoshis === 4000000000000 || +utxos[i].satoshis === 1250000000000 || +utxos[i].satoshis === 100000000000)) {
                // eslint-disable-next-line no-continue
                continue;
              }

              if (maxUtxoSatoshis > 0 && +utxos[i].satoshis > maxUtxoSatoshis) {
                // eslint-disable-next-line no-continue
                continue;
              }

              if (this.coincontrol.selectedValueSats > 0) {
                if (!selectedCoins.has(utxos[i].txid + utxos[i].vout)) {
                  // eslint-disable-next-line no-continue
                  continue;
                }
              }

              if (usedUtxos.has(utxos[i].txid + utxos[i].vout)) {
                // eslint-disable-next-line no-continue
                continue;
              } else {
                usedUtxos.add(utxos[i].txid + utxos[i].vout);
                utxosUsedInCurrentTransaction[utxos[i].txid + utxos[i].vout] = utxos[i].satoshis;
              }

              history = history.concat({
                txid: utxos[i].txid,
                vout: utxos[i].vout,
                scriptPubKey: utxos[i].scriptPubKey,
                satoshis: utxos[i].satoshis,
              });

              satoshisSoFar += utxos[i].satoshis;
              count += 1;
              if (this.sendAllFlux) {
                if (count >= 2000) {
                  break;
                }
                // eslint-disable-next-line no-continue
                continue;
              } else if (satoshisSoFar >= satoshisToSend + satoshisfeesToSend) {
                break;
              }
            }
          }

          if (this.sendAllFlux) {
            // Update the recipient to the full flux amount
            // Overrides the amount that was put in the Amount to Send textbox
            recipients[0].satoshis = satoshisSoFar;

            // We don't have any change when sendAllFlux is true

            // All txs have fee 0
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
          const txb = new bitgotx.TransactionBuilder(network, satoshisfeesToSend);
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
            const dataScript = bitgotx.script.nullData.output.encode(data);
            txb.addOutput(dataScript, 0);
          }

          const tx = txb.buildIncomplete();
          let destination = '';
          let change = '';

          if ('outs' in tx) {
            if (tx.outs.length >= 1) {
              destination = bitgotx.address.fromOutputScript(tx.outs[0].script, network);
              const amountSending = Number(tx.outs[0].value * 1e-8).toFixed(8);
              this.txinfo = `Sending ${amountSending} ${this.chain === 'flux' ? 'FLUX' : 'BTC'} to ${destination}`;
            }

            if (tx.outs.length >= 2) {
              if (tx.outs[1].script[0] === 0x6a) {
                // This is the message outpoint as it starts with OP_RETURN
              } else {
                change = bitgotx.address.fromOutputScript(tx.outs[1].script, network);
                const amountChange = Number(tx.outs[1].value * 1e-8).toFixed(8);
                this.txinfo += ` and sending back as change ${amountChange} ${this.chain === 'flux' ? 'FLUX' : 'BTC'} to ${change}`;
              }
            }
          }
          this.txinfoList.push(this.txinfo);
          this.unsignedTx.hex = tx.toHex();
          this.unsignedTxList.push(this.unsignedTx);
          if (this.sendAllFlux || !this.multipleTxes) {
            break;
          }
        }
        console.log('All transactions built');
        console.log(this.unsignedTxList.map((x) => x.hex));
        console.log(JSON.stringify(this.unsignedTxList.map((x) => x.hex)));
        this.saveUtxoCache();
      } catch (e) {
        console.log(e);
        this.buildError = e.message;
      } finally {
        this.loading.build = false;
      }
    },
    decodeRawTransaction() {
      try {
        this.decodedInfoString = '';
        this.decodedInfo.outputs = [];
        this.decodedInfo.inputs.count = 0;

        const network = this.getNetwork();
        const tx = bitgotx.Transaction.fromHex(this.decodeRawHex, network);

        this.decodedInfo.inputs.count = tx.ins.length;

        tx.outs.forEach((out) => {
          // OP_RETURN outputs have no recipient address
          if (out.script[0] === 0x6a) return;
          try {
            this.decodedInfo.outputs.push({
              amount: Number(out.value * 1e-8).toFixed(8),
              address: bitgotx.address.fromOutputScript(out.script, network),
            });
          } catch (e) {
            // Unknown script type; skip
          }
        });

        const unit = this.chain === 'flux' ? 'FLUX' : 'BTC';
        this.decodedInfoString = `\nSpending ${this.decodedInfo.inputs.count} input(s).\n`;
        this.decodedInfo.outputs.forEach((output) => {
          this.decodedInfoString += `Sending ${output.amount} ${unit} to ${output.address}\n`;
        });
      } catch (e) {
        console.log(e);
        this.decodedInfoString = e.message;
      }
    },
    async submitTransaction() {
      this.loading.submit = true;
      try {
        this.submitedTx.hex = '';
        this.submitedTxList = [];
        const txhex = this.submitedTx.rawtx.trim();
        let txs = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
          // multiple txs
        }

        const promises = txs.map((tx, index) => {
          if (this.chain === 'flux' && !this.isTestnet) {
            console.log('Submitting tx:', index + 1, '/', txs.length);

            const data = { hexstring: tx, allowhighfees: true };
            const config = {
              method: 'post',
              url: 'https://api.runonflux.io/daemon/sendrawtransaction/',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              data,
            };

            return axios(config);
          }
          if (this.chain === 'flux' && this.isTestnet) {
            console.log('Submitting tx:', index + 1, '/', txs.length);

            const data = {
              rawtx: tx,
            };
            const config = {
              method: 'post',
              url: `${this.testnetExplorer}/api/tx/send`,
              data,
            };

            return axios(config);
          }
          console.log('Submitting tx:', index + 1, '/', txs.length);

          const data = tx;
          const config = {
            method: 'post',
            url: this.isTestnet ? `${this.testnetBitcoinBlockbook}/api/v2/sendtx/` : `${this.bitcoinBlockbook}/api/v2/sendtx/`,
            data,
          };

          return axios(config);
        });

        const results = await Promise.allSettled(promises);
        this.submitedTxList = results.map((result) => {
          if (result.status === 'fulfilled') {
            // Flux daemon API returns HTTP 200 with `{status: "error"}` on logical failure
            const body = result.value.data;
            const fluxStyleError = body && typeof body === 'object' && body.status === 'error';
            return {
              ok: !fluxStyleError,
              status: result.value.status,
              data: body,
            };
          }
          const err = result.reason;
          const httpStatus = (err && err.response && err.response.status) || null;
          const errData = (err && err.response && err.response.data) || (err && err.message) || String(err);
          return { ok: false, status: httpStatus, data: errData };
        });
        const okCount = this.submitedTxList.filter((x) => x.ok).length;
        console.log(`Submitted ${okCount}/${this.submitedTxList.length} transactions`);
      } catch (e) {
        console.log(e);
        this.submitedTx.hex = e.message;
      } finally {
        this.loading.submit = false;
      }
    },
    async signTransaction() {
      this.loading.sign = true;
      try {
        this.signedTx.hex = '';
        this.signedTxList = [];
        const network = this.getNetwork();
        const hashType = bitgotx.Transaction.SIGHASH_ALL;
        const txhex = this.signedTx.rawtx.trim();
        let txs = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
          // multiple txs
        }
        const signedTxs = [];
        for (let t = 0; t < txs.length; t += 1) {
          console.log('Signing tx:', t + 1, '/', txs.length);
          const keyPair = bitgotx.ECPair.fromWIF(this.signedTx.privatekey, network);
          const txb = bitgotx.TransactionBuilder.fromTransaction(bitgotx.Transaction.fromHex(txs[t], network), network);
          let quickLoad = true;
          // eslint-disable-next-line no-unused-vars
          for (let i = 0; i < txb.inputs.length; i += 1) {
            const hash = this.getValueHexBuffer(txb.tx.ins[i].hash.toString('hex'));
            const { index } = txb.tx.ins[i];
            let value;

            // Do a quick lookup in the utxos dictionary
            if (hash + index in utxosUsedInCurrentTransaction) {
              value = Math.round(Number(utxosUsedInCurrentTransaction[hash + index]));
            } else if (quickLoad) {
            // Only do it once
              quickLoad = false;

              // Fetch the first tx, so we can determine the address the inputs are coming from
              let addr;
              let tx;
              /* eslint-disable no-await-in-loop */
              if (this.chain === 'flux') {
                const exp = this.isTestnet ? this.testnetExplorer : this.mainnetExplorer;
                tx = await axios.get(`${exp}/api/tx/${hash}`);
                // eslint-disable-next-line prefer-destructuring
                addr = tx.data.vout[index].scriptPubKey.addresses[0];
              } else {
                const blockbook = this.isTestnet ? this.testnetBitcoinBlockbook : this.bitcoinBlockbook;
                tx = await axios.get(`${blockbook}/api/tx/${hash}`);
                // eslint-disable-next-line prefer-destructuring
                addr = tx.data.vout[index].scriptPubKey.addresses[0];
              }

              // Get all utxos for that address with a single call
              let utxos = [];
              if (this.chain === 'flux') {
                const exp = this.isTestnet ? this.testnetExplorer : this.mainnetExplorer;
                const utx = await axios.get(`${exp}/api/addr/${addr}/utxo`);
                const fetchedUtxos = utx.data;
                utxos = fetchedUtxos.map((x) => ({
                  txid: x.txid,
                  vout: x.vout,
                  scriptPubKey: x.scriptPubKey,
                  satoshis: Number(x.satoshis),
                  confirmations: x.confirmations,
                  coinbase: x.coinbase || false,
                }));
              } else {
                const blockbook = this.isTestnet ? this.testnetBitcoinBlockbook : this.bitcoinBlockbook;
                const utx = await axios.get(`${blockbook}/api/v2/utxo/${addr}`);
                const fetchedUtxos = utx.data;
                utxos = fetchedUtxos.map((x) => ({
                  txid: x.txid,
                  vout: x.vout,
                  scriptPubKey: '', // that is fine, not needed
                  satoshis: Number(x.value),
                  confirmations: x.confirmations,
                  coinbase: x.coinbase || false,
                }));
              }

              // Load utxo into dictionary
              /* eslint-disable no-loop-func */
              utxos.forEach((element) => {
                utxosUsedInCurrentTransaction[element.txid + element.vout] = element.satoshis;
              });

              // Check the utxo dictionary again for the txid + index
              if (hash + index in utxosUsedInCurrentTransaction) {
                value = Math.round(Number(utxosUsedInCurrentTransaction[hash + index]));
              } else {
              // If not found use the value received when fetching the singleton txhash above.
                value = Math.round(Number(tx.data.vout[index].value) * 1e8);
              }
            } else {
            // If quick searches don't work, default to fetching tx one at a time.
              let tx;
              if (this.chain === 'flux') {
                const exp = this.isTestnet ? this.testnetExplorer : this.mainnetExplorer;
                tx = await axios.get(`${exp}/api/tx/${hash}`);
              } else {
                const blockbook = this.isTestnet ? this.testnetBitcoinBlockbook : this.bitcoinBlockbook;
                tx = await axios.get(`${blockbook}/api/tx/${hash}`);
              }
              value = Math.round(Number(tx.data.vout[index].value) * 1e8);
            }

            txb.sign(i, keyPair, this.chain !== 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '', hashType, value, this.chain === 'bitcoin' ? Buffer.from(this.signedTx.redeemScript, 'hex') : '');
          }
          const tx = txb.buildIncomplete();
          signedTxs.push(tx.toHex());
        }
        this.signedTxList = signedTxs;
        console.log('All transactions signed');
        this.saveUtxoCache();
      } catch (e) {
        console.log(e);
        this.signedTx.hex = e.message;
      } finally {
        this.loading.sign = false;
      }
    },
    finaliseTransaction() {
      try {
        this.finalisedTx.hex = '';
        this.finalisedTxList = [];
        const network = this.getNetwork();
        const txhex = this.finalisedTx.rawtx.trim();
        let txs = [txhex];
        if (txhex.startsWith('[')) {
          txs = JSON.parse(txhex);
          // multiple txs
        }
        const finalizedTxs = [];
        for (let t = 0; t < txs.length; t += 1) {
          console.log('Finalizing tx:', t + 1, '/', txs.length);
          const txb = bitgotx.TransactionBuilder.fromTransaction(bitgotx.Transaction.fromHex(txs[t], network), network);
          const tx = txb.build();
          finalizedTxs.push(tx.toHex());
        }
        this.finalisedTxList = finalizedTxs;
        console.log('All transactions finalized');
      } catch (e) {
        console.log(e);
        this.finalisedTx.hex = e.message;
      }
    },
    getValueHexBuffer(hex) {
      const buf = Buffer.from(hex, 'hex').reverse();
      return buf.toString('hex');
    },
    updateTitanNodeMessage(message) {
      // Match the integer following "Titan Node" and increment it.
      // Anchoring on the label avoids collisions with other digits in the message.
      // Non-Titan messages are dropped on subsequent txs (multi-tx is a Titan-only flow).
      const match = message.match(/Titan Node (\d+)/);
      if (!match) return '';
      return message.replace(
        /Titan Node \d+/,
        `Titan Node ${parseInt(match[1], 10) + 1}`,
      );
    },
  },
};
</script>

<style>
/* design tokens */
:root {
  --bg: #0b0c0a;
  --bg-elev: #131512;
  --surface: #181a17;
  --surface-2: #1f221e;
  --border: #2a2d28;
  --border-strong: #3b3f39;
  --text: #ece9df;
  --text-dim: #8e8b81;
  --text-faint: #5a5854;
  --accent: #c8ff3d;
  --accent-deep: #9bc92a;
  --accent-glow: rgba(200, 255, 61, 0.18);
  --danger: #ff5c3a;
  --warn: #ffb84d;
  --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
  --radius: 2px;
  --radius-pill: 999px;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

::selection {
  background: var(--accent);
  color: var(--bg);
}

.app {
  position: relative;
  min-height: 100vh;
  isolation: isolate;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-glow), transparent 70%),
    var(--bg);
}

.app--testnet {
  --accent: #ffb84d;
  --accent-deep: #d99422;
  --accent-glow: rgba(255, 184, 77, 0.16);
}

.app--light {
  --bg: #faf7ee;
  --bg-elev: #f1eee5;
  --surface: #e8e5dc;
  --surface-2: #ddd9cf;
  --border: #cfcabc;
  --border-strong: #a8a394;
  --text: #1a1916;
  --text-dim: #5e5b54;
  --text-faint: #94918a;
  --accent: #5a8c20;
  --accent-deep: #3d6814;
  --accent-glow: rgba(90, 140, 32, 0.16);
  --danger: #c93b1d;
  --warn: #a86510;
}

.app--light.app--testnet {
  --accent: #a86510;
  --accent-deep: #7a4a09;
  --accent-glow: rgba(168, 101, 16, 0.16);
}

/* grain overlay */
.grain {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  opacity: 0.07;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 220px 220px;
}

.app--light .grain {
  opacity: 0.04;
  mix-blend-mode: multiply;
}

/* testnet warning stripe */
.testnet-stripe {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 28px;
  z-index: 60;
  pointer-events: none;
  background: var(--warn);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1916;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  box-shadow: 0 2px 16px color-mix(in srgb, var(--warn) 50%, transparent);
  animation: stripe-in 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.testnet-stripe__txt {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.testnet-stripe__mark {
  font-size: 10px;
  line-height: 1;
  letter-spacing: 0;
  animation: stripe-pulse 1.8s ease-in-out infinite;
}

.testnet-stripe__mark:last-child {
  animation-delay: 0.9s;
}

@keyframes stripe-in {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes stripe-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* shift topbar down when stripe is visible */
.app--testnet { padding-top: 28px; }
.app--testnet .topbar { top: 28px; }

@media (max-width: 540px) {
  .testnet-stripe { font-size: 10px; letter-spacing: 0.14em; }
}

/* copy toast */
.copy-toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--bg-elev);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  box-shadow:
    0 8px 28px rgba(0, 0, 0, 0.4),
    0 0 0 1px color-mix(in srgb, var(--accent) 14%, transparent),
    0 0 24px color-mix(in srgb, var(--accent) 30%, transparent);
}

.copy-toast__check {
  font-size: 14px;
  line-height: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* topbar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.topbar__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar__brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.topbar__mark {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--text);
}

.topbar__slash { color: var(--text-faint); letter-spacing: 0.04em; }

.topbar__sub {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 19px;
  color: var(--text-dim);
}

.topbar__toggles {
  display: flex;
  gap: 8px;
}

/* pill toggle */
.pill {
  appearance: none;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: border-color 0.15s, background 0.15s, transform 0.05s;
}

.pill:hover {
  border-color: var(--text-dim);
  background: var(--surface-2);
}

.pill:active { transform: translateY(1px); }

.pill__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
  display: inline-block;
}

.pill__dot--accent { background: var(--accent); }
.pill--warn { border-color: var(--warn); color: var(--warn); }
.pill--warn .pill__dot { background: var(--warn); box-shadow: 0 0 8px color-mix(in srgb, var(--warn) 40%, transparent); }

.pill__glyph {
  font-size: 13px;
  line-height: 1;
  display: inline-block;
  color: var(--text-dim);
}

.pill--theme { letter-spacing: 0.14em; }

/* container */
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 64px 32px 96px;
  position: relative;
}

/* hero */
.hero {
  margin-bottom: 64px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.hero__title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(36px, 5.5vw, 72px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
  color: var(--text);
}

.hero__title em {
  font-style: italic;
  color: var(--accent);
  transition: color 0.3s;
}

.hero__lede {
  font-family: var(--font-mono);
  color: var(--text-dim);
  max-width: 560px;
  font-size: 15px;
  line-height: 1.6;
  margin: 0;
}

/* panel */
.panel {
  margin-bottom: 88px;
  position: relative;
  animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.panel:nth-of-type(1) { animation-delay: 0.05s; }
.panel:nth-of-type(2) { animation-delay: 0.12s; }
.panel:nth-of-type(3) { animation-delay: 0.18s; }
.panel:nth-of-type(4) { animation-delay: 0.24s; }
.panel:nth-of-type(5) { animation-delay: 0.30s; }
.panel:nth-of-type(6) { animation-delay: 0.36s; }
.panel:nth-of-type(7) { animation-delay: 0.42s; }
.panel:nth-of-type(8) { animation-delay: 0.48s; }

.panel__head {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.panel__num {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 64px;
  line-height: 0.85;
  color: var(--accent);
  font-weight: 400;
  letter-spacing: -0.02em;
  flex-shrink: 0;
  min-width: 84px;
  transition: color 0.3s;
}

.panel__title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0;
  padding-top: 8px;
  color: var(--text);
}

.panel__desc {
  font-family: var(--font-mono);
  color: var(--text-dim);
  font-size: 13px;
  max-width: 640px;
  margin: 0 0 24px;
  padding-left: 116px;
}

.panel__body {
  padding-left: 116px;
}

@keyframes rise {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* field/input */
.field { margin-bottom: 16px; }

.field--inline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.field__label {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 6px;
}

.field--inline .field__label { margin-bottom: 0; }

.field__hint {
  text-transform: none;
  letter-spacing: normal;
  font-size: 11px;
  color: var(--text-faint);
  margin-left: 8px;
}

.input,
.textarea {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 10px 12px;
  border-radius: var(--radius);
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  outline: none;
}

.input::placeholder,
.textarea::placeholder { color: var(--text-faint); }

.input:focus,
.textarea:focus {
  border-color: var(--accent);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.input:disabled,
.textarea:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.input--small {
  width: auto;
  max-width: 160px;
}

.textarea {
  resize: vertical;
  line-height: 1.5;
  min-height: 80px;
}

.input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-wrap .input { flex: 1; }

/* buttons */
.btn {
  appearance: none;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 18px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s, transform 0.05s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.btn:hover { border-color: var(--text-dim); }
.btn:active { transform: translateY(1px); }

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, transparent);
}

.btn--primary:hover {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
}

.btn--primary:disabled {
  background: color-mix(in srgb, var(--accent) 3%, transparent);
  color: var(--accent);
  border-color: var(--accent);
}

.btn--ghost {
  border-color: var(--border);
  color: var(--text-dim);
  font-size: 11px;
  padding: 7px 12px;
}

.btn--ghost:hover {
  color: var(--text);
  border-color: var(--text-faint);
}

.btn--micro {
  font-size: 10px;
  padding: 5px 10px;
  letter-spacing: 0.12em;
}

.btn--toggle {
  font-size: 11px;
  border-color: var(--border-strong);
  color: var(--text-dim);
}

.btn--toggle-on {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
}

.btn__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-faint);
  display: inline-block;
  transition: background 0.15s, box-shadow 0.15s;
}

.btn--toggle-on .btn__dot {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}

.actions {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.actions--row {
  margin: 12px 0;
}

/* loading dots */
.dots::after {
  content: '';
  display: inline-block;
  letter-spacing: 0.1em;
  width: 1.4em;
  text-align: left;
  animation: dots 1.4s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* checkbox */
.cb {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-strong);
  background: var(--bg-elev);
  cursor: pointer;
  position: relative;
  margin: 0;
  border-radius: 1px;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}

.cb:hover { border-color: var(--text-dim); }

.cb:checked {
  border-color: var(--accent);
  background: var(--accent);
}

.cb:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 9px;
  border: solid var(--bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.cb:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.check {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  line-height: 1.4;
}

.check em {
  font-style: italic;
  color: var(--text-faint);
  font-size: 12px;
  font-family: var(--font-serif);
}

.check-inline {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* advanced panel */
.advanced {
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 18px 22px;
  margin: 12px 0 24px;
  border-radius: var(--radius);
  position: relative;
  overflow: hidden;
}

.advanced::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent);
  transition: background 0.3s;
}

.advanced--inline { margin-top: 0; }

.advanced__head {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 12px;
}

.advanced__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* key/value display */
.kv {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 24px;
  border-top: 1px solid var(--border);
}

.kv__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.kv__label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-dim);
  min-width: 110px;
  flex-shrink: 0;
}

.kv__val {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
  word-break: break-all;
  overflow-wrap: anywhere;
  min-width: 0;
  background: transparent;
  padding: 0;
}

/* alerts */
.alert {
  margin: 16px 0;
  padding: 12px 16px;
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  border-left: 3px solid;
  line-height: 1.5;
}

.alert--err {
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
  color: var(--danger);
}

.alert--ok {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 6%, transparent);
  color: var(--accent);
}

/* table */
.table-wrap {
  overflow-x: auto;
  margin: 20px 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: 12px;
}

.table thead th {
  text-align: left;
  background: var(--bg-elev);
  color: var(--text-faint);
  font-weight: 500;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

.table tbody td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
}

.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover td { background: color-mix(in srgb, var(--accent) 4%, transparent); }

.td-clip {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* pagination */
.pag {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 14px 0;
}

.pag__num {
  appearance: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  min-width: 32px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pag__num:hover:not(:disabled):not(.pag__num--gap) {
  border-color: var(--text-faint);
  color: var(--text);
}

.pag__num:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pag__num--active {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.pag__num--gap {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: var(--text-faint);
  letter-spacing: 0.1em;
  opacity: 0.7;
  padding: 6px 4px;
  min-width: 20px;
}

.pag__num--gap:disabled {
  opacity: 0.7;
}

.pag__nav {
  font-size: 16px;
  line-height: 1;
  padding: 6px 12px;
  color: var(--text);
}

.pag__count {
  margin-left: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.08em;
}

/* info list */
.info-list {
  margin: 16px 0;
  padding: 12px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.info-list__row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 0;
}

.info-list__num {
  color: var(--text-faint);
  flex-shrink: 0;
  min-width: 32px;
}

.info-list__txt {
  color: var(--text-dim);
  flex: 1;
}

/* multi-tx output */
.multi { margin-top: 24px; }

.expand {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.expand__summary {
  list-style: none;
  cursor: pointer;
  padding: 14px 18px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s;
}

.expand__summary::-webkit-details-marker { display: none; }
.expand__summary:hover { background: var(--surface-2); }

.expand__chevron {
  font-size: 18px;
  line-height: 1;
  transition: transform 0.2s;
  color: var(--accent);
  display: inline-block;
  width: 14px;
}

.expand[open] .expand__chevron { transform: rotate(90deg); }

.expand__hint {
  color: var(--text-faint);
  margin-left: auto;
  font-size: 11px;
}

.expand__body {
  padding: 0 18px 6px;
  border-top: 1px solid var(--border);
}

.expand__body .kv__row:last-child { border-bottom: none; }

/* decode output */
.output {
  margin: 16px 0;
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.65;
  overflow-x: auto;
}

/* submit response list */
.response-list {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.response-list__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: 13px;
  flex-wrap: wrap;
}

.response-list__label {
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  min-width: 110px;
}

.response-list__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid;
}

.response-list__status--ok {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 7%, transparent);
}

.response-list__status--fail {
  color: var(--danger);
  border-color: var(--danger);
  background: color-mix(in srgb, var(--danger) 8%, transparent);
}

.response-list__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.response-list__code {
  font-weight: 500;
  font-feature-settings: "tnum";
}

.response-list__row > .btn { margin-left: auto; }

/* foot */
.foot {
  margin-top: 96px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.04em;
  flex-wrap: wrap;
}

.foot__mark {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-dim);
}

.foot__sep { color: var(--text-faint); }

/* misc */
.muted { color: var(--text-faint); }

/* responsive */
@media (max-width: 720px) {
  .container { padding: 32px 20px 64px; }
  .topbar__inner { padding: 14px 20px; }
  .topbar__sub { display: none; }
  .panel__head { gap: 16px; }
  .panel__num { font-size: 40px; min-width: 56px; }
  .panel__title { font-size: 22px; }
  .panel__desc, .panel__body { padding-left: 0; }
  .hero__title { font-size: clamp(32px, 8vw, 56px); }
  .kv__label { min-width: auto; }
  .response-list__row { flex-wrap: wrap; }
  .response-list__row > .btn { margin-left: 0; }
  .td-clip { max-width: 140px; }
}
</style>
