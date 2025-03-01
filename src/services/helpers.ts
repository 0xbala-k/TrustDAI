import { trustDAIContract } from "./TrustDAI.ts";
import { uploadData, fetchData } from "./ethstorage.ts";

// Hardcoded TrustDAI contract address
const TRUSTDAI_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0xd0EBaF6bAc19AA239853D94ec0FC0639F27eA986"; // Replace with your deployed address

interface File {
  fileID: string;
  content: string;
}

interface Profile {
  name: string;
  age: string;
}

// Wallet Connection
export async function connectWallet(): Promise<string> {
  const account = await trustDAIContract.connect();
  await trustDAIContract.initializeContract(TRUSTDAI_CONTRACT_ADDRESS);
  return account;
}

export async function disconnectWallet(): Promise<void> {
  await trustDAIContract.disconnect();
}

export async function getCurrentAccount(): Promise<string | null> {
  try {
    const [account] = await window.ethereum.request({ method: "eth_accounts" });
    if (account) {
      await trustDAIContract.initializeContract(TRUSTDAI_CONTRACT_ADDRESS);
    }
    return account || null;
  } catch (error) {
    console.error("Error checking current account:", error);
    return null;
  }
}

export function setupAccountChangeListener(
  onAccountChange: (accounts: string[]) => void
): () => void {
  if (!window.ethereum) return () => {};
  window.ethereum.on("accountsChanged", onAccountChange);
  return () => {
    window.ethereum.removeListener("accountsChanged", onAccountChange);
  };
}

// Profile Management
export async function fetchProfiles(): Promise<Profile[]> {
  const userFiles = await trustDAIContract.getUserFiles();
  const profilePromises = userFiles.map(async (fileId: string) => {
    try {
      const response = await fetchData(fileId);
      return JSON.parse(response.data) as Profile;
    } catch (error: any) {
      console.error(`Failed to fetch file ${fileId}:`, error);
      throw new Error(`Failed to fetch profile ${fileId}: ${error.message}`);
    }
  });
  const profiles = await Promise.all(profilePromises);
  return profiles.filter((p): p is Profile => p !== null);
}

export async function addProfile(account: string, name: string, age: string): Promise<string> {
  const profile = { name, age };
  const profileJson = JSON.stringify(profile);
  const fileID = `${account}-${Date.now()}`;
  await uploadData(fileID, profileJson);
  await trustDAIContract.addFile(fileID);
  return fileID;
}