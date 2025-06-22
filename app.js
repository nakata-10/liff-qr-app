// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) return liff.login({ redirectUri: location.href });

    // 画面要素を表示
    document.getElementById('title').classList.add('visible');
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'QRコードを生成中…';
    statusEl.classList.add('visible');

    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    generateQrCode(userId, idToken);
    startPointPolling(userId, idToken);

  } catch (err) {
    console.error(err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました';
    statusEl.classList.add('visible');
  }
});

function generateQrCode(userId, idToken) {
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(userId)}`
                + `&idToken=${encodeURIComponent(idToken)}`;
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, { text: scanUrl, width:300, height:300 });
  qEl.classList.add('visible');

  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QRコードをスキャンしてください';
}

// ポーリング＆ポイント制御
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const awardEl   = document.getElementById("lastAward");
  const pointEl   = document.getElementById("pointDisplay");
  const awardUrl  = APP_CONFIG.AZURE_FUNCTION_URL;     // POST 用
  const resultUrl = APP_CONFIG.SCAN_RESULT_URL;        // GET 用
  const AWARD_POINTS = 150;

  let awarded = false;

  async function checkAndAward() {
    // 1) まず「スキャン済みかどうか」だけチェック
    const res1 = await fetch(`${resultUrl}?code=${encodeURIComponent(userId)}`);
    if (!res1.ok) throw new Error(`getScanResult HTTP ${res1.status}`);
    const scanData = await res1.json();

    if (!scanData.scanned) {
      // まだスキャンされていない → 何も表示せず return
      return;
    }

    // 2) スキャン済みなら一度だけ付与
    if (!awarded) {
      const res2 = await fetch(awardUrl, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId,
          points:  AWARD_POINTS,
          scanInfo: {
            qrText:    userId,
            timestamp: new Date().toISOString()
          }
        })
      });
      if (!res2.ok) throw new Error(`awardPoints HTTP ${res2.status}`);
      const awardData = await res2.json();

      awardEl.textContent = `今回の付与ポイント：${AWARD_POINTS} pt`;
      awardEl.classList.add('visible');
      awarded = true;
    }

    // 3) 最後に累計を再取得して表示
    const res3 = await fetch(`${resultUrl}?code=${encodeURIComponent(userId)}`);
    if (!res3.ok) throw new Error(`getScanResult HTTP ${res3.status}`);
    const finalData = await res3.json();
    const total = finalData.totalPoints;
    pointEl.textContent = `現在のポイント：${total} pt`;
    pointEl.classList.add('visible');

    // ポーリング不要なら停止
    clearInterval(pollIntervalId);
  }

  // スキャン直後から即時チェック
  checkAndAward().catch(console.error);
  // そのあと3秒ごとに再チェック
  pollIntervalId = setInterval(() => {
    checkAndAward().catch(console.error);
  }, 3000);
}
