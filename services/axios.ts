import axios from "axios";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.EXPO_PUBLIC_DEV_API_BASE_URL
    : process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseUrl) {
  throw new Error("PUBLIC_EXPO_API_BASE_URL is not defined");
}

const axiosClient = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
});

axiosClient.interceptors.request.use((config) => config);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
      console.log("Request was cancelled");
    } else if (error.code === "ECONNABORTED") {
      console.log("Request timed out");
    } else if (!error.response) {
      console.log("Network error - API not available");
    }
    console.log("Axios error details:", {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response?.data,
      status: error.response?.status,
    });

    return Promise.reject(error);
  }
);

export default axiosClient;
