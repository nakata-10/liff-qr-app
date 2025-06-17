// app.js

window.addEventListener('DOMContentLoaded', async () => {
  // 1) 読み込み完了 → LIFF 初期化
  await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });

  // 2) ログインしていなければリダイレクト
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return;
  }

  // 3) ログイン済み → QR を自動生成
  await generateQrCode();

  // 4) QR 以外の要素を隠し、qrcode のみ表示
  document.querySelectorAll('body > *').forEach(el => {
    if (el.id !== 'qrcode') el.style.display = 'none';
  });
  document.getElementById('qrcode').style.display = 'block';
});

async function generateQrCode() {
  // ① LIFF 情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;

  // ② スキャン先 URL を組み立て
  const scanUrl = `${window.APP_CONFIG.SCAN_BASE_URL}/scan.html`
    + `?code=${encodeURIComponent(userId + ':' + Date.now())}`
    + `&idToken=${encodeURIComponent(idToken)}`
    + `&userId=${encodeURIComponent(userId)}`;

  // ③ qrcode.js で描画
  const container = document.getElementById('qrcode');
  container.innerHTML = '';  // クリア
  new QRCode(container, {
    text: scanUrl,
    width: 300,
    height: 300,
  });
}
