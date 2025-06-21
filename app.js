// public/app.js

;(async function() {
  // LIFF 初期化
  try {
    await liff.init({ liffId: APP_CONFIG.LIFF_ID });
  } catch (err) {
    console.error("LIFF 初期化失敗", err);
    return;
  }
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: location.href });
    return;
  }

  // 要素取得
  const viewQr   = document.getElementById("view-qr");
  const viewRes  = document.getElementById("view-result");
  const qrcodeEl = document.getElementById("qrcode");
  const statusEl = document.getElementById("status");
  const totalEl  = document.getElementById("total-points");

  // QRコード生成
  function generateQrCode() {
    qrcodeEl.innerHTML = "";
    const idToken = liff.getIDToken();
    const userId  = liff.getContext().userId;
    const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                  + `?code=${encodeURIComponent(userId)}`
                  + `&idToken=${encodeURIComponent(idToken)}`
                  + `&userId=${encodeURIComponent(userId)}`;
    new QRCode(qrcodeEl, { text: scanUrl, width: 300, height: 300 });
  }

  // ポイント付与＆結果表示
  async function handleScan(code, idToken, userId) {
    // QRビュー→結果ビュー
    viewQr.classList.remove("active");
    viewRes.classList.add("active");
    statusEl.textContent = "ポイント付与中…";

    try {
      const res = await fetch(
        `${APP_CONFIG.AZURE_FUNCTION_URL}?code=${APP_CONFIG.FUNCTION_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + idToken
          },
          body: JSON.stringify({
            userId,
            points: 10,
            scanInfo: { qrText: code, timestamp: new Date().toISOString() }
          })
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { totalPoints } = await res.json();
      statusEl.textContent = "ポイントを正常に付与しました 🎉";
      totalEl.textContent  = totalPoints;
    } catch (err) {
      console.error(err);
      statusEl.textContent = "エラーが発生しました: " + err.message;
    }

    // 5秒後に再びQRビュー
    setTimeout(() => {
      viewRes.classList.remove("active");
      viewQr.classList.add("active");
      generateQrCode();
      // URLパラメータを消しておく
      history.replaceState(null, "", location.pathname);
    }, 5000);
  }

  // 初期表示：QRを生成
  generateQrCode();

  // もし scan.html 経由で ?code= が付いていれば handleScan を呼ぶ
  const params = new URLSearchParams(location.search);
  if (params.has("code")) {
    const code    = params.get("code");
    const idToken = params.get("idToken");
    const userId  = params.get("userId");
    await handleScan(code, idToken, userId);
  }
})();
