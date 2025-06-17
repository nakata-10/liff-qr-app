// app.js

// 事前に index.html 等で
// <script src="config.js"></script>             ← APP_CONFIG を定義したファイル
// <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>  ← QRCode.js
// を読み込んでおいてください。

document.addEventListener('DOMContentLoaded', async () => {
  // 1. LIFF 初期化
  await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
  
  // 2. 未ログインならログインへリダイレクト
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return;
  }

  // 3. ボタン有効化
  const btn = document.getElementById('btn-generate');
  btn.disabled = false;
  btn.addEventListener('click', generateQr);
});

async function generateQr() {
  // 4. ID トークン取得
  const idToken = liff.getIDToken();
  
  // 5. 一意のコード（例：タイムスタンプ）を生成
  const code = Date.now().toString();
  
  // 6. スキャン用 URL を組み立て
  const scanUrl = [
    `${location.origin}/scan.html`,
    `?code=${encodeURIComponent(code)}`,
    `&idToken=${encodeURIComponent(idToken)}`,
    `&liffClientId=${encodeURIComponent(window.APP_CONFIG.LIFF_ID)}`,
    `&liffRedirectUri=${encodeURIComponent(window.location.href)}`
  ].join('');

  // 7. 画面に QR コードを表示
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';  // クリア
  new QRCode(qrContainer, {
    text: scanUrl,
    width: 300,
    height: 300,
    correctLevel: QRCode.CorrectLevel.M
  });

  // 8. Azure Function（ポイント付与ロジック）に事前登録／通知する場合
  //    （必要ならここで fetch してください）
  /*
  fetch(window.APP_CONFIG.FUNCTION_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      userId: liff.getContext().userId,
      points: 0,            // 生成通知なら 0
      scanInfo: { code }
    })
  })
  .then(res => res.json())
  .then(json => console.log('通知結果', json))
  .catch(err => console.error('通知エラー', err));
  */
}
