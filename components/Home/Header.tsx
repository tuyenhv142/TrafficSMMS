import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

const Header = () => {
  const router = useRouter();
  const [name, setName] = useState<String | null>("");
  const [role, setRole] = useState<String | null>("");
  const getName = async () => {
    const usename = await AsyncStorage.getItem("name");
    const role = await AsyncStorage.getItem("role");
    setName(usename);
    setRole(role);
  };
  useEffect(() => {
    getName();
  });
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: "/profile" });
          }}
        >
          <Image
            style={styles.logo}
            source={require("./../../assets/images/imageAdmin.png")}
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.text}>交通號誌維修管理系統</Text>
          <Text style={styles.text1}>{name}</Text>
        </View>
      </View>
      <View style={styles.notification}>
        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: "/notification" });
          }}
        >
          <FontAwesome5 name="bell" size={28} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.primaryColor,
  },
  content: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 99,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  text1: {
    color: "#fff",
    fontSize: 16,
  },
  notification: {
    backgroundColor: "#fff",
    borderRadius: 99,
    height: 45,
    width: 45,
    justifyContent: "center",
    alignItems: "center",
  },
});
