// Generated from protocol/dualcue-reader-v1.schema.json. Do not edit by hand.
export const DUALCUE_READER_PROTOCOL_VERSION = 1;
export const DUALCUE_READER_PORT_NAME = 'dualcue-reader-v1';
export const DUALCUE_READER_ORIGIN = 'https://craighsieh.github.io';
export const READER_TARGET_LANGUAGES = ['zh-Hant', 'zh-Hans', 'ja', 'ko'];
export const READER_SOURCE_KINDS = ['article', 'youtube', 'bilibili'];
export const READER_IMPORT_STATUSES = ['opening-source', 'waiting-authorization', 'extracting'];
export const READER_ERROR_CODES = ['invalid-request', 'unsupported-url', 'authorization-required', 'no-readable-content', 'captions-unavailable', 'connection-lost', 'translation-failed'];
export const READER_MAX_SEGMENTS = 3000;
export const READER_MAX_SEGMENT_CHARACTERS = 4000;
export const READER_MAX_DOCUMENT_CHARACTERS = 500000;
export const READER_MAX_TRANSLATION_CHARACTERS = 12000;
function readerRecord(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(label + ' is invalid.');
    }
    return value;
}
function readerOpaqueId(value, label) {
    if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
        throw new Error(label + ' is invalid.');
    }
    return value;
}
function readerBoundedText(value, label, maximum) {
    const result = typeof value === 'string' ? value.trim() : '';
    if (!result || result.length > maximum || result.includes('\0')) {
        throw new Error(label + ' is invalid.');
    }
    return result;
}
function readerBoundedInteger(value, label, minimum, maximum) {
    if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) {
        throw new Error(label + ' is invalid.');
    }
    return Number(value);
}
function readerPrivateIpv4(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part)))
        return false;
    const octets = parts.map(Number);
    if (octets.some((part) => part < 0 || part > 255))
        return true;
    const first = octets[0] ?? 0;
    const second = octets[1] ?? 0;
    return (first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        (first === 198 && (second === 18 || second === 19)) ||
        first >= 224);
}
function readerPrivateIpv6(hostname) {
    const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (!normalized.includes(':'))
        return false;
    return (normalized === '::' ||
        normalized === '::1' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        /^fe[89ab]/.test(normalized) ||
        normalized.startsWith('::ffff:127.') ||
        normalized.startsWith('::ffff:10.') ||
        normalized.startsWith('::ffff:192.168.'));
}
export function parseReaderPublicHttpsUrl(rawUrl) {
    if (typeof rawUrl !== 'string' || rawUrl.length > 2_048) {
        throw new Error('URL is invalid.');
    }
    let url;
    try {
        url = new URL(rawUrl);
    }
    catch {
        throw new Error('URL is invalid.');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
        throw new Error('Only public HTTPS URLs without credentials are accepted.');
    }
    const hostname = url.hostname.toLowerCase();
    if (!hostname ||
        hostname === 'localhost' ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.local') ||
        readerPrivateIpv4(hostname) ||
        readerPrivateIpv6(hostname)) {
        throw new Error('Private-network URLs are not accepted.');
    }
    return url;
}
export function classifyReaderSourceUrl(rawUrl) {
    const hostname = parseReaderPublicHttpsUrl(rawUrl).hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname)) {
        return 'youtube';
    }
    if (['bilibili.com', 'www.bilibili.com', 'm.bilibili.com'].includes(hostname)) {
        return 'bilibili';
    }
    const unsupportedHosts = [
        'netflix.com',
        'disneyplus.com',
        'vimeo.com',
        'primevideo.com',
        'hulu.com',
        'max.com',
    ];
    if (unsupportedHosts.some((host) => hostname === host || hostname.endsWith('.' + host))) {
        return 'unsupported-video';
    }
    return 'article';
}
export function parseReaderBridgeRequestValue(value) {
    const request = readerRecord(value, 'request');
    if (request.protocolVersion !== DUALCUE_READER_PROTOCOL_VERSION) {
        throw new Error('Unsupported protocol version.');
    }
    const requestId = readerOpaqueId(request.requestId, 'requestId');
    if (request.type === 'hello') {
        return { protocolVersion: DUALCUE_READER_PROTOCOL_VERSION, type: 'hello', requestId };
    }
    if (request.type === 'import-url') {
        if (!READER_TARGET_LANGUAGES.includes(request.targetLanguage)) {
            throw new Error('Target language is invalid.');
        }
        return {
            protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
            type: 'import-url',
            requestId,
            url: parseReaderPublicHttpsUrl(String(request.url ?? '')).href,
            targetLanguage: request.targetLanguage,
        };
    }
    if (request.type === 'resume-job') {
        if (!READER_TARGET_LANGUAGES.includes(request.targetLanguage)) {
            throw new Error('Target language is invalid.');
        }
        return {
            protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
            type: 'resume-job',
            requestId,
            jobId: readerOpaqueId(request.jobId, 'jobId'),
            targetLanguage: request.targetLanguage,
        };
    }
    if (request.type === 'start-local-translation' ||
        request.type === 'prepare-byok' ||
        request.type === 'cancel') {
        return {
            protocolVersion: DUALCUE_READER_PROTOCOL_VERSION,
            type: request.type,
            requestId,
            jobId: readerOpaqueId(request.jobId, 'jobId'),
        };
    }
    throw new Error('Request type is invalid.');
}
export function validateReaderDocumentValue(value) {
    const document = readerRecord(value, 'document');
    if (!READER_SOURCE_KINDS.includes(document.sourceKind)) {
        throw new Error('Document source is invalid.');
    }
    const sourceUrl = parseReaderPublicHttpsUrl(String(document.url ?? '')).href;
    const expectedKind = classifyReaderSourceUrl(sourceUrl);
    if (expectedKind === 'unsupported-video' || expectedKind !== document.sourceKind) {
        throw new Error('Document source does not match its URL.');
    }
    const title = readerBoundedText(document.title, 'document.title', 500);
    if (document.sourceLanguage !== 'en')
        throw new Error('Document metadata is invalid.');
    if (!Array.isArray(document.segments) ||
        document.segments.length < 1 ||
        document.segments.length > READER_MAX_SEGMENTS) {
        throw new Error('Document segment count is invalid.');
    }
    const ids = new Set();
    let characterCount = 0;
    const segments = document.segments.map((value) => {
        const segment = readerRecord(value, 'segment');
        const id = readerOpaqueId(segment.id, 'segment.id');
        if (ids.has(id))
            throw new Error('Segment IDs must be unique.');
        ids.add(id);
        const text = readerBoundedText(segment.text, 'segment.text', READER_MAX_SEGMENT_CHARACTERS);
        characterCount += text.length;
        if (characterCount > READER_MAX_DOCUMENT_CHARACTERS)
            throw new Error('Document is too large.');
        if (document.sourceKind === 'article')
            return { id, text };
        const startMs = readerBoundedInteger(segment.startMs, 'segment.startMs', 0, Number.MAX_SAFE_INTEGER);
        const endMs = readerBoundedInteger(segment.endMs, 'segment.endMs', 1, Number.MAX_SAFE_INTEGER);
        if (endMs <= startMs)
            throw new Error('Cue timing is invalid.');
        return { id, text, startMs, endMs };
    });
    return {
        sourceKind: document.sourceKind,
        url: sourceUrl,
        title,
        sourceLanguage: 'en',
        segments,
    };
}
export function validateReaderTranslationResults(document, value) {
    if (!Array.isArray(value) || value.length !== document.segments.length) {
        throw new Error('Translation result count is invalid.');
    }
    const expectedIds = new Set(document.segments.map((segment) => segment.id));
    const receivedIds = new Set();
    const translations = value.map((item) => {
        const result = readerRecord(item, 'translation');
        const id = readerOpaqueId(result.id, 'translation.id');
        if (!expectedIds.has(id) || receivedIds.has(id)) {
            throw new Error('Translation result ID is invalid.');
        }
        receivedIds.add(id);
        return {
            id,
            text: readerBoundedText(result.text, 'translation.text', READER_MAX_TRANSLATION_CHARACTERS),
        };
    });
    return translations;
}
export function parseReaderBridgeEventValue(value) {
    const event = readerRecord(value, 'bridge event');
    if (event.protocolVersion !== DUALCUE_READER_PROTOCOL_VERSION) {
        throw new Error('Incompatible bridge event.');
    }
    readerOpaqueId(event.requestId, 'requestId');
    if (event.type === 'hello-ack') {
        readerBoundedText(event.extensionVersion, 'extensionVersion', 50);
        const capabilities = readerRecord(event.capabilities, 'capabilities');
        if (typeof capabilities.localTranslator !== 'boolean' ||
            typeof capabilities.byokConfigured !== 'boolean' ||
            (capabilities.provider !== undefined && typeof capabilities.provider !== 'string') ||
            (capabilities.model !== undefined && typeof capabilities.model !== 'string')) {
            throw new Error('Capabilities are invalid.');
        }
        return value;
    }
    readerOpaqueId(event.jobId, 'jobId');
    if (event.type === 'import-status') {
        if (!READER_IMPORT_STATUSES.includes(event.status)) {
            throw new Error('Import status is invalid.');
        }
    }
    else if (event.type === 'document-ready') {
        validateReaderDocumentValue(event.document);
    }
    else if (event.type === 'byok-confirmation-required') {
        readerBoundedText(event.provider, 'provider', 100);
        readerBoundedText(event.model, 'model', 200);
        if (!READER_TARGET_LANGUAGES.includes(event.targetLanguage)) {
            throw new Error('Target language is invalid.');
        }
        readerBoundedInteger(event.segmentCount, 'segmentCount', 1, READER_MAX_SEGMENTS);
        readerBoundedInteger(event.characterCount, 'characterCount', 1, READER_MAX_DOCUMENT_CHARACTERS);
    }
    else if (event.type === 'batch-results') {
        const total = readerBoundedInteger(event.total, 'total', 1, READER_MAX_SEGMENTS);
        readerBoundedInteger(event.completed, 'completed', 0, total);
        if (!Array.isArray(event.translations) || event.translations.length < 1 || event.translations.length > total) {
            throw new Error('Translations are invalid.');
        }
        const ids = new Set();
        for (const item of event.translations) {
            const result = readerRecord(item, 'translation');
            const id = readerOpaqueId(result.id, 'translation.id');
            if (ids.has(id))
                throw new Error('Translation IDs must be unique.');
            ids.add(id);
            readerBoundedText(result.text, 'translation.text', READER_MAX_TRANSLATION_CHARACTERS);
        }
    }
    else if (event.type === 'complete') {
        // The envelope validation above is sufficient.
    }
    else if (event.type === 'error') {
        if (!READER_ERROR_CODES.includes(event.code)) {
            throw new Error('Error code is invalid.');
        }
        readerBoundedText(event.message, 'error.message', 2_000);
        if (typeof event.recoverable !== 'boolean')
            throw new Error('Error recovery flag is invalid.');
    }
    else {
        throw new Error('Bridge event type is invalid.');
    }
    return value;
}
