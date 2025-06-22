// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    const userId = liff.getContext().userId;
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
      const res  = await fetch(resultUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // スキャンされていなければ何もしない
      if (!data.scanned) return;

      // 表示
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";

      // 以降のポーリングは不要なら止める
      clearInterval(pollIntervalId);
    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  // 即時１回と、以降３秒ごとに
  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}
