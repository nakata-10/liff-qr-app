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

    // 4) LIFF 情報を取得（一度だけ宣言）
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
 * ユーザーIDとトークンを引数で受け取って QR を生成
 */
function generateQrCode(userId, idToken) {
  console.log("▶ generateQrCode called");

  const code = userId;  // ユニークコードとして userId を利用

  // スキャン先 URL を組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(code)}`
                + `&idToken=${encodeURIComponent(idToken)}`
                + `&userId=${encodeURIComponent(userId)}`;

  // QR コード描画
  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  // 要素を表示
  qEl.classList.add('visible');
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';
}

/**
 * ユーザーIDとトークンを引数で受け取って定期的にポイントを取得（POST）
 */
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const displayEl = document.getElementById("pointDisplay");
  const apiUrl = APP_CONFIG.AZURE_FUNCTION_URL;  // 例: https://line-func-app.azurewebsites.net/awardPoints

  console.log("▶ ポーリング先URL:", apiUrl);

  // 5秒ごとに API を叩いてポイントを取得
  pollIntervalId = setInterval(async () => {
    try {
      const res = await fetch(apiUrl, {
        method:  "POST",                    // ここを POST に固定
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({             // クエリではなく JSON ボディ
          
          code:    userId,    // 関数で req.body.code を読むなら
          idToken: idToken,    // 関数で req.body.idToken を読むなら
          userId:  userId
          
          
        })
      });

      console.log("▶ リクエスト送信完了, status=", res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      displayEl.textContent = `現在のポイント：${data.points} pt`;
      displayEl.classList.add("visible");

      // 1pt 以上になったら一度だけ停止
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
