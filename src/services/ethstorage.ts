import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_ENDPOINT;

interface UploadDataResponse {
    success: boolean;
}
  
interface GetDataResponse {
    data: any;
}

// Function to call the /upload-data endpoint.
export async function uploadData(key: string, content: string): Promise<UploadDataResponse> {
    try {
      const response = await axios.post<UploadDataResponse>(apiUrl+'upload-data', {
        key,
        content,
      });
      return response.data;
    } catch (error) {
      console.error('Error calling /upload-data endpoint:', error);
      throw error;
    }
  }
  
  // Function to call the /get-data/:key endpoint.
  export async function fetchData(key: string): Promise<GetDataResponse> {
    try {
      const response = await axios.get<GetDataResponse>(`${apiUrl}get-data/${key}`);
      return response.data;
    } catch (error) {
      console.error('Error calling /get-data endpoint:', error);
      throw error;
    }
  }