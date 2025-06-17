// app.js

// 事前に index.html で以下を読み込んでおいてください：
// <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
// <script src="config.js"></script>

document.addEventListener('DOMContentLoaded', async () => {
  console.log('app.js loaded');
  console.log('window.APP_CONFIG:', window.APP_CONFIG);

  // 1. LIFF SDK 初期化
  try {
    await liff.init({ liffId: window.APP_CONFIG.LIFF_ID });
    console.log('▶ liff.init done, isLoggedIn:', liff.isLoggedIn());
  } catch (e) {
    console.error('LIFF SDK の初期化に失敗しました:', e);
    document.getElementById('message').textContent = 'LIFF 初期化エラー';
    return;
  }

  // 2. ログインチェック
  if (!liff.isLoggedIn()) {
    console.log('▶ 未ログイン → LIFF ログインへ');
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }

  // 3. ログイン済み表示 & ボタン有効化
  document.getElementById('message').textContent = 'ログイン済みです';
  const btn = document.getElementById('btn-generate');
  btn.disabled = false;
  btn.addEventListener('click', generateQr);
});

async function generateQr() {
  console.log('▶ generateQr called');

  // 4. ID トークン・ユーザーID取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;
  console.log('▶ ID Token & userId:', idToken ? '(token present)' : '(no token)', userId);

  // 5. 一意のコード生成
  const code = Date.now().toString();

  // 6. スキャン用 URL を組み立て
  const scanUrl = [
    `${location.origin}/scan.html`,
    `?code=${encodeURIComponent(code)}`,
    `&idToken=${encodeURIComponent(idToken)}`,
    `&userId=${encodeURIComponent(userId)}`
  ].join('');
  console.log('▶ scanUrl:', scanUrl);

  // 7. QR コード表示
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = ''; // クリア
  new QRCode(qrContainer, {
    text: scanUrl,
    width: 300,
    height: 300,
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qr-result').textContent = 'QRコードをスキャンしてください';
}
