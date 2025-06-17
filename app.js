// app.js

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
    document.getElementById('qrcode').innerHTML = '';
    document.getElementById('qr-result').textContent = '';

    const codeText = Date.now().toString();
    // 【相対パス版】
//  const link = `scan.html?code=${codeText}`;

    // 【絶対URL版】（必要に応じてこちらを使ってください）
//  const link = `https://nakata-10.github.io/liff-qr-app/scan.html?code=${codeText}`;

    // 推奨：相対パス
    const link = `scan.html?code=${codeText}`;

    new QRCode(document.getElementById('qrcode'), {
      text: link,
      width: 200,
      height: 200,
    });
  });
}

initializeLiff().then(() => {
  setupQrGeneration();
});
