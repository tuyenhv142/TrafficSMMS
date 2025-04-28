import messaging from "@react-native-firebase/messaging";
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

const requestUserPermission = async () => {
  if (Platform.OS === "android") {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Notification permission granted");
    } else {
      console.log("Notification permission denied");
    }
  }

  //   try {
  //     const authStatus = await messaging().requestPermission();
  //     const enabled =
  //       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //       authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  //     if (enabled) {
  //       console.log("Authorization status:", authStatus);
  //     }
  //   } catch (error) {
  //     console.error("Permission request failed:", error);
  //   }
};

const getToken = async () => {
  console.log("Đang cố gắng lấy FCM Token...");
  try {
    const token = await messaging().getToken();
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error fetching token:", (error as any)?.message);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return getToken();
  }
};

export const useNotification = () => {
  useEffect(() => {
    requestUserPermission();
    getToken(); // Ensure that token fetching is done after permission is requested
  }, []);
};
