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

    // 4) QRコード生成
    const scanUrl =
      `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
      `?code=${encodeURIComponent(userId)}` +
      `&idToken=${encodeURIComponent(idToken)}`;
    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width:300, height:300 });
    qEl.style.display = "block";

    // 5) まず一度だけ累計ポイントをフェッチして表示
    await fetchAndDisplayTotal(userId);

    // 6) SignalR ハブ接続開始（リアルタイム更新）
    startSignalR(userId);

  } catch (err) {
    console.error("LIFF 初期化エラー", err);
  }
});

/**
 * 初回表示用：Azure Function の getScanResult を叩いて
 * 返ってきた totalPoints を一度だけ表示します
 */
async function fetchAndDisplayTotal(userId) {
  try {
    const url = `${APP_CONFIG.SCAN_RESULT_URL}?code=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.scanned) {
      const pointEl = document.getElementById("pointDisplay");
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";
    }
  } catch (err) {
    console.error("初期ポイント取得エラー", err);
  }
}

async function startSignalR() {
  try {
    // 1) negotiate を GET で呼び出し
    const resp = await fetch(APP_CONFIG.NEGOTIATE_URL, { method: "GET" });
    if (!resp.ok) throw new Error(`negotiate HTTP ${resp.status}`);
    const connInfo = await resp.json();

    // 2) ハブ接続を構築
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(connInfo.url, { accessTokenFactory: () => connInfo.accessToken })
      .withAutomaticReconnect()
      .build();

    // 3) scanCompleted イベントを受信
    connection.on("scanCompleted", ({ userId, totalPoints }) => {
      const pointEl = document.getElementById("pointDisplay");
      pointEl.textContent = `現在のポイント：${totalPoints} pt`;
      pointEl.style.display = "block";
    });

    // 4) 接続開始
    await connection.start();
    console.log("SignalR 接続完了");
  } catch (err) {
    console.error("SignalR 接続エラー", err);
  }
}

