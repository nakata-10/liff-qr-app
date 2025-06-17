// ============================
// 事前に置き換える箇所
// ============================
const YOUR_LIFF_ID = "2007532568-4ggdRvjk"; 
const FUNCTION_BASE_URL = "https://…/awardPoints";
const AZURE_FUNCTION_KEY  = process.env.AZURE_FUNCTION_KEY;
const AZURE_FUNCTION_URL  = `${FUNCTION_BASE_URL}?code=${AZURE_FUNCTION_KEY}`;

// グローバル
let liffUserId = "";
let html5QrCode = null;

// 1) LIFF 初期化とログイン
async function initializeLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    // profile と openid スコープでログインを要求
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
}

// 2) QR 生成ロジック
function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    new QRCode(document.getElementById('qrcode'), {
      text: Date.now().toString(),
      width: 128,
      height: 128,
    });
  });
}

// 3) QR 読み取り・ポイント付与呼び出し
function setupQrScanning() {
  const scanner = new Html5Qrcode('qr-reader');
  document.getElementById('btn-scan').addEventListener('click', () => {
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10 },
      onScanSuccess,
      onScanError
    );
  });
}

async function onScanSuccess(decodedText) {
  // ID トークン取得
  const idToken = liff.getIDToken();
  // ユーザーID取得
  const userId = liff.getContext().userId;

  // リクエストボディ作成
  const body = {
    userId,
    points: 10,
    scanInfo: {
      qrText: decodedText,
      timestamp: new Date().toISOString()
    }
  };

  try {
    // Azure Function 呼び出し（POST, JSON, 認証ヘッダー付き）
    const res = await fetch(AZURE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(body)
    });
    const json = await res.json();

    // 結果表示
    document.getElementById('qr-result').textContent = json.message || json.error;
  } catch (err) {
    console.error('API 呼び出しエラー:', err);
    document.getElementById('qr-result').textContent = '通信エラーが発生しました';
  }
}

function onScanError(errorMessage) {
  // スキャンエラー時（オプション）
  console.warn('スキャンエラー:', errorMessage);
}

// 初期化後に QR 生成・スキャン処理をセットアップ
initializeLiff().then(() => {
  setupQrGeneration();
  setupQrScanning();
});
