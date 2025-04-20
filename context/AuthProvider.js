import { useContext,useState,createContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { login } from "../api/authService";
import { Text,ActivityIndicator, Alert } from "react-native";
import { set } from "lodash";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const role = await AsyncStorage.getItem("role");
        const userid = await AsyncStorage.getItem("user_id");
        if (token) {
          setToken(token);
          setRole(role);
          setUserId(userid);
          // You can also fetch user data here if needed
        }
      } catch (error) {
        console.error("Error fetching token:", error);
      }
      setLoading(false);
    };
    checkToken();
  }
  , []);

  

  const signin = async ({name,password}) => {
    setLoading(true);
    try {
        console.log("name",name);
        console.log("password",password);
        const data = await login(name, password);
        if (!data || !data.token) {
          Alert.alert("錯誤","登入失敗，請檢查帳號密碼是否正確");
          return
        }
        // await AsyncStorage.setItem("token", data.token);
        setToken(data.token);
        setRole(data.role.toString());
        setUserId(data.id.toString());
    } catch (error) {
        console.error("Login error:", error);
    }finally
    {
      setLoading(false);
    }
    
  };

  const logout =async () => {
    setLoading(true);
    setUserId(null);
    setToken(null);
    setRole(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("name");
    await AsyncStorage.removeItem("role");
    await AsyncStorage.removeItem("user_id")
    console.log(AsyncStorage.getItem("token"));
    console.log(AsyncStorage.getItem("role"));
    console.log(AsyncStorage.getItem("user_id"));
    setLoading(false);
  };

  const contextData = {
    userId,
    token,
    role,
    signin,
    logout,
  };
  return (  
    <AuthContext.Provider value={contextData}>
      {loading ? (
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </SafeAreaView>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
  return useContext(AuthContext);
}
export { AuthProvider, useAuth, AuthContext }; 