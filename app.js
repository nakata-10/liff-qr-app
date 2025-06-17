// app.js
import { writeText } from 'some-qr-lib'; // 例: QRコード書き出し関数

window.addEventListener('DOMContentLoaded', async () => {
  await liff.init({ liffId: APP_CONFIG.LIFF_ID });
  console.log('LIFF ready, isLoggedIn=', liff.isLoggedIn());

  if (!liff.isLoggedIn()) {
    // 未ログインならリダイレクト
    liff.login({ redirectUri: window.location.href });
    return;
  }

  // ——— ここで自動生成 ———
  generateQrCode();

  // （もしボタンも残すなら、有効化してあとから手動でも再生成できるように）
  const btn = document.getElementById('btn-generate');
  btn.disabled = false;
  btn.addEventListener('click', generateQrCode);
});

/**
 * QRコードを描画する関数
 */
async function generateQrCode() {
  console.log('▶ generateQr called');

  // LIFF からパラメータを取得
  const idToken = liff.getIDToken();
  const userId  = liff.getContext().userId;
  const scanUrl = `${window.APP_CONFIG.SCAN_BASE_URL
    }/scan.html?code=${encodeURIComponent(/* 任意のコード */)}&
      idToken=${encodeURIComponent(idToken)}&
      userId=${encodeURIComponent(userId)}`;
  
  // #qrcode に描画 (ライブラリによって書き方は変わります)
  document.getElementById('qrcode').innerHTML = '';
  new QRCode(document.getElementById('qrcode'), {
    text: scanUrl,
    width: 300,
    height: 300,
  });

  // ラベルなど出したい場合
  document.getElementById('qrcode-label').style.display = 'block';
}
