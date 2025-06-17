// app.js

// public/config.js で設定した LIFF_ID と Azure Function URL を読み込む
const { LIFF_ID, AZURE_FUNCTION_URL } = window.APP_CONFIG;
let html5QrCode = null;

async function initializeLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
  document.getElementById('message').textContent = 'ログイン済みです';
  document.getElementById('btn-generate').disabled = false;
}

function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    // 前回の表示をクリア
    document.getElementById('qrcode').innerHTML     = '';
    document.getElementById('qr-result').textContent = '';

    // 一意のコード + LIFF のトークン/ユーザーID を取得
    const codeText = Date.now().toString();
    const idToken  = liff.getIDToken();
    const userId   = liff.getContext().userId;

    // 必ずここで idToken と userId も含める
    const link =
      `https://nakata-10.github.io/liff-qr-app/scan.html` +
      `?code=${encodeURIComponent(codeText)}` +
      `&idToken=${encodeURIComponent(idToken)}` +
      `&userId=${encodeURIComponent(userId)}`;

    // QR コード生成
    new QRCode(document.getElementById('qrcode'), {
      text: link,
      width: 300,
      height: 300,
    });
  });
}

initializeLiff().then(() => {
  setupQrGeneration();
});
