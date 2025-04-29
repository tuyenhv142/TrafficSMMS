import { StyleSheet, Text, View, Image } from "react-native";
import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthProvider";
// import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const LogoComponent = () => {
  const { role } = useAuth();

  useFocusEffect(
    useCallback(() => {
      // console.log("Current Role:", role);
      if (role !== "1" && role !== "2") {
        // router.replace("/");
      }
    }, [role])
  );

  return (
    <View style={styles.container}>
      <Image
        source={
          role === 1
            ? require("../assets/images/imageAdmin.png")
            : require("../assets/images/image.png")
        }
        style={styles.image}
      />

      <Text style={styles.title}>交通號誌維修管理系統</Text>

      {/* <FontAwesome5 name="traffic-light" size={28} color="#333" /> */}
      <Image
        source={require("../assets/images/splashscreen_logo.png")}
        style={styles.image}
      />
    </View>
  );
};

export default LogoComponent;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 99,
  },
  title: {
    flex: 1,
    marginHorizontal: 12,
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    // fontFamily: "outfit",
  },
});
