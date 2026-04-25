let pc;
let channel;

function log(msg) {
  document.getElementById("output").innerText = msg;
}

// Utility: encode/decode
function encode(data) {
  return btoa(JSON.stringify(data));
}

function decode(data) {
  return JSON.parse(atob(data));
}

// START SERVER
async function startServer() {
  pc = new RTCPeerConnection();

  channel = pc.createDataChannel("data");

  setupChannel();

  let iceCandidates = [];

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      iceCandidates.push(event.candidate);
    } else {
      // Done gathering
      const payload = {
        offer: pc.localDescription,
        ice: iceCandidates
      };

      log("Share this code:\n\n" + encode(payload));
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
}

// JOIN SERVER
async function joinServer() {
  const input = prompt("Paste server code:");
  const data = decode(input);

  pc = new RTCPeerConnection();

  pc.ondatachannel = (event) => {
    channel = event.channel;
    setupChannel();
  };

  let iceCandidates = [];

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      iceCandidates.push(event.candidate);
    } else {
      const payload = {
        answer: pc.localDescription,
        ice: iceCandidates
      };

      alert("Send this back to server:\n\n" + encode(payload));
    }
  };

  await pc.setRemoteDescription(data.offer);

  for (let c of data.ice) {
    await pc.addIceCandidate(c);
  }

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
}

// COMPLETE CONNECTION (SERVER SIDE)
async function completeConnection() {
  const input = prompt("Paste answer code:");
  const data = decode(input);

  await pc.setRemoteDescription(data.answer);

  for (let c of data.ice) {
    await pc.addIceCandidate(c);
  }

  log("✅ Connected!");
}

// CHANNEL SETUP
function setupChannel() {
  channel.onopen = () => log("✅ Connected!");
  channel.onmessage = handleReceive;
}

// FILE SEND
document.getElementById("fileInput").addEventListener("change", function () {
  const file = this.files[0];
  const reader = new FileReader();

  reader.onload = () => {
    const chunkSize = 16000;
    let offset = 0;

    while (offset < reader.result.byteLength) {
      channel.send(reader.result.slice(offset, offset + chunkSize));
      offset += chunkSize;
    }

    channel.send("EOF"); // End of file
  };

  reader.readAsArrayBuffer(file);
});

// FILE RECEIVE
let receivedBuffers = [];

function handleReceive(event) {
  if (event.data === "EOF") {
    const blob = new Blob(receivedBuffers);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "received_file";
    a.click();

    receivedBuffers = [];
    return;
  }

  receivedBuffers.push(event.data);
}
