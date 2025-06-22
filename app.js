// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) return liff.login({ redirectUri: location.href });

    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // QRコード生成
    const scanUrl =
      `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
      `?code=${encodeURIComponent(userId)}` +
      `&idToken=${encodeURIComponent(idToken)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width:300, height:300 });
    qEl.style.display = "block";

    // ポイント取得ポーリング開始
    startPointPolling(userId);

    // storage イベントでスキャン完了を検知 → 一度だけリロード
    window.addEventListener("storage", (e) => {
      if (e.key === "scanCompleted" && e.newValue) {
        // フラグをクリアして、自動リロード
        localStorage.removeItem("scanCompleted");
        window.location.reload();
      }
    });
  } catch (err) {
    console.error("LIFF 初期化エラー", err);
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

      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";
      clearInterval(pollIntervalId);
    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}
