import fs from 'node:fs';
import path from 'node:path';
import { examCopy } from '../dist/exam-copy.js';

const siteOrigin = 'https://craighsieh.github.io/bilingual-learning-assistant-site';
const examNames = { toefl: 'TOEFL', ielts: 'IELTS', toeic: 'TOEIC' };

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderExamPage(slug) {
  const copy = examCopy['zh-TW'][slug];
  const relatedLinks = Object.keys(examNames)
    .filter((relatedSlug) => relatedSlug !== slug)
    .map((relatedSlug) => `<a href="../${relatedSlug}-translation/">${examNames[relatedSlug]}</a>`)
    .join('');
  const sections = copy.sections
    .map(([heading, body]) => `<section class="exam-study-section"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`)
    .join('\n      ');

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="${escapeHtml(copy.intro)}">
    <title>${escapeHtml(copy.title)}｜DualCue</title>
    <link rel="canonical" href="${siteOrigin}/${slug}-translation/">
    <link rel="icon" href="../assets/icon.svg">
    <link rel="stylesheet" href="../styles.css">
  </head>
  <body data-page="${slug}">
    <header><nav class="shell"><a class="brand" href="../index.html"><img src="../assets/icon.svg" alt=""><span>DualCue - AI 雙語字幕與學習講義下載</span></a><a href="../index.html#reader" data-i18n="nav.reader">雙語閱讀器</a><a href="../index.html#exams" data-i18n="nav.exams">考試學習</a><a href="../faq.html" data-i18n="nav.faq">常見問題</a><label class="locale-picker"><span class="sr-only">Language</span><select id="ui-locale" aria-label="Interface language"><option value="zh-TW">繁體中文</option><option value="zh-CN">简体中文</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label></nav></header>
    <main class="page"><article id="page-content">
      <p class="eyebrow">${examNames[slug]} STUDY WITH DUALCUE</p>
      <h1>${escapeHtml(copy.title)}</h1>
      <p class="exam-intro">${escapeHtml(copy.intro)}</p>
      ${sections}
      <p class="exam-disclaimer">${escapeHtml(copy.disclaimer)}</p>
      <a class="button primary exam-cta" href="../index.html#reader">${escapeHtml(copy.cta)}</a>
    </article></main>
    <footer><div class="shell"><span>© 2026 DualCue</span><div>${relatedLinks}<a href="https://chromewebstore.google.com/detail/fknpamogppkmlmjpmaomoalbpekjpboc">Chrome Web Store</a></div></div></footer>
    <script type="module" src="../dist/pages.js"></script>
  </body>
</html>
`;
}

for (const slug of Object.keys(examNames)) {
  const directory = path.resolve(`${slug}-translation`);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), renderExamPage(slug));
}

process.stdout.write('Generated crawlable TOEFL, IELTS and TOEIC landing pages.\n');
