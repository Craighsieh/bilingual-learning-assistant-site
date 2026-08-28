export type UiLocale = 'zh-TW' | 'zh-CN' | 'ja' | 'ko';

const zhTW = {
  'nav.reader': '雙語閱讀器', 'nav.features': '功能', 'nav.faq': '常見問題', 'nav.privacy': '隱私政策',
  'hero.title': '貼上英文內容網址，直接讀雙語版本',
  'hero.body': '一般文章、YouTube 與 Bilibili 都能交給已安裝的 DualCue 擴充功能擷取；正文與字幕不經過 DualCue 伺服器，也不建立閱讀歷史。',
  'trust.local': '預設本機翻譯', 'trust.noAccount': '無帳號', 'trust.noHistory': '重新整理即清除', 'trust.noKey': '官網看不到 API Key',
  'reader.title': '公開雙語閱讀器', 'reader.body': '輸入公開 HTTPS 網址。來源頁開啟後請點一次 DualCue；文章會擷取可讀正文，YouTube／Bilibili 會重用頁面已提供的英文字幕。',
  'reader.urlLabel': '影片或文章網址', 'reader.import': '匯入內容',
  'reader.supported': '支援一般 HTTPS 文章、YouTube、Bilibili。Netflix、Disney+ 與其他影音平台請在原頁使用 DualCue。',
  'reader.desktopOnly': '第一版閱讀器只支援桌面 Chrome；手機可先開啟原始網址閱讀。',
  'reader.source': '開啟來源', 'reader.local': '使用 Chrome 本機翻譯', 'reader.byok': '使用擴充功能的 BYOK', 'reader.cancel': '停止',
  'reader.copy': '複製雙語內容', 'reader.txt': '下載 TXT', 'reader.print': '列印／PDF',
  'extension.missingTitle': '需要相容的 DualCue Chrome 擴充功能',
  'extension.missingBody': '官網本身不能跨網站讀取正文。安裝擴充功能後，內容擷取與翻譯才會在你的瀏覽器中完成。',
  'extension.install': '前往 Chrome Web Store', 'status.missing': '等待安裝或更新相容的 DualCue Chrome 擴充功能。',
  'status.connecting': '正在連接 DualCue…', 'status.ready': 'DualCue 已連接。貼上網址即可開始。',
  'status.opening': '正在開啟來源頁…', 'status.authorization': '來源頁已開啟。請在該頁點一次工具列的 DualCue，完成後會自動回到閱讀器。',
  'status.extracting': '正在擷取可讀的英文內容…', 'status.document': '內容已就緒。選擇本機翻譯或擴充功能內的 BYOK。',
  'status.translating': '正在翻譯 {completed}/{total}…', 'status.complete': '雙語內容已完成；可以複製、下載或列印。',
  'status.byok': '請回到來源頁點一次 DualCue，並在擴充功能內確認 Provider、模型、內容量與可能費用。',
  'status.copied': '已複製雙語內容。', 'status.cancelled': '已停止這次工作。',
  'error.invalidUrl': '請輸入不含帳號密碼的公開 HTTPS 網址。', 'error.invalid-request': '閱讀器請求格式不正確，請重新整理後再試。',
  'error.unsupported-url': '此影音平台不支援官網直譯，請在原頁使用 DualCue。', 'error.authorization-required': '來源頁授權已失效，請在該頁再點一次 DualCue。',
  'error.no-readable-content': '找不到可讀的英文文章內容。', 'error.captions-unavailable': '找不到可讀的英文字幕；燒錄字幕、需登入字幕與音訊轉錄不會匯入官網。',
  'error.connection-lost': '暫存工作已中斷，請在來源頁再點一次 DualCue，或重新匯入網址。', 'error.translation-failed': '翻譯未完成，請確認語言包或 Provider 設定後再試。', 'error.clipboard': '無法寫入剪貼簿，請確認瀏覽器權限後再試。',
  'features.title': '在原頁翻譯，也能在乾淨閱讀器專心讀', 'features.body': '工具列點一次就把譯文放在原段落下方；公開閱讀器則適合複製、匯出或列印當次內容。',
  'features.pageTitle': '一般網頁一鍵翻譯', 'features.pageBody': '背景直接鎖定被點擊的分頁與網址，保留停止、完整還原、單句編輯、重譯與列印 PDF。',
  'features.videoTitle': 'YouTube／Bilibili 字幕', 'features.videoBody': '匯入頁面已提供的英文人工或 AI 字幕；沒有可讀字幕時會說明原因，不繞過登入或付費限制。',
  'features.privacyTitle': '不保存閱讀歷史', 'features.privacyBody': '閱讀器內容只在目前分頁記憶體；重新整理或關閉後清除，沒有帳號、分析 SDK 或雲端內容庫。',
} as const;

