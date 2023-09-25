import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  toBigNumber,
} from "@metaplex-foundation/js";
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import * as fs from "fs";
import { base58 } from "@metaplex-foundation/umi/serializers";
// @todo add your own secretKey
let secretKey = base58.serialize("");
//
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
async function main() {
  await METAPLEX.nfts().transfer({
    nftOrSft: {
      tokenStandard: TokenStandard.NonFungible,
      address: new PublicKey("36pDyX9GeXuYwkbumKsNiRvfe4oeYSefHV1BfA68Ey8i"),
    },
    toOwner: new PublicKey("9gARzcKJoaecvJcCiU6xqMZ9V3hDJfYPFVRtQr29H4Nu"),
  });
}
main();
