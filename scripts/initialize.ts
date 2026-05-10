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
  const authority = loadKeypair("../relayer/relayer-keypair.json");
  const mint = Keypair.generate();

  const [mintStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_state"), mint.publicKey.toBuffer()],
    PROGRAM_ID
  );

  console.log("Authority (treasury): ", authority.publicKey.toBase58());
  console.log("Mint:                 ", mint.publicKey.toBase58());
  console.log("MintState PDA:        ", mintStatePda.toBase58());

  // --- Step 1: initialize (creates MintState PDA + SPL mint) ---
  const ix1 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true,  isWritable: true  },
      { pubkey: mintStatePda,        isSigner: false, isWritable: true  },
      { pubkey: mint.publicKey,      isSigner: true,  isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,    isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("initialize"),
  });

  const tx1 = new Transaction().add(ix1);
  tx1.feePayer = authority.publicKey;
  tx1.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx1.sign(authority, mint);

  console.log("\n[1/2] initialize...");
  const sig1 = await sendAndConfirmTransaction(connection, tx1, [authority, mint]);
  console.log("✅", sig1);

  // --- Step 2: create_mint_state_token_account (creates ATA + mints LP_RESERVE) ---
  const mintStateTokenAccount = Keypair.generate();

  console.log("MintState Token Account:", mintStateTokenAccount.publicKey.toBase58());

  const ix2 = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey,              isSigner: true,  isWritable: true  },
      { pubkey: mintStatePda,                     isSigner: false, isWritable: true  },
      { pubkey: mint.publicKey,                   isSigner: false, isWritable: true  },
      { pubkey: mintStateTokenAccount.publicKey,  isSigner: true,  isWritable: true  },
      { pubkey: TOKEN_PROGRAM_ID,                 isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId,          isSigner: false, isWritable: false },
    ],
    data: discriminator("create_mint_state_token_account"),
  });

  const tx2 = new Transaction().add(ix2);
  tx2.feePayer = authority.publicKey;
  tx2.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx2.sign(authority, mintStateTokenAccount);

  console.log("\n[2/2] create_mint_state_token_account (mints 5B LP reserve)...");
  const sig2 = await sendAndConfirmTransaction(connection, tx2, [authority, mintStateTokenAccount]);
  console.log("✅", sig2);

  // Save mint keypair for reference
  writeFileSync("../relayer/mint-keypair.json", JSON.stringify(Array.from(mint.secretKey)));

  console.log("\n=== SUCCESS ===");
  console.log("MINT_PUBKEY=" + mint.publicKey.toBase58());
  console.log("TREASURY_PUBKEY=" + authority.publicKey.toBase58());
  console.log("\nAdd these to relayer/.env and Railway env vars");
}

main().catch((e) => {
  console.error("\nFailed:", e.message);
  process.exit(1);
});
