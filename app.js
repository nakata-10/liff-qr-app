// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  // ──────────────── ここから追加 ────────────────
  // URL に code, idToken, userId が含まれていたら scan.html へリダイレクト
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') && params.has('idToken') && params.has('userId')) {
    // 現在のクエリ部を丸ごと scan.html に引き継ぐ
    window.location.replace(
      `${APP_CONFIG.SCAN_BASE_URL}/scan.html?${window.location.search.substring(1)}`
    );
    return;
  }
  // ──────────────── ここまで追加 ────────────────

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

  // LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";  // 必要に応じてダミーを設定
  const code    = userId;                          // ユニークコードとして userId を利用

  // ↓ ここをテンプレートリテラルで組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
                  `?code=${encodeURIComponent(code)}` +
                  `&idToken=${encodeURIComponent(idToken)}` +
                  `&userId=${encodeURIComponent(userId)}`;

  // QR コード描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  // 要素を表示
  qEl.classList.add('visible');
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';
}
