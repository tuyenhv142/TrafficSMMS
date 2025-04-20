import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

const Map = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => {
          router.push("/map");
        }}
      >
        <Image
          style={styles.img}
          source={require("./../../assets/images/TrafficSignalMap.png")}
        ></Image>
      </TouchableOpacity>
    </View>
  );
};

export default Map;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  img: {
    width: "100%",
    height: 150,
    // height: "100%",
  },
});
