import {
  parseReaderBridgeEventValue,
  parseReaderPublicHttpsUrl,
  type ReaderBridgeEvent,
  type ReaderDocument,
  type TranslationResult,
} from './reader-protocol.generated.js';

export function parseReaderEvent(value: unknown): ReaderBridgeEvent {
  return parseReaderBridgeEventValue(value);
}

export function publicHttpsUrl(rawUrl: string): URL {
  return parseReaderPublicHttpsUrl(rawUrl);
}

function timestamp(milliseconds: number): string {
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const millis = milliseconds % 1_000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

export function bilingualText(
  document: ReaderDocument,
  translations: Map<string, string>,
): string {
  return document.segments
    .map((segment) => {
      const time =
        segment.startMs === undefined
          ? ''
          : `[${timestamp(segment.startMs).replace(',', '.')} ]\n`;
      return `${time}${segment.text}\n${translations.get(segment.id) ?? ''}`.trim();
    })
    .join('\n\n');
}

export function bilingualSrt(
  document: ReaderDocument,
  translations: Map<string, string>,
): string {
  if (document.sourceKind === 'article') throw new Error('SRT is only available for video.');
  return document.segments
    .map((segment, index) => {
      if (segment.startMs === undefined || segment.endMs === undefined) {
        throw new Error('Video cue timing is incomplete.');
      }
      return `${index + 1}\n${timestamp(segment.startMs)} --> ${timestamp(segment.endMs)}\n${segment.text}\n${translations.get(segment.id) ?? ''}`;
    })
    .join('\n\n');
}

export function mergeTranslations(
  document: ReaderDocument,
  current: Map<string, string>,
  batch: TranslationResult[],
): Map<string, string> {
  const expected = new Set(document.segments.map(({ id }) => id));
  const next = new Map(current);
  for (const result of batch) {
    if (expected.has(result.id) && result.text.trim()) next.set(result.id, result.text.trim());
  }
  return next;
}
