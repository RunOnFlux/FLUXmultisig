<template>
  <div id="app">

    <h1>Welcome to ZEL multisig</h1>
    <hr>
    <h3>
      Keypair generation tool
    </h3>
    <p>
      This tool generates a Public Key and corresponding private key that can later be used for MultiSignature address.
    </p>
    <div>
      <button @click="generateKeypair">
        Generate Keypair
      </button>
      <br>
      Public Key: {{ keypair.publickey }}
      <br>
      Private Key: {{ keypair.privatekey }}
    </div>
    <hr>
    <h3>
      Multi Signature address generation tool
    </h3>
    <p>
      This tool generates a Multisignature address from given set of Public Keys and required signatures needed.
    </p>
    <div>
      <div
        v-for="n in inputs"
        :key="n"
      >
        Public Key {{n}}: <input
          class="pubkey"
          v-model="publickeys[n-1]"
        >
      </div>
      <br>
      <button @click="addPubKey">
        Add Public Key Input
      </button>
      <br><br>
      <div>
        Signatures needed: <input v-model="reqsig">
        <br><br>
        <button @click="generateMultisig">
          Generate Multisig Address
        </button>
        <br><br>
        Address: {{ multisig.address }}
        <br>
        Redeem Script: {{ multisig.redeemScript }}
      </div>
    </div>
    <hr>
    <div>
      <h3>
        Build Unsigned Transaction
      </h3>
      <p>
        This tool helps you build an unsigned transaction.
      </p>
      My Address: <input
        class="pubkey"
        v-model="unsignedTx.myAddress"
      >
      <br>
      Receiver Address: <input
        class="pubkey"
        v-model="unsignedTx.receiver"
      >
      <br>
      Amount to Send: <input
        class="pubkey"
        v-model="unsignedTx.amount"
      >
      <br>
      Message to Send: <input
        class="pubkey"
        v-model="unsignedTx.message"
      >
      <br>
      <br>
      <button @click="buildUnsignedRawTx">
        Build!
      </button>
      <br><br>
      Raw Transaction: {{ unsignedTx.hex }}
    </div>
    <hr>
    <div>
      <h3>
        Sign Transaction
      </h3>
      <p>
        This tool signs a transaction that is being performed from a multisig address with your private key. Fee is 10000 satoshis.
      </p>
      My Private Key: <input
        class="pubkey"
        v-model="signedTx.privatekey"
      >
      <br>
      My Multisig address Redeem Script: <textarea
        class="pubkey"
        v-model="signedTx.redeemScript"
      />
      <br>
      Transaction to sign: <textarea
        class="pubkey"
        v-model="signedTx.rawtx"
      />
      <br>
      <br>
      <button @click="signTransaction">
        Sign!
      </button>
      <br><br>
      Raw Transaction: {{ signedTx.hex }}
    </div>
  </div>
</template>

