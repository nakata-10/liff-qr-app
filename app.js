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

    // 4) LIFF トークン＆ユーザーID 取得
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


  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(userId)}`
                + `&idToken=${encodeURIComponent(idToken)}`;
                + `&userId=${encodeURIComponent(userId)}`;

  const qEl = document.getElementById('qrcode');
  qEl.innerHTML = '';
  new QRCode(qEl, {
    text: scanUrl,
    width: 300,
    height: 300
  });

  qEl.classList.add('visible');
  const statusEl = document.getElementById('status');
  statusEl.textContent = 'この QR コードをスキャンしてください';
}

/**
 * 初回は POST で awardPoints、
 * 以降は GET で getScanResult を呼んで累計ポイントを取得するポーリング
 */
let pollIntervalId = null;
function startPointPolling(userId, idToken) {
  const displayEl = document.getElementById("pointDisplay");
  const awardUrl      = APP_CONFIG.AZURE_FUNCTION_URL;      // awardPoints の URL
  const resultUrlBase = APP_CONFIG.SCAN_RESULT_URL;        // getScanResult の URL, 例 "https://…/getScanResult"

  let awarded = false;

  pollIntervalId = setInterval(async () => {
    try {
      let res, data;

      if (!awarded) {
        // 初回：ポイント付与
        res = await fetch(awardUrl, {
          method: "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            userId:  userId,
            points:  150,
            scanInfo: {
              qrText:    userId,
              timestamp: new Date().toISOString()
            }
          })
        });
        console.log("▶ awardPoints status=", res.status);
        if (!res.ok) throw new Error(`awardPoints HTTP ${res.status}`);
        data = await res.json();
        console.log("▶ awardPoints response:", data);

        awarded = true;

      } else {
        // ２回目以降：累計ポイント取得
        const url = `${resultUrlBase}?code=${encodeURIComponent(userId)}`;
        res = await fetch(url, {
          method: "GET",
          headers: { "Authorization": `Bearer ${idToken}` }
        });
        console.log("▶ getScanResult status=", res.status);
        if (!res.ok) throw new Error(`getScanResult HTTP ${res.status}`);
        data = await res.json();
        console.log("▶ getScanResult response:", data);

        // data には { scanned: boolean, totalPoints?: number } が返る
        if (!data.scanned) {
          displayEl.textContent = "まだスキャンされていません";
          displayEl.classList.add("visible");
          return;
        }
      }

      // 累計ポイントを取り出す (awardPoints と getScanResult でキー名が違う場合に対応)
      const current = data.totalPoints ?? data.points;
      displayEl.textContent = `現在のポイント：${current} pt`;
      displayEl.classList.add("visible");

      // ポーリングを続ける必要がなければここで停止
      // clearInterval(pollIntervalId);

    } catch (err) {
      console.error("ポイント取得エラー", err);
      displayEl.textContent = "ポイント取得エラー";
      displayEl.classList.add("visible");
    }
  }, 5000);
}
