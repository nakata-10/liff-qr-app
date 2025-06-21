(async () => {
  // 1) LIFF 初期化＆ログイン確認
  await liff.init({ liffId: APP_CONFIG.LIFF_ID });
  if (!liff.isLoggedIn()) return liff.login({ redirectUri: location.href });

  // 2) QRコード生成
  const userId = liff.getContext().userId;
  const idToken = liff.getIDToken();
  const scanUrl = `${APP_CONFIG.SCAN_BASE_URL}/scan.html`
                + `?code=${encodeURIComponent(userId)}`
                + `&idToken=${encodeURIComponent(idToken)}`
                + `&userId=${encodeURIComponent(userId)}`;
  new QRCode(document.getElementById('qrcode'), { text: scanUrl, width:300, height:300 });

  // 3) ポーリング開始
  startPolling(userId);
})();

/**
 * 3秒ごとにスキャン結果を問い合わせ、
 * scanned=true が返ってきたら結果表示へ。
 */
function startPolling(code) {
  const intervalId = setInterval(async () => {
    try {
      const res = await fetch(
        `${APP_CONFIG.AZURE_FUNCTION_URL}/getScanResult?code=${encodeURIComponent(code)}`,
        { headers: { Authorization: 'Bearer ' + liff.getIDToken() } }
      );
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (json.scanned) {
        clearInterval(intervalId);
        showResult(json.totalPoints);
      }
    } catch (e) {
      console.error('ポーリングエラー:', e);
    }
  }, 3000);
}

function showResult(totalPoints) {
  document.getElementById('status').style.display = 'none';
  document.getElementById('qrcode').style.display = 'none';
  document.getElementById('pts').textContent = totalPoints;
  document.getElementById('result').style.display = 'block';
}
