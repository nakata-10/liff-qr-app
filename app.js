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

    const { sessionId, idToken } = generateQrCode();
    startPolling(sessionId, idToken);

  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});


/**
 * QR を生成し、sessionId と idToken を返す
 */
function generateQrCode() {
  const idToken = liff.getIDToken();
  const sessionId = Math.random().toString(36).slice(-8);

  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?sessionId=${encodeURIComponent(sessionId)}`
                + `&idToken=${encodeURIComponent(idToken)}`;

  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, { text: scanUrl, width: 300, height: 300 });
  qEl.classList.add('visible');

  document.getElementById('status').textContent = 'この QR コードをスキャンしてください';

  return { sessionId, idToken };
}


/**
 * 定期的にスキャン結果（累計ポイント）を取得してUIを更新
 */
function startPolling(sessionId, idToken) {
  const resultEl  = document.getElementById('scan-result');
  const messageEl = document.getElementById('scan-message');
  const pointsEl  = document.getElementById('scan-points');
  let lastTotal = 0;

  resultEl.classList.add('visible');

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
            sessionId,
            points:   0,                    // 累計取得のみ
            scanInfo: { timestamp: new Date().toISOString() }
          })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { totalPoints } = await res.json();

      if (totalPoints > lastTotal) {
        lastTotal = totalPoints;
        messageEl.textContent = 'ポイントを正常に付与しました 🎉';
        pointsEl.textContent  = lastTotal;
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 5000);
}
