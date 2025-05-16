import {
  Alert,
  PermissionsAndroid,
  ScrollView,
  View,
  Text,
  Modal,
  Button,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "../components/Home/Header";
import Map from "../components/Home/Map";
import Content from "../components/Home/Content";
import Content2 from "../components/Home/Content2";
import Content1 from "../components/Home/Content1";
import { useAuth } from "../context/AuthProvider";
import { Redirect } from "expo-router";
import "react-native-get-random-values";
import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  getToken as fetchToken,
  onTokenRefresh,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import apiClient from "./../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StatisticsScreen from "./statistinal";

// import { useNetInfo } from "@react-native-community/netinfo";

// const { type, isConnected } = useNetInfo();
const app = getApp();

const requestUserPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("Notification permission granted");
  } else {
    console.log("Notification permission denied");
  }
};

const getToken = async () => {
  try {
    const messagingInstance = getMessaging(app);
    const token = await fetchToken(messagingInstance);
    // console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.log("Error fetching token:", error);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getToken();
  }
};

interface Response {
  success: boolean;
  content: {
    token: string;
  };
}

const checkTokenValidity = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return false;

    const response = await apiClient.post("/User/CheckToken", null, {
      params: { token },
    });

    const data = response.data as Response;

    if (response.status === 200 && data.success) {
      // Nếu token mới được cấp → lưu lại
      if (data.content.token && data.content.token !== token) {
        await AsyncStorage.setItem("token", data.content.token);
        console.log("🔄 Token refreshed and saved");
      }
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("Token validation error:", error);
    return false;
  }
};

const index = () => {
  const { token, role, logout } = useAuth();
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        setShowTokenExpiredModal(true); // hiển thị modal thông báo
      }
    };
    verifyToken();
    // console.log(role);
  }, []);

  // const netInfo = useNetInfo();
  // const [showNoInternet, setShowNoInternet] = useState(false);

  // useEffect(() => {
  //   if (!netInfo.isConnected) {
  //     setShowNoInternet(true);
  //   } else {
  //     setShowNoInternet(false);
  //   }
  // }, [netInfo.isConnected]);

  useEffect(() => {
    requestUserPermission();
    getToken();

    const messagingInstance = getMessaging(app);

    if (token) {
      fetchToken(messagingInstance)
        .then(async (token) => {
          console.log("FCM Token:", token);

          const response = await apiClient.post("/User/AddToken", null, {
            params: { token: token },
          });
          console.log("Token update response:", response.data);
        })
        .catch((error) => {
          console.error("Error getting FCM token:", error);
        });
    }

    setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
    });

    const unsubscribeOnTokenRefresh = onTokenRefresh(
      messagingInstance,
      (newToken) => {
        console.log("New FCM Token:", newToken);
      }
    );

    // 👇 Thêm đoạn lắng nghe khi app đang mở
    const unsubscribeOnMessage = messagingInstance.onMessage(
      async (remoteMessage) => {
        console.log("Foreground message received:", remoteMessage);

        // if (role === 2)
        Alert.alert(
          "A new FCM message arrived!",
          remoteMessage.notification?.title || "",
          [
            {
              text: "Cancel",
              onPress: () => console.log("Cancel Pressed"),
              style: "cancel",
            },
            {
              text: "OK",
              onPress: () => console.log("OK Pressed"),
            },
          ]
        );
      }
    );

    return () => {
      unsubscribeOnTokenRefresh();
      unsubscribeOnMessage();
    };
  }, []);

  if (!token) {
    return <Redirect href="/login" />;
  }

  // if (showNoInternet) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <Text style={{ fontSize: 18, color: "red" }}>
  //         沒有網路連結，請檢查您的網路設定
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <ScrollView>
      <Modal visible={showTokenExpiredModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "80%",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, marginBottom: 15, color: "red" }}>
              Token 已過期，請重新登入。
            </Text>
            <Button title="前往登入頁面" onPress={() => logout()} />
          </View>
        </View>
      </Modal>

      <Header />

      {Number(role) === 1 ? (
        <>
          <StatisticsScreen />
          <Map />
          <Content />
          <Content1 />
          <Content2 />
        </>
      ) : (
        <>
          <Map />
          <Content />
          <Content1 />
          <Content2 />
        </>
      )}
    </ScrollView>
  );
};

export default index;
