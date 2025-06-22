// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  await liff.init({ liffId: APP_CONFIG.LIFF_ID });
  if (!liff.isLoggedIn()) return liff.login({ redirectUri: location.href });

  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";

  generateQrCode(userId, idToken);
  startPointPolling(userId, idToken);
});

function generateQrCode(userId, idToken) {
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(userId)}`
                + `&idToken=${encodeURIComponent(idToken)}`;
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, { text: scanUrl, width:300, height:300 });
}

// ポーリング＆ポイント付与
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const pointEl     = document.getElementById("pointDisplay");
  const awardEl     = document.getElementById("lastAward");
  const awardUrl    = APP_CONFIG.AZURE_FUNCTION_URL;
  const resultUrl   = APP_CONFIG.SCAN_RESULT_URL + `?code=${encodeURIComponent(userId)}`;
  const awardAmount = 10;  // 付与ポイント数

  let awarded = false;

  pollIntervalId = setInterval(async () => {
    try {
      let data;

      if (!awarded) {
        // --- 初回：POST でポイントを付与 ---
        const res = await fetch(awardUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            userId,
            idToken,
            points: awardAmount,
            scanInfo: {
              qrText:    userId,
              timestamp: new Date().toISOString()
            }
          })
        });
        if (!res.ok) throw new Error(`awardPoints HTTP ${res.status}`);
        data = await res.json();
        awarded = true;

        // 「今回付与」を表示
        awardEl.textContent = `今回付与：${awardAmount} pt`;
        awardEl.style.display = "block";
      } else {
        // --- 2回目以降：GET で累計ポイントを取得 ---
        const res = await fetch(resultUrl, { method: "GET" });
        if (!res.ok) throw new Error(`getScanResult HTTP ${res.status}`);
        data = await res.json();
      }

      // 累計ポイントを表示
      const total = data.totalPoints ?? data.points;
      pointEl.textContent = `現在のポイント：${total} pt`;
      pointEl.style.display = "block";

      // （必要ならポーリング停止）
      // clearInterval(pollIntervalId);

    } catch (err) {
      console.error("ポイント取得エラー", err);
      // エラー時は非表示のままにしてもOK
    }
  }, 5000);
}
