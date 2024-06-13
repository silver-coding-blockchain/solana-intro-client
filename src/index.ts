import * as web3 from "@solana/web3.js";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();



async function main(){
   // const connection = new web3.Connection(web3.clusterApiUrl('devnet'));
   const connection = new web3.Connection(
    "https://necessary-spring-shard.solana-devnet.quiknode.pro/0417dc7b4af48216baf61e31edbabb9a71579a91/",
    'confirmed',
  );
    const signer = await initializeKeypair(connection);

    console.log("Public key:", signer.publicKey.toBase58());
    await pingProgram(connection, signer);
}
async function initializeKeypair(connection:web3.Connection): Promise<web3.Keypair>{
    if(!process.env.PRIVATE_KEY){
        console.log('Generating new keypair...');
        const signer =web3.Keypair.generate();
        console.log('Creating .env file');
        fs.writeFileSync('.env',`PRIVATE_KEY=[${signer.secretKey.toString()}]`);
        await airdropSolIfNeeded(signer, connection);
        return signer;
    }
    const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];
    const secretKey = Uint8Array.from(secret);
    const keypairFromSecret = web3.Keypair.fromSecretKey(secretKey);
    await airdropSolIfNeeded(keypairFromSecret, connection);
    return keypairFromSecret;
}
async function airdropSolIfNeeded(
    signer: web3.Keypair,
    connection: web3.Connection
  ) {
    const balance = await connection.getBalance(signer.publicKey);
    console.log('Current balance is', balance / web3.LAMPORTS_PER_SOL, 'SOL');
  
    // 1 SOL should be enough for almost anything you wanna do
    if (balance / web3.LAMPORTS_PER_SOL < 1) {
      // You can only get up to 2 SOL per request 
      console.log('Airdropping 1 SOL');
      const airdropSignature = await connection.requestAirdrop(
        signer.publicKey,
        web3.LAMPORTS_PER_SOL
      );
  
      const latestBlockhash = await connection.getLatestBlockhash();
  
      await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: airdropSignature,
      });
  
      const newBalance = await connection.getBalance(signer.publicKey);
      console.log('New balance is', newBalance / web3.LAMPORTS_PER_SOL, 'SOL');
    }
  }

const PROGRAM_ID = new web3.PublicKey("ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa")
const PROGRAM_DATA_PUBLIC_KEY = new web3.PublicKey("Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod")
async function pingProgram(connection: web3.Connection, payer: web3.Keypair) {
    const transaction = new web3.Transaction()
    const instruction = new web3.TransactionInstruction({
      // Instructions need 3 things 
      
      // 1. The public keys of all the accounts the instruction will read/write
      keys: [
        {
          pubkey: PROGRAM_DATA_PUBLIC_KEY,
          isSigner: false,
          isWritable: true
        }
      ],
      
      // 2. The ID of the program this instruction will be sent to
      programId: PROGRAM_ID
      
      // 3. Data - in this case, there's none!
    })
  
    transaction.add(instruction)
    const transactionSignature = await web3.sendAndConfirmTransaction(connection, transaction, [payer])
  
    console.log(
      `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
      )
  }
main();