// File-download helpers. Uses native CompressionStream for gzip so we
// don't pull in a zip library just to compress a JSON blob of hex strings.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revoke so the browser finishes initiating the download first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function gzipBlob(input: string | Uint8Array, mime = 'application/gzip'): Promise<Blob> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  // Cast: TS lib's Uint8Array<ArrayBufferLike> includes SharedArrayBuffer,
  // but Blob's BlobPart type is narrower. The runtime accepts it fine.
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).blob();
  return new Blob([compressed], { type: mime });
}

export function timestampSlug(d: Date = new Date()): string {
  // 2026-05-13T08-43-53 (filesystem-safe, lexicographically sortable).
  return d.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}
