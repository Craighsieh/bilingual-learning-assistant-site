import { applyLocale } from './i18n.js';
import { examCopy, isExamSlug } from './exam-copy.js';
const faq = {
    'zh-TW': {
        title: '常見問題', intro: '公開閱讀器、原頁翻譯、字幕、語言包與資料處理的快速說明。',
        items: [
            ['官網閱讀器怎麼取得其他網站的內容？', '官網前端不會直接跨來源抓取正文。相容的桌面 Chrome 擴充功能會開啟來源頁；請在來源頁點一次 DualCue。一般文章藉此取得 activeTab，YouTube／Bilibili 則重用頁面字幕 Adapter，並確保本機翻譯環境已開啟。'],
            ['為什麼顯示找不到相容擴充功能？', '官網閱讀器需要支援 DualCueReaderBridgeV1 的 Chrome 版本。相容商店版本公開前，正式入口不會把舊版誤認為可用。Firefox 首版只能開啟原頁並使用 Sidebar。'],
            ['收藏功能去哪裡了？', '收藏已完整移除。升級會刪除舊 learning-items IndexedDB store，這項刪除不可復原；翻譯快取、設定、術語表和 API Key 不受影響。單句編輯、重譯、恢復與整份匯出仍保留。'],
            ['Chrome 語言包何時下載？', '首次同意以及切換繁中、簡中、日文或韓文目標時，DualCue 會在有效的使用者操作中準備 English → 目標語言包並顯示進度。Chrome 若移除模型，介面才會再次要求下載。'],
            ['官網可以看到我的 API Key 嗎？', '不可以。官網只能要求使用 BYOK。擴充功能自己的確認畫面會顯示 Provider、模型、目標、段落量、字數與可能費用；再次確認後才使用擴充功能本機保存的金鑰。'],
            ['支援哪些網址？', '首版支援公開 HTTPS 一般文章、YouTube 與 Bilibili。Netflix、Disney+、Vimeo 等影音平台請在原頁使用 DualCue。拒絕帳密 URL、localhost、私有網路與瀏覽器內部頁。'],
            ['沒有字幕的影片會怎樣？', '若沒有人工／ASR／AI 文字字幕、字幕需要登入，或只有畫面燒錄字幕，閱讀器會顯示具體原因。音訊轉錄仍必須在原影片頁明確啟動，不會由官網自動開始。'],
            ['閱讀器會保存網址或翻譯歷史嗎？', '不會。網址、正文、字幕與譯文只存在目前分頁記憶體；重新整理或關閉即清除。沒有帳號、分析 SDK 或雲端歷史。'],
            ['可以匯出什麼？', '文章可複製、下載雙語 TXT、列印或另存 PDF；影片另可下載雙語 SRT。譯文未完整時匯出控制會保持停用。'],
        ],
    },
    'zh-CN': {
        title: '常见问题', intro: '公开阅读器、原页翻译、字幕、语言包与数据处理的快速说明。',
        items: [
            ['官网阅读器如何获得其他网站内容？', '官网前端不会直接跨来源抓取正文。兼容的桌面 Chrome 扩展会打开来源页；请在来源页点击一次 DualCue。普通文章借此获得 activeTab，YouTube／哔哩哔哩会复用页面字幕 Adapter，并确保本机翻译环境已打开。'],
            ['为什么显示找不到兼容扩展？', '官网阅读器需要支持 DualCueReaderBridgeV1 的 Chrome 版本。兼容商店版本公开前，正式入口不会把旧版误认为可用。Firefox 首版只能打开原页并使用 Sidebar。'],
            ['收藏功能去哪里了？', '收藏已完整移除。升级会删除旧 learning-items IndexedDB store，且无法恢复；翻译缓存、设置、术语表和 API Key 不受影响。单句编辑、重译、恢复与整份导出仍保留。'],
            ['Chrome 语言包何时下载？', '首次同意以及切换繁中、简中、日文或韩文目标时，DualCue 会在有效用户操作中准备 English → 目标语言包并显示进度。Chrome 若移除模型，界面才会再次要求下载。'],
            ['官网可以看到我的 API Key 吗？', '不可以。官网只能请求使用 BYOK。扩展自己的确认界面会显示 Provider、模型、目标、段落量、字数和可能费用；再次确认后才使用扩展本机保存的密钥。'],
            ['支持哪些网址？', '首版支持公开 HTTPS 普通文章、YouTube 和哔哩哔哩。Netflix、Disney+、Vimeo 等视频平台请在原页使用 DualCue。拒绝账号密码 URL、localhost、私有网络和浏览器内部页。'],
            ['没有字幕的视频会怎样？', '若没有人工／ASR／AI 文字字幕、字幕需要登录或只有画面烧录字幕，阅读器会显示具体原因。音频转录仍必须在原视频页明确启动。'],
            ['阅读器会保存网址或翻译历史吗？', '不会。网址、正文、字幕和译文只存在当前标签页内存；刷新或关闭即清除。没有账号、分析 SDK 或云端历史。'],
            ['可以导出什么？', '文章可复制、下载双语 TXT、打印或另存 PDF；视频还可下载双语 SRT。译文未完整时导出按钮保持禁用。'],
        ],
    },
    ja: {
        title: 'よくある質問', intro: '公開リーダー、元ページ翻訳、字幕、言語パック、データ処理について。',
        items: [
            ['公式リーダーは他サイトの内容をどう取得しますか？', '公式サイトは別オリジンの本文を直接取得しません。対応するデスクトップ Chrome 拡張機能が元ページを開くので、DualCue を一度押します。記事は activeTab を取得し、YouTube／Bilibili は字幕 Adapter を再利用すると同時にローカル翻訳環境を開きます。'],
            ['対応する拡張機能が見つからないのはなぜですか？', 'DualCueReaderBridgeV1 対応版が必要です。対応ストア版の公開前は旧版を利用可能と表示しません。Firefox 初版は元ページと Sidebar のみです。'],
            ['保存（お気に入り）機能はどこへ行きましたか？', '保存機能は完全に削除しました。更新時に旧 learning-items IndexedDB store を削除し、復元できません。翻訳キャッシュ、設定、用語集、API Key は保持します。文の編集、再翻訳、復元、全文書き出しは残ります。'],
            ['Chrome 言語パックはいつダウンロードされますか？', '初回同意時と繁体字中国語、簡体字中国語、日本語、韓国語への切替時に、ユーザー操作の中で English → 対象パックを準備し進捗を表示します。Chrome がモデルを削除した場合のみ再取得を求めます。'],
            ['公式サイトは API Key を見られますか？', '見られません。サイトは BYOK を依頼するだけです。拡張機能の確認画面で Provider、モデル、対象言語、件数、文字数、料金の可能性を表示し、再確認後にローカル保存キーを使います。'],
            ['どの URL に対応しますか？', '公開 HTTPS 記事、YouTube、Bilibili に対応します。Netflix、Disney+、Vimeo などは元ページで DualCue を使います。認証情報付き URL、localhost、プライベートネットワーク、ブラウザ内部ページは拒否します。'],
            ['字幕がない動画はどうなりますか？', '人手／ASR／AI の文字字幕がない、ログインが必要、焼き付け字幕だけの場合は理由を表示します。音声文字起こしは元動画ページで明示的に開始する必要があります。'],
            ['URL や翻訳履歴は保存されますか？', '保存しません。URL、本文、字幕、訳文は現在タブのメモリだけにあり、再読み込みや終了で消えます。アカウント、分析 SDK、クラウド履歴はありません。'],
            ['何を書き出せますか？', '記事はコピー、対訳 TXT、印刷／PDF。動画は対訳 SRT も利用できます。訳文が未完成の間は書き出しを無効にします。'],
        ],
    },
    ko: {
        title: '자주 묻는 질문', intro: '공개 리더, 원본 페이지 번역, 자막, 언어 팩 및 데이터 처리 안내입니다.',
        items: [
            ['공식 리더는 다른 사이트 콘텐츠를 어떻게 가져오나요?', '공식 사이트는 교차 출처 본문을 직접 가져오지 않습니다. 호환되는 데스크톱 Chrome 확장 프로그램이 원본 페이지를 열면 DualCue를 한 번 누릅니다. 기사는 activeTab을 얻고 YouTube／Bilibili는 자막 Adapter를 재사용하면서 로컬 번역 환경을 엽니다.'],
            ['호환 확장 프로그램을 찾지 못하는 이유는 무엇인가요?', 'DualCueReaderBridgeV1을 지원하는 Chrome 버전이 필요합니다. 호환 스토어 버전 공개 전에는 이전 버전을 사용 가능으로 표시하지 않습니다. Firefox 첫 버전은 원본 페이지와 Sidebar만 지원합니다.'],
            ['저장(즐겨찾기) 기능은 어디로 갔나요?', '저장 기능을 완전히 제거했습니다. 업데이트 시 기존 learning-items IndexedDB store를 삭제하며 복구할 수 없습니다. 번역 캐시, 설정, 용어집, API Key는 유지됩니다. 문장 편집, 재번역, 복원, 전체 내보내기는 남습니다.'],
            ['Chrome 언어 팩은 언제 다운로드되나요?', '첫 동의 및 번체 중국어, 간체 중국어, 일본어, 한국어 대상 전환 시 사용자 작업 안에서 English → 대상 언어 팩을 준비하고 진행률을 표시합니다. Chrome이 모델을 제거한 경우에만 다시 다운로드합니다.'],
            ['공식 사이트가 API Key를 볼 수 있나요?', '볼 수 없습니다. 사이트는 BYOK 사용을 요청할 뿐입니다. 확장 프로그램 확인 화면에서 Provider, 모델, 대상, 단락 수, 글자 수와 비용 가능성을 표시하고 재확인 후 로컬 키를 사용합니다.'],
            ['어떤 URL을 지원하나요?', '공개 HTTPS 기사, YouTube, Bilibili를 지원합니다. Netflix, Disney+, Vimeo 등은 원본 페이지에서 DualCue를 사용하세요. 자격 증명 URL, localhost, 사설망, 브라우저 내부 페이지는 거부합니다.'],
            ['자막 없는 동영상은 어떻게 되나요?', '수동／ASR／AI 텍스트 자막이 없거나 로그인이 필요하거나 화면에 구워진 자막만 있으면 이유를 표시합니다. 오디오 전사는 원본 동영상 페이지에서 명시적으로 시작해야 합니다.'],
            ['URL이나 번역 기록을 저장하나요?', '저장하지 않습니다. URL, 본문, 자막, 번역은 현재 탭 메모리에만 있고 새로고침하거나 닫으면 삭제됩니다. 계정, 분석 SDK, 클라우드 기록이 없습니다.'],
            ['무엇을 내보낼 수 있나요?', '기사는 복사, 이중 언어 TXT, 인쇄／PDF를 지원하고 동영상은 이중 언어 SRT도 지원합니다. 번역이 완전하지 않으면 내보내기가 비활성화됩니다.'],
        ],
    },
};
const privacy = {
    'zh-TW': {
        title: '隱私政策', intro: '更新日期：2026-08-28。DualCue 採本機優先、資料最小化與使用者主動操作；不建立帳號、廣告或分析追蹤。',
        sections: [
            ['官網閱讀器', '官網透過版本化長連線向已安裝的 Chrome 擴充功能提出要求。擴充功能只傳送來源網址、標題、純文字英文段落或字幕時間碼；不傳原始 HTML、Cookie、帳號資訊或 API Key。'],
            ['當次記憶體', '官網閱讀器的網址、正文、字幕與譯文只存在目前分頁記憶體，重新整理或關閉即清除。不寫入 localStorage、IndexedDB、雲端歷史或分析 SDK。'],
            ['擴充功能本機資料', '擴充功能保存設定、網站閱讀偏好、按目標語言分區的術語表、翻譯快取及使用者提供的 API Key。API Key 僅限受信任的擴充功能環境。收藏功能已移除；升級會不可復原地刪除舊 learning-items store，其他資料不受影響。'],
            ['內容擷取與權限', '匯入後必須在來源頁由使用者點一次 DualCue；一般文章藉此取得 activeTab，YouTube／Bilibili 則重用固定 Adapter。密碼、表單、付款、可編輯、隱藏與程式碼區域會被排除。'],
            ['本機翻譯', 'Chrome Translator 在裝置上處理 English → 繁中、簡中、日文或韓文。首次同意或切換目標語言時，Chrome 可能要求透過有效使用者操作下載語言包；DualCue 不會因失敗而自動改用付費 BYOK。'],
            ['BYOK', '官網看不到金鑰。官網只能要求翻譯，擴充功能會另顯示 Provider、模型、目標語言、段落量、字數與可能費用；使用者再次確認後，才將純文字直接傳到所選 Provider。'],
            ['影片與音訊', 'YouTube／Bilibili 只匯入頁面可讀的文字字幕，不使用非官方伺服器抓取、不繞過登入或付費限制。音訊轉錄只在原影片頁明確啟動，並可能使用使用者的 OpenAI 帳戶。Netflix／Disney+ 只處理播放時可見字幕。'],
            ['我們不做的事', '不出售資料、不用內容訓練模型、不人工閱覽內容、不把金鑰寫入原始碼或日誌、不在沒有明確操作時呼叫付費 API。'],
            ['聯絡', '問題可由 FAQ／支援頁或開發者 GitHub 聯絡。'],
        ],
    },
    'zh-CN': {
        title: '隐私政策', intro: '更新日期：2026-08-28。DualCue 采用本机优先、数据最小化和用户主动操作；不建立账号、广告或分析追踪。',
        sections: [
            ['官网阅读器', '官网通过版本化长连接向已安装的 Chrome 扩展提出请求。扩展只发送来源网址、标题、纯文本英文段落或字幕时间码；不发送原始 HTML、Cookie、账号信息或 API Key。'],
            ['当次内存', '官网阅读器的网址、正文、字幕和译文只存在当前标签页内存，刷新或关闭即清除。不写入 localStorage、IndexedDB、云端历史或分析 SDK。'],
            ['扩展本机数据', '扩展保存设置、网站阅读偏好、按目标语言分区的术语表、翻译缓存和用户提供的 API Key。API Key 仅限可信扩展环境。收藏已移除；升级会不可恢复地删除旧 learning-items store，其他数据不受影响。'],
            ['内容获取与权限', '导入后必须由用户在来源页点击一次 DualCue；普通文章借此获取 activeTab，YouTube／哔哩哔哩则复用固定 Adapter。密码、表单、付款、可编辑、隐藏和代码区域会被排除。'],
            ['本机翻译', 'Chrome Translator 在设备上处理 English → 繁中、简中、日文或韩文。首次同意或切换目标时，Chrome 可能要求通过有效用户操作下载语言包；DualCue 不会因失败自动改用付费 BYOK。'],
            ['BYOK', '官网看不到密钥。官网只能请求翻译，扩展会另行显示 Provider、模型、目标语言、段落量、字数和可能费用；用户再次确认后才把纯文本直接发送到所选 Provider。'],
            ['视频与音频', 'YouTube／哔哩哔哩只导入页面可读的文字字幕，不使用非官方服务器抓取，不绕过登录或付费限制。音频转录只在原视频页明确启动，并可能使用用户的 OpenAI 账户。Netflix／Disney+ 只处理播放时可见字幕。'],
            ['我们不做的事', '不出售数据、不用内容训练模型、不人工查看内容、不把密钥写入源码或日志、不在没有明确操作时调用付费 API。'],
            ['联系', '问题可通过 FAQ／支持页或开发者 GitHub 联系。'],
        ],
    },
    ja: {
        title: 'プライバシーポリシー', intro: '更新日：2026-08-28。DualCue はローカル優先、データ最小化、明示的なユーザー操作を原則とし、アカウント、広告、分析追跡を持ちません。',
        sections: [
            ['公式リーダー', '公式サイトはバージョン付き長期接続でインストール済み Chrome 拡張機能へ依頼します。送るのは元 URL、タイトル、プレーンテキストの英語段落または字幕時刻だけで、HTML、Cookie、アカウント情報、API Key は送りません。'],
            ['今回のタブメモリ', 'URL、本文、字幕、訳文は現在タブのメモリだけにあり、再読み込みや終了で消えます。localStorage、IndexedDB、クラウド履歴、分析 SDK へ保存しません。'],
            ['拡張機能のローカルデータ', '設定、サイト別表示設定、対象言語別用語集、翻訳キャッシュ、ユーザー提供 API Key を保存します。キーは信頼された拡張機能環境に限定します。保存機能は削除され、更新時に旧 learning-items store を復元不能で削除します。他のデータは保持します。'],
            ['取得と権限', '読み込み後、元ページで DualCue を一度押します。記事は activeTab を取得し、YouTube／Bilibili は固定 Adapter を再利用します。パスワード、フォーム、決済、編集可能、非表示、コード領域を除外します。'],
            ['ローカル翻訳', 'Chrome Translator が端末上で English → 繁体字／簡体字中国語、日本語、韓国語を処理します。初回同意や対象切替でユーザー操作による言語パック取得が必要な場合があります。失敗しても有料 BYOK へ自動切替しません。'],
            ['BYOK', '公式サイトはキーを取得しません。拡張機能が Provider、モデル、対象、件数、文字数、料金の可能性を表示し、再確認後だけプレーンテキストを選択 Provider へ直接送ります。'],
            ['動画と音声', 'YouTube／Bilibili はページで読める文字字幕だけを取り込み、非公式サーバー、ログイン・有料制限の回避を使いません。音声文字起こしは元動画ページで明示的に開始し、ユーザーの OpenAI アカウントを使う場合があります。Netflix／Disney+ は再生中に見える字幕だけを処理します。'],
            ['行わないこと', 'データ販売、学習への利用、人工閲覧、キーのソースコード／ログ保存、明示操作なしの有料 API 呼び出しを行いません。'],
            ['連絡', 'FAQ／サポートページまたは開発者 GitHub から連絡できます。'],
        ],
    },
    ko: {
        title: '개인정보 처리방침', intro: '업데이트: 2026-08-28. DualCue는 로컬 우선, 데이터 최소화, 명시적 사용자 작업을 원칙으로 하며 계정, 광고, 분석 추적이 없습니다.',
        sections: [
            ['공식 리더', '공식 사이트는 버전이 있는 장기 연결로 설치된 Chrome 확장 프로그램에 요청합니다. 확장 프로그램은 원본 URL, 제목, 일반 텍스트 영어 단락 또는 자막 시간만 보내며 HTML, Cookie, 계정 정보, API Key는 보내지 않습니다.'],
            ['현재 탭 메모리', 'URL, 본문, 자막, 번역은 현재 탭 메모리에만 있고 새로고침하거나 닫으면 삭제됩니다. localStorage, IndexedDB, 클라우드 기록, 분석 SDK에 저장하지 않습니다.'],
            ['확장 프로그램 로컬 데이터', '설정, 사이트별 읽기 설정, 대상 언어별 용어집, 번역 캐시, 사용자 제공 API Key를 저장합니다. 키는 신뢰할 수 있는 확장 환경에 한정합니다. 저장 기능은 제거되며 업데이트 시 기존 learning-items store를 복구 불가능하게 삭제합니다. 다른 데이터는 유지됩니다.'],
            ['콘텐츠 및 권한', '가져온 뒤 원본 페이지에서 DualCue를 한 번 누릅니다. 기사는 activeTab을 얻고 YouTube／Bilibili는 고정 Adapter를 재사용합니다. 비밀번호, 양식, 결제, 편집 가능, 숨김, 코드 영역은 제외합니다.'],
            ['로컬 번역', 'Chrome Translator가 기기에서 English → 번체／간체 중국어, 일본어, 한국어를 처리합니다. 첫 동의나 대상 변경 시 사용자 작업으로 언어 팩을 받아야 할 수 있습니다. 실패해도 유료 BYOK로 자동 전환하지 않습니다.'],
            ['BYOK', '공식 사이트는 키를 볼 수 없습니다. 확장 프로그램이 Provider, 모델, 대상, 단락 수, 글자 수와 비용 가능성을 표시하고 다시 확인한 후에만 일반 텍스트를 선택한 Provider로 직접 보냅니다.'],
            ['동영상과 오디오', 'YouTube／Bilibili는 페이지에서 읽을 수 있는 텍스트 자막만 가져오며 비공식 서버, 로그인 또는 유료 제한 우회를 사용하지 않습니다. 오디오 전사는 원본 동영상 페이지에서 명시적으로 시작하며 사용자의 OpenAI 계정을 사용할 수 있습니다. Netflix／Disney+는 재생 중 보이는 자막만 처리합니다.'],
            ['하지 않는 일', '데이터 판매, 모델 학습 사용, 사람의 콘텐츠 열람, 키의 소스 코드／로그 저장, 명시적 작업 없는 유료 API 호출을 하지 않습니다.'],
            ['연락', 'FAQ／지원 페이지 또는 개발자 GitHub를 통해 연락할 수 있습니다.'],
        ],
    },
};
function render(locale) {
    applyLocale(locale);
    const page = document.body.dataset.page;
    const root = document.getElementById('page-content');
    if (!root)
        return;
    root.replaceChildren();
    if (page === 'faq') {
        const copy = faq[locale];
        const title = document.createElement('h1');
        title.textContent = copy.title;
        const intro = document.createElement('p');
        intro.textContent = copy.intro;
        const list = document.createElement('div');
        list.className = 'faq';
        copy.items.forEach(([question, answer], index) => {
            const details = document.createElement('details');
            details.open = index === 0;
            const summary = document.createElement('summary');
            summary.textContent = question;
            const paragraph = document.createElement('p');
            paragraph.textContent = answer;
            details.append(summary, paragraph);
            list.append(details);
        });
        root.append(title, intro, list);
    }
    else if (page === 'privacy') {
        const copy = privacy[locale];
        const title = document.createElement('h1');
        title.textContent = copy.title;
        const intro = document.createElement('p');
        intro.textContent = copy.intro;
        root.append(title, intro);
        for (const [heading, body] of copy.sections) {
            const h2 = document.createElement('h2');
            h2.textContent = heading;
            const paragraph = document.createElement('p');
            paragraph.textContent = body;
            root.append(h2, paragraph);
        }
    }
    else if (isExamSlug(page)) {
        const copy = examCopy[locale][page];
        const title = document.createElement('h1');
        title.textContent = copy.title;
        const intro = document.createElement('p');
        intro.className = 'exam-intro';
        intro.textContent = copy.intro;
        root.append(title, intro);
        for (const [heading, body] of copy.sections) {
            const section = document.createElement('section');
            section.className = 'exam-study-section';
            const h2 = document.createElement('h2');
            h2.textContent = heading;
            const paragraph = document.createElement('p');
            paragraph.textContent = body;
            section.append(h2, paragraph);
            root.append(section);
        }
        const disclaimer = document.createElement('p');
        disclaimer.className = 'exam-disclaimer';
        disclaimer.textContent = copy.disclaimer;
        const cta = document.createElement('a');
        cta.className = 'button primary exam-cta';
        cta.href = '../index.html#reader';
        cta.textContent = copy.cta;
        root.append(disclaimer, cta);
    }
}
const selector = document.getElementById('ui-locale');
if (selector) {
    render(selector.value);
    selector.addEventListener('change', () => render(selector.value));
}
