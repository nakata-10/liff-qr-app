// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) return liff.login({ redirectUri: location.href });

    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // QRコード生成
    const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                  + `?code=${encodeURIComponent(userId)}`
                  + `&idToken=${encodeURIComponent(idToken)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width:300, height:300 });
    qEl.style.display = "block";

    startPointPolling(userId);
  } catch (err) {
    console.error(err);
  }
});

let pollIntervalId = null;
function startPointPolling(userId) {
  const pointEl   = document.getElementById("pointDisplay");
  const resultUrl = `${APP_CONFIG.SCAN_RESULT_URL}?code=${encodeURIComponent(userId)}`;

  async function fetchPoints() {
    try {
      const res  = await fetch(resultUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!data.scanned) return;

      // 累計ポイント表示
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";

      // ポーリング停止
      clearInterval(pollIntervalId);

      // まだリロードしていなければ一度だけ強制リロード
      if (!sessionStorage.getItem("hasReloaded")) {
        sessionStorage.setItem("hasReloaded", "true");
        setTimeout(() => {
          // キャッシュを回避して強制リロード
          window.location.href = window.location.href.split("?")[0] + "?_=" + Date.now();
        }, 1000);
      }
    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  // 即時チェック＋3秒ごと
  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}
