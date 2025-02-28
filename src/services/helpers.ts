import { trustDAIContract } from "./TrustDAI.ts";
import { encryptData, File, EncryptedFile, decryptData } from "./LitProtocol.js";
import { fetchData, uploadData } from "./ethstorage.ts";

import { ethers } from "ethers";

export async function addData(files: File[]){
    // Encrypt data
    const encryptedData = await encryptData(files);

    // Upload data
    for (let i = 0; i < files.length; i++) {
        await uploadData(files[i].fileID,encryptedData[i])
    }

    // update contract
    files.forEach(async function(file){
        console.log("File id adding:", file.fileID)
        const tx = await trustDAIContract.addFile(file.fileID)
        console.log(tx)
    })
}

export async function getData(){

    // Get User file ids
    const userFiles = await trustDAIContract.getUserFiles()

    // Download data
    const encryptedFiles: EncryptedFile[] = [];
    console.log("Herer")
    userFiles.forEach(async function(fileId){
        try{
            const encryptedData = await fetchData(fileId);
            console.log("Data: ",encryptedData["data"] )
            // const data = JSON.parse(encryptedData["data"]);
            const data = encryptedData["data"]

            encryptedFiles.push({
                fileID:fileId,
                cipherText: data["ciphertext"],
                hash: data["dataToEncryptHash"]
            });
        } catch (error){
            console.log("Error fetching data from EthStorage: ",error)
        }
    });
    

    const signerAddress = await trustDAIContract.getSignerAddress();
    const checkSumAddress = ethers.getAddress(signerAddress);
    const signer = await trustDAIContract.getSigner();
    

    // decrypt data
    const decryptedData =  await decryptData(encryptedFiles, checkSumAddress, signer)

    return decryptedData;
}