// File-import helpers. Mirror of download.ts. Detects gzip by magic
// bytes (1f 8b) rather than filename so a .json containing gzip data
// still works.

const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

async function decompressGzip(bytes: Uint8Array): Promise<string> {
  // Cast: TS lib's stricter Uint8Array<ArrayBufferLike> isn't assignable
  // to BlobPart even though runtime accepts it.
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressed = await new Response(stream).blob();
  return decompressed.text();
}

export async function readTextFromFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.length >= 2 && buf[0] === GZIP_MAGIC_0 && buf[1] === GZIP_MAGIC_1) {
    return decompressGzip(buf);
  }
  return new TextDecoder().decode(buf);
}

// Pick a file via a hidden <input>. Resolves to null if the user cancels.
export function pickFile(accept = '.json,.gz,.json.gz,application/json,application/gzip'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    let settled = false;
    const cleanup = () => {
      if (input.parentNode) input.parentNode.removeChild(input);
    };
    input.addEventListener('change', () => {
      settled = true;
      const file = input.files && input.files[0] ? input.files[0] : null;
      cleanup();
      resolve(file);
    });
    // 'cancel' is supported in modern browsers; fallback to focus heuristic.
    input.addEventListener('cancel', () => {
      settled = true;
      cleanup();
      resolve(null);
    });
    window.addEventListener('focus', () => {
      setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(null);
        }
      }, 250);
    }, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

// Coerce loaded text into either a single hex string or a JSON array of
// hex strings. Returns the canonical string to drop into a textarea: the
// hex itself for single, or the stringified array for multi (matching
// the format Sign/Submit already expect).
export function normalizeTxImport(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('File is empty');
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (!parsed.every((x) => typeof x === 'string')) {
        throw new Error('JSON array must contain hex strings only');
      }
      return parsed.length === 1 ? parsed[0] : JSON.stringify(parsed);
    }
    // Tolerate { transactions: [...] } or { hex: "..." } shapes.
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.transactions)) {
        const arr = obj.transactions as unknown[];
        if (!arr.every((x) => typeof x === 'string')) {
          throw new Error('"transactions" must be an array of hex strings');
        }
        return arr.length === 1 ? (arr[0] as string) : JSON.stringify(arr);
      }
      if (typeof obj.hex === 'string') return obj.hex;
    }
    throw new Error('Unsupported JSON shape');
  }
  // Plain hex blob.
  return trimmed;
}
