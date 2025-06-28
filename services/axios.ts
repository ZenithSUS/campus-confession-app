import axios from "axios";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? "https://campus-confession-api.onrender.com/api"
    : process.env.EXPO_PUBLIC_API_BASE_URL;

console.log(process.env.NODE_ENV);

if (!baseUrl) {
  throw new Error("PUBLIC_EXPO_API_BASE_URL is not defined");
}

const axiosClient = axios.create({
  baseURL: baseUrl,
  timeout: 1000000,
});

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
