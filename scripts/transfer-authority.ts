import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { readFileSync } from "fs";
import { createHash } from "crypto";

const PROGRAM_ID = new PublicKey("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");
const MINT_PUBKEY = new PublicKey("Cux2eGKP4oBg1MZ1MLRpULPTyHvtSMDEZEZcHN7WSTdR");
const NEW_AUTHORITY = new PublicKey("9XJBGVLCM83upbNtV7TmuYkJEizF4vqhsZ4zoaAJfxhz");

function discriminator(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const authority = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync("../relayer/relayer-keypair.json", "utf8")))
  );

  const [mintStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_state"), MINT_PUBKEY.toBuffer()],
    PROGRAM_ID
  );

  console.log("Current authority:", authority.publicKey.toBase58());
  console.log("New authority (cold):", NEW_AUTHORITY.toBase58());
  console.log("MintState PDA:", mintStatePda.toBase58());

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true,  isWritable: true  },
      { pubkey: mintStatePda,        isSigner: false, isWritable: true  },
      { pubkey: NEW_AUTHORITY,       isSigner: false, isWritable: false },
    ],
    data: discriminator("transfer_authority"),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = authority.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
  console.log("✅ Authority transferred:", sig);
  console.log("\nFrom now on, graduate + emergency_withdraw require the cold key.");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
