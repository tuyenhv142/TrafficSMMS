// app/_layout.tsx
import { Stack } from "expo-router";
import "../global.css";
import { AuthProvider } from "../context/AuthProvider";
import { Colors } from "./../constants/Colors";
import { NetworkProvider } from "./../context/NetworkProvider";

export default function RootLayout() {
  return (
    <NetworkProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Colors.primaryColor, // hoặc Colors.primaryColor
            },
            headerTintColor: "#fff",
            headerTitleAlign: "center",
          }}
        >
          {/* 👇 Slot nằm trong Stack để render các route con */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen
            name="trafficSignalDetail"
            options={{ headerTitle: "交通號誌詳情" }}
          />
          <Stack.Screen
            name="trafficLightErrorList"
            options={{ headerTitle: "故障號誌" }}
          />
          <Stack.Screen
            name="trafficLightList"
            options={{ headerTitle: "號誌清單" }}
          />
          <Stack.Screen name="statistic" options={{ headerTitle: "統計" }} />
          <Stack.Screen
            name="trafficListEngineer"
            options={{ headerTitle: "工程師清單" }}
            // options={{ headerTitle: "號誌清單" }}
          />
          <Stack.Screen
            name="trafficSignalEngineer"
            options={{ headerTitle: "交通號誌詳情" }}
            // options={{ headerTitle: "號誌清單" }}
          />
          <Stack.Screen
            name="map"
            options={{ headerTitle: "地圖", headerShown: false }}
          />
          <Stack.Screen name="profile" options={{ headerTitle: "會員" }} />
          <Stack.Screen name="notification" options={{ headerTitle: "通知" }} />
          <Stack.Screen name="add" options={{ headerTitle: "故障通報" }} />
        </Stack>
      </AuthProvider>
    </NetworkProvider>
  );
}
