import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { encryptString, decryptToString } from "@lit-protocol/encryption";
import { createSiweMessageWithRecaps, generateAuthSig, LitAccessControlConditionResource } from "@lit-protocol/auth-helpers";
import axios from "axios";
import { ethers } from "ethers";

// Replace these with your actual values or environment variable handling as needed
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
const apiUrl = import.meta.env.VITE_API_ENDPOINT;
const chainName = import.meta.env.VITE_CHAIN_NAME;

export class Lit {
    litNodeClient;
   chain;

  constructor(chain) {
    this.chain = chain;
  }

  async connect() {
    this.litNodeClient = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev,
    });
    await this.litNodeClient.connect();
  }

  async disconnect() {
    await this.litNodeClient.disconnect();
  }

  async delegateCapacity(userAddress) {

    const mintCredit = await axios.get(apiUrl+"mint-capacity-credits")

    const req = {
      userAddress: userAddress,
      capacityTokenIdStr: mintCredit["data"]["capacityTokenIdStr"]
    };

    const resp = await axios.post(apiUrl + "delegate-capacity", req, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("RESP: ", resp["data"]["delegationAuthSig"]["capacityDelegationAuthSig"])
    const capacityDelegationAuthSig  = resp["data"]["delegationAuthSig"]["capacityDelegationAuthSig"];
    return capacityDelegationAuthSig;
  }

  async encrypt(message, fileID) {
    const evmContractConditions = [
        {
          contractAddress: contractAddress,
          functionName: "hasAccess",
          functionParams: [fileID,":userAddress"],
          functionAbi: {
                  inputs: [
                      {
                          internalType: "string",
                          name: "cid",
                          type: "string"
                      },
                      {
                          internalType: "address",
                          name: "requestor",
                          type: "address"
                      }
                  ],
                  name: "hasAccess",
                  outputs: [
                      {
                          "internalType": "bool",
                          "name": "",
                          "type": "bool"
                      }
                  ],
                  stateMutability: "view",
                  type: "function"
              },
          chain: chainName,
          returnValueTest: {
            key: "",
            comparator: "=",
            value: "true",
          },
        },
      ];
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        evmContractConditions,
        dataToEncrypt: message,
      },
      this.litNodeClient
    );
    return { ciphertext, dataToEncryptHash };
  }

  async getSessionSignatures(capacityDelegationAuthSig, signer, signerAddress) {
    const latestBlockhash = await this.litNodeClient.getLatestBlockhash();
    const authNeededCallback = async (params) => {
      if (!params.uri) {
        throw new Error("uri is required");
      }
      if (!params.expiration) {
        throw new Error("expiration is required");
      }
      if (!params.resourceAbilityRequests) {
        throw new Error("resourceAbilityRequests is required");
      }

      const toSign = await createSiweMessageWithRecaps({
        uri: params.uri,
        expiration: params.expiration,
        resources: params.resourceAbilityRequests,
        walletAddress: signerAddress,
        nonce: latestBlockhash,
        litNodeClient: this.litNodeClient,
      });

      const authSig = await generateAuthSig({
        signer: signer,
        toSign,
      });

      return authSig;
    };

    const litResource = new LitAccessControlConditionResource("*");

    const sessionSigs = await this.litNodeClient.getSessionSigs({
      chain: this.chain,
      resourceAbilityRequests: [
        {
          resource: litResource,
          ability: LIT_ABILITY.AccessControlConditionDecryption,
        },
      ],
      authNeededCallback,
      capacityDelegationAuthSig,
    });
    return sessionSigs;
  }

  async decrypt(ciphertext, dataToEncryptHash, capacityDelegationAuthSig, fileID) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();

    const sessionSigs = await this.getSessionSignatures(
      capacityDelegationAuthSig,
      signer,
      walletAddress
    );

    const evmContractConditions = [
      {
        contractAddress: contractAddress,
        functionName: "hasAccess",
        functionParams: [fileID,":userAddress"],
        functionAbi: {
          inputs: [
            {
              internalType: "string",
              name: "cid",
              type: "string"
            },
            {
              internalType: "address",
              name: "requestor",
              type: "address"
            }
          ],
          name: "hasAccess",
          outputs: [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          stateMutability: "view",
          type: "function"
        },
        chain: chainName,
        returnValueTest: {
          key: "",
          comparator: "=",
          value: "true",
        },
      },
    ];

    const decryptedString = await decryptToString(
      {
        evmContractConditions,
        chain: this.chain,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
      },
      this.litNodeClient
    );

    return { decryptedString };
  }
}

const chain = "ethereum";

// In JavaScript, types like File are not used, so we just document the expected object shape.
// Expected shape for files: { data: string, fileID: string }
export async function encryptData(files) {
  const myLit = new Lit(chain);
  await myLit.connect();

  const encryptedData = [];
  // Use a for...of loop to await each encryption sequentially.
  for (const file of files) {
    const encryptionData = await myLit.encrypt(file.data, file.fileID);
    console.log("Encryption Data", encryptionData);
    const jsonString = JSON.stringify(encryptionData);
    encryptedData.push(jsonString);
  }

  await myLit.disconnect();

  return encryptedData;
}

// Expected shape for encryptedFiles: { fileID: string, cipherText: string, hash: string }
export async function decryptData(encryptedFiles, signerAddress, signer) {
  const myLit = new Lit(chain);
  await myLit.connect();

  const delegationAuthSig = await myLit.delegateCapacity(signerAddress);

  const decryptedData = [];
  for (const encryptedFile of encryptedFiles) {
    const { decryptedString } = await myLit.decrypt(
      encryptedFile.cipherText,
      encryptedFile.hash,
      delegationAuthSig,
      encryptedFile.fileID,
      signer
    );
    decryptedData.push(decryptedString);
  }

  await myLit.disconnect();

  return decryptedData;
}
