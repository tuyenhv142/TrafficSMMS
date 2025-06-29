import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState, useEffect } from "react";
import MapViewComponent from "../components/MapViewComponent";
import apiClient from "../api/apiClient";
import { getDistance } from "geolib";
import Test from "../components/Test";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { router } from "expo-router";

interface TrafficSignal {
  identificationCode: number;
  signalNumber: string;
  latitude: number;
  longitude: number;
  typesOfSignal: string;
  statusError: number;
  // statusErrorFauCode: number;
  isError: boolean;
}

const map = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapCenterLocation, setMapCenterLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 23.0346,
    longitude: 120.2887,
  });
  const [nearbySignals, setNearbySignals] = useState<TrafficSignal[]>([]);
  const [allSignals, setAllSignals] = useState<TrafficSignal[]>([]);

  interface ApiResponse {
    content?: {
      data?: TrafficSignal[];
    };
  }

  // Hàm gọi API
  const fetchSignals = async () => {
    try {
      const response = await apiClient.get<ApiResponse>(
        "TrafficEquipment/FindAll?page=1&pageSize=22000"
      );
      if (response.data?.content?.data) {
        setAllSignals(response.data.content.data);
      } else {
        console.log("No data found in API response");
      }
    } catch (e) {
      console.error("API error", e);
    }
  };

  // Mỗi lần vào trang, fetch lại dữ liệu
  useEffect(() => {
    fetchSignals();
  }, []);

  // Lọc nearbySignals khi allSignals thay đổi
  useEffect(() => {
    const locationToUse = selectedLocation || mapCenterLocation;

    const nearby = allSignals.filter((signal) => {
      const distance = getDistance(
        { latitude: signal.latitude, longitude: signal.longitude },
        locationToUse
      );
      return distance < 1500; // Chỉ lấy những tín hiệu gần vị trí (dưới 1000m)
    });

    setNearbySignals(nearby); // Cập nhật tín hiệu gần với vị trí
  }, [selectedLocation, mapCenterLocation, allSignals]);
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              router.back();
            }}
          >
            <FontAwesome5 name="arrow-left" size={25} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <Test onLocationSelected={setSelectedLocation} />
        </View>
      </View>
      <MapViewComponent
        selectedLocation={selectedLocation || mapCenterLocation}
        signals={nearbySignals}
        onMapCenterChanged={setMapCenterLocation}
      />
    </View>
  );
};

export default map;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    position: "absolute",
    zIndex: 10,
    padding: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 10,
    marginRight: 3,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
});
