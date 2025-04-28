import { View, Text, Alert, PermissionsAndroid } from "react-native";
import React, { useEffect } from "react";
import "react-native-get-random-values";
import { ScrollView } from "react-native";
import Header from "../components/Home/Header";
import Map from "../components/Home/Map";
import Content from "../components/Home/Content";
import Content2 from "../components/Home/Content2";
import { useAuth } from "./../context/AuthProvider";
import { Redirect } from "expo-router";
import Content1 from "../components/Home/Content1";
// import {
//   getMessaging,
//   AuthorizationStatus,
// } from "@react-native-firebase/messaging";
import messaging from "@react-native-firebase/messaging";
import { getApp } from "@react-native-firebase/app";

// Khởi tạo Firebase app và messaging
const app = getApp();
// const messagingInstance = getMessaging(app);

const requestUserPermission = async () => {
  // Xử lý quyền Android
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    console.log("Notification permission granted");
  } else {
    console.log("Notification permission denied");
  }

  // Xử lý quyền iOS
  // const authStatus = await messagingInstance.requestPermission();
  // const enabled =
  //   authStatus === AuthorizationStatus.AUTHORIZED ||
  //   authStatus === AuthorizationStatus.PROVISIONAL;

  // if (enabled) {
  //   console.log("Authorization status:", authStatus);
  // }
};

const getToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    // Thử lại sau 2 giây
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getToken();
  }
};

const index = () => {
  const { token } = useAuth();

  useEffect(() => {
    requestUserPermission();
    getToken();

    // Xử lý message nền
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log("Message handled in the background!", remoteMessage);
    });

    // Xử lý message foreground
    // const unsubscribe = messagingInstance.onMessage(async (remoteMessage) => {
    //  Alert.alert("A new FCM message arrived!", JSON.stringify(remoteMessage));
    // });

    // const unsubscribe = messagingInstance.onTokenRefresh((token) => {
    //   console.log("New FCM Token:", token);
    // });

    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert("A new FCM message arrived!", JSON.stringify(remoteMessage));
    });

    return unsubscribe;
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
