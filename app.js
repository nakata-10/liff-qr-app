// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン画面へリダイレクト
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    // 3) UI 表示
    document.getElementById('title').classList.add('visible');
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'QRコードを生成中…';
    statusEl.classList.add('visible');

    // 4) LIFF トークン・ユーザー情報取得
    const idToken = liff.getIDToken();
    const userId  = liff.getContext().userId || "";

    // 5) QR コード生成 & ポーリング開始
    generateQrCode(userId, idToken);
    startPointPolling(userId, idToken);

  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});

/**
 * QRコードを生成して表示する
 */
function generateQrCode(userId, idToken) {
  console.log("▶ generateQrCode called");

  const code = userId;  // ユニークコードとして userId を利用

  // スキャン先 URL を組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(code)}`
                + `&idToken=${encodeURIComponent(idToken)}`
                + `&userId=${encodeURIComponent(userId)}`;

  // QRコード描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  // QR要素とステータスを表示
  qEl.classList.add('visible');
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';
}

/**
 * 定期的に Azure Function に POST してポイントを取得し、表示する
 */
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const displayEl = document.getElementById("pointDisplay");
  const apiUrl = APP_CONFIG.AZURE_FUNCTION_URL;  // 例: https://line-func-app.azurewebsites.net/awardPoints

  console.log("▶ ポーリング先URL:", apiUrl);

  pollIntervalId = setInterval(async () => {
    try {
      const res = await fetch(apiUrl, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId:  userId,
          points: 10,
          scanInfo: {
            timestamp: new Date().toISOString()
          }
        })
      });

      console.log("▶ リクエスト送信完了, status=", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      displayEl.textContent = `現在のポイント：${data.points} pt`;
      displayEl.classList.add("visible");

      // ポイントが 1pt 以上になったら一度だけ停止
      if (data.points >= 1) {
        clearInterval(pollIntervalId);
      }
    } catch (err) {
      console.error("ポイント取得エラー", err);
      displayEl.textContent = "ポイント取得エラー";
      displayEl.classList.add("visible");
      // 必要なら clearInterval(pollIntervalId);
    }
  }, 5000);
}
