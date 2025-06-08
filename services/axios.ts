import axios from "axios";

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseUrl) {
  throw new Error("PUBLIC_EXPO_API_BASE_URL is not defined");
}

console.log("API Base URL:", baseUrl);

const axiosClient = axios.create({
  baseURL: baseUrl,
  timeout: 1000000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    console.log("Request URL:", fullUrl);
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
