// app.js

// public/config.js で設定している LIFF_ID と Azure Function URL を読み込む
const { LIFF_ID, AZURE_FUNCTION_URL } = window.APP_CONFIG;

async function initializeLiff() {
  console.log("▶ initializeLiff start");
  await liff.init({ liffId: LIFF_ID });
  console.log("▶ liff.init done, isLoggedIn:", liff.isLoggedIn());
  if (!liff.isLoggedIn()) {
    console.log("▶ not logged in → redirect to LIFF login");
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
  document.getElementById('message').textContent = 'ログイン済みです';
  document.getElementById('btn-generate').disabled = false;
  console.log("▶ LIFF ready, button enabled");
}

function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    console.log("▶ QR generate clicked");
    document.getElementById('qrcode').innerHTML     = '';
    document.getElementById('qr-result').textContent = '';

    const codeText = Date.now().toString();
    const idToken  = liff.getIDToken();
    const userId   = liff.getContext().userId;
    console.log("▶ codeText, userId:", codeText, userId);

    const link =
      `https://nakata-10.github.io/liff-qr-app/scan.html` +
      `?code=${encodeURIComponent(codeText)}` +
      `&idToken=${encodeURIComponent(idToken)}` +
      `&userId=${encodeURIComponent(userId)}`;

    console.log("▶ QR link:", link);

    new QRCode(document.getElementById('qrcode'), {
      text: link,
      width: 300,
      height: 300,
      correctLevel: QRCode.CorrectLevel.H
    });
  });
}

initializeLiff().then(() => {
  setupQrGeneration();
});
