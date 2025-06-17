// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  // 1) LIFF 初期化
  await liff.init({ liffId: APP_CONFIG.LIFF_ID });

  // 2) 未ログインならログイン画面へリダイレクト
  if (!liff.isLoggedIn()) {
    return liff.login({ redirectUri: window.location.href });
  }

  // 3) ログイン済み → 自動で QR を生成
  generateQrCode();
});

function generateQrCode() {
  console.log("▶ generateQrCode called");

  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;

  // スキャン先 URL を生成
  const scanUrl =  [
    APP_CONFIG.SCAN_BASE_URL,
    "/scan.html?code=" + encodeURIComponent(code),
    "&idToken=" + encodeURIComponent(idToken),
    "&userId=" + encodeURIComponent(userId)
  ].join("");

  // QR を描画
  const qEl = document.getElementById("qrcode");
  qEl.innerHTML = "";
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });
}
