import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "./../../context/AuthProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors } from "./../../constants/Colors";

const _layout = () => {
  const { token, role } = useAuth();

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          headerTitleAlign: "center",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="trafficLightErrorList"
        options={{
          title: "號誌故障清單",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="traffic" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "設定",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
