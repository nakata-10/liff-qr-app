// app.js
window.addEventListener('DOMContentLoaded', async () => {
  // 1) LIFF 初期化
  await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
  console.log('LIFF ready, isLoggedIn=', liff.isLoggedIn());

  if (!liff.isLoggedIn()) {
    // ログインしていなければリダイレクト
    return liff.login({ redirectUri: window.location.href });
  }

  // 2) ログイン済みなら自動で QR を生成
  generateQrCode();
});

function generateQrCode() {
  console.log('▶ generateQrCode called');

  // LIFF からパラメータを取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;

  // 適宜、APP_CONFIG.SCAN_BASE_URL を定義しておいて…
  const scanUrl = `${window.APP_CONFIG.SCAN_BASE_URL
    }/scan.html?code=${encodeURIComponent(userId + ':' + Date.now())
    }&idToken=${encodeURIComponent(idToken)
    }&userId=${encodeURIComponent(userId)}`;

  // #qrcode に描画
  document.getElementById('qrcode').innerHTML = '';
  new QRCode(document.getElementById('qrcode'), {
    text: scanUrl,
    width: 300,
    height: 300,
  });

  // ラベルを表示
  document.getElementById('qrcode-label').style.display = 'block';
}
