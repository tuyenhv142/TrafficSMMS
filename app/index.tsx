import { Alert, PermissionsAndroid, ScrollView } from "react-native";
import React, { useEffect } from "react";
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
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getToken();
  }
};

const index = () => {
  const { token, role } = useAuth();

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

  return (
    <ScrollView>
      <Header />
      <Map />
      <Content />
      <Content1 />
      <Content2 />
    </ScrollView>
  );
};

export default index;
