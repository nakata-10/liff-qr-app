// public/app.js

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

  // 1) LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";  
  // ユニークコードとして userId を利用 (必要に応じて別ロジックに置き換え)
  const code    = userId;                          

  // 2) スキャン用 URL を組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
                  `?code=${encodeURIComponent(code)}` +
                  `&idToken=${encodeURIComponent(idToken)}` +
                  `&userId=${encodeURIComponent(userId)}`;

  // 3) QR コード描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });
  qEl.classList.add('visible');

  // 4) ステータス更新
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';

  // 5) ポーリング開始: 3 秒ごとに「GET /awardPoints?code=...」を呼び出し
  const poll = setInterval(async () => {
    try {
      const res = await fetch(
        `${APP_CONFIG.AZURE_FUNCTION_BASE_URL}/awardPoints?code=${encodeURIComponent(code)}`,
        { method: 'GET' }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // スキャンされたら UI をポイント表示に切り替え
      if (json.scanned) {
        clearInterval(poll);
        // QR とタイトルを隠す
        document.getElementById('qrcode').classList.remove('visible');
        document.getElementById('title').classList.remove('visible');
        // ステータス＆ポイント表示
        statusEl.textContent = 'ポイントを正常に付与しました 🎉';
        const resultEl = document.createElement('p');
        resultEl.textContent = `合計ポイント: ${json.totalPoints} pt`;
        resultEl.style.textAlign = 'center';
        resultEl.style.fontSize = '1.2rem';
        resultEl.style.marginTop = '8px';
        statusEl.insertAdjacentElement('afterend', resultEl);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 3000);
}
