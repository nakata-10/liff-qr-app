// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 未ログインならログイン
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: location.href });
    }

    const userId  = liff.getContext().userId;
    const idToken = liff.getIDToken();

    // QRコード生成 (scan.html へのリンクに code と idToken を渡す)
    const scanUrl =
      `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
      `?code=${encodeURIComponent(userId)}` +
      `&idToken=${encodeURIComponent(idToken)}`;

    const qEl = document.getElementById("qrcode");
    qEl.innerHTML = "";
    new QRCode(qEl, { text: scanUrl, width: 300, height: 300 });
    qEl.style.display = "block";

    // ポイント表示ポーリング開始
    startPointPolling(userId);
  } catch (err) {
    console.error("LIFF 初期化エラー", err);
  }
});

let pollIntervalId = null;
function startPointPolling(userId) {
  const pointEl   = document.getElementById("pointDisplay");
  const resultUrl = `${APP_CONFIG.SCAN_RESULT_URL}?code=${encodeURIComponent(userId)}`;
  let reloaded = false;

  async function fetchPoints() {
    try {
      const res = await fetch(resultUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // スキャンされていなければ何もしない
      if (!data.scanned) return;

      // 累計ポイントを表示
      pointEl.textContent = `現在のポイント：${data.totalPoints} pt`;
      pointEl.style.display = "block";

      // ポーリングを停止
      clearInterval(pollIntervalId);

      // 一度だけ、指定秒後に自動リロード
      if (!reloaded) {
        reloaded = true;
        setTimeout(() => {
          // URL にキャッシュバスターを付けて強制リロード
          const base = window.location.href.split("?")[0];
          window.location.href = `${base}?_=${Date.now()}`;
        }, 7000);  // ← リロードまでの遅延（ミリ秒）を調整
      }
    } catch (err) {
      console.error("ポイント取得エラー", err);
    }
  }

  // 即時チェック＋以降3秒ごと
  fetchPoints();
  pollIntervalId = setInterval(fetchPoints, 3000);
}
