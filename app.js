// public/app.js

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) LIFF 初期化
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });

    // 2) 未ログインならログイン画面へリダイレクト
    if (!liff.isLoggedIn()) {
      return liff.login({ redirectUri: window.location.href });
    }

    // 3) ログイン済み → UI 表示 & QR を生成
    document.getElementById('title').classList.add('visible');
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'QRコードを生成中…';
    statusEl.classList.add('visible');

    generateQrCode();

    // 4) ポイント取得ポーリング開始（匿名アクセス）
    const idToken = liff.getIDToken();
    const userId  = liff.getContext().userId || "";
    startPointPolling(userId, idToken);

  } catch (err) {
    console.error('LIFF 初期化エラー', err);
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'エラーが発生しました。';
    statusEl.classList.add('visible');
  }
});

function generateQrCode() {
  console.log("▶ generateQrCode called");

  // LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";  
  const code    = userId;  // ユニークコードとして userId を利用

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

let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const displayEl = document.getElementById("pointDisplay");
  // config.js の AZURE_FUNCTION_URL を使用
  const apiUrl = `${APP_CONFIG.AZURE_FUNCTION_URL}`
               + `?userId=${encodeURIComponent(userId)}`
               + `&code=${encodeURIComponent(userId)}`;

  console.log("▶ ポーリング先URL:", apiUrl);

  // 5秒ごとに API を叩いてポイントを取得
  pollIntervalId = setInterval(async () => {
    try {
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // { points: 123 } の形式を想定
      displayEl.textContent = `現在のポイント：${data.points} pt`;
      displayEl.classList.add('visible');

      // ポイントが 1 以上になったら一度だけ停止
      if (data.points >= 1) {
        clearInterval(pollIntervalId);
      }
    } catch (err) {
      console.error("ポイント取得エラー", err);
      displayEl.textContent = "ポイント取得エラー";
      displayEl.classList.add('visible');
      // 必要なら clearInterval(pollIntervalId); で停止
    }
  }, 5000);
}
