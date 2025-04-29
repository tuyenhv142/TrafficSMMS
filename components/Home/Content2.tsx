import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
// import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
// import { Colors } from "../../constants/Colors";
import MapView, { Marker } from "react-native-maps";
import { Picker } from "@react-native-picker/picker";

const cities = {
  台北: { latitude: 25.033, longitude: 121.5654 },
  台中: { latitude: 24.1477, longitude: 120.6736 },
  高雄: { latitude: 22.6273, longitude: 120.3014 },
  台南: { latitude: 23.0346, longitude: 120.2887 },
};
const Content2 = () => {
  const [selectCity, setSelectCity] = useState<keyof typeof cities>("台南");
  const region = {
    ...cities[selectCity],
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };
  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.text}>車流量圖層</Text>
      </View> */}

      <Picker
        selectedValue={selectCity}
        onValueChange={(value) => setSelectCity(value)}
        style={styles.picker}
      >
        {Object.keys(cities).map((city) => (
          <Picker.Item key={city} label={city} value={city} />
        ))}
      </Picker>
      <MapView
        style={styles.map}
        mapType="standard"
        region={region}
        showsTraffic={true}
        // zoomEnabled={false}
        // scrollEnabled={false}
        // pitchEnabled={false}
        // rotateEnabled={false}
      ></MapView>
    </View>
  );
};

export default Content2;

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  header: {
    // display: "flex",
    // flexDirection: "row",
    // justifyContent: "space-between",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  map: {
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  picker: {
    height: 50,
    width: "100%",
    marginVertical: 10,
  },
});
