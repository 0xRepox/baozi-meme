import {
  Connection, Keypair, PublicKey, Transaction,
  TransactionInstruction, SystemProgram, sendAndConfirmTransaction,
  SYSVAR_INSTRUCTIONS_PUBKEY,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { createHash } from "crypto";

const PROGRAM_ID      = new PublicKey("BBP3vz9Bm4Fx21UZmmWAoykL4shNbTxCrAXtmUrBMEuV");
const MINT_PUBKEY     = new PublicKey(process.env.MINT_PUBKEY!);
const METAPLEX_ID     = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const RPC_URL         = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const KEYPAIR_PATH    = process.env.DEPLOY_KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`;

function discriminator(name: string): Buffer {
  return Buffer.from(createHash("sha256").update(`global:${name}`).digest()).slice(0, 8);
}

function encodeString(s: string): Buffer {
  const strBuf = Buffer.from(s, "utf8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(strBuf.length);
  return Buffer.concat([len, strBuf]);
}

async function main() {
  const connection = new Connection(RPC_URL, "confirmed");
  const authority = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(readFileSync(KEYPAIR_PATH, "utf8")))
  );

  const [mintStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint_state"), MINT_PUBKEY.toBuffer()],
    PROGRAM_ID
  );

  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METAPLEX_ID.toBuffer(), MINT_PUBKEY.toBuffer()],
    METAPLEX_ID
  );

  const name   = "Baozi";
  const symbol = "$BAO";
  const uri    = "https://baozi.meme/metadata.json";

  console.log("Authority:    ", authority.publicKey.toBase58());
  console.log("Mint:         ", MINT_PUBKEY.toBase58());
  console.log("MintState PDA:", mintStatePda.toBase58());
  console.log("Metadata PDA: ", metadataPda.toBase58());
  console.log("Name:", name, "| Symbol:", symbol);

  const data = Buffer.concat([
    discriminator("create_metadata"),
    encodeString(name),
    encodeString(symbol),
    encodeString(uri),
  ]);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey,        isSigner: true,  isWritable: true  },
      { pubkey: mintStatePda,               isSigner: false, isWritable: true  },
      { pubkey: MINT_PUBKEY,                isSigner: false, isWritable: true  },
      { pubkey: metadataPda,                isSigner: false, isWritable: true  },
      { pubkey: METAPLEX_ID,                isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId,    isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = authority.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const sig = await sendAndConfirmTransaction(connection, tx, [authority]);
  console.log("✅ Metadata created:", sig);
  console.log("Token name/symbol now visible in wallets and DEXes.");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
