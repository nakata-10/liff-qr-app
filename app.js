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
  const userId  = liff.getContext().userId || "";  // 必要に応じてダミーを設定
  const code    = userId;                          // ユニークコードとして userId を利用
  startPointPolling(userId, idToken);

  // ↓ ここをテンプレートリテラルで組み立て
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html` +
                  `?code=${encodeURIComponent(code)}` +
                  `&idToken=${encodeURIComponent(idToken)}` + //この部分をお店の名前に変更する、＋GASのデータベースからお店の名前を取得するようにする。
                  `&userId=${encodeURIComponent(userId)}`;

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
// ──────── ここから追記 ────────
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const displayEl = document.getElementById("pointDisplay");

   // LIFF から情報取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId || "";  // 必要に応じてダミーを設定
  const code    = userId;                          // ユニークコードとして userId を利用
  
  // クエリ文字列に Function Key を付与
  const apiUrl = `${APP_CONFIG.AZURE_FUNCTION_URL}?code=${encodeURIComponent(code)}`
               + `&userId=${encodeURIComponent(userId)}`
               + `&functionKey=${encodeURIComponent(APP_CONFIG.FUNCTION_KEY)}`;

  // 5 秒ごとに API を呼び出し
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

      // 条件を満たしたらポーリング停止（例：1pt 以上になったら）
      if (data.points >= 1) {
        clearInterval(pollIntervalId);
      }
    } catch (err) {
      console.error("ポイント取得エラー", err);
      displayEl.textContent = "ポイント取得エラー";
      displayEl.classList.add('visible');
      // 必要なら clearInterval(pollIntervalId) して停止
    }
  }, 5000);
}
// ──────── ここまで追記 ────────
