// app.js

// 設定は public/config.js で読み込まれる
const { LIFF_ID, AZURE_FUNCTION_URL } = window.APP_CONFIG;

async function initializeLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    // profile と openid スコープでログインを要求
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
  // ログイン済みならメッセージ更新＆ボタン有効化
  document.getElementById('message').textContent = 'ログイン済みです';
  document.getElementById('btn-generate').disabled = false;
}

function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    // 前回の QR と結果表示をクリア
    document.getElementById('qrcode').innerHTML   = '';
    document.getElementById('qr-result').textContent = '';

    // 一意のコード + LIFF トークン／ユーザーID を取得
    const codeText = Date.now().toString();
    const idToken  = liff.getIDToken();
    const userId   = liff.getContext().userId;

    // scan.html への絶対 URL を組み立て
    const link = 
      `https://nakata-10.github.io/liff-qr-app/scan.html` +
      `?code=${encodeURIComponent(codeText)}` +
      `&idToken=${encodeURIComponent(idToken)}` +
      `&userId=${encodeURIComponent(userId)}`;

    // QR コード生成
    new QRCode(document.getElementById('qrcode'), {
      text: link,
      width: 200,
      height: 200,
    });
  });
}

// ページ読み込み後に実行
initializeLiff().then(() => {
  setupQrGeneration();
});
