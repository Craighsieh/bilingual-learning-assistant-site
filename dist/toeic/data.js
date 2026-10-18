import { isPublicFormId, PUBLIC_FORM_IDS } from './public-forms.js';
function record(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function str(value) { return typeof value === 'string'; }
export class StudyData {
    root;
    request;
    constructor(root, request = (input, init) => globalThis.fetch(input, init)) {
        this.root = root;
        this.request = request;
    }
    asset(relative) {
        if (!/^media\/(audio|images)\/[a-f0-9]{64}\.(mp3|png)$/.test(relative))
            throw new Error('媒體位置無效。');
        return new URL(relative, this.root).href;
    }
    async json(relative) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await this.request(new URL(relative, this.root), { signal: controller.signal, cache: 'no-cache', credentials: 'omit' });
            if (!response.ok)
                throw new Error('題庫暫時無法載入，請檢查網路後重試。');
            return await response.json();
        }
        catch (error) {
            if (error.name === 'AbortError')
                throw new Error('載入逾時，已保留目前作答，請重試。');
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async catalog() {
        const value = await this.json('catalog.json');
        if (!record(value) || value.schemaVersion !== 1 || !str(value.contentVersion) || value.totalQuestions !== 600 || !Array.isArray(value.forms) || value.forms.length !== PUBLIC_FORM_IDS.length)
            throw new Error('題庫目錄格式不符，請重新整理後再試。');
        const seen = new Set();
        for (const entry of value.forms) {
            if (!record(entry) || !str(entry.id) || !isPublicFormId(entry.id) || seen.has(entry.id) || !str(entry.title) || !str(entry.description) || entry.role !== (entry.id.startsWith('prac') ? 'practice' : 'mock') || entry.total !== 200 || !Array.isArray(entry.parts) || entry.parts.length !== 7)
                throw new Error('套卷目錄不完整。');
            seen.add(entry.id);
        }
        return value;
    }
    async form(id, version) {
        if (!isPublicFormId(id))
            throw new Error('這份套卷目前未開放，請回免費題庫選擇其他套卷。');
        const value = await this.json(`forms/${id}.json`);
        if (!record(value) || value.schemaVersion !== 1 || value.id !== id || value.contentVersion !== version || !str(value.title) || !['practice', 'mock'].includes(String(value.role)) || !Array.isArray(value.questions) || value.questions.length !== 200)
            throw new Error('題庫版本已更新，請回題庫首頁重新開始。');
        for (const q of value.questions) {
            if (!record(q) || !str(q.id) || !str(q.text) || !str(q.groupId) || !Number.isInteger(q.number) || !Number.isInteger(q.part) || !Array.isArray(q.choices) || !Array.isArray(q.documents))
                throw new Error('題目內容不完整。');
            for (const c of q.choices)
                if (!record(c) || !str(c.key) || !str(c.text))
                    throw new Error('選項格式不符。');
            for (const kind of ['audio', 'image'])
                if (q[kind] !== null)
                    this.asset(String(q[kind]));
        }
        if (new Set(value.questions.map((q) => q.id)).size !== 200)
            throw new Error('題目 ID 重複。');
        return value;
    }
    async review(form) {
        if (!isPublicFormId(form.id))
            throw new Error('這份套卷目前未開放，請回免費題庫選擇其他套卷。');
        const value = await this.json(`review/${form.id}.json`);
        if (!record(value) || value.schemaVersion !== 1 || value.formId !== form.id || value.contentVersion !== form.contentVersion || !record(value.answers))
            throw new Error('解析版本不符，請重試或返回題庫首頁。');
        for (const question of form.questions) {
            const answer = value.answers[question.id];
            if (!record(answer) || !str(answer.answer) || !str(answer.explanation) || !str(answer.transcript) || !str(answer.skill) || !question.choices.some((choice) => choice.key === answer.answer))
                throw new Error('解析不完整，已保留作答，請重試。');
        }
        return value;
    }
}
