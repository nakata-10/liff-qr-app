// app.js

// 設定は public/config.js で読み込まれる
const { LIFF_ID, AZURE_FUNCTION_URL } = window.APP_CONFIG;

let html5QrCode = null;

// 1) LIFF 初期化とログイン
async function initializeLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    // profile と openid スコープでログインを要求
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
  // ログイン済みならメッセージ更新＆ボタン有効化
  document.getElementById('message').textContent = 'ログイン済みです';
  document.getElementById('btn-generate').disabled = false;
  document.getElementById('btn-scan').disabled     = false;
}

// 2) QR 生成ロジック
function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    // 生成前に前回の QR をクリア
    document.getElementById('qrcode').innerHTML = '';
    const codeText = Date.now().toString();
    new QRCode(document.getElementById('qrcode'), {
      text: codeText,
      width: 200,
      height: 200,
    });
    document.getElementById('qr-result').textContent = '';
  });
}

// 3) QR 読み取り・ポイント付与呼び出し
function setupQrScanning() {
  html5QrCode = new Html5Qrcode('qr-reader');
  document.getElementById('btn-scan').addEventListener('click', () => {
    document.getElementById('qr-reader').style.display = 'block';
    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10 },
      onScanSuccess,
      onScanError
    );
  });
}

async function onScanSuccess(decodedText) {
  // 読み取り停止
  await html5QrCode.stop();
  document.getElementById('qr-reader').style.display = 'none';

  // ID トークン取得
  const idToken = liff.getIDToken();
  if (!idToken) {
    document.getElementById('qr-result').textContent = 'ID トークンの取得に失敗しました';
    return;
  }

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

// 初期化後に処理セットアップ
initializeLiff().then(() => {
  setupQrGeneration();
  setupQrScanning();
});
