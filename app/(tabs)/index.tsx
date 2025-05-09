import { Text, View, Button, StyleSheet } from "react-native";
// import "react-native-get-random-values";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider"; // Import useAuth từ AuthContext
import "react-native-gesture-handler";
import "react-native-reanimated";
import Test from "../../components/Test";
import LogoComponent from "../../components/LogoComponent";
import MapViewComponent from "../../components/MapViewComponent";
import apiClient from "../../api/apiClient";
import { getDistance } from "geolib";

interface TrafficSignal {
  identificationCode: number;
  signalNumber: string;
  latitude: number;
  longitude: number;
  typesOfSignal: string;
  statusError: number;
  isError: boolean;
}

export default function Index() {
  const { logout, name } = useAuth(); // Sử dụng useAuth để lấy thông tin người dùng
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
      }
    } catch (e) {
      console.error("API error", e);
    }
  };

  // Mỗi lần vào trang, fetch lại dữ liệu
  useEffect(() => {
    fetchSignals();
  }, []); // Chạy 1 lần khi component mount

  // Lọc nearbySignals khi allSignals thay đổi
  useEffect(() => {
    const locationToUse = selectedLocation || mapCenterLocation;

    const nearby = allSignals.filter((signal) => {
      const distance = getDistance(
        { latitude: signal.latitude, longitude: signal.longitude },
        locationToUse
      );
      return distance < 1000; // Chỉ lấy những tín hiệu gần vị trí (dưới 1000m)
    });

    setNearbySignals(nearby); // Cập nhật tín hiệu gần với vị trí
  }, [selectedLocation, mapCenterLocation, allSignals]); // Lắng nghe thay đổi để lọc tín hiệu gần

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        {/* <LogoComponent /> */}
        <Test onLocationSelected={setSelectedLocation} />
      </View>
      <MapViewComponent
        selectedLocation={selectedLocation || mapCenterLocation}
        signals={nearbySignals}
        onMapCenterChanged={setMapCenterLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    zIndex: 10,
    padding: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
});
