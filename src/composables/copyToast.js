// Shared copy-to-clipboard + toast state. Components import these directly
// rather than going through provide/inject — the toast is a single global
// element and the copy function is stateless except for the toast flag.

import { reactive } from 'vue';

export const toastState = reactive({ visible: false });

let timer = null;

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toastState.visible = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      toastState.visible = false;
    }, 1400);
  } catch (e) {
    console.log('Copy failed:', e);
  }
}
