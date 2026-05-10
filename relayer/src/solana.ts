import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes/index.js";
import { createHash } from "crypto";

export const PROGRAM_ID = new PublicKey("51FZiDCAqQMYwGxv9YgQa6jv3bs5r263PomDMrPPyg8E");
export const MINT_PUBKEY = new PublicKey(process.env.MINT_PUBKEY!);

export function getConnection(): Connection {
  return new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
}

export function getRelayerKeypair(): Keypair {
  const raw = process.env.RELAYER_PRIVATE_KEY;
  if (!raw) throw new Error("RELAYER_PRIVATE_KEY not set");
  return Keypair.fromSecretKey(bs58.decode(raw));
}

export function getMintStatePda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_state"), MINT_PUBKEY.toBuffer()],
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

export function encodeU8(value: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeUInt8(value);
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

export async function getMintStateAuthority(): Promise<PublicKey> {
  const connection = getConnection();
  const mintStatePda = getMintStatePda();
  const info = await connection.getAccountInfo(mintStatePda);
  if (!info) throw new Error("MintState PDA not found — program not initialized");
  // MintState layout: discriminator(8) + mint(32) + authority(32)
  return new PublicKey(info.data.slice(40, 72));
}

export async function buildMintTx(userPubkey: PublicKey, quantity: number = 1): Promise<Transaction> {
  const qty = Math.max(1, Math.min(10, Math.floor(quantity)));
  const connection = getConnection();
  const relayer = getRelayerKeypair();
  const mintStatePda = getMintStatePda();
  const userAccountPda = getUserAccountPda(userPubkey);
  const userTokenAccount = await getAssociatedTokenAddress(MINT_PUBKEY, userPubkey);
  const treasury = await getMintStateAuthority();

  const tx = new Transaction();
  tx.feePayer = relayer.publicKey;

  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 80_000 }));

  const ataInfo = await connection.getAccountInfo(userTokenAccount);
  if (!ataInfo) {
    tx.add(createAssociatedTokenAccountInstruction(
      userPubkey, userTokenAccount, userPubkey, MINT_PUBKEY
    ));
  }

  // mint_tokens(quantity: u8) — single instruction for the whole batch
  const data = Buffer.concat([discriminator("mint_tokens"), encodeU8(qty)]);

  const mintIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: mintStatePda, isSigner: false, isWritable: true },
      { pubkey: userAccountPda, isSigner: false, isWritable: true },
      { pubkey: MINT_PUBKEY, isSigner: false, isWritable: true },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: treasury, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  tx.add(mintIx);

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
  // wallet: Pubkey (32) | mints_used: u8 (1) | total_spent_lamports: u64 (8)
  // registered_at: i64 (8) | bump: u8 (1)
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
