function connectWallet() {
  if (!window.solana) {
    alert("Install Phantom Wallet");
    return;
  }

  window.solana.connect()
    .then(res => {
      alert("Connected: " + res.publicKey.toString());
    })
    .catch(() => {
      alert("Connection failed");
    });
}

function goToExchange() {
  const mint = window.MONET_CONFIG?.MINT;

  if (!mint) {
    console.error("[MONET] Token mint unavailable from backend");
    return;
  }

  const url =
    `https://jup.ag/swap/So11111111111111111111111111111111111111112-${mint}`;
  window.open(url, "_blank");
}

window.connectWallet = connectWallet;
window.goToExchange = goToExchange;
