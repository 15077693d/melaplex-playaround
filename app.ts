import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  toBigNumber,
} from "@metaplex-foundation/js";
import * as fs from "fs";
import { base58 } from "@metaplex-foundation/umi/serializers";
// @todo add your own secretKey
let secretKey = base58.serialize("");

const QUICKNODE_RPC = "https://api.devnet.solana.com";
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);
const walletPayer = Keypair.fromSecretKey(secretKey);
const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
  .use(keypairIdentity(walletPayer))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: QUICKNODE_RPC,
      timeout: 60000,
    })
  );
const CONFIG = {
  uploadPath: "uploads/",
  imgFileName: "image.png",
  imgType: "image/png",
  imgName: "LV Bag 001 collection",
  description: "This is LV Bag 001 #1",
  attributes: [],
  sellerFeeBasisPoints: 0, //500 bp = 5%
  symbol: "LV01",
  updateAuthourity: walletPayer,
  mintAuthority: walletPayer,
  tokenOwner: walletPayer.publicKey,
  isMutable: true,
  primarySaleHappened: false,
  creators: [],
};

async function uploadImage(
  filePath: string,
  fileName: string
): Promise<string> {
  console.log(`Step 1 - Uploading Image`);
  const imgBuffer = fs.readFileSync(filePath + fileName);
  const imgMetaplexFile = toMetaplexFile(imgBuffer, fileName);
  const imgUri = await METAPLEX.storage().upload(imgMetaplexFile);
  console.log(`   Image URI:`, imgUri);
  return imgUri;
}

async function uploadMetadata(
  imgUri: string,
  imgType: string,
  nftName: string,
  description: string,
  attributes: { trait_type: string; value: string }[]
) {
  console.log(`Step 2 - Uploading Metadata`);
  const { uri } = await METAPLEX.nfts().uploadMetadata({
    name: nftName,
    description: description,
    image: imgUri,
    attributes: attributes,
    properties: {
      files: [
        {
          type: imgType,
          uri: imgUri,
        },
      ],
    },
  });
  console.log("Metadata URI:", uri);
  return uri;
}
async function mintNft(
  metadataUri: string,
  name: string,
  sellerFee: number,
  symbol: string,
  creators: { address: PublicKey; share: number }[],
  collection?: PublicKey
) {
  console.log(`Step 3 - Minting NFT`);
  const { nft } = await METAPLEX.nfts().create(
    {
      uri: metadataUri,
      name: name,
      sellerFeeBasisPoints: sellerFee,
      symbol: symbol,
      creators: creators,
      isMutable: false,
      isCollection: !!collection,
      collection: collection || null,
    },
    { commitment: "finalized" }
  );
  console.log(`   Success!🎉`);
  console.log(
    `   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`
  );
}
async function main() {
  console.log(
    `Minting ${
      CONFIG.imgName
    } to an NFT in Wallet ${walletPayer.publicKey.toBase58()}.`
  );
  //Step 1 - Upload Image
  const imgUri = await uploadImage(CONFIG.uploadPath, CONFIG.imgFileName);
  //Step 2 - Upload Metadata
  const metadataUri = await uploadMetadata(
    imgUri,
    CONFIG.imgType,
    CONFIG.imgName,
    CONFIG.description,
    CONFIG.attributes
  );
  //Step 3 - Mint NFT
  mintNft(
    metadataUri,
    CONFIG.imgName,
    CONFIG.sellerFeeBasisPoints,
    CONFIG.symbol,
    CONFIG.creators
  );
}

main();