type CopyKey = keyof typeof zhTW;
type Dictionary = Record<CopyKey, string>;

const zhCN: Dictionary = {
  'nav.reader': '双语阅读器', 'nav.features': '功能', 'nav.faq': '常见问题', 'nav.privacy': '隐私政策',
  'hero.title': '粘贴英文内容网址，直接阅读双语版本', 'hero.body': '普通文章、YouTube 与哔哩哔哩都可交给已安装的 DualCue 扩展获取；正文与字幕不经过 DualCue 服务器，也不建立阅读历史。',
  'trust.local': '默认本机翻译', 'trust.noAccount': '无需账号', 'trust.noHistory': '刷新即清除', 'trust.noKey': '官网看不到 API Key',
  'reader.title': '公开双语阅读器', 'reader.body': '输入公开 HTTPS 网址。来源页打开后请点击一次 DualCue；文章会获取可读正文，YouTube／哔哩哔哩会复用页面提供的英文字幕。',
  'reader.urlLabel': '视频或文章网址', 'reader.import': '导入内容', 'reader.supported': '支持普通 HTTPS 文章、YouTube、哔哩哔哩。Netflix、Disney+ 与其他视频平台请在原页使用 DualCue。',
  'reader.desktopOnly': '第一版阅读器仅支持桌面 Chrome；手机可先打开原始网址阅读。', 'reader.source': '打开来源', 'reader.local': '使用 Chrome 本机翻译', 'reader.byok': '使用扩展中的 BYOK', 'reader.cancel': '停止',
  'reader.copy': '复制双语内容', 'reader.txt': '下载 TXT', 'reader.print': '打印／PDF',
  'extension.missingTitle': '需要兼容的 DualCue Chrome 扩展', 'extension.missingBody': '官网本身不能跨网站读取正文。安装扩展后，内容获取与翻译才会在你的浏览器中完成。', 'extension.install': '前往 Chrome Web Store', 'status.missing': '等待安装或更新兼容的 DualCue Chrome 扩展。',
  'status.connecting': '正在连接 DualCue…', 'status.ready': 'DualCue 已连接。粘贴网址即可开始。', 'status.opening': '正在打开来源页…', 'status.authorization': '来源页已打开。请在该页点击一次工具栏的 DualCue，完成后会自动返回阅读器。',
  'status.extracting': '正在获取可读的英文内容…', 'status.document': '内容已就绪。请选择本机翻译或扩展内的 BYOK。', 'status.translating': '正在翻译 {completed}/{total}…', 'status.complete': '双语内容已完成；可以复制、下载或打印。',
  'status.byok': '请返回来源页点击一次 DualCue，并在扩展内确认 Provider、模型、内容量与可能费用。', 'status.copied': '已复制双语内容。', 'status.cancelled': '已停止本次工作。',
  'error.invalidUrl': '请输入不含账号密码的公开 HTTPS 网址。', 'error.invalid-request': '阅读器请求格式不正确，请刷新后重试。',
  'error.unsupported-url': '此视频平台不支持官网直译，请在原页面使用 DualCue。', 'error.authorization-required': '来源页授权已失效，请在该页面再次点击 DualCue。',
  'error.no-readable-content': '找不到可读取的英文文章内容。', 'error.captions-unavailable': '找不到可读取的英文字幕；烧录字幕、需登录字幕与音频转录不会导入官网。',
  'error.connection-lost': '临时任务已中断，请在来源页再次点击 DualCue，或重新导入网址。', 'error.translation-failed': '翻译未完成，请确认语言包或 Provider 设置后重试。', 'error.clipboard': '无法写入剪贴板，请确认浏览器权限后重试。',
  'features.title': '可在原页翻译，也可在简洁阅读器专心阅读', 'features.body': '工具栏点击一次就把译文放在原段落下方；公开阅读器适合复制、导出或打印当次内容。',
  'features.pageTitle': '普通网页一键翻译', 'features.pageBody': '后台直接锁定被点击的标签页与网址，保留停止、完整恢复、单句编辑、重译与打印 PDF。',
  'features.videoTitle': 'YouTube／哔哩哔哩字幕', 'features.videoBody': '导入页面已提供的英文人工或 AI 字幕；没有可读字幕时会说明原因，不绕过登录或付费限制。',
  'features.privacyTitle': '不保存阅读历史', 'features.privacyBody': '阅读器内容只在当前标签页内存中；刷新或关闭后清除，不含账号、分析 SDK 或云端内容库。',
};

