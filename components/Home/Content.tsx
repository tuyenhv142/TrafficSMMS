import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import React from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Colors } from "../../constants/Colors";
import { useRouter } from "expo-router";

const Content = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>功能表</Text>
        <FontAwesome5 name="bars" size={28} color={Colors.primaryColor} />
      </View>
      <View style={styles.content}>
        <View style={styles.layout}>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/trafficLightList",
              });
            }}
          >
            <View style={styles.border}>
              <Image
                style={styles.img}
                source={require("./../../assets/images/3.png")}
              ></Image>
            </View>
            <Text style={styles.textLayout}>號誌清單</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.layout}>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/trafficListEngineer",
              });
            }}
          >
            <View style={styles.border}>
              <Image
                style={styles.img}
                source={require("./../../assets/images/1.png")}
              ></Image>
            </View>
            <Text style={styles.textLayout}>故障號誌</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.layout}>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/trafficLightErrorList",
              });
            }}
          >
            <View style={styles.border}>
              <Image
                style={styles.img}
                source={require("./../../assets/images/2.png")}
              ></Image>
            </View>
            <Text style={styles.textLayout}>故障未確認</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.layout}>
          <TouchableOpacity>
            <View style={styles.border}>
              <Image
                style={styles.img}
                source={require("./../../assets/images/4.png")}
              ></Image>
            </View>
            <Text style={styles.textLayout}>道路交通</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Content;

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
  border: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 99,
    // width: "23%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
    // alignContent: "center",
  },
  content: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  layout: {
    width: "23%",
  },

  img: {
    height: 60,
    width: 60,
    // marginBottom: 20,
  },
  textLayout: {
    textAlign: "center",
    marginTop: 10,
  },
});
