// public/app.js

// 前提: HTML の <script src="./config.js"></script> より後に読み込まれること
// config.js で window.APP_CONFIG が定義されているものとします

window.addEventListener("DOMContentLoaded", async () => {
  // 1) LIFF 初期化
  await liff.init({ liffId: APP_CONFIG.LIFF_ID });
  console.log("LIFF initialized, isLoggedIn =", liff.isLoggedIn());

  // 2) 未ログインならログイン画面へ飛ばす
  if (!liff.isLoggedIn()) {
    // redirectUri はこのページ URL をそのまま指定
    return liff.login({ redirectUri: window.location.href });
  }

  // 3) ログイン済み → 自動で QR を生成
  generateQrCode();
});

function generateQrCode() {
  console.log("▶ generateQrCode called");

  // 4) LIFF から必要パラメータ取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;
  // この QR を「何に紐づけるか」を示すコード
  // 今回は userId とタイムスタンプを組み合わせた文字列を使います
  const code    = `${userId}:${Date.now()}`;

  // 5) 実際にスキャン先となる URL を組み立て
  //    scan.html が同じドメイン・ルート直下に置いてある想定
  const scanUrl = [
    APP_CONFIG.SCAN_BASE_URL,      // 例: https://nakata-10.github.io/liff-qr-app
    "/scan.html?code=",            // scan.html 側で code, idToken, userId を parse
    encodeURIComponent(code),
    "&idToken=", encodeURIComponent(idToken),
    "&userId=",  encodeURIComponent(userId)
  ].join("");

  console.log("🔗 scanUrl =", scanUrl);

  // 6) QR コードを描画
  const qEl = document.getElementById("qrcode");
  qEl.innerHTML = "";  // いったん消す
  new QRCode(qEl, {
    text:   scanUrl,
    width:  300,
    height: 300
  });
}
