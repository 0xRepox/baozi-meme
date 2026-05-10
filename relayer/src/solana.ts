import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { createHash } from "crypto";
import fs from "fs";

export const PROGRAM_ID = new PublicKey("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");
export const MINT_PUBKEY = new PublicKey(process.env.MINT_PUBKEY!);
export const TREASURY_PUBKEY = new PublicKey(process.env.TREASURY_PUBKEY!);
export const CURVE_TOKEN_ACCOUNT = new PublicKey(process.env.CURVE_TOKEN_ACCOUNT!);

export function getConnection(): Connection {
  return new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
}

export function getRelayerKeypair(): Keypair {
  const raw = process.env.RELAYER_PRIVATE_KEY;
  if (!raw) throw new Error("RELAYER_PRIVATE_KEY not set");
  return Keypair.fromSecretKey(bs58.decode(raw));
}

export function getBondingCurvePda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding_curve"), MINT_PUBKEY.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getUserAccountPda(wallet: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user_account"), wallet.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function discriminator(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

export function encodeU64(value: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value);
  return buf;
}

export async function buildRegisterUserTx(userPubkey: PublicKey): Promise<Transaction> {
  const connection = getConnection();
  const relayer = getRelayerKeypair();
  const userAccountPda = getUserAccountPda(userPubkey);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: userAccountPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: discriminator("register_user"),
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = relayer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.partialSign(relayer);
  return tx;
}

export async function buildBuyTx(userPubkey: PublicKey, quantity: number = 1): Promise<Transaction> {
  const qty = Math.max(1, Math.min(10, Math.floor(quantity)));
  const connection = getConnection();
  const relayer = getRelayerKeypair();
  const bondingCurvePda = getBondingCurvePda();
  const userAccountPda = getUserAccountPda(userPubkey);
  const userTokenAccount = await getAssociatedTokenAddress(MINT_PUBKEY, userPubkey);

  const tx = new Transaction();
  tx.feePayer = relayer.publicKey;

  // Increase compute budget for batch mints (each buy ~25k CU)
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 60_000 * qty + 50_000 }));

  // Create ATA if it doesn't exist — relayer pays so user only signs once
  const ataInfo = await connection.getAccountInfo(userTokenAccount);
  if (!ataInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      userPubkey, userTokenAccount, userPubkey, MINT_PUBKEY
    ));
  }

  const minTokensOut = encodeU64(0n);
  const buyIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: userAccountPda, isSigner: false, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: true },
      { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
      { pubkey: CURVE_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([discriminator("buy"), minTokensOut]),
  });

  // Add one buy instruction per mint slot requested
  for (let i = 0; i < qty; i++) tx.add(buyIx);

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.partialSign(relayer);
  return tx;
}

export async function buildSellTx(userPubkey: PublicKey, tokenAmount: bigint): Promise<Transaction> {
  const connection = getConnection();
  const relayer = getRelayerKeypair();
  const bondingCurvePda = getBondingCurvePda();
  const userTokenAccount = await getAssociatedTokenAddress(MINT_PUBKEY, userPubkey);

  const data = Buffer.concat([
    discriminator("sell"),
    encodeU64(tokenAmount),
    encodeU64(0n), // min_sol_out
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: bondingCurvePda, isSigner: false, isWritable: true },
      { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
      { pubkey: CURVE_TOKEN_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = relayer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.partialSign(relayer);
  return tx;
}

export async function getUserStatus(wallet: PublicKey) {
  const connection = getConnection();
  const userAccountPda = getUserAccountPda(wallet);
  const info = await connection.getAccountInfo(userAccountPda);

  if (!info) return { registered: false, mintsUsed: 0, mintsRemaining: 10, totalSpentLamports: 0 };

  // UserAccount layout (after 8-byte discriminator):
  // wallet: Pubkey (32)
  // mints_used: u8 (1)
  // total_spent_lamports: u64 (8)
  // registered_at: i64 (8)
  // bump: u8 (1)
  const data = info.data;
  const mintsUsed = data[8 + 32];
  const totalSpent = Number(data.readBigUInt64LE(8 + 32 + 1));

  return {
    registered: true,
    mintsUsed,
    mintsRemaining: 10 - mintsUsed,
    totalSpentLamports: totalSpent,
  };
}
