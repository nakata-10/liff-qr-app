// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2. 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 3. ユーザーID取得
    const userId = liff.getContext().userId;

    // 4. QRコード生成
    const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html?code=${encodeURIComponent(userId)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width: 300, height: 300 });
    qEl.style.display = "block";

    // 5. ポイント表示ポーリング開始
    startPointPolling(userId);

  } catch (err) {
    console.error("LIFF エラー", err);
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

      // 累計ポイントを表示
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";

      // 一度表示したらポーリングを停止
      clearInterval(pollIntervalId);

    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  // 即時１回呼び出し＋以降3秒ごと
  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}
