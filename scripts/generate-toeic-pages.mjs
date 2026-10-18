import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import qrcode from 'qrcode-generator';

const origin = 'https://craighsieh.github.io/bilingual-learning-assistant-site/';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function appDownload(config) {
  if (config.status === 'preparing') return null;
  if (config.status !== 'available' || config.verified !== true || typeof config.downloadUrl !== 'string') throw new Error('App 下載連結必須先經確認');
  const url = new URL(config.downloadUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash || !(
    (url.hostname === 'apps.apple.com' && /\/id\d+\/?$/.test(url.pathname)) ||
    (url.hostname === 'testflight.apple.com' && /^\/j\/[A-Za-z0-9]+\/?$/.test(url.pathname))
  )) throw new Error('只接受已確認的 App Store 或公開 TestFlight HTTPS 連結');
  return url.href;
}

function page({ title, description, route, content, script = false, hero = '' }) {
  const base = route === 'toeic/' ? '../' : '../../';
  const root = route === 'toeic/' ? './' : '../';
  const kind = route.includes('feedback') ? 'feedback' : route.includes('practice') ? 'practice' : 'catalog';
  const scriptFile = script === 'feedback' ? 'toeic-feedback.js' : 'toeic.js';
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}｜DualCue</title>
<meta name="description" content="${escape(description)}"><link rel="canonical" href="${origin}${route}"><link rel="icon" type="image/png" href="${base}assets/toeic-prepstation-icon.png"><link rel="stylesheet" href="${base}styles.css"><link rel="stylesheet" href="${base}toeic.css"></head>
<body class="toeic-page" data-toeic-page="${kind}" data-toeic-root="${root}"><a class="toeic-skip" href="#toeic-root">跳至主要內容</a>
<header class="toeic-header"><nav class="toeic-shell" aria-label="專區導覽"><a class="toeic-brand" href="${base}index.html"><img src="${base}assets/icon.svg" alt=""><strong>DualCue</strong><span>免費 TOEIC 練習</span></a><div class="toeic-nav"><a href="${root}">免費題庫</a><a href="${root}app/">認識 App</a><a href="${root}feedback/">題目回饋</a><a href="${root}privacy/">隱私說明</a></div></nav></header>
${hero}<main id="toeic-root" class="toeic-shell toeic-main">${content}</main>
<footer class="toeic-footer"><div class="toeic-shell"><span>© 2026 DualCue · 自主學習，照自己的步調。</span><p>原創 TOEIC 題型練習，非官方試題、評分或成績保證，與 TOEIC 主辦機構無隸屬或合作關係。</p><a href="${root}privacy/">本機進度與隱私</a><a href="${root}feedback/">題目回饋</a></div></footer>
${script ? `<script type="module" src="${base}dist/${scriptFile}"></script>` : ''}</body></html>\n`;
}

export async function generateToeicPages(site = process.cwd()) {
  const config = JSON.parse(await readFile(path.join(site, 'config/toeic-app.json'), 'utf8'));
  const download = appDownload(config);
  const catalog = JSON.parse(await readFile(path.join(site, 'assets/toeic/catalog.json'), 'utf8'));
  for (const dir of ['toeic', 'toeic/practice', 'toeic/app', 'toeic/privacy', 'toeic/feedback']) await mkdir(path.join(site, dir), { recursive: true });
  const hero = `<section class="toeic-hero"><div class="toeic-shell"><div class="toeic-app-identity"><img src="../assets/toeic-prepstation-icon.png" width="64" height="64" alt="Toeic 多益考前站 App 圖示"><span>TOEIC PrepStation<br><strong>Toeic 多益考前站</strong></span></div><p class="eyebrow">A LITTLE PRACTICE. A CLEARER PATH.</p><h1>練習，從這一刻開始。</h1><p class="toeic-lead">一套完整練習＋兩套模考，<strong>免費 600 題</strong>。<br>聽力、閱讀，每題附繁中解題說明。<br>照自己的步調練，逐步掌握答題方法。</p><div class="toeic-trust"><span>免註冊</span><span>不需安裝擴充功能</span><span>繁中解題說明與聽力逐字稿</span></div><a class="study-button primary" href="practice/?form=prac01">從練習 1 開始</a><a class="study-button" href="app/">認識 Toeic 多益考前站</a><div class="hero-stats"><span><strong>1</strong>完整練習</span><span><strong>2</strong>免費模考</span><span><strong>7</strong>題型 Part</span></div></div></section>`;
  const fallback = `<p class="study-note">進度只保存在此瀏覽器，不與 App 同步。作答需要啟用 JavaScript。</p><div class="form-grid">${catalog.forms.map((form) => `<article class="form-card"><h2>${escape(form.title)}</h2><p>${escape(form.description)}</p><p>200 題 · 聽力 100 ＋ 閱讀 100</p><p>每題附繁中解題說明 · 聽力含逐字稿</p><a class="study-button primary" href="practice/?form=${form.id}">開始練習</a></article>`).join('')}</div>`;
  await writeFile(path.join(site, 'toeic/index.html'), page({ route: 'toeic/', title: '免費 TOEIC 練習與模考 600 題', description: '免註冊免費作答：一套完整練習與兩套模考，共600題，含繁中解析、聽力逐字稿與本機續答。', hero, content: fallback, script: true }));
  await writeFile(path.join(site, 'toeic/practice/index.html'), page({ route: 'toeic/practice/', title: 'TOEIC 自由練習', description: '按自己的步調練習 TOEIC 聽力與閱讀，自動保存本機進度，交卷後查看解析。', content: '<h1>準備你的練習…</h1><p role="status">正在載入套卷。作答需要啟用 JavaScript。</p>', script: true }));
  const downloadBlock = download
    ? `<div class="app-download"><a class="study-button primary" href="${escape(download)}" rel="noopener noreferrer">${download.includes('testflight.apple.com') ? '前往 TestFlight 公開測試' : '前往 App Store 下載'}</a><div class="download-qr"><img src="download-qr.svg" width="184" height="184" alt="掃描以開啟相同的 App 下載連結"><p>用 iPhone 掃描開啟下載頁</p></div></div>`
    : '<p class="app-launch-status" role="status">準備上架 · 正式下載連結將在確認後開放</p>';
  const appContent = `<article class="app-intro"><img class="app-main-icon" src="../../assets/toeic-prepstation-icon.png" width="104" height="104" alt="Toeic 多益考前站 App 圖示"><p class="eyebrow">MEET YOUR NEXT STUDY COMPANION</p><h1>Toeic 多益考前站</h1><p class="app-english">TOEIC PrepStation</p><p class="toeic-lead">把今天的練習，變成你的備考日常。</p><p>先在這裡免費體驗完整題型，每題附繁中解題說明，聽力含逐字稿。App 提供兩套完整練習、全部 10 套模考，讓你在 iPhone 上持續練習。</p>${downloadBlock}<div class="app-facts"><section><strong>網站：三套免費</strong><p>練習 1、模考 1～2，共 600 題，直接在瀏覽器作答。</p></section><section><strong>App：完整十套模考</strong><p>包含網站的兩套模考，再加模考 3～10；兩套完整練習免費，模考依 App 方案解鎖。</p></section><section><strong>各自保留學習進度</strong><p>網站只保存在此瀏覽器，答案與紀錄不會自動帶入 App。</p></section></div><a class="study-button primary" href="../">繼續免費練習</a><p class="study-note">iPhone App；價格、開放地區與可用方案以正式商店及 App 顯示為準。</p></article>`;
  await writeFile(path.join(site, 'toeic/app/index.html'), page({ route: 'toeic/app/', title: 'Toeic 多益考前站 · TOEIC PrepStation', description: '認識 Toeic 多益考前站，兩套完整練習、完整十套模考。先在 DualCue 免費體驗一套練習與兩套模考，共 600 題。', content: appContent }));
  const qrPath = path.join(site, 'toeic/app/download-qr.svg');
  if (download) { const qr = qrcode(0, 'M'); qr.addData(download); qr.make(); await writeFile(qrPath, qr.createSvgTag({ cellSize: 5, margin: 20, scalable: true })); }
  else await rm(qrPath, { force: true });
  const feedback = `<article class="toeic-prose"><p class="eyebrow">HELP US MAKE PRACTICE CLEARER</p><h1>一起讓題目更清楚</h1><p class="toeic-lead">答案有疑問、解析看不懂，或覺得題目表達不夠好？歡迎告訴我們。</p><p>你可以回報答案、解題說明、聽力與逐字稿、圖片或圖表，也可以分享哪裡讓你感到不清楚。</p><aside id="feedback-privacy" class="feedback-notice"><strong>不需要註冊，直接在這裡送出。</strong><p>回饋會透過 FormSubmit 傳給網站管理者，不會公開張貼。只需描述問題，不必提供姓名、email 或電話，也不需要附上作答紀錄。</p><p>送出時會傳送你填寫的內容、套卷、題號、類別、內容版本與回饋編號；服務會接收一般連線資訊（例如 IP 位址），並保留回饋最多 30 天。詳見<a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit 隱私政策</a>。</p></aside><form id="feedback-form" class="feedback-form" data-content-version="${escape(catalog.contentVersion)}" aria-describedby="feedback-privacy"><div class="feedback-fields"><label for="feedback-form-id">套卷<select id="feedback-form-id" required><option value="">選擇套卷</option>${catalog.forms.map((form) => `<option value="${escape(form.id)}">${escape(form.title)}</option>`).join('')}</select></label><label for="feedback-question">題號（選填）<input id="feedback-question" type="number" min="1" max="200" step="1" inputmode="numeric" aria-describedby="feedback-question-help"><span id="feedback-question-help" class="study-note">填 1～200；整份套卷的建議可留白。</span></label></div><label for="feedback-category">問題類別<select id="feedback-category" required><option value="">選擇問題類別</option><option value="answer">答案有疑問</option><option value="explanation">解題說明不清楚</option><option value="audio">聽力或逐字稿</option><option value="image">圖片或圖表</option><option value="wording">題目表達或品質</option><option value="other">其他問題</option></select></label><label for="feedback-description">問題說明<textarea id="feedback-description" rows="6" required maxlength="1000" aria-describedby="feedback-description-help"></textarea><span id="feedback-description-help" class="study-note">請描述哪裡有疑問、預期看到什麼，最多 1,000 字。請勿填寫個人資料。</span></label><input id="feedback-website" class="feedback-honey" type="text" name="_honey" autocomplete="off" tabindex="-1" aria-hidden="true"><p id="feedback-error" class="study-error" role="alert" tabindex="-1" hidden></p><p id="feedback-status" class="feedback-status" role="status" aria-live="polite" aria-atomic="true"></p><button class="study-button primary" type="submit" disabled>送出回饋</button><button id="feedback-another" class="study-button" type="button" hidden>再寫一則回饋</button><p class="study-note">按下送出才會傳送回饋，不會自動附上答案。填寫內容只保留在目前頁面，重新整理或關閉頁面會清除。</p></form><noscript><p>送出回饋需要啟用 JavaScript。啟用後即可在本頁填寫，不需要帳號。</p></noscript><a class="study-button" href="../">繼續免費練習</a></article>`;
  await writeFile(path.join(site, 'toeic/feedback/index.html'), page({ route: 'toeic/feedback/', title: 'TOEIC 題目回饋', description: '回報 TOEIC 題目、答案、解析、聽力與圖片的問題，協助我們讓免費練習更清楚。', content: feedback, script: 'feedback' }));
  const privacy = `<article class="toeic-prose"><p class="eyebrow">YOUR PROGRESS STAYS WITH YOU</p><h1>本機進度與隱私</h1><h2>保存哪些資料</h2><p>本專區使用獨立的 IndexedDB 儲存答案選項、套卷與內容版本、待複習標記、題目位置、已交卷結果和練習用時，方便在同一瀏覽器續答。</p><h2>不會傳送作答紀錄</h2><p>答案與進度不會上傳，也不蒐集 email、建立帳戶或使用第三方分析追蹤。載入網頁、題庫與音訊仍會向網站託管服務提出一般靜態檔案請求。</p><h2>保存範圍與清除</h2><p>只有同一裝置、同一瀏覽器及相同網站來源可以續答；無痕模式或清除網站資料可能移除進度。可回題庫首頁選擇「清除本機 TOEIC 進度」，只清除本專區的資料，不影響閱讀器或 App。</p><h2>儲存受限與版本更新</h2><p>無法使用 IndexedDB 時會明示「本次進度無法保存」，資料只留在目前分頁。新版題目不套用舊版答案；同一份作答由一個分頁編輯，已交卷結果固定，重練會建立新紀錄。公開套卷範圍調整時，未開放套卷的舊進度仍留在本機，但不再顯示續答入口。</p><h2>題目回饋</h2><p>回饋不需要帳號，也不會公開張貼。只有按下「送出回饋」，才會把你填寫的問題說明、套卷、展示題號、問題類別、內容版本、回饋編號及本表單的公開網址傳給第三方 FormSubmit，再轉寄給網站管理者。表單不讀取作答資料庫，不自動附上答案、作答紀錄或目前網址的查詢參數；也不要求姓名、email 或電話，請勿填寫個人資料。</p><p>FormSubmit 會接收一般連線資訊（例如 IP 位址），依其服務說明保留回饋最多 30 天；管理者收到的郵件會用於檢查與改善教材。適用<a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit 隱私政策</a>。本頁不另存回饋草稿，重新整理或關閉頁面會清除填寫內容；未能確認送出時不會自動重試，手動重試可能產生重複回報。</p><h2>與其他產品的關係</h2><p>本專區的本機進度與 DualCue 閱讀器分頁內容分開處理，不與 Toeic 多益考前站 App 同步。App 及商店頁有各自的資料與隱私說明。</p><a class="study-button primary" href="../">回免費題庫</a></article>`;
  await writeFile(path.join(site, 'toeic/privacy/index.html'), page({ route: 'toeic/privacy/', title: 'TOEIC 練習進度與隱私', description: '免費 TOEIC 練習專區的本機進度保存、清除與隱私說明。', content: privacy }));
  return { pages: 5, downloadStatus: download ? 'available' : 'preparing' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await generateToeicPages()));
