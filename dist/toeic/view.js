import { canReview, scoreAttempt, skillLabel } from './session.js';
export function element(tag, className = '', text = '') {
    const node = document.createElement(tag);
    node.className = className;
    if (text)
        node.textContent = text;
    return node;
}
export function action(text, click, className = 'study-button') {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', click);
    return node;
}
export function link(text, href, className = 'study-button') {
    const node = element('a', className, text);
    node.href = href;
    return node;
}
export function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${Math.floor(seconds / 60)} 分 ${String(seconds % 60).padStart(2, '0')} 秒`;
}
export function renderMaterial(question, asset) {
    const root = element('div', 'study-material');
    if (question.image) {
        const image = element('img');
        image.src = asset(question.image);
        image.alt = `第 ${question.number} 題的題目圖片，點擊可放大`;
        image.className = 'question-image';
        const zoom = action('放大圖片', () => dialog.showModal(), 'image-zoom');
        zoom.replaceChildren(image, element('span', '', '放大圖片'));
        const dialog = element('dialog', 'image-dialog');
        const full = element('img');
        full.src = image.src;
        full.alt = `第 ${question.number} 題圖片放大檢視`;
        const close = action('關閉放大圖片', () => dialog.close());
        dialog.append(close, full);
        dialog.addEventListener('click', (event) => { if (event.target === dialog)
            dialog.close(); });
        root.append(zoom, dialog);
    }
    if (question.passage)
        root.append(element('p', 'passage-text', question.passage));
    for (const doc of question.documents) {
        const article = element('article', 'reading-document');
        if (doc.title)
            article.append(element('h3', '', doc.title));
        article.append(element('p', 'passage-text', doc.text));
        root.append(article);
    }
    if (question.graphic?.rows.length) {
        const figure = element('figure', 'question-graphic');
        figure.append(element('figcaption', '', question.graphic.title || '題組圖表'));
        const scroll = element('div', 'table-scroll');
        scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region');
        scroll.setAttribute('aria-label', '可左右捲動的題組圖表');
        const table = element('table');
        const columns = [...new Set(question.graphic.rows.flatMap((row) => Object.keys(row)))];
        const head = element('thead');
        const header = element('tr');
        columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; header.append(th); });
        head.append(header);
        const body = element('tbody');
        for (const row of question.graphic.rows) {
            const tr = element('tr');
            columns.forEach((column) => tr.append(element('td', '', String(row[column] ?? ''))));
            body.append(tr);
        }
        table.append(head, body);
        scroll.append(table);
        figure.append(scroll);
        root.append(figure);
    }
    if (!root.childElementCount)
        root.append(element('p', 'material-hint', question.part <= 4 ? '先聆聽音訊，再選擇最合適的答案。可自由重播。' : '閱讀右側題目，選擇最合適的答案。'));
    return root;
}
export function renderQuestionGroup(questions, attempt, review, readonly, actions) {
    const root = element('div', 'question-group');
    for (const q of questions) {
        const visible = canReview(attempt, q);
        // Part 2 is a listening response task; written prompts/options belong to review.
        const listeningOnly = q.part === 2 && !visible;
        const key = visible ? review?.answers[q.id] : undefined;
        const card = element('section', 'question-card');
        card.id = `question-${q.number}`;
        const top = element('div', 'question-heading');
        top.append(element('span', 'question-number', `第 ${q.number} 題`));
        if (attempt.status === 'draft') {
            const flagged = attempt.flags.includes(q.id);
            const flag = action(flagged ? '已標記待複習' : '標記待複習', () => actions.flag(q.id), 'flag-button');
            flag.setAttribute('aria-pressed', String(flagged));
            flag.disabled = readonly;
            flag.id = `flag-${q.number}`;
            top.append(flag);
        }
        if (actions.feedbackHref) {
            const report = link('回報這一題', actions.feedbackHref(q), 'study-button question-feedback');
            report.setAttribute('aria-label', `回報第 ${q.number} 題`);
            report.target = '_blank';
            report.rel = 'noopener noreferrer';
            top.append(report);
        }
        const fieldset = element('fieldset');
        fieldset.disabled = readonly || visible;
        const legend = element('legend', 'question-prompt', listeningOnly ? '請聆聽題目與選項，選擇最合適的回應。' : q.text || '請選擇最合適的答案。');
        fieldset.append(legend);
        for (const choice of q.choices) {
            const label = element('label', 'answer-choice');
            const input = element('input');
            input.type = 'radio';
            input.name = `answer-${q.id}`;
            input.value = choice.key;
            input.id = `answer-${q.number}-${choice.key}`;
            input.checked = attempt.answers[q.id] === choice.key;
            input.addEventListener('change', () => actions.answer(q.id, choice.key));
            const badge = element('span', 'choice-key', choice.key);
            const copy = element('span', 'choice-copy', choice.text);
            label.append(input, badge);
            if (!listeningOnly)
                label.append(copy);
            if (key && key.answer === choice.key) {
                label.classList.add('correct-choice');
                label.append(element('span', 'choice-outcome', '正解'));
            }
            if (key && input.checked && key.answer !== choice.key) {
                label.classList.add('wrong-choice');
                label.append(element('span', 'choice-outcome', '你的選擇'));
            }
            fieldset.append(label);
        }
        card.append(top, fieldset);
        if (key) {
            const explanation = element('div', 'answer-review');
            explanation.append(element('h3', '', `正解 ${key.answer} · ${attempt.answers[q.id] ? attempt.answers[q.id] === key.answer ? '答對' : '待加強' : '未作答'}`), element('p', 'passage-text', key.explanation));
            explanation.append(element('p', 'learning-focus', `學習重點：${skillLabel(key.skill)}`));
            card.append(explanation);
        }
        root.append(card);
    }
    const first = questions[0];
    if (first && attempt.role === 'practice' && attempt.status === 'draft' && !canReview(attempt, first)) {
        const confirm = action(questions.length > 1 ? '確認本題組，查看解析' : '確認答案，查看解析', () => actions.confirm(first.groupId), 'study-button primary');
        confirm.disabled = readonly;
        root.append(confirm, element('p', 'study-note', '確認後固定原作答，方便檢視第一次的理解。'));
    }
    if (first && canReview(attempt, first) && review?.answers[first.id]?.transcript) {
        const transcript = element('details', 'transcript');
        const summary = element('summary', '', '查看聽力逐字稿');
        transcript.append(summary, element('p', 'passage-text', review.answers[first.id].transcript));
        root.append(transcript);
    }
    return root;
}
export function renderResult(attempt, review, appHref) {
    const score = scoreAttempt(attempt, review);
    const root = element('section', 'result-panel');
    root.append(element('p', 'eyebrow', 'YOUR PRACTICE, YOUR PACE'), element('h2', '', '每一次練習，都更靠近目標。'));
    const metrics = element('div', 'result-metrics');
    for (const [label, value] of [['答對', `${score.correct} / ${score.total}`], ['已答', `${score.answered} 題`], ['未答', `${score.unanswered} 題`], ['練習用時', formatTime(attempt.elapsedMs)]]) {
        const metric = element('div');
        metric.append(element('strong', '', value), element('span', '', label));
        metrics.append(metric);
    }
    root.append(metrics, element('p', 'study-note', '未答題列入總題數。這是本次練習結果，並非官方成績或 TOEIC 分數預測。'));
    const parts = element('div', 'part-results');
    score.parts.forEach((part) => parts.append(element('span', '', `Part ${part.part}：${part.correct} / ${part.total}　未答 ${part.unanswered}`)));
    root.append(parts);
    const cta = element('div', 'result-app');
    const appIcon = element('img', 'result-app-icon');
    appIcon.src = new URL('../../assets/toeic-prepstation-icon.png', appHref).href;
    appIcon.alt = 'Toeic 多益考前站 App 圖示';
    appIcon.width = 52;
    appIcon.height = 52;
    cta.append(appIcon, element('p', '', '想繼續練完整題庫？認識 Toeic 多益考前站，App 提供全部 10 套模考。'), link('認識 TOEIC PrepStation', appHref, 'study-button'));
    root.append(cta);
    return root;
}
