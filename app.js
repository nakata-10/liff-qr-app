// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    // 3) userId と idToken を取得
    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // 4) QRコード生成 (scan.html に code と idToken を渡す)
    const scanUrl =
      `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
      `?code=${encodeURIComponent(userId)}` +
      `&idToken=${encodeURIComponent(idToken)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width:300, height:300 });
    qEl.style.display = "block";

    // 5) ポイント表示ポーリング開始（フォールバック）
    startPointPolling(userId);

    // 6) SignalR ハブ接続開始
    await startSignalR();

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

      // 累計ポイントを表示
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

async function startSignalR() {
  try {
    // 1) negotiate で接続情報を取得
    const resp = await fetch(APP_CONFIG.NEGOTIATE_URL, { method: "POST" });
    if (!resp.ok) throw new Error(`negotiate HTTP ${resp.status}`);
    const connInfo = await resp.json();

    // 2) ハブ接続を構築
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(connInfo.url, { accessTokenFactory: () => connInfo.accessToken })
      .withAutomaticReconnect()
      .build();

    // 3) scanCompleted イベントを受信
    connection.on("scanCompleted", ({ userId, totalPoints }) => {
      console.log("リアルタイム通知:", userId, totalPoints);
      const pointEl = document.getElementById("pointDisplay");
      pointEl.textContent = `現在のポイント：${totalPoints} pt`;
      pointEl.style.display = "block";
      // ポーリングが動いていれば止める
      if (pollIntervalId) clearInterval(pollIntervalId);
    });

    // 4) 接続開始
    await connection.start();
    console.log("SignalR 接続完了");
  } catch (err) {
    console.error("SignalR 接続エラー", err);
  }
}
