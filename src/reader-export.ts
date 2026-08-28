import type { ReaderDocument } from './reader-protocol.generated.js';

export function downloadReaderFile(
  document: ReaderDocument,
  content: string,
  extension: 'txt' | 'srt',
): void {
  const link = window.document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  link.download = `${document.title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'dualcue'}.${extension}`;
  link.click();
  URL.revokeObjectURL(link.href);
}
