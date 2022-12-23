const bitgotx = require('bitgo-utxo-lib');

const network = bitgotx.networks.zelcash;

const keypairs = [];
const patter = 't3flux';

const minSignature = 3;

function genKey() {
  const keyPair = bitgotx.ECPair.makeRandom({ network });
  const pubKey = keyPair.getPublicKeyBuffer().toString('hex');

  const keypair = {
    publickey: pubKey,
    privatekey: keyPair.toWIF(),
  };

  return keypair;
}

let i = 0;
const now = new Date().getTime();

function generateMultisig() {
  try {
    let address = '';
    while (!address.toLowerCase().startsWith(patter)) {
      i += 1;
      if (i % 100 === 0) {
        const newTime = new Date().getTime();
        const diff = Number(((newTime - now) / 1000).toFixed(0));
        const hashRate = i / diff;
        console.log(`Tested: ${i} private keys`);
        console.log(`${hashRate.toFixed(2)} H/s`);
      }
      const filteredPK = JSON.parse(JSON.stringify(keypairs));

      const k = genKey();
      filteredPK.push(k.publickey);

      const pubKeysBuffer = [];
      filteredPK.forEach((hex) => {
        pubKeysBuffer.push(Buffer.from(hex, 'hex'));
      });

      const redeemScript = bitgotx.script.multisig.output.encode(Number(minSignature), pubKeysBuffer);
      const redeemScriptHex = redeemScript.toString('hex');
      const scriptPubKey = bitgotx.script.scriptHash.output.encode(bitgotx.crypto.hash160(redeemScript));
      address = bitgotx.address.fromOutputScript(scriptPubKey, network);
      if (address.toLowerCase().startsWith(patter)) {
        console.log(address);
        console.log(filteredPK);
        console.log(k);
        console.log(redeemScriptHex);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

generateMultisig();