const ja: Dictionary = {
  'nav.reader': 'バイリンガルリーダー', 'nav.features': '機能', 'nav.faq': 'よくある質問', 'nav.privacy': 'プライバシー',
  'hero.title': '英語コンテンツの URL を貼り、すぐに対訳で読む', 'hero.body': '記事、YouTube、Bilibili はインストール済みの DualCue 拡張機能が取得します。本文や字幕は DualCue サーバーを経由せず、閲覧履歴も作りません。',
  'trust.local': '既定はローカル翻訳', 'trust.noAccount': 'アカウント不要', 'trust.noHistory': '再読み込みで消去', 'trust.noKey': 'サイトは API Key を取得しません',
  'reader.title': '公開バイリンガルリーダー', 'reader.body': '公開 HTTPS URL を入力します。元ページが開いたら DualCue を一度押してください。記事本文を取得し、YouTube／Bilibili はページ提供の英語字幕を再利用します。',
  'reader.urlLabel': '動画または記事の URL', 'reader.import': 'コンテンツを読み込む', 'reader.supported': 'HTTPS 記事、YouTube、Bilibili に対応。Netflix、Disney+ などは元ページで DualCue を使ってください。',
  'reader.desktopOnly': '初版リーダーはデスクトップ Chrome のみ対応しています。モバイルでは元 URL を開いてください。', 'reader.source': '元ページを開く', 'reader.local': 'Chrome ローカル翻訳', 'reader.byok': '拡張機能の BYOK を使う', 'reader.cancel': '停止',
  'reader.copy': '対訳をコピー', 'reader.txt': 'TXT を保存', 'reader.print': '印刷／PDF',
  'extension.missingTitle': '対応する DualCue Chrome 拡張機能が必要です', 'extension.missingBody': '公式サイトだけでは別サイトの本文を読めません。拡張機能を入れると、取得と翻訳がブラウザ内で行われます。', 'extension.install': 'Chrome Web Store へ', 'status.missing': '対応する DualCue Chrome 拡張機能のインストールまたは更新を待っています。',
  'status.connecting': 'DualCue に接続中…', 'status.ready': 'DualCue に接続しました。URL を貼って開始できます。', 'status.opening': '元ページを開いています…', 'status.authorization': '元ページを開きました。そのページでツールバーの DualCue を一度押すと、自動でリーダーへ戻ります。',
  'status.extracting': '読める英語コンテンツを取得中…', 'status.document': 'コンテンツを取得しました。ローカル翻訳か拡張機能内の BYOK を選んでください。', 'status.translating': '翻訳中 {completed}/{total}…', 'status.complete': '対訳が完成しました。コピー、保存、印刷できます。',
  'status.byok': '元ページで DualCue を一度押し、拡張機能内で Provider、モデル、量、料金の可能性を確認してください。', 'status.copied': '対訳をコピーしました。', 'status.cancelled': 'この処理を停止しました。',
  'error.invalidUrl': '認証情報を含まない公開 HTTPS URL を入力してください。', 'error.invalid-request': 'リーダーの要求形式が正しくありません。再読み込みしてお試しください。',
  'error.unsupported-url': 'この動画サービスはサイト内翻訳に非対応です。元ページで DualCue を使ってください。', 'error.authorization-required': '元ページの許可が失効しました。そのページで DualCue をもう一度押してください。',
  'error.no-readable-content': '読める英語の記事本文が見つかりません。', 'error.captions-unavailable': '読める英語字幕がありません。焼き付け字幕、ログイン必須字幕、音声文字起こしはサイトへ読み込みません。',
  'error.connection-lost': '一時処理が中断しました。元ページで DualCue をもう一度押すか、URL を再度読み込んでください。', 'error.translation-failed': '翻訳を完了できませんでした。言語パックまたは Provider 設定を確認してください。', 'error.clipboard': 'クリップボードへ書き込めません。ブラウザの権限を確認してください。',
  'features.title': '元ページでも、集中できるリーダーでも読めます', 'features.body': 'ツールバーを一度押すと訳文を段落下に表示。公開リーダーは今回の内容のコピー、書き出し、印刷に向いています。',
  'features.pageTitle': 'ウェブページをワンクリック翻訳', 'features.pageBody': 'クリックしたタブと URL を固定し、停止、完全復元、文ごとの編集、再翻訳、PDF 印刷を維持します。',
  'features.videoTitle': 'YouTube／Bilibili 字幕', 'features.videoBody': 'ページが提供する英語の人手／AI 字幕を読み込みます。読めない場合は理由を示し、ログインや有料制限を回避しません。',
  'features.privacyTitle': '閲覧履歴を保存しません', 'features.privacyBody': '内容は現在のタブのメモリだけに存在し、再読み込みや終了で消去。アカウント、分析 SDK、クラウド履歴はありません。',
};

