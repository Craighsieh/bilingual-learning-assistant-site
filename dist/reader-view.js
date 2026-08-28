import { applyLocale, uiText } from './i18n.js';
function element(id) {
    const result = document.getElementById(id);
    if (!result)
        throw new Error(`Missing #${id}`);
    return result;
}
function timeLabel(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
export class ReaderView {
    form = element('reader-form');
    urlInput = element('source-url');
    targetSelect = element('target-language');
    localeSelect = element('ui-locale');
    localButton = element('translate-local');
    byokButton = element('translate-byok');
    cancelButton = element('cancel-job');
    copyButton = element('copy-reader');
    txtButton = element('download-txt');
    srtButton = element('download-srt');
    printButton = element('print-reader');
    status = element('reader-status');
    extensionCard = element('extension-card');
    documentPanel = element('reader-document');
    documentTitle = element('document-title');
    documentKind = element('document-kind');
    documentSource = element('document-source');
    output = element('reader-output');
    progress = element('reader-progress');
    locale = 'zh-TW';
    activeStatus = {
        key: 'status.connecting',
    };
    initialize() {
        this.setExportEnabled(false, false);
        this.byokButton.hidden = true;
        applyLocale(this.locale);
        this.localeSelect.addEventListener('change', () => {
            this.locale = this.localeSelect.value;
            applyLocale(this.locale);
            this.setStatus(this.activeStatus.key, this.activeStatus.values);
        });
    }
    setStatus(key, values) {
        this.activeStatus = { key, values };
        this.status.textContent = uiText(this.locale, key, values);
    }
    showExtensionRequired() {
        this.extensionCard.hidden = false;
        this.setStatus(/Firefox/i.test(navigator.userAgent) ? 'reader.desktopOnly' : 'status.missing');
    }
    showExtensionConnected(byokConfigured) {
        this.extensionCard.hidden = true;
        this.byokButton.hidden = !byokConfigured;
    }
    resetForImport() {
        this.documentPanel.hidden = true;
        this.targetSelect.disabled = true;
    }
    showDocument(documentValue, targetLanguage, translations) {
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
    renderSegments(documentValue, targetLanguage, translations) {
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
    setProgress(completed) {
        this.progress.value = completed;
    }
    finish(documentValue, translatedCount) {
        this.progress.value = documentValue.segments.length;
        this.setExportEnabled(translatedCount === documentValue.segments.length, documentValue.sourceKind !== 'article');
        this.targetSelect.disabled = false;
    }
    unlockTarget() {
        this.targetSelect.disabled = false;
    }
    setExportEnabled(enabled, timed) {
        this.copyButton.disabled = !enabled;
        this.txtButton.disabled = !enabled;
        this.printButton.disabled = !enabled;
        this.srtButton.disabled = !enabled || !timed;
    }
}
