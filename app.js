window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン画面へリダイレクト
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    // 3) ログイン済み → UI 表示 & QR を生成
    document.getElementById('title').classList.add('visible');
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'QRコードを生成中…';
    statusEl.classList.add('visible');

    generateQrCode();
  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});

function generateQrCode() {
  console.log("▶ generateQrCode called");

  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;
  const code    = userId;  // ユニークなコード（ここでは userId を利用）

  // スキャン先 URL を生成
  const scanUrl = [
    APP_CONFIG.SCAN_BASE_URL,
    "/scan.html?code=" + encodeURIComponent(code),
    "&idToken=" + encodeURIComponent(idToken),
    "&userId=" + encodeURIComponent(userId)
  ].join("");

  // QR コード描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  // 描画後に要素を表示
  qEl.classList.add('visible');

  // ステータスメッセージ更新
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';
}
