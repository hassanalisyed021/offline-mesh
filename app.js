let pc = new RTCPeerConnection();
let channel;
let fileBuffer = [];
let receivedSize = 0;

const CHUNK_SIZE = 16000;

function log(msg) {
  document.getElementById("status").innerText = msg;
}

// ICE handling
pc.onicecandidate = (event) => {
  if (event.candidate === null) {
    const data = JSON.stringify(pc.localDescription);
    QRCode.toCanvas(document.getElementById("qr"), data);
  }
};

// ------------------ START SERVER ------------------
async function startServer() {
  channel = pc.createDataChannel("data");

  setupChannel();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  log("Share QR with other device");
}

// ------------------ JOIN SERVER ------------------
function joinServer() {
  const scanner = new Html5QrcodeScanner("qr", { fps: 10 });

  scanner.render(async (text) => {
    scanner.clear();

    const offer = JSON.parse(text);

    pc.ondatachannel = (event) => {
      channel = event.channel;
      setupChannel();
    };

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    QRCode.toCanvas(document.getElementById("qr"),
      JSON.stringify(pc.localDescription)
    );

    log("Show this QR back to server");
  });
}

// ------------------ RECEIVE ANSWER ------------------
async function receiveAnswer(text) {
  const answer = JSON.parse(text);
  await pc.setRemoteDescription(answer);
}

// ------------------ CHANNEL SETUP ------------------
function setupChannel() {
  channel.onopen = () => log("Connected ✅");

  channel.onmessage = (e) => {
    if (typeof e.data === "string") {
      console.log("Text:", e.data);
    } else {
      fileBuffer.push(e.data);
      receivedSize += e.data.byteLength;

      if (receivedSize >= expectedFileSize) {
        const blob = new Blob(fileBuffer);
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "received_file";
        a.click();

        fileBuffer = [];
        receivedSize = 0;
      }
    }
  };
}

// ------------------ FILE SEND ------------------
document.getElementById("fileInput").addEventListener("change", () => {
  const file = fileInput.files[0];
  sendFile(file);
});

function sendFile(file) {
  let offset = 0;

  const reader = new FileReader();

  reader.onload = (e) => {
    channel.send(e.target.result);
    offset += e.target.result.byteLength;

    if (offset < file.size) {
      readSlice(offset);
    } else {
      log("File sent ✅");
    }
  };

  function readSlice(o) {
    const slice = file.slice(o, o + CHUNK_SIZE);
    reader.readAsArrayBuffer(slice);
  }

  readSlice(0);
}
