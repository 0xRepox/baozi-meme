import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import "dotenv/config";

const PROGRAM_ID = new PublicKey("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");
const RPC = process.env.RPC_URL ?? "https://api.devnet.solana.com";

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function discriminator(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const authority = loadKeypair("./relayer/relayer-keypair.json");
  const treasury = loadKeypair("./relayer/treasury-keypair.json");
  const mint = Keypair.generate();

  console.log("Authority:", authority.publicKey.toBase58());
  console.log("Treasury: ", treasury.publicKey.toBase58());
  console.log("Mint:     ", mint.publicKey.toBase58());

  const [bondingCurvePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding_curve"), mint.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Curve PDA:", bondingCurvePda.toBase58());

  // --- Step 1: initialize (creates bonding_curve PDA + mint) ---
  const ix1 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: true },
      { pubkey: mint.publicKey, isSigner: true, isWritable: true },
      { pubkey: treasury.publicKey, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("initialize"),
  });

  const tx1 = new Transaction().add(ix1);
  tx1.feePayer = authority.publicKey;
  tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx1.sign(authority, mint);

  console.log("\n[1/2] Sending initialize...");
  const sig1 = await sendAndConfirmTransaction(connection, tx1, [authority, mint]);
  console.log("✅ Done:", sig1);

  // --- Step 2: create_curve_token_account ---
  const curveTokenAccount = Keypair.generate();

  console.log("Curve Token Account:", curveTokenAccount.publicKey.toBase58());

  const ix2 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: false },
      { pubkey: mint.publicKey, isSigner: false, isWritable: false },
      { pubkey: curveTokenAccount.publicKey, isSigner: true, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("create_curve_token_account"),
  });

  const tx2 = new Transaction().add(ix2);
  tx2.feePayer = authority.publicKey;
  tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx2.sign(authority, curveTokenAccount);

  console.log("\n[2/2] Creating curve token account...");
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [authority, curveTokenAccount]);
  console.log("✅ Done:", sig2);

  // Save results
  writeFileSync("./relayer/mint-keypair.json", JSON.stringify(Array.from(mint.secretKey)));

  console.log("\n=== SUCCESS ===");
  console.log("MINT_PUBKEY=" + mint.publicKey.toBase58());
  console.log("CURVE_TOKEN_ACCOUNT=" + curveTokenAccount.publicKey.toBase58());
  console.log("\nAdd MINT_PUBKEY to relayer/.env");
}

main().catch((e) => {
  console.error("\nFailed:", e.message);
  process.exit(1);
});
