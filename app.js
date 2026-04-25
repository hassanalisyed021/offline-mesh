let pc;
let channel;

async function startServer() {
  pc = new RTCPeerConnection();

  channel = pc.createDataChannel("data");

  channel.onmessage = (e) => {
    document.getElementById("output").innerText += "\n" + e.data;
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Display offer (simulate QR)
  document.getElementById("output").innerText =
    "SHARE THIS CODE:\n" + JSON.stringify(offer);
}

async function joinServer() {
  const offer = prompt("Paste server code:");

  pc = new RTCPeerConnection();

  pc.ondatachannel = (event) => {
    channel = event.channel;

    channel.onmessage = (e) => {
      document.getElementById("output").innerText += "\n" + e.data;
    };
  };

  await pc.setRemoteDescription(JSON.parse(offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  alert("Send this back to server:\n" + JSON.stringify(answer));
}
document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    const reader = new FileReader();
  
    reader.onload = () => {
      channel.send(reader.result);
    };
  
    reader.readAsArrayBuffer(file);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }