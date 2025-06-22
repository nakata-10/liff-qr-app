// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 要素を取得＆表示
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
  const awardUrl  = APP_CONFIG.AZURE_FUNCTION_URL;    // POST 用
  const resultUrl = APP_CONFIG.SCAN_RESULT_URL;       // GET 用

  const AWARD_POINTS = 150;  // 付与ポイント数

  let awarded = false;

  pollIntervalId = setInterval(async () => {
    try {
      let data;

      if (!awarded) {
        // ===== 初回：ポイント付与 =====
        const res = await fetch(awardUrl, {
          method:  "POST",
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();

        // 「今回付与」を表示
        awardEl.textContent = `今回付与：${AWARD_POINTS} pt`;
        awardEl.classList.add('visible');

        awarded = true;

      } else {
        // ===== 2回目以降：累計取得 =====
        const url = `${resultUrl}?code=${encodeURIComponent(userId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();

        if (!data.scanned) {
          pointEl.textContent = "まだスキャンされていません";
          pointEl.classList.add('visible');
          return;
        }
      }

      // ===== ポイント表示 =====
      const total = data.totalPoints ?? data.points;
      pointEl.textContent = `現在のポイント：${total} pt`;
      pointEl.classList.add('visible');

      // （必要なら一度だけ更新して止める）
      // clearInterval(pollIntervalId);

    } catch (err) {
      console.error(err);
    }
  }, 5000);
}
