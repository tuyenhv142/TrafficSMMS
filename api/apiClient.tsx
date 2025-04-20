import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tạo instance Axios
const apiClient = axios.create({
  // baseURL: "http://192.168.37.182:7243/api",
  // baseURL: "http://172.20.10.3:7243/api",
  baseURL: "http://34.80.69.96:5000/api",
  timeout: 100000,
  headers: {
    // "Content-Type": "multipart/form-data",
  },
});

// Hàm khởi tạo token
const initializeToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error initializing token:", error);
  }
};

// Gọi hàm khởi tạo token khi app khởi động
initializeToken();

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      delete apiClient.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