const ko: Dictionary = {
  'nav.reader': '이중 언어 리더', 'nav.features': '기능', 'nav.faq': '자주 묻는 질문', 'nav.privacy': '개인정보',
  'hero.title': '영어 콘텐츠 URL을 붙여 넣고 이중 언어로 읽으세요', 'hero.body': '일반 기사, YouTube, Bilibili는 설치된 DualCue 확장 프로그램이 가져옵니다. 본문과 자막은 DualCue 서버를 거치지 않으며 읽기 기록도 만들지 않습니다.',
  'trust.local': '기본 로컬 번역', 'trust.noAccount': '계정 없음', 'trust.noHistory': '새로고침 시 삭제', 'trust.noKey': '사이트는 API Key를 볼 수 없음',
  'reader.title': '공개 이중 언어 리더', 'reader.body': '공개 HTTPS URL을 입력하세요. 원본 페이지가 열리면 DualCue를 한 번 누르세요. 기사는 읽을 수 있는 본문을 가져오고 YouTube／Bilibili는 페이지의 영어 자막을 재사용합니다.',
  'reader.urlLabel': '동영상 또는 기사 URL', 'reader.import': '콘텐츠 가져오기', 'reader.supported': '일반 HTTPS 기사, YouTube, Bilibili를 지원합니다. Netflix, Disney+ 등은 원본 페이지에서 DualCue를 사용하세요.',
  'reader.desktopOnly': '첫 버전 리더는 데스크톱 Chrome만 지원합니다. 모바일에서는 원본 URL을 여세요.', 'reader.source': '원본 열기', 'reader.local': 'Chrome 로컬 번역', 'reader.byok': '확장 프로그램 BYOK 사용', 'reader.cancel': '중지',
  'reader.copy': '이중 언어 내용 복사', 'reader.txt': 'TXT 다운로드', 'reader.print': '인쇄／PDF',
  'extension.missingTitle': '호환되는 DualCue Chrome 확장 프로그램이 필요합니다', 'extension.missingBody': '공식 사이트만으로는 다른 사이트의 본문을 읽을 수 없습니다. 확장 프로그램을 설치하면 가져오기와 번역이 브라우저에서 처리됩니다.', 'extension.install': 'Chrome Web Store 열기', 'status.missing': '호환되는 DualCue Chrome 확장 프로그램의 설치 또는 업데이트를 기다리고 있습니다.',
  'status.connecting': 'DualCue 연결 중…', 'status.ready': 'DualCue가 연결되었습니다. URL을 붙여 넣어 시작하세요.', 'status.opening': '원본 페이지를 여는 중…', 'status.authorization': '원본 페이지가 열렸습니다. 해당 페이지에서 도구 모음의 DualCue를 한 번 누르면 자동으로 리더로 돌아옵니다.',
  'status.extracting': '읽을 수 있는 영어 콘텐츠를 가져오는 중…', 'status.document': '콘텐츠가 준비되었습니다. 로컬 번역 또는 확장 프로그램의 BYOK를 선택하세요.', 'status.translating': '번역 중 {completed}/{total}…', 'status.complete': '이중 언어 콘텐츠가 완성되었습니다. 복사, 다운로드, 인쇄할 수 있습니다.',
  'status.byok': '원본 페이지에서 DualCue를 한 번 누르고 확장 프로그램에서 Provider, 모델, 분량, 비용 가능성을 확인하세요.', 'status.copied': '이중 언어 콘텐츠를 복사했습니다.', 'status.cancelled': '이번 작업을 중지했습니다.',
  'error.invalidUrl': '계정 정보가 없는 공개 HTTPS URL을 입력하세요.', 'error.invalid-request': '리더 요청 형식이 올바르지 않습니다. 새로고침한 뒤 다시 시도하세요.',
  'error.unsupported-url': '이 동영상 서비스는 사이트 번역을 지원하지 않습니다. 원본 페이지에서 DualCue를 사용하세요.', 'error.authorization-required': '원본 페이지 권한이 만료되었습니다. 해당 페이지에서 DualCue를 다시 누르세요.',
  'error.no-readable-content': '읽을 수 있는 영어 기사 본문을 찾지 못했습니다.', 'error.captions-unavailable': '읽을 수 있는 영어 자막이 없습니다. 번인 자막, 로그인 필요 자막, 음성 전사는 사이트로 가져오지 않습니다.',
  'error.connection-lost': '임시 작업 연결이 끊겼습니다. 원본 페이지에서 DualCue를 다시 누르거나 URL을 다시 가져오세요.', 'error.translation-failed': '번역을 완료하지 못했습니다. 언어 팩 또는 Provider 설정을 확인하세요.', 'error.clipboard': '클립보드에 쓸 수 없습니다. 브라우저 권한을 확인한 뒤 다시 시도하세요.',
  'features.title': '원본 페이지에서도, 깔끔한 리더에서도 읽으세요', 'features.body': '도구 모음을 한 번 누르면 원문 단락 아래 번역이 표시됩니다. 공개 리더는 이번 콘텐츠를 복사, 내보내기, 인쇄하기 좋습니다.',
  'features.pageTitle': '일반 웹페이지 원클릭 번역', 'features.pageBody': '클릭한 탭과 URL을 고정하고 중지, 전체 복원, 문장 편집, 재번역, PDF 인쇄를 유지합니다.',
  'features.videoTitle': 'YouTube／Bilibili 자막', 'features.videoBody': '페이지가 제공하는 영어 수동／AI 자막을 가져옵니다. 읽을 수 없으면 이유를 알리고 로그인이나 유료 제한을 우회하지 않습니다.',
  'features.privacyTitle': '읽기 기록을 저장하지 않음', 'features.privacyBody': '내용은 현재 탭 메모리에만 있으며 새로고침하거나 닫으면 삭제됩니다. 계정, 분석 SDK, 클라우드 기록이 없습니다.',
};

const dictionaries: Record<UiLocale, Dictionary> = { 'zh-TW': zhTW, 'zh-CN': zhCN, ja, ko };

export function uiText(locale: UiLocale, key: CopyKey, values: Record<string, string | number> = {}): string {
  return dictionaries[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}

export function applyLocale(locale: UiLocale): void {
  document.documentElement.lang = locale === 'zh-TW' ? 'zh-Hant' : locale === 'zh-CN' ? 'zh-Hans' : locale;
  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = element.dataset.i18n as CopyKey | undefined;
    if (key && key in dictionaries[locale]) element.textContent = dictionaries[locale][key];
  }
}
