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

  // LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";  
  const code    = userId;  // セッション ID として userId を利用

  // スキャン結果画面への URL を組み立て
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

  // ポーリング開始
  startPolling(code, idToken);
}

/**
 * 定期的にスキャン結果（累計ポイント）を取得して UI を更新
 * @param {string} sessionId — 今回のスキャン識別子（userId など）
 * @param {string} idToken — LIFF から取得した ID トークン
 */
function startPolling(sessionId, idToken) {
  const resultEl  = document.getElementById('scan-result');
  const messageEl = document.getElementById('scan-message');
  const pointsEl  = document.getElementById('scan-points');
  let lastTotal = 0;

  // 結果表示領域を見えるように
  resultEl.classList.add('visible');

  setInterval(async () => {
    try {
      const res = await fetch(
        `${APP_CONFIG.AZURE_FUNCTION_BASE_URL}/awardPoints?code=${APP_CONFIG.FUNCTION_KEY}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': 'Bearer ' + idToken
          },
          body: JSON.stringify({
            sessionId,
            points:   0,                    // 保存はせず、累計のみ取得
            scanInfo: { timestamp: new Date().toISOString() }
          })
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { totalPoints } = await res.json();

      // ポイント増加を検知したら表示を更新
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
