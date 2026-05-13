// Shared copy-to-clipboard + toast state. Components import these directly
// rather than going through provide/inject — the toast is a single global
// element and the copy function is stateless except for the toast flag.

import { reactive } from 'vue';

interface ToastState { visible: boolean }

export const toastState: ToastState = reactive({ visible: false });

let timer: ReturnType<typeof setTimeout> | null = null;

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toastState.visible = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      toastState.visible = false;
    }, 1400);
  } catch (e) {
    console.log('Copy failed:', e);
  }
}
