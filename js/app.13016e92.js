(function(e){function t(t){for(var i,a,r=t[0],l=t[1],c=t[2],u=0,h=[];u<r.length;u++)a=r[u],Object.prototype.hasOwnProperty.call(n,a)&&n[a]&&h.push(n[a][0]),n[a]=0;for(i in l)Object.prototype.hasOwnProperty.call(l,i)&&(e[i]=l[i]);d&&d(t);while(h.length)h.shift()();return o.push.apply(o,c||[]),s()}function s(){for(var e,t=0;t<o.length;t++){for(var s=o[t],i=!0,r=1;r<s.length;r++){var l=s[r];0!==n[l]&&(i=!1)}i&&(o.splice(t--,1),e=a(a.s=s[0]))}return e}var i={},n={app:0},o=[];function a(t){if(i[t])return i[t].exports;var s=i[t]={i:t,l:!1,exports:{}};return e[t].call(s.exports,s,s.exports,a),s.l=!0,s.exports}a.m=e,a.c=i,a.d=function(e,t,s){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},a.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(a.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)a.d(s,i,function(t){return e[t]}.bind(null,i));return s},a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,"a",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p="/";var r=window["webpackJsonp"]=window["webpackJsonp"]||[],l=r.push.bind(r);r.push=t,r=r.slice();for(var c=0;c<r.length;c++)t(r[c]);var d=l;o.push([0,"chunk-vendors"]),s()})({0:function(e,t,s){e.exports=s("56d7")},1:function(e,t){},"199c":function(e,t,s){"use strict";(function(Buffer){s("14d9");const e=s("7da2"),i=s("bc3a");let n={};t["a"]={name:"App",data(){return{keypair:{publickey:"",privatekey:""},multisig:{address:"",redeemScript:""},txinfo:"",txinfoList:[],publickeys:[],inputs:1,reqsig:1,nTxLoopCount:5,unsignedTx:{myAddress:"",receiver:"",amount:0,message:"",hex:""},unsignedTxList:[],signedTx:{rawtx:"",privatekey:"",redeemScript:"",hex:""},finalisedTx:{rawtx:"",hex:""},submitedTx:{rawtx:"",hex:""},coincontrol:{address:"",utxos:[],selected:[],errorMsg:"",currentPage:1,elementsPerPage:10,getrows:0,numpages:0,show:!1,selectedValueSats:0,selectedValueAmount:0},avoidFluxNodeAmounts:!1,sendAllFlux:!1,isTestnet:!1,isTitan:!1,multipleTxes:!1,createCollateralTx:!1,fillHotWalletFromDesposit:!1,fillHotWalletWithRewards:!1,decodeRawHex:"",decodedInfo:{inputs:{balanceSpent:0,count:0},outputs:[]},decodedInfoString:"",mainnetExplorer:"https://explorer.runonflux.io",testnetExplorer:"https://testnet.runonflux.io"}},methods:{generateKeypair(){const t=this.isTestnet?e.networks.fluxtestnet:e.networks.zelcash,s=e.ECPair.makeRandom({network:t}),i=s.getPublicKeyBuffer().toString("hex");this.keypair.publickey=i,this.keypair.privatekey=s.toWIF()},generateMultisig(){try{const t=this.publickeys.filter(e=>null!=e&&""!==e&&void 0!==e),s=t.map(e=>Buffer.from(e,"hex")),i=e.script.multisig.output.encode(Number(this.reqsig),s),n=i.toString("hex"),o=e.script.scriptHash.output.encode(e.crypto.hash160(i)),a=this.isTestnet?e.networks.fluxtestnet:e.networks.zelcash,r=e.address.fromOutputScript(o,a);this.multisig.address=r,this.multisig.redeemScript=n}catch(t){console.log(t),this.multisig.address=t.message,this.multisig.redeemScript=t.message}},addPubKey(){this.inputs+=1},num_pages(){this.coincontrol.numpages=Math.ceil(this.coincontrol.utxos.length/this.coincontrol.elementsPerPage)},get_rows(){const e=(this.coincontrol.currentPage-1)*this.coincontrol.elementsPerPage,t=e+this.coincontrol.elementsPerPage;this.coincontrol.getrows=this.coincontrol.utxos.slice(e,t)},change_page(e){this.coincontrol.currentPage=e,this.get_rows()},checkboxClicked(e,t){e?this.coincontrol.selectedValueSats+=this.coincontrol.utxos[t].satoshis:this.coincontrol.selectedValueSats-=this.coincontrol.utxos[t].satoshis,this.coincontrol.selectedValueAmount=Number(1e-8*this.coincontrol.selectedValueSats).toFixed(8)},createCollateralTxCheckboxClicked(e){e?(this.avoidFluxNodeAmounts=!1,this.fillHotWalletFromDesposit=!1,this.fillHotWalletWithRewards=!1,this.sendAllFlux=!1,this.unsignedTx.myAddress="t3a6HnypgaJf5xHMA8PrnfJBR6PpTithbeC",this.unsignedTx.receiver="t3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ",this.unsignedTx.amount=4e4):(this.unsignedTx.myAddress="",this.unsignedTx.receiver="",this.unsignedTx.amount=0)},generateMultiTxesCheckboxClicked(e){e&&(this.sendAllFlux=!1)},fillHotWalletFromDepositCheckboxClicked(e){e?(this.avoidFluxNodeAmounts=!1,this.createCollateralTx=!1,this.fillHotWalletWithRewards=!1,this.unsignedTx.myAddress="t3a6HnypgaJf5xHMA8PrnfJBR6PpTithbeC",this.unsignedTx.receiver="t1S9USrJGCkLZgmA1Cv7P1fe5qraz2oqT5e",this.unsignedTx.amount=0):(this.unsignedTx.myAddress="",this.unsignedTx.receiver="",this.unsignedTx.amount=0)},fillHotWalletWithRewardsCheckboxClicked(e){e?(this.avoidFluxNodeAmounts=!0,this.createCollateralTx=!1,this.fillHotWalletFromDesposit=!1,this.unsignedTx.myAddress="t3c4EfxLoXXSRZCRnPRF3RpjPi9mBzF5yoJ",this.unsignedTx.receiver="t1S9USrJGCkLZgmA1Cv7P1fe5qraz2oqT5e",this.unsignedTx.amount=0):(this.unsignedTx.myAddress="",this.unsignedTx.receiver="",this.unsignedTx.amount=0)},async fetchUtxoSet(){try{this.coincontrol.selectedValueSats=0,this.coincontrol.selectedValueAmount=0,this.coincontrol.errorMsg="",this.coincontrol.currentPage=1,this.coincontrol.selected=[];const e=this.isTestnet?this.testnetExplorer:this.mainnetExplorer,t=await i.get(`${e}/api/addr/${this.coincontrol.address}/utxo`);this.coincontrol.utxos=t.data,this.num_pages(),this.get_rows(),this.coincontrol.show=!0}catch(e){console.log(e),this.coincontrol.errorMsg=e.message}},async buildUnsignedRawTx(){try{const t=this.isTestnet?e.networks.fluxtestnet:e.networks.zelcash,s=this.isTestnet?this.testnetExplorer:this.mainnetExplorer,o=await i.get(`${s}/api/addr/${this.unsignedTx.myAddress}/utxo`),a=o.data;n={};let r=0,l=[];const c=Math.round(1e8*Number(this.unsignedTx.amount)),d=0;let u=[{address:this.unsignedTx.receiver,satoshis:c}],h=0;this.unsignedTxList=[],this.txinfoList=[];const p=new Set,x=new Set;for(let i=0;i<this.nTxLoopCount;i+=1){console.log("TX Loop:",i),l=[],r=0,u=[{address:this.unsignedTx.receiver,satoshis:c}],h=0,p.clear();const s=this.unsignedTx.myAddress,o=this.unsignedTx.receiver,{amount:m}=this.unsignedTx;let{message:g}=this.unsignedTx;if(i>0&&(g=this.updateTitanNodeMessage(g)),this.unsignedTx={myAddress:s,receiver:o,amount:m,message:g,hex:""},this.coincontrol.selectedValueSats>0)for(let e=0;e<this.coincontrol.selected.length;e+=1)!0===this.coincontrol.selected[e]&&p.add(this.coincontrol.utxos[e].txid+this.coincontrol.utxos[e].vout);for(let e=0;e<a.length;e+=1)if(0!==a[e].height){if(this.avoidFluxNodeAmounts&&(4e12===+a[e].satoshis||125e10===+a[e].satoshis||1e11===+a[e].satoshis))continue;if(this.coincontrol.selectedValueSats>0&&!p.has(a[e].txid+a[e].vout))continue;if(x.has(a[e].txid+a[e].vout))continue;if(x.add(a[e].txid+a[e].vout),n[a[e].txid+a[e].vout]=a[e].satoshis,l=l.concat({txid:a[e].txid,vout:a[e].vout,scriptPubKey:a[e].scriptPubKey,satoshis:a[e].satoshis}),r+=a[e].satoshis,h+=1,this.sendAllFlux){if(h>=2e3)break;continue}if(r>=c+d)break}if(this.sendAllFlux)u[0].satoshis=r;else{const e=r-c-d;if(e>0&&(u=u.concat({address:this.unsignedTx.myAddress,satoshis:e})),e<0)return void(this.unsignedTx.hex="Insufficient amount")}const v=new e.TransactionBuilder(t,d);if(v.setVersion(4),v.setVersionGroupId(2301567109),l.forEach(e=>v.addInput(e.txid,e.vout)),u.forEach(e=>v.addOutput(e.address,e.satoshis)),""!==this.unsignedTx.message){const t=Buffer.from(this.unsignedTx.message,"utf8"),s=e.script.nullData.output.encode(t);v.addOutput(s,0)}const f=v.buildIncomplete();let b="",T="";if("outs"in f){if(f.outs.length>=1){b=e.address.fromOutputScript(f.outs[0].script,t);const s=Number(1e-8*f.outs[0].value).toFixed(8);this.txinfo=`Sending ${s} FLUX to ${b}`}if(f.outs.length>=2)if(106===f.outs[1].script[0]);else{T=e.address.fromOutputScript(f.outs[1].script,t);const s=Number(1e-8*f.outs[1].value).toFixed(8);this.txinfo+=` and sending back as change ${s} FLUX to ${T}`}}if(this.txinfoList.push(this.txinfo),this.unsignedTx.hex=f.toHex(),this.unsignedTxList.push(this.unsignedTx),this.sendAllFlux||!this.multipleTxes)break}console.log("All transactions built"),console.log(this.unsignedTxList.map(e=>e.hex)),console.log(JSON.stringify(this.unsignedTxList.map(e=>e.hex)))}catch(t){console.log(t),this.unsignedTx.hex=t.message}},async decodeRawTransaction(){try{this.decodedInfoString="",this.decodedInfo.outputs=[],this.decodedInfo.inputs.balanceSpent=0,this.decodedInfo.inputs.count=0;const e={hexstring:this.decodeRawHex},t={method:"post",url:"https://api.runonflux.io/daemon/decoderawtransaction/",headers:{"Content-Type":"application/x-www-form-urlencoded"},data:e},s=await i(t),{vin:n}=s.data.data,o=s.data.data.vout;n.forEach(e=>{"value"in e&&(this.decodedInfo.inputs.balanceSpent+=e.value||0),this.decodedInfo.inputs.count+=1}),o.forEach(e=>{const t={};t.amount=e.value,"addresses"in e.scriptPubKey&&(t.address=e.scriptPubKey.addresses[0],this.decodedInfo.outputs.push(t))}),this.decodedInfoString=`\nSpending ${this.decodedInfo.inputs.count} input(s).\n`,this.decodedInfo.inputs.value&&(this.decodedInfoString=`\nSpending ${this.decodedInfo.inputs.value} Flux in the input(s).\n`),this.decodedInfo.outputs.forEach(e=>{this.decodedInfoString+=`Sending ${e.amount} Flux to ${e.address}\n`})}catch(e){console.log(e),this.decodedInfoString=e.message}},async submitTransaction(){try{const e=this.submitedTx.rawtx;let t=[this.submitedTx.rawtx];e.startsWith("[")&&(t=JSON.parse(e));const s=t.map((e,s)=>{console.log("Submitting tx:",s+1,"/",t.length);const n={hexstring:e},o={method:"post",url:"https://api.runonflux.io/daemon/sendrawtransaction/",headers:{"Content-Type":"application/x-www-form-urlencoded"},data:n};return i(o)}),n=await Promise.all(s),o=n.map(e=>e.data);1===o.length?(console.log(o[0]),this.submitedTx.hex=o[0]):(console.log(JSON.stringify(o)),this.submitedTx.hex="See console for multiple transactions"),console.log("All transactions submitted")}catch(e){console.log(e)}},async signTransaction(){try{const t=this.isTestnet?e.networks.fluxtestnet:e.networks.zelcash,s=e.Transaction.SIGHASH_ALL,o=this.signedTx.rawtx;let a=[this.signedTx.rawtx];o.startsWith("[")&&(a=JSON.parse(o));const r=[];for(let l=0;l<a.length;l+=1){console.log("Signing tx:",l+1,"/",a.length);const o=e.ECPair.fromWIF(this.signedTx.privatekey,t),c=e.TransactionBuilder.fromTransaction(e.Transaction.fromHex(a[l],t),t);let d=!0;for(let e=0;e<c.inputs.length;e+=1){const t=this.getValueHexBuffer(c.tx.ins[e].hash.toString("hex")),{index:a}=c.tx.ins[e],r=this.isTestnet?this.testnetExplorer:this.mainnetExplorer;let l;if(t+a in n)l=Math.round(Number(n[t+a]));else if(d){d=!1;const e=await i.get(`${r}/api/tx/${t}`),s=e.data.vout[a].scriptPubKey.addresses[0],o=await i.get(`${r}/api/addr/${s}/utxo`),c=o.data;c.forEach(e=>{n[e.txid+e.vout]=e.satoshis}),l=t+a in n?Math.round(Number(n[t+a])):Math.round(1e8*Number(e.data.vout[a].value))}else{const e=await i.get(`${r}/api/tx/${t}`);l=Math.round(1e8*Number(e.data.vout[a].value))}c.sign(e,o,Buffer.from(this.signedTx.redeemScript,"hex"),s,l)}const u=c.buildIncomplete();r.push(u.toHex())}1===r.length?(console.log(r[0]),this.signedTx.hex=r[0]):(console.log(JSON.stringify(r)),this.signedTx.hex="See console for multiple transactions"),console.log("All transactions signed")}catch(t){console.log(t),this.signedTx.hex=t.message}},finaliseTransaction(){try{const t=this.isTestnet?e.networks.fluxtestnet:e.networks.zelcash,s=this.finalisedTx.rawtx;let i=[this.finalisedTx.rawtx];s.startsWith("[")&&(i=JSON.parse(s));const n=[];for(let o=0;o<i.length;o+=1){console.log("Finalizing tx:",o+1,"/",i.length);const s=e.TransactionBuilder.fromTransaction(e.Transaction.fromHex(i[o],t),t),a=s.build();n.push(a.toHex())}1===n.length?(console.log(n[0]),this.finalisedTx.hex=n[0]):(console.log(JSON.stringify(n)),this.finalisedTx.hex="See console for multiple tx finalization"),console.log("All transactions finalized")}catch(t){console.log(t),this.finalisedTx.hex=t.message}},getValueHexBuffer(e){const t=Buffer.from(e,"hex").reverse();return t.toString("hex")},updateTitanNodeMessage(e){if(e.includes("Titan Node")){const t=e,s=t.replace(/[^\d.]/g,""),i=parseInt(s,10),n=i+1,o=new RegExp(i),a=t.replace(o,n);return a}return""}}}}).call(this,s("b639").Buffer)},2:function(e,t){},"27e9":function(e,t,s){},3:function(e,t){},4:function(e,t){},5:function(e,t){},"56d7":function(e,t,s){"use strict";s.r(t);var i=s("2b0e"),n=function(){var e=this,t=e._self._c;return t("div",{attrs:{id:"app"}},[t("button",{on:{click:function(t){e.isTestnet=!e.isTestnet}}},[e._v(" USING "+e._s(e.isTestnet?"TESTNET":"MAINNET")+". Click to use "+e._s(e.isTestnet?"MAINNET":"TESTNET")+" ")]),t("h1",[e._v("Welcome to FLUX multisig")]),t("hr"),t("h3",[e._v(" Keypair generation tool ")]),t("p",[e._v(" This tool generates a Public Key and corresponding private key that can later be used for MultiSignature address. ")]),t("div",[t("button",{on:{click:e.generateKeypair}},[e._v(" Generate Keypair ")]),t("br"),e._v(" Public Key: "+e._s(e.keypair.publickey)+" "),t("br"),e._v(" Private Key: "+e._s(e.keypair.privatekey)+" ")]),t("hr"),t("h3",[e._v(" Multi Signature address generation tool ")]),t("p",[e._v(" This tool generates a Multisignature address from given set of Public Keys and required signatures needed. ")]),t("div",[e._l(e.inputs,(function(s){return t("div",{key:s},[e._v(" Public Key "+e._s(s)+": "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.publickeys[s-1],expression:"publickeys[n-1]"}],staticClass:"pubkey",domProps:{value:e.publickeys[s-1]},on:{input:function(t){t.target.composing||e.$set(e.publickeys,s-1,t.target.value)}}})])})),t("br"),t("button",{on:{click:e.addPubKey}},[e._v(" Add Public Key Input ")]),t("br"),t("br"),t("div",[e._v(" Signatures needed: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.reqsig,expression:"reqsig"}],domProps:{value:e.reqsig},on:{input:function(t){t.target.composing||(e.reqsig=t.target.value)}}}),t("br"),t("br"),t("button",{on:{click:e.generateMultisig}},[e._v(" Generate Multisig Address ")]),t("br"),t("br"),e._v(" Address: "+e._s(e.multisig.address)+" "),t("br"),e._v(" Redeem Script: "+e._s(e.multisig.redeemScript)+" ")])],2),t("hr"),t("div",[t("h3",[e._v(" Coin Control ")]),t("p",[e._v(" This tool lets you select which outputs you would like to spend ")]),t("br"),e._v(" Address: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.coincontrol.address,expression:"coincontrol.address"}],staticClass:"pubkey",domProps:{value:e.coincontrol.address},on:{input:function(t){t.target.composing||e.$set(e.coincontrol,"address",t.target.value)}}}),t("p",[t("button",{on:{click:e.fetchUtxoSet}},[e._v(" View Spendable Transactions ")]),t("br"),t("br"),e._v(" "+e._s(e.coincontrol.errorMsg)+" ")]),e.coincontrol.show?t("div",[t("table",{staticClass:"center",attrs:{id:"coincontroltable"}},[e._m(0),t("tbody",e._l(e.coincontrol.getrows,(function(s,i){return t("tr",{key:i},[t("td",[e._v(e._s(10*(e.coincontrol.currentPage-1)+i))]),t("td",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.coincontrol.selected[10*(e.coincontrol.currentPage-1)+i],expression:"coincontrol.selected[(coincontrol.currentPage - 1) * 10 + index]"}],staticClass:"checkbox",attrs:{"aria-labelledby":"coinControl",type:"checkbox"},domProps:{checked:Array.isArray(e.coincontrol.selected[10*(e.coincontrol.currentPage-1)+i])?e._i(e.coincontrol.selected[10*(e.coincontrol.currentPage-1)+i],null)>-1:e.coincontrol.selected[10*(e.coincontrol.currentPage-1)+i]},on:{change:[function(t){var s=e.coincontrol.selected[10*(e.coincontrol.currentPage-1)+i],n=t.target,o=!!n.checked;if(Array.isArray(s)){var a=null,r=e._i(s,a);n.checked?r<0&&e.$set(e.coincontrol.selected,10*(e.coincontrol.currentPage-1)+i,s.concat([a])):r>-1&&e.$set(e.coincontrol.selected,10*(e.coincontrol.currentPage-1)+i,s.slice(0,r).concat(s.slice(r+1)))}else e.$set(e.coincontrol.selected,10*(e.coincontrol.currentPage-1)+i,o)},function(t){e.checkboxClicked(t.target.checked,10*(e.coincontrol.currentPage-1)+i)}]}})]),t("td",[e._v(e._s(s.confirmations))]),t("td",[e._v(e._s(s.txid))]),t("td",[e._v(e._s(s.vout))]),t("td",[e._v(e._s(s.amount))])])})),0)]),t("br"),t("div",{staticClass:"pagination"},e._l(e.coincontrol.numpages,(function(s){return t("div",{key:s,staticClass:"number",class:[s==e.coincontrol.currentPage?"active":""],on:{click:function(t){return e.change_page(s)}}},[e._v(" "+e._s(s)+" ")])})),0)]):e._e()]),t("hr"),t("div",[t("h3",[e._v(" Build Unsigned Transaction ")]),t("p",[e._v(" This tool helps you build an unsigned transaction. ")]),t("p"),t("button",{on:{click:function(t){e.isTitan=!e.isTitan,e.avoidFluxNodeAmounts=e.isTitan}}},[e._v(" "+e._s(e.isTitan?"USING Titan Features.":"")+" Click to toggle titan features ")]),t("br"),t("div",{style:{display:e.isTitan?"initial":"none"}},[t("label",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.avoidFluxNodeAmounts,expression:"avoidFluxNodeAmounts"}],attrs:{id:"checkbox","aria-labelledby":"avoindFluxNodeAmounts",type:"checkbox",disabled:e.fillHotWalletWithRewards||e.fillHotWalletFromDesposit||e.createCollateralTx},domProps:{checked:Array.isArray(e.avoidFluxNodeAmounts)?e._i(e.avoidFluxNodeAmounts,null)>-1:e.avoidFluxNodeAmounts},on:{change:function(t){var s=e.avoidFluxNodeAmounts,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.avoidFluxNodeAmounts=s.concat([o])):a>-1&&(e.avoidFluxNodeAmounts=s.slice(0,a).concat(s.slice(a+1)))}else e.avoidFluxNodeAmounts=n}}}),e._v("Avoid Flux Node Collateral Amounts")]),t("br"),t("label",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.sendAllFlux,expression:"sendAllFlux"}],attrs:{id:"checkbox","aria-labelledby":"sendAll",type:"checkbox",disabled:e.multipleTxes||e.createCollateralTx},domProps:{checked:Array.isArray(e.sendAllFlux)?e._i(e.sendAllFlux,null)>-1:e.sendAllFlux},on:{change:function(t){var s=e.sendAllFlux,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.sendAllFlux=s.concat([o])):a>-1&&(e.sendAllFlux=s.slice(0,a).concat(s.slice(a+1)))}else e.sendAllFlux=n}}}),e._v("Select All Flux (Ignores the Amount - Max 2000 inputs)")]),t("br"),t("label",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.fillHotWalletWithRewards,expression:"fillHotWalletWithRewards"}],attrs:{id:"checkbox","aria-labelledby":"fillHotWithRewards",type:"checkbox"},domProps:{checked:Array.isArray(e.fillHotWalletWithRewards)?e._i(e.fillHotWalletWithRewards,null)>-1:e.fillHotWalletWithRewards},on:{change:[function(t){var s=e.fillHotWalletWithRewards,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.fillHotWalletWithRewards=s.concat([o])):a>-1&&(e.fillHotWalletWithRewards=s.slice(0,a).concat(s.slice(a+1)))}else e.fillHotWalletWithRewards=n},function(t){return e.fillHotWalletWithRewardsCheckboxClicked(t.target.checked)}]}}),e._v("Fill Hot Wallet From Collateral Rewards")]),t("br"),t("label",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.fillHotWalletFromDesposit,expression:"fillHotWalletFromDesposit"}],attrs:{id:"checkbox","aria-labelledby":"fillHotWalletFromDesposit",type:"checkbox"},domProps:{checked:Array.isArray(e.fillHotWalletFromDesposit)?e._i(e.fillHotWalletFromDesposit,null)>-1:e.fillHotWalletFromDesposit},on:{change:[function(t){var s=e.fillHotWalletFromDesposit,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.fillHotWalletFromDesposit=s.concat([o])):a>-1&&(e.fillHotWalletFromDesposit=s.slice(0,a).concat(s.slice(a+1)))}else e.fillHotWalletFromDesposit=n},function(t){return e.fillHotWalletFromDepositCheckboxClicked(t.target.checked)}]}}),e._v("Fill Hot Wallet From Deposit Address")]),t("br"),t("label",[t("input",{directives:[{name:"model",rawName:"v-model",value:e.createCollateralTx,expression:"createCollateralTx"}],attrs:{id:"checkbox","aria-labelledby":"createCollateralTx",type:"checkbox"},domProps:{checked:Array.isArray(e.createCollateralTx)?e._i(e.createCollateralTx,null)>-1:e.createCollateralTx},on:{change:[function(t){var s=e.createCollateralTx,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.createCollateralTx=s.concat([o])):a>-1&&(e.createCollateralTx=s.slice(0,a).concat(s.slice(a+1)))}else e.createCollateralTx=n},function(t){return e.createCollateralTxCheckboxClicked(t.target.checked)}]}}),e._v("Create Titan Collateral Transaction")])]),t("div",{directives:[{name:"show",rawName:"v-show",value:e.coincontrol.selectedValueSats,expression:"coincontrol.selectedValueSats"}],staticStyle:{color:"green"}},[e._v(" Coin Control Active: "),t("b",[e._v(e._s(e.coincontrol.selectedValueAmount))])]),t("br"),e._v(" My Address: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.unsignedTx.myAddress,expression:"unsignedTx.myAddress"}],staticClass:"pubkey",attrs:{disabled:e.createCollateralTx||e.fillHotWalletFromDesposit||e.fillHotWalletWithRewards},domProps:{value:e.unsignedTx.myAddress},on:{input:function(t){t.target.composing||e.$set(e.unsignedTx,"myAddress",t.target.value)}}}),t("br"),e._v(" Receiver Address: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.unsignedTx.receiver,expression:"unsignedTx.receiver"}],staticClass:"pubkey",attrs:{disabled:e.createCollateralTx||e.fillHotWalletFromDesposit||e.fillHotWalletWithRewards},domProps:{value:e.unsignedTx.receiver},on:{input:function(t){t.target.composing||e.$set(e.unsignedTx,"receiver",t.target.value)}}}),t("br"),e._v(" Amount to Send: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.unsignedTx.amount,expression:"unsignedTx.amount"}],staticClass:"pubkey",attrs:{disabled:e.sendAllFlux||e.createCollateralTx},domProps:{value:e.unsignedTx.amount},on:{input:function(t){t.target.composing||e.$set(e.unsignedTx,"amount",t.target.value)}}}),t("br"),e._v(" Message to Send: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.unsignedTx.message,expression:"unsignedTx.message"}],staticClass:"pubkey",domProps:{value:e.unsignedTx.message},on:{input:function(t){t.target.composing||e.$set(e.unsignedTx,"message",t.target.value)}}}),t("div",{style:{display:e.isTitan?"initial":"none"}},[t("br"),t("label",[e._v("Generate Multiple Transactions (Can't use with send All):"),t("input",{directives:[{name:"model",rawName:"v-model",value:e.multipleTxes,expression:"multipleTxes"}],attrs:{id:"checkbox","aria-labelledby":"multiTxes",type:"checkbox"},domProps:{checked:Array.isArray(e.multipleTxes)?e._i(e.multipleTxes,null)>-1:e.multipleTxes},on:{change:[function(t){var s=e.multipleTxes,i=t.target,n=!!i.checked;if(Array.isArray(s)){var o=null,a=e._i(s,o);i.checked?a<0&&(e.multipleTxes=s.concat([o])):a>-1&&(e.multipleTxes=s.slice(0,a).concat(s.slice(a+1)))}else e.multipleTxes=n},function(t){return e.generateMultiTxesCheckboxClicked(t.target.checked)}]}})]),t("br"),t("br"),t("label",[e._v(" How many transactions to build "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.nTxLoopCount,expression:"nTxLoopCount"}],attrs:{type:"number",min:"1",max:"30",value:"5"},domProps:{value:e.nTxLoopCount},on:{input:function(t){t.target.composing||(e.nTxLoopCount=t.target.value)}}})])]),t("br"),t("br"),t("button",{on:{click:e.buildUnsignedRawTx}},[e._v(" Build! ")]),t("br"),t("br"),e._l(e.txinfoList,(function(s,i){return t("div",{key:s.id},[e._v(" Information "+e._s(i)+": "+e._s(s)+" ")])})),t("br"),t("br"),e._l(e.unsignedTxList,(function(s,i){return t("div",{key:s.id},[e._v(" Raw Transaction "+e._s(i)+": "+e._s(s.hex)+" ")])}))],2),t("hr"),t("div",{staticStyle:{"white-space":"pre-line"}},[t("h3",[e._v(" Decode Transaction ")]),t("p",[e._v(" This tool displays information about a transaction to the user ")]),e._v(" Transaction to decode: "),t("textarea",{directives:[{name:"model",rawName:"v-model",value:e.decodeRawHex,expression:"decodeRawHex"}],staticClass:"pubkey",attrs:{"aria-labelledby":"decodeRawHex"},domProps:{value:e.decodeRawHex},on:{input:function(t){t.target.composing||(e.decodeRawHex=t.target.value)}}}),e._v(" "),t("br"),t("br"),t("button",{on:{click:e.decodeRawTransaction}},[e._v(" Decode! ")]),t("br"),e._v(" "+e._s(e.decodedInfoString)+" "),t("br")]),t("hr"),t("div",[t("h3",[e._v(" Sign Transaction ")]),t("p",[e._v(" This tool signs a transaction that is being performed from a multisig address with your private key. Fee is 0 satoshis. ")]),e._v(" My Private Key: "),t("input",{directives:[{name:"model",rawName:"v-model",value:e.signedTx.privatekey,expression:"signedTx.privatekey"}],staticClass:"pubkey",domProps:{value:e.signedTx.privatekey},on:{input:function(t){t.target.composing||e.$set(e.signedTx,"privatekey",t.target.value)}}}),t("br"),e._v(" My Multisig address Redeem Script: "),t("textarea",{directives:[{name:"model",rawName:"v-model",value:e.signedTx.redeemScript,expression:"signedTx.redeemScript"}],staticClass:"pubkey",attrs:{"aria-labelledby":"redeemScript"},domProps:{value:e.signedTx.redeemScript},on:{input:function(t){t.target.composing||e.$set(e.signedTx,"redeemScript",t.target.value)}}}),e._v(" "),t("br"),e._v(" Transaction to sign: "),t("textarea",{directives:[{name:"model",rawName:"v-model",value:e.signedTx.rawtx,expression:"signedTx.rawtx"}],staticClass:"pubkey",attrs:{"aria-labelledby":"transactionToSign"},domProps:{value:e.signedTx.rawtx},on:{input:function(t){t.target.composing||e.$set(e.signedTx,"rawtx",t.target.value)}}}),e._v(" "),t("br"),t("br"),t("button",{on:{click:e.signTransaction}},[e._v(" Sign! ")]),t("br"),t("br"),e._v(" Raw Transaction: "+e._s(e.signedTx.hex)+" ")]),t("hr"),t("div",[t("h3",[e._v(" Finalise Transaction ")]),t("p",[e._v(" This tool finalises a transaction that was previously signed. ")]),e._v(" Transaction to finalise: "),t("textarea",{directives:[{name:"model",rawName:"v-model",value:e.finalisedTx.rawtx,expression:"finalisedTx.rawtx"}],staticClass:"pubkey",attrs:{"aria-labelledby":"transactionToFinalise"},domProps:{value:e.finalisedTx.rawtx},on:{input:function(t){t.target.composing||e.$set(e.finalisedTx,"rawtx",t.target.value)}}}),e._v(" "),t("br"),t("br"),t("button",{on:{click:e.finaliseTransaction}},[e._v(" Finalise! ")]),t("br"),t("br"),e._v(" Finalised Transaction: "+e._s(e.finalisedTx.hex)+" ")]),t("hr"),t("div",[t("h3",[e._v(" Submit Transaction ")]),t("p",[e._v(" This tool submits a transaction that was previously finalized. ")]),e._v(" Transaction to submit: "),t("textarea",{directives:[{name:"model",rawName:"v-model",value:e.submitedTx.rawtx,expression:"submitedTx.rawtx"}],staticClass:"pubkey",attrs:{"aria-labelledby":"transactionToSubmit"},domProps:{value:e.submitedTx.rawtx},on:{input:function(t){t.target.composing||e.$set(e.submitedTx,"rawtx",t.target.value)}}}),e._v(" "),t("br"),t("br"),t("button",{on:{click:e.submitTransaction}},[e._v(" Submit! ")]),t("br"),t("br"),e._v(" Submit Transaction: "+e._s(e.submitedTx.hex)+" ")])])},o=[function(){var e=this,t=e._self._c;return t("thead",[t("tr",[t("th"),t("th"),t("th",[e._v("Confirmations")]),t("th",[e._v("Txid")]),t("th",[e._v("Vout")]),t("th",[e._v("Amount")])])])}],a=s("199c"),r=a["a"],l=(s("80b4"),s("2877")),c=Object(l["a"])(r,n,o,!1,null,"7494610a",null),d=c.exports;i["a"].config.productionTip=!1,new i["a"]({render:e=>e(d)}).$mount("#app")},6:function(e,t){},"80b4":function(e,t,s){"use strict";s("27e9")}});
//# sourceMappingURL=app.13016e92.js.map