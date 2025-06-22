// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 3) ユーザーID と IDトークン取得
    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // 4) QRコード生成 (scan.html に code と idToken を渡す)
    const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                  + `?code=${encodeURIComponent(userId)}`
                  + `&idToken=${encodeURIComponent(idToken)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width: 300, height: 300 });
    qEl.style.display = "block";

    // 5) ポイント表示をポーリング開始
    startPointPolling(userId);

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
      const res  = await fetch(resultUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // スキャンされていなければ何もしない
      if (!data.scanned) return;

      // 累計ポイントを表示
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";

      // 一度出したらポーリングを停止
      clearInterval(pollIntervalId);

    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  // 即時１回 + 以降3秒ごと
  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}