<script>
const bitgotx = require('bitgo-utxo-lib');
const axios = require('axios');

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
      publickeys: [],
      inputs: 1,
      reqsig: 1,
      unsignedTx: {
        myAddress: '',
        receiver: '',
        amount: 0,
        message: '',
        hex: '',
      },
      signedTx: {
        rawtx: '',
        privatekey: '',
        redeemScript: '',
        hex: '',
      }
    }
  },
  methods: {
    generateKeypair() {
      const network = bitgotx.networks.zelcash
      const keyPair = bitgotx.ECPair.makeRandom({ network });
      // console.log(keyPair);
      const pubKey = keyPair.getPublicKeyBuffer().toString('hex');
      // const address = keyPair.getAddress();
      // console.log(address);

      this.keypair.publickey = pubKey;
      this.keypair.privatekey = keyPair.toWIF();
    },
    generateMultisig() {
      try {
        const filteredPK = this.publickeys.filter(function (el) {
          return el != null && el != "";
        });

        const pubKeysBuffer = filteredPK.map(function (hex) { return Buffer.from(hex, 'hex') })

        const redeemScript = bitgotx.script.multisig.output.encode(Number(this.reqsig), pubKeysBuffer);
        const redeemScriptHex = redeemScript.toString('hex');
        const scriptPubKey = bitgotx.script.scriptHash.output.encode(bitgotx.crypto.hash160(redeemScript));

        const network = bitgotx.networks.zelcash
        const address = bitgotx.address.fromOutputScript(scriptPubKey, network);
        this.multisig.address = address;
        this.multisig.redeemScript = redeemScriptHex;
      } catch (e) {
        console.log(e)
        this.multisig.address = e.message;
        this.multisig.redeemScript = e.message;
      }
    },
    addPubKey() {
      this.inputs += 1;
    },
    async buildUnsignedRawTx() {
      try {
        const network = bitgotx.networks.zelcash;
        const utx = await axios.get(`https://explorer.zel.cash/api/addr/${this.unsignedTx.myAddress}/utxo`);
        const utxos = utx.data;
        let satoshisSoFar = 0;
        let history = [];
        const satoshisToSend = Math.round(Number(this.unsignedTx.amount) * 1e8);
        const satoshisfeesToSend = 1000;
        let recipients = [{
          address: this.unsignedTx.receiver,
          satoshis: satoshisToSend,
        }];
        for (let i = 0; i < utxos.length; i += 1) {
          if (utxos[i].height !== 0) {
            history = history.concat({
              txid: utxos[i].txid,
              vout: utxos[i].vout,
              scriptPubKey: utxos[i].scriptPubKey,
              satoshis: utxos[i].satoshis,
            });

            satoshisSoFar += utxos[i].satoshis;
            if (satoshisSoFar >= satoshisToSend + satoshisfeesToSend) {
              break;
            }
          }
        }
        const refundSatoshis = satoshisSoFar - satoshisToSend - satoshisfeesToSend;
        if (refundSatoshis > 0) {
          recipients = recipients.concat({
            address: this.unsignedTx.myAddress,
            satoshis: refundSatoshis,
          });
        }
        if (refundSatoshis < 0) {
          this.unsignedTx.hex = 'Insufficient amount';
          return;
        }
        const txb = new bitgotx.TransactionBuilder(network, satoshisfeesToSend);
        txb.setVersion(4);
        txb.setVersionGroupId(0x892F2085);
        history.forEach((x) => txb.addInput(x.txid, x.vout, x.satoshis));
        recipients.forEach((x) => txb.addOutput(x.address, x.satoshis));
        if (this.unsignedTx.message !== '') {
          const data = Buffer.from(this.unsignedTx.message, "utf8");
          const dataScript = bitgotx.script.nullData.output.encode(data);
          txb.addOutput(dataScript, 0);
        }

        const tx = txb.buildIncomplete();
        this.unsignedTx.hex = tx.toHex()
      } catch (e) {
        console.log(e);
        this.unsignedTx.hex = e.message;
      }

    },
    async signTransaction() {
      try {
        const network = bitgotx.networks.zelcash;
        const hashType = bitgotx.Transaction.SIGHASH_ALL;
        const txhex = this.signedTx.rawtx;
        const keyPair = bitgotx.ECPair.fromWIF(this.signedTx.privatekey, network);
        const txb = bitgotx.TransactionBuilder.fromTransaction(bitgotx.Transaction.fromHex(txhex, network), network);
        console.log(txb);
        let i = 0;
        // eslint-disable-next-line no-unused-vars
        for (const input of txb.inputs) {
          const hash = this.getValueHexBuffer(txb.tx.ins[i].hash.toString('hex'));
          const index = txb.tx.ins[i].index;
          console.log(txb.tx);
          console.log(hash);
          const tx = await axios.get(`https://explorer.zel.cash/api/tx/${hash}`);
          const value =  Math.round(Number(tx.data.vout[index].value) * 1e8);
          txb.sign(i, keyPair, Buffer.from(this.signedTx.redeemScript, 'hex'), hashType, value);
          i += 1;
        }
        const tx = txb.buildIncomplete();
        this.signedTx.hex = tx.toHex()
      } catch (e) {
        console.log(e);
        this.signedTx.hex = e.message;
      }
    },
    getValueHexBuffer(hex) {
      const buf = Buffer.from(hex, 'hex').reverse();
      return buf.toString('hex');
    },
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.pubkey {
  width: 80%;
}
</style>
