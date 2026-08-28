import { createReaderBridgeClient } from './reader-bridge-client.js';
import { DUALCUE_READER_PROTOCOL_VERSION, } from './reader-protocol.generated.js';
import { bilingualSrt, bilingualText, mergeTranslations, parseReaderEvent, publicHttpsUrl, } from './reader-core.js';
import { downloadReaderFile } from './reader-export.js';
import { ReaderView } from './reader-view.js';
const EXTENSION_ID = 'fknpamogppkmlmjpmaomoalbpekjpboc';
const MINIMUM_READER_VERSION = [0, 5, 8];
const READER_ERROR_STATUS_KEYS = {
    'invalid-request': 'error.invalid-request',
    'unsupported-url': 'error.unsupported-url',
    'authorization-required': 'error.authorization-required',
    'no-readable-content': 'error.no-readable-content',
    'captions-unavailable': 'error.captions-unavailable',
    'connection-lost': 'error.connection-lost',
    'translation-failed': 'error.translation-failed',
};
function versionAtLeast(version) {
    const parts = version.split('.').map((part) => Number.parseInt(part, 10) || 0);
    for (let index = 0; index < MINIMUM_READER_VERSION.length; index += 1) {
        const current = parts[index] ?? 0;
        const required = MINIMUM_READER_VERSION[index] ?? 0;
        if (current > required)
            return true;
        if (current < required)
            return false;
    }
    return true;
}
function initializeReader() {
    const view = new ReaderView();
    let bridge;
    let compatible = false;
    let currentRequestId = '';
    let currentJobId = '';
    let readerJobPending = false;
    let readerDocument = null;
    let readerTargetLanguage = 'zh-Hant';
    let translations = new Map();
    let byokConfigured = false;
    const guardedAction = (action, failureStatus = 'error.connection-lost') => {
        void Promise.resolve()
            .then(action)
            .catch(() => view.setStatus(failureStatus));
    };
    const post = (request) => {
        if (!compatible || !bridge.isConnected()) {
            throw new Error('A compatible DualCue extension is not connected.');
        }
        bridge.post(request);
    };
    const handleEvent = (rawEvent) => {
        let event;
        try {
            event = parseReaderEvent(rawEvent);
        }
        catch {
            return;
        }
        if (event.type === 'hello-ack') {
            compatible = versionAtLeast(event.extensionVersion);
            byokConfigured = event.capabilities.byokConfigured;
            if (!compatible) {
                view.showExtensionRequired();
                return;
            }
            view.showExtensionConnected(byokConfigured);
            view.setStatus('status.ready');
            if (readerJobPending && currentJobId && currentRequestId) {
                guardedAction(() => post({
                    protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
                    type: 'resume-job',
                    requestId: currentRequestId,
                    jobId: currentJobId,
                    targetLanguage: readerTargetLanguage,
                }));
            }
            return;
        }
        if (event.requestId !== currentRequestId && event.requestId !== 'invalid-request')
            return;
        if ('jobId' in event && event.jobId)
            currentJobId = event.jobId;
        if (event.type === 'import-status') {
            view.setStatus(event.status === 'opening-source'
                ? 'status.opening'
                : event.status === 'waiting-authorization'
                    ? 'status.authorization'
                    : 'status.extracting');
            return;
        }
        if (event.type === 'document-ready') {
            readerDocument = event.document;
            translations = new Map();
            view.showDocument(readerDocument, readerTargetLanguage, translations);
            view.setStatus('status.document');
            return;
        }
        if (event.type === 'byok-confirmation-required') {
            view.setStatus('status.byok');
            return;
        }
        if (event.type === 'batch-results' && readerDocument) {
            translations = mergeTranslations(readerDocument, translations, event.translations);
            view.setProgress(event.completed);
            view.renderSegments(readerDocument, readerTargetLanguage, translations);
            view.setStatus('status.translating', { completed: event.completed, total: event.total });
            return;
        }
        if (event.type === 'complete' && readerDocument) {
            view.finish(readerDocument, translations.size);
            readerJobPending = false;
            view.setStatus('status.complete');
            return;
        }
        if (event.type === 'error') {
            view.unlockTarget();
            if (!event.recoverable || event.code === 'connection-lost')
                readerJobPending = false;
            view.setStatus(READER_ERROR_STATUS_KEYS[event.code]);
        }
    };
    bridge = createReaderBridgeClient({
        extensionId: EXTENSION_ID,
        onEvent: handleEvent,
        onConnectionChange: (connected) => {
            if (!connected)
                compatible = false;
            if (!connected || !compatible)
                view.showExtensionRequired();
        },
    });
    view.form.addEventListener('submit', (event) => {
        event.preventDefault();
        let sourceUrl;
        try {
            sourceUrl = publicHttpsUrl(view.urlInput.value.trim());
        }
        catch {
            view.setStatus('error.invalidUrl');
            return;
        }
        if (!compatible) {
            view.showExtensionRequired();
            if (/Firefox/i.test(navigator.userAgent))
                window.open(sourceUrl.href, '_blank', 'noopener');
            return;
        }
        currentRequestId = crypto.randomUUID();
        currentJobId = '';
        readerJobPending = true;
        readerDocument = null;
        readerTargetLanguage = view.targetSelect.value;
        translations = new Map();
        view.resetForImport();
        view.setStatus('status.opening');
        guardedAction(() => post({
            protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
            type: 'import-url',
            requestId: currentRequestId,
            url: sourceUrl.href,
            targetLanguage: readerTargetLanguage,
        }));
    });
    view.localButton.addEventListener('click', () => {
        if (!currentJobId)
            return;
        guardedAction(() => {
            view.setStatus('status.translating', {
                completed: 0,
                total: readerDocument?.segments.length ?? 0,
            });
            post({
                protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
                type: 'start-local-translation',
                requestId: currentRequestId,
                jobId: currentJobId,
            });
        });
    });
    view.byokButton.addEventListener('click', () => {
        if (!currentJobId || !byokConfigured)
            return;
        guardedAction(() => post({
            protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
            type: 'prepare-byok',
            requestId: currentRequestId,
            jobId: currentJobId,
        }));
    });
    view.cancelButton.addEventListener('click', () => {
        guardedAction(() => {
            if (currentJobId && compatible) {
                post({
                    protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
                    type: 'cancel',
                    requestId: currentRequestId,
                    jobId: currentJobId,
                });
            }
            view.unlockTarget();
            readerJobPending = false;
            view.setStatus('status.cancelled');
        });
    });
    view.copyButton.addEventListener('click', () => {
        if (!readerDocument)
            return;
        guardedAction(async () => {
            await navigator.clipboard.writeText(bilingualText(readerDocument, translations));
            view.setStatus('status.copied');
        }, 'error.clipboard');
    });
    view.txtButton.addEventListener('click', () => {
        if (readerDocument) {
            downloadReaderFile(readerDocument, bilingualText(readerDocument, translations), 'txt');
        }
    });
    view.srtButton.addEventListener('click', () => {
        if (readerDocument) {
            downloadReaderFile(readerDocument, bilingualSrt(readerDocument, translations), 'srt');
        }
    });
    view.printButton.addEventListener('click', () => window.print());
    view.initialize();
    bridge.connect();
}
if (document.getElementById('reader-form'))
    initializeReader();
export { versionAtLeast };
