import { StudyData } from './toeic/data.js';
import { PracticePage } from './toeic/practice.js';
import { openStudyStore } from './toeic/store.js';
import { action, element, link } from './toeic/view.js';
const root = document.getElementById('toeic-root');
const pageRoot = new URL(document.body.dataset.toeicRoot ?? './', location.href);
const data = new StudyData(new URL('../assets/toeic/', pageRoot));
function attemptLink(attempt) {
    const url = new URL('practice/', pageRoot);
    url.searchParams.set('form', attempt.formId);
    url.searchParams.set('attempt', attempt.id);
    return url.href;
}
async function catalogPage(target) {
    const [catalog, store] = await Promise.all([data.catalog(), openStudyStore()]);
    const all = await store.list();
    const offered = new Set(catalog.forms.map((form) => form.id));
    const attempts = all.filter((a) => a.contentVersion === catalog.contentVersion && offered.has(a.formId));
    const old = all.some((a) => a.contentVersion !== catalog.contentVersion);
    const intro = element('div', 'catalog-intro');
    if (!store.persistent)
        intro.append(element('p', 'storage-warning', '本次進度無法保存：目前使用分頁記憶體，重新整理或關閉後會清除。'));
    if (old)
        intro.append(element('p', 'storage-warning', '題庫內容已更新，舊版進度不會套用至新版題目。可從下方開始新版練習。'));
    if (all.some((a) => a.contentVersion === catalog.contentVersion && !offered.has(a.formId)))
        intro.append(element('p', 'study-note', '免費題庫目前開放練習 1、模考 1 和 2。其他套卷的本機進度仍保留，但暫不提供續答。'));
    const latest = attempts.find((a) => a.status === 'draft');
    if (latest) {
        const entry = catalog.forms.find((form) => form.id === latest.formId);
        const card = element('section', 'resume-card');
        card.append(element('div', '', `繼續上次練習 · ${entry?.title ?? ''}${latest.scopePart ? ` · Part ${latest.scopePart}` : ''} · 已答 ${Object.keys(latest.answers).length} / ${latest.questionIds.length}`), link('繼續作答', attemptLink(latest), 'study-button primary'));
        intro.append(card);
    }
    target.replaceChildren(intro);
    for (const role of ['practice', 'mock']) {
        const section = element('section', 'catalog-section');
        section.append(element('h2', '', role === 'practice' ? '一套完整練習，先建立手感。' : '兩套完整模考，照自己的步調練。'));
        const grid = element('div', 'form-grid');
        for (const form of catalog.forms.filter((f) => f.role === role)) {
            const formAttempts = attempts.filter((a) => a.formId === form.id);
            const active = formAttempts.find((a) => a.status === 'draft');
            const answered = new Map();
            formAttempts.forEach((a) => Object.keys(a.answers).forEach((id) => { const part = a.partById[id]; if (part)
                answered.set(id, part); }));
            const card = element('article', 'form-card');
            card.append(element('p', 'form-type', role === 'practice' ? 'GUIDED PRACTICE' : 'FULL MOCK · FREE PRACTICE'), element('h3', '', form.title), element('p', '', form.description));
            card.append(element('p', 'form-count', `200 題 · 聽力 100 ＋ 閱讀 100`), element('p', 'explanation-reminder', '每題附繁中解題說明 · 聽力含逐字稿'));
            const parts = element('div', 'part-progress');
            form.parts.forEach((p) => parts.append(element('span', '', `P${p.part}　${[...answered.values()].filter((part) => part === p.part).length}/${p.total}`)));
            const select = element('select');
            select.id = `scope-${form.id}`;
            select.setAttribute('aria-label', `${form.title}練習範圍`);
            const whole = element('option', '', '完整卷 · 200 題');
            whole.value = '';
            select.append(whole);
            form.parts.forEach((p) => { const option = element('option', '', `Part ${p.part} · ${p.total} 題`); option.value = String(p.part); select.append(option); });
            const start = link('開始新練習', new URL(`practice/?form=${form.id}`, pageRoot).href, 'study-button primary');
            select.addEventListener('change', () => { const url = new URL(`practice/?form=${form.id}`, pageRoot); if (select.value)
                url.searchParams.set('part', select.value); start.href = url.href; });
            card.append(parts, select, start);
            if (active)
                card.append(link('繼續這份進度', attemptLink(active), 'study-button'));
            const submitted = formAttempts.find((a) => a.status === 'submitted');
            if (submitted)
                card.append(link('查看上次結果', attemptLink(submitted), 'study-button quiet'));
            grid.append(card);
        }
        section.append(grid);
        target.append(section);
    }
    const privacy = element('section', 'local-data');
    const clearDialog = element('dialog', 'submit-dialog');
    const clear = action('清除本機 TOEIC 進度', () => {
        clearDialog.replaceChildren(element('h2', '', '清除這個瀏覽器的 TOEIC 進度？'), element('p', '', '會清除本專區的答案、結果與標記；不影響 DualCue 閱讀器或 App 資料。'), action('保留進度', () => clearDialog.close()), action('確認清除', () => {
            void store.clear().then(() => location.reload()).catch(() => { clearDialog.replaceChildren(element('p', '', '無法清除，請關閉其他 TOEIC 分頁後再試。'), action('關閉', () => clearDialog.close())); });
        }));
        clearDialog.showModal();
    }, 'study-button quiet');
    privacy.append(element('p', '', '進度只保存在目前瀏覽器，不會傳送至伺服器，也不與 App 同步。'), link('進度與隱私說明', new URL('privacy/', pageRoot).href, 'text-link'), clear, clearDialog);
    target.append(privacy);
}
async function boot() {
    if (!root)
        return;
    let page;
    try {
        if (document.body.dataset.toeicPage === 'practice') {
            const store = await openStudyStore();
            page = new PracticePage(root, data, store, pageRoot, new URLSearchParams(location.search));
            await page.start();
        }
        else
            await catalogPage(root);
    }
    catch (error) {
        page?.dispose();
        const message = element('p', 'study-error', error.message);
        message.setAttribute('role', 'alert');
        root.replaceChildren(element('h2', '', '暫時無法開啟練習'), message, action('重新載入', () => location.reload()), link('回免費題庫', pageRoot.href));
    }
}
void boot();
