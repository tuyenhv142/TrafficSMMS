import apiClient from "./apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LoginResponse {
  success: boolean;
  content: {
    token: string;
    username: string;
    id: number;
    role: number;
    [key: string]: any; // Adjust based on actual response structure
  };
  error?: string;
}

export const login = async (name: string, password: string) => {
  try {
    const response = await apiClient.post(
      "/User/Login",
      { name, password },
      {
        headers: {
          Authorization: undefined, // Không gửi token trong request này
        },
      }
    );
    const data = response.data as LoginResponse; // Explicitly cast response.data
    if (data.success) {
      await AsyncStorage.setItem("token", data.content.token);
      await AsyncStorage.setItem("name", data.content.username);
      await AsyncStorage.setItem("role", data.content.role.toString());
      await AsyncStorage.setItem("user_id", data.content.id.toString());
      const role = await AsyncStorage.getItem("role"); // Lưu role vào AsyncStorage
      const tokenSave = await AsyncStorage.getItem("token");
      const userid = await AsyncStorage.getItem("user_id"); // Lưu token vào AsyncStorage
      console.log("token saved", tokenSave);
      console.log("role", role);
      console.log("userid", userid);
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.content.token}`;
      return data.content; // Trả về thông tin user
    } else {
      // throw new Error(data.error || "Login failed");
      console.log("Login failed", data.error);
    }
  } catch (error) {
    console.log("Login failed", error);
  }
};

// export const logout = async () => {
//   try {
//     await apiClient.post("/auth/logout");
//   } catch (error) {
//     throw error;
//   }
// };
