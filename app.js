// 設定は config.js で読み込まれる
const { LIFF_ID } = window.APP_CONFIG;

// 1) LIFF 初期化とログイン
async function initializeLiff() {
  await liff.init({ liffId: LIFF_ID });
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href, scope: 'profile openid' });
    return;
  }
  // ログイン済みならボタン有効化＆メッセージ更新
  document.getElementById('message').textContent = 'ログイン済みです';
  document.getElementById('btn-generate').disabled = false;
}

// 2) QR 生成のみ
function setupQrGeneration() {
  document.getElementById('btn-generate').addEventListener('click', () => {
    const codeText = Date.now().toString();
    new QRCode(document.getElementById('qrcode'), {
      text: codeText,
      width: 200,
      height: 200,
    });
    // ポイント付与呼び出しは行わない
  });
}

// 初期化後に処理セットアップ
initializeLiff().then(() => {
  setupQrGeneration();
});
