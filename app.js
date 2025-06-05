// 【1】ここに、あとで LINE Developers で発行される LIFF ID を書き換えます
const YOUR_LIFF_ID = "YOUR_LIFF_ID_HERE";

// 【2】ここに Azure Functions のエンドポイント URL (Function Key付き) を書き換えます
// 例: "https://<your-function-app>.azurewebsites.net/api/HttpTrigger1?code=<FUNCTION_KEY>"
const AZURE_FUNCTION_URL = "https://<your-function-app>.azurewebsites.net/api/HttpTrigger1?code=<YOUR_FUNCTION_KEY>";

let liffUserId = null;

window.onload = () => {
  // 1) LIFF 初期化
  liff
    .init({ liffId: YOUR_LIFF_ID })
    .then(() => {
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        liffUserId = liff.getContext().userId;
        document.getElementById("content").style.display = "block";
      }
    })
    .catch((err) => {
      document.getElementById("liff-init-error").innerText =
        "LIFF の初期化に失敗しました: " + JSON.stringify(err);
    });

  // 2) 「QRコードをスキャンする」ボタン押下時の処理
  document.getElementById("btn-scan").addEventListener("click", () => {
    document.getElementById("btn-scan").style.display = "none";
    document.getElementById("qr-reader").style.display = "block";
    startQrScanner();
  });
};

/**
 * QRコードスキャンの初期化とコールバック
 */
function startQrScanner() {
  const html5QrcodeScanner = new Html5Qrcode("qr-reader");
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // スキャンしたテキストを qrId として使用
    const qrId = decodedText.trim();
    // スキャン停止
    html5QrcodeScanner.stop().then(() => {
      document.getElementById("qr-reader").style.display = "none";
      // ポイント付与 API を呼び出し
      awardPoints(qrId);
    });
  };

  const config = { fps: 10, qrbox: 250 };
  html5QrcodeScanner
    .start({ facingMode: "environment" }, config, qrCodeSuccessCallback)
    .catch((err) => {
      document.getElementById("status").innerText = "カメラ起動に失敗: " + err;
    });
}

/**
 * Azure Functions にポイント付与を依頼
 */
function awardPoints(qrId) {
  if (!liffUserId) {
    document.getElementById("status").innerText = "ユーザー情報が取得できませんでした";
    return;
  }
  document.getElementById("status").innerText = "ポイント付与中…";

  fetch(AZURE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: liffUserId, qrId: qrId }),
  })
    .then((res) =>
      res.json().then((body) => ({ status: res.status, body }))
    )
    .then(({ status, body }) => {
      if (status === 200) {
        document.getElementById("status").innerText =
          `ポイント付与成功！ 現在の残高：${body.points} pt`;
      } else if (status === 409) {
        document.getElementById("status").innerText = "すでに付与済みのQRです";
      } else {
        document.getElementById("status").innerText =
          "ポイント付与に失敗しました: " + (body.error || JSON.stringify(body));
      }
    })
    .catch((err) => {
      document.getElementById("status").innerText = "通信エラー: " + err;
    });
}
