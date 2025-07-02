import { AxiosError } from "axios";

export const networkAxiosError = (err: AxiosError, id: string = "") => {
  if (id) {
    // Handle timeout and network errors
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.log(`Request timed out for data ${id}`);
      throw new Error("Server is not responding. Please try again later.");
    }

    if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
      console.log(`Network error for data ${id}`);
      throw new Error("Unable to connect to server. Check your connection.");
    }

    if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
      console.log(`Request automatically cancelled for confession ${id}`);
      throw err;
    }
  } else {
    // Handle timeout and network errors
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.log("Request timed out - API not responding");
      throw new Error("Server is not responding. Please try again later.");
    }

    if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
      console.log("Network error - API unavailable");
      throw new Error("Unable to connect to server. Check your connection.");
    }
    // Handle abort from React Query (component unmount, etc.)
    if (err.name === "AbortError" || err.code === "ERR_CANCELED") {
      console.log("Request was automatically cancelled");
      throw err;
    }
  }
};

export const retryAxiosError = (failedCount: number, error: AxiosError) => {
  if (
    error.message.includes("timeout") ||
    error.message.includes("not responding") ||
    error.message.includes("connect to server")
  ) {
    console.log(`API timeout/network error - attempt ${failedCount + 1}`);
  }
};
