// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン画面へ
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    // 3) UI 表示 & QR 生成
    document.getElementById('title').classList.add('visible');
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'QRコードを生成中…';
    statusEl.classList.add('visible');

    // BroadcastChannel でリスナーを登録
    const bc = new BroadcastChannel("scan-channel");
    bc.onmessage = ev => {
      if (ev.data && ev.data.url) {
        // scan.html から渡された URL を受け取り
        const targetUrl = ev.data.url;
        // 5秒後に同じタブで scan.html に切り替え
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 5000);
      }
    };

    // QR 生成
    generateQrCode();

  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});

function generateQrCode() {
  // LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";
  const code    = userId;  // ユニークコードとして userId を利用

  // スキャン先 URL を組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(code)}`
                + `&idToken=${encodeURIComponent(idToken)}`
                + `&userId=${encodeURIComponent(userId)}`;

  // QR コードを描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  // ステータス更新
  qEl.classList.add('visible');
  document.getElementById('status').textContent = 'この QR コードをスキャンしてください';
}
