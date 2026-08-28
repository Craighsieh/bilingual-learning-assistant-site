import { applyLocale, uiText, type UiLocale } from './i18n.js';
import type { ReaderDocument, ReaderTargetLanguage } from './reader-protocol.generated.js';

export type ReaderStatusKey = Parameters<typeof uiText>[1];

function element<T extends HTMLElement>(id: string): T {
  const result = document.getElementById(id);
  if (!result) throw new Error(`Missing #${id}`);
  return result as T;
}

function timeLabel(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export class ReaderView {
  readonly form = element<HTMLFormElement>('reader-form');
  readonly urlInput = element<HTMLInputElement>('source-url');
  readonly targetSelect = element<HTMLSelectElement>('target-language');
  readonly localeSelect = element<HTMLSelectElement>('ui-locale');
  readonly localButton = element<HTMLButtonElement>('translate-local');
  readonly byokButton = element<HTMLButtonElement>('translate-byok');
  readonly cancelButton = element<HTMLButtonElement>('cancel-job');
  readonly copyButton = element<HTMLButtonElement>('copy-reader');
  readonly txtButton = element<HTMLButtonElement>('download-txt');
  readonly srtButton = element<HTMLButtonElement>('download-srt');
  readonly printButton = element<HTMLButtonElement>('print-reader');

  private readonly status = element<HTMLElement>('reader-status');
  private readonly extensionCard = element<HTMLElement>('extension-card');
  private readonly documentPanel = element<HTMLElement>('reader-document');
  private readonly documentTitle = element<HTMLElement>('document-title');
  private readonly documentKind = element<HTMLElement>('document-kind');
  private readonly documentSource = element<HTMLAnchorElement>('document-source');
  private readonly output = element<HTMLElement>('reader-output');
  private readonly progress = element<HTMLProgressElement>('reader-progress');
  private locale: UiLocale = 'zh-TW';
  private activeStatus: { key: ReaderStatusKey; values?: Record<string, string | number> } = {
    key: 'status.connecting',
  };

  initialize(): void {
    this.setExportEnabled(false, false);
    this.byokButton.hidden = true;
    applyLocale(this.locale);
    this.localeSelect.addEventListener('change', () => {
      this.locale = this.localeSelect.value as UiLocale;
      applyLocale(this.locale);
      this.setStatus(this.activeStatus.key, this.activeStatus.values);
    });
  }

  setStatus(key: ReaderStatusKey, values?: Record<string, string | number>): void {
    this.activeStatus = { key, values };
    this.status.textContent = uiText(this.locale, key, values);
  }

  showExtensionRequired(): void {
    this.extensionCard.hidden = false;
    this.setStatus(/Firefox/i.test(navigator.userAgent) ? 'reader.desktopOnly' : 'status.missing');
  }

  showExtensionConnected(byokConfigured: boolean): void {
    this.extensionCard.hidden = true;
    this.byokButton.hidden = !byokConfigured;
  }

  resetForImport(): void {
    this.documentPanel.hidden = true;
    this.targetSelect.disabled = true;
  }

  showDocument(
    documentValue: ReaderDocument,
    targetLanguage: ReaderTargetLanguage,
    translations: Map<string, string>,
  ): void {
    this.documentTitle.textContent = documentValue.title;
    this.documentKind.textContent = documentValue.sourceKind.toUpperCase();
    this.documentSource.href = documentValue.url;
    this.documentPanel.hidden = false;
    this.srtButton.hidden = documentValue.sourceKind === 'article';
    this.progress.max = documentValue.segments.length;
    this.progress.value = 0;
    this.setExportEnabled(false, documentValue.sourceKind !== 'article');
    this.renderSegments(documentValue, targetLanguage, translations);
  }

  renderSegments(
    documentValue: ReaderDocument,
    targetLanguage: ReaderTargetLanguage,
    translations: Map<string, string>,
  ): void {
    this.output.replaceChildren();
    for (const segment of documentValue.segments) {
      const row = document.createElement('section');
      row.className = 'reader-segment';
      if (segment.startMs !== undefined) {
        const time = document.createElement('time');
        time.textContent = timeLabel(segment.startMs);
        row.append(time);
      }
      const source = document.createElement('p');
      source.className = 'reader-source-text';
      source.textContent = segment.text;
      const translation = document.createElement('p');
      translation.className = 'reader-translation-text';
      translation.lang = targetLanguage;
      translation.textContent = translations.get(segment.id) ?? '…';
      row.append(source, translation);
      this.output.append(row);
    }
  }

  setProgress(completed: number): void {
    this.progress.value = completed;
  }

  finish(documentValue: ReaderDocument, translatedCount: number): void {
    this.progress.value = documentValue.segments.length;
    this.setExportEnabled(
      translatedCount === documentValue.segments.length,
      documentValue.sourceKind !== 'article',
    );
    this.targetSelect.disabled = false;
  }

  unlockTarget(): void {
    this.targetSelect.disabled = false;
  }

  private setExportEnabled(enabled: boolean, timed: boolean): void {
    this.copyButton.disabled = !enabled;
    this.txtButton.disabled = !enabled;
    this.printButton.disabled = !enabled;
    this.srtButton.disabled = !enabled || !timed;
  }
}
