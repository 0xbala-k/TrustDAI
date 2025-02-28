import axios from "axios";

// Determine EthStorage API endpoint: env var or fallback
const API_URL = import.meta.env.VITE_API_ENDPOINT || "http://190.102.110.163:3000/"; // e.g., "http://localhost:3000/" or your deployed server

interface UploadDataResponse {
  success: boolean;
}

interface GetDataResponse {
  data: string; // Assuming plaintext JSON string
}

// Function to upload data to EthStorage with retries
export async function uploadData(key: string, content: string): Promise<UploadDataResponse> {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.post<UploadDataResponse>(`${API_URL}upload-data`, {
        key,
        content,
      }, {
        timeout: 10000, // 10s timeout
      });
      return response.data;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed for /upload-data:`, error.message);
      if (i === 2) throw new Error(`Failed to upload data after 3 attempts: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff: 1s, 2s, 3s
    }
  }
  throw new Error("Unexpected failure in uploadData"); // Should never reach here
}

// Function to fetch data from EthStorage with retries
export async function fetchData(key: string): Promise<GetDataResponse> {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await axios.get<GetDataResponse>(`${API_URL}get-data/${key}`, {
        timeout: 10000, // 10s timeout
      });
      return response.data;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed for /get-data/${key}:`, error.message);
      if (i === 2) throw new Error(`Failed to fetch data after 3 attempts: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error("Unexpected failure in fetchData"); // Should never reach here
}