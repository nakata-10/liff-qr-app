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

    // QR とポーリング開始
    const { code, userId, idToken } = generateQrCode();
    startPolling(code, userId, idToken);

  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});


/**
 * QR を生成し、コード・userId・idToken を返す
 */
function generateQrCode() {
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;
  const code    = userId;  // ここはお好みで一意の文字列に

  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(code)}`
                + `&idToken=${encodeURIComponent(idToken)}`
                + `&userId=${encodeURIComponent(userId)}`;

  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, { text: scanUrl, width: 300, height: 300 });
  qEl.classList.add('visible');

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';

  // 戻り値として必要情報を返す
  return { code, userId, idToken };
}


/**
 * 定期的にスキャン結果（累計ポイント）を取得してUIを更新
 */
function startPolling(code, userId, idToken) {
  const resultEl     = document.getElementById('scan-result');
  const messageEl    = document.getElementById('scan-message');
  const pointsEl     = document.getElementById('scan-points');
  let lastTotal = 0;

  // 最初に UI 表示をオン
  resultEl.classList.add('visible');

  // 5 秒ごとにサーバーに問い合わせ
  setInterval(async () => {
    try {
      const res = await fetch(
        `${APP_CONFIG.AZURE_FUNCTION_BASE_URL}/awardPoints?code=${APP_CONFIG.FUNCTION_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + idToken
          },
          body: JSON.stringify({
            userId,
            points:   0,        // ポイント加算は行わない。累計取得用ダミー
            scanInfo: { qrText: code, timestamp: new Date().toISOString() }
          })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.totalPoints > lastTotal) {
        // 新しいスキャンがあった！
        lastTotal = json.totalPoints;
        messageEl.textContent = 'ポイントを正常に付与しました 🎉';
        pointsEl.textContent  = lastTotal;
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 5000);
}
