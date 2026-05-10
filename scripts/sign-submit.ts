import { Connection, Keypair, Transaction } from "@solana/web3.js";
import { readFileSync } from "fs";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync("/tmp/test-wallet.json", "utf8")))
  );
  const txBase64 = process.argv[2];
  const txBuf = Buffer.from(txBase64, "base64");
  const tx = Transaction.from(txBuf);
  tx.partialSign(wallet);
  const raw = tx.serialize({ requireAllSignatures: false });
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false });
  console.log("Sent:", sig);
  const result = await connection.confirmTransaction(sig, "confirmed");
  if (result.value.err) throw new Error(JSON.stringify(result.value.err));
  console.log("✅ Confirmed:", sig);
}
main().catch(e => { console.error("❌", e.message); process.exit(1); });
