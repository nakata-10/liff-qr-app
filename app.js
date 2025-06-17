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
}

// 2) QR 生成ロジック（リンク埋め込み版）
function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    // 生成前に前回の QR をクリア
    document.getElementById('qrcode').innerHTML = '';
    document.getElementById('qr-result').textContent = '';

    // 一意のコードを発行
    const codeText = Date.now().toString();
    // リンク化：scan.html にパラメータ付きで飛ぶ URL を生成
    const link = `${window.location.origin}/scan.html?code=${codeText}`;

    // QR コードを生成
    new QRCode(document.getElementById('qrcode'), {
      text: link,
      width: 200,
      height: 200,
    });
  });
}

// 初期化後に処理をセットアップ
initializeLiff().then(() => {
  setupQrGeneration();
});
