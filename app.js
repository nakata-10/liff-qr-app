// ============================
// 1) 事前に置き換える箇所
// ============================
const YOUR_LIFF_ID = "2007532568-4ggdRvjk"; 
const FUNCTION_BASE_URL = "https://…/awardPoints";
const AZURE_FUNCTION_KEY  = process.env.AZURE_FUNCTION_KEY;
const AZURE_FUNCTION_URL  = `${FUNCTION_BASE_URL}?code=${AZURE_FUNCTION_KEY}`;

// グローバル
let liffUserId = "";
let html5QrCode = null;

// ============================
// 2) LIFF 初期化＆ログイン
// ============================
async function initializeLiff() {
  try {
    await liff.init({ liffId: YOUR_LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    liffUserId = profile.userId;
    document.getElementById("message").innerText = `ようこそ、${profile.displayName} さん！`;

    // ログイン後にUI部を初期化
    setupQrGeneration();
    setupQrScanning();
  } catch (err) {
    console.error("LIFF init failed:", err);
    document.getElementById("message").innerText = "LINEログインに失敗しました…";
  }
}
window.addEventListener("load", initializeLiff);

// ============================
// 3) QRコード生成部分
// ============================
function setupQrGeneration() {
  const btnGenerate = document.getElementById("btn-generate");
  const qrContainer = document.getElementById("qrcode");

  btnGenerate.disabled = false;
  btnGenerate.addEventListener("click", () => {
    const text = prompt("QRコードにしたい文字列を入力：", "https://example.com/point?id=12345");
    if (!text) return alert("文字列を入力してください。");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text, width: 200, height: 200,
      colorDark: "#000", colorLight: "#fff",
      correctLevel: QRCode.CorrectLevel.H
    });
  });
}

// ============================
// 4) QRコード読み取り＆ポイント付与
// ============================
function setupQrScanning() {
  const btnScan = document.getElementById("btn-scan");
  const readerDiv = document.getElementById("qr-reader");
  const resultDiv = document.getElementById("qr-result");

  btnScan.disabled = false;
  btnScan.addEventListener("click", () => {
    readerDiv.style.display = "block";
    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: 250 };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => onScanSuccess(decodedText, resultDiv, readerDiv),
      (err) => console.warn("Scan error:", err)
    ).catch(err => {
      console.error("Camera start error:", err);
      document.getElementById("message").innerText = "カメラを起動できませんでした。";
    });
  });
}

async function onScanSuccess(decodedText, resultDiv, readerDiv) {
  await html5QrCode.stop();
  html5QrCode.clear();
  readerDiv.style.display = "none";

  resultDiv.innerText = `読み取り結果: ${decodedText}\nサーバーへ送信中…`;

  try {
    const resp = await fetch(AZURE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: liffUserId,
        points: 10,
        scanInfo: {
          qrText: decodedText,
          timestamp: new Date().toISOString()
        }
      })
    });
    const data = await resp.json();
    if (resp.ok) {
      resultDiv.innerText = `ポイント付与成功！ 現在の合計：${data.totalPoints} pt`;
    } else if (resp.status === 409) {
      resultDiv.innerText = "このQRは既に使用されています。";
    } else {
      resultDiv.innerText = data.error || "ポイント付与に失敗しました。";
    }
  } catch (err) {
    console.error("Function call error:", err);
    resultDiv.innerText = "サーバー通信中にエラーが発生しました。";
  }
}
