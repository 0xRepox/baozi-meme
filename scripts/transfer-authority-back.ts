import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import { readFileSync } from "fs";
import { createHash } from "crypto";

const PROGRAM_ID  = new PublicKey("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");
const MINT_PUBKEY = new PublicKey("Cux2eGKP4oBg1MZ1MLRpULPTyHvtSMDEZEZcHN7WSTdR");
const COLD_KEY    = new PublicKey("9XJBGVLCM83upbNtV7TmuYkJEizF4vqhsZ4zoaAJfxhz");

function discriminator(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  // Cold key needs to sign — we need the cold keypair file
  const coldKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(process.argv[2], "utf8")))
  );
  const hotKey = new PublicKey("9CPEMRrNF9THDBcezXLaRThKtshqtxzeWCYmqfvbsgEs");

  const [mintStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_state"), MINT_PUBKEY.toBuffer()], PROGRAM_ID
  );

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: coldKeypair.publicKey, isSigner: true,  isWritable: true  },
      { pubkey: mintStatePda,          isSigner: false, isWritable: true  },
      { pubkey: hotKey,                isSigner: false, isWritable: false },
    ],
    data: discriminator("transfer_authority"),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = coldKeypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const sig = await sendAndConfirmTransaction(connection, tx, [coldKeypair]);
  console.log("✅ Authority back to hot wallet:", sig);
}
main().catch(e => { console.error("❌", e.message); process.exit(1); });
