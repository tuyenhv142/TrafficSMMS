import React, { useRef, useEffect, useState } from "react";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import Modal from "react-native-modal";
import { getDistance } from "geolib";
import mapStyle1 from "../mapStyle.json";
// import { types } from "@babel/core";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Platform } from "react-native";

interface Signal {
  identificationCode: number;
  signalNumber: string;
  latitude: number;
  longitude: number;
  statusError: number;
  // statusErrorFauCode: number;
  typesOfSignal: string;
  isError: boolean;
}

interface Props {
  selectedLocation: { latitude: number; longitude: number } | null;
  signals: Signal[];
  onMapCenterChanged?: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}
const getFaultCodeDescription = (code: number) => {
  switch (code) {
    case 0:
      return "號誌正常";
    case 1:
      return "號誌設備故障";
    case 2:
      return "號誌停電";
    default:
      return "null";
  }
};

const MapViewComponent = ({
  selectedLocation,
  signals,
  onMapCenterChanged,
}: Props) => {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  console.log("selectedSignal", selectedSignal);
  const lastCenter = useRef<{ latitude: number; longitude: number } | null>(
    null
  );
  const [mapStyle, setMapStyle] = useState<boolean>(true);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard"
  );
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);

  useEffect(() => {
    lastCenter.current = selectedLocation;
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...selectedLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [selectedLocation]);

  const handleRegionChangeComplete = (region: Region) => {
    const newCenter = {
      latitude: region.latitude,
      longitude: region.longitude,
    };

    // So sánh khoảng cách từ vị trí trước đó
    if (lastCenter.current) {
      const distance = getDistance(lastCenter.current, newCenter);

      if (distance >= 1000) {
        onMapCenterChanged?.(newCenter);
        lastCenter.current = newCenter; // Cập nhật tâm mới
      }
    } else {
      onMapCenterChanged?.(newCenter);
      lastCenter.current = newCenter;
    }
  };
  const toggleMapType = () => {
    setMapType((prevType) => (prevType === "hybrid" ? "standard" : "hybrid"));
  };

  const toggleShowErrorsOnly = () => {
    setShowErrorsOnly((prevState) => !prevState);
  };
  const clickMapStyle = () => {
    setMapStyle((prevState) => !prevState);
  };

  return (
    <>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapType={mapType}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={mapStyle ? mapStyle1 : []}
        initialRegion={{
          latitude: 22.99318457718073,
          longitude: 120.20495235408347,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        // userLocationAnnotationTitle="My Location"
        // showsUserLocation={true}
        // showsMyLocationButton={true}
        showsTraffic={showErrorsOnly}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* {selectedLocation && <Marker coordinate={selectedLocation} />} */}
        {signals.map((signal) => (
          <Marker
            key={signal.identificationCode}
            coordinate={{
              latitude: signal.latitude,
              longitude: signal.longitude,
            }}
            title={signal.signalNumber}
            pinColor={
              signal.isError && signal.statusError !== 0 ? "red" : "green"
            }
            onPress={() => setSelectedSignal(signal)}
          />
        ))}
      </MapView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button1} onPress={toggleMapType}>
          <MaterialCommunityIcons
            name={mapType === "standard" ? "map" : "satellite-variant"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button1} onPress={toggleShowErrorsOnly}>
          <MaterialCommunityIcons
            name={showErrorsOnly ? "alert-circle-outline" : "traffic-light"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.button1} onPress={clickMapStyle}>
          <MaterialCommunityIcons
            name={mapStyle ? "palette-swatch" : "theme-light-dark"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      {/* <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Center location</Text>
              <Text style={styles.infoText}>
                latitude: {mapRegion.latitude.toFixed(6)} | longitude:{" "}
                {mapRegion.longitude.toFixed(6)}
              </Text>
        <Text style={styles.infoText}>號誌顯示 {visibleSignals.length}</Text>
      </View> */}
      <Modal
        isVisible={!!selectedSignal}
        onBackdropPress={() => setSelectedSignal(null)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          {/* <Text style={styles.modalTitle}>Báo đèn hỏng</Text> */}
          <Text style={styles.modalTitle}>
            號誌編號: {selectedSignal?.signalNumber}
          </Text>
          <Text style={styles.modalText}>
            識別碼: {selectedSignal?.identificationCode}
          </Text>
          <Text style={styles.modalText}>
            座標: {selectedSignal?.latitude}, {selectedSignal?.longitude}
          </Text>
          <Text style={styles.modalText}>
            號誌種類: {selectedSignal?.typesOfSignal}
          </Text>
          {/* {selectedSignal?.statusErrorFauCode === null ? (
            <Text style={styles.modalText}>狀態: {"號誌正常"}</Text>
          ) : (
            <Text style={styles.modalText}>
              狀態:{" "}
              {getFaultCodeDescription(
                selectedSignal?.statusErrorFauCode ?? -1
              )}
              {/* {selectedSignal?.statusError} 
            </Text>
          )} */}
          <Text style={styles.modalText}>
            狀態: {getFaultCodeDescription(selectedSignal?.statusError ?? -1)}
          </Text>

          {!selectedSignal?.isError ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                router.push({
                  pathname: "/add",
                  params: { selectedSignal: JSON.stringify(selectedSignal) },
                });
                setSelectedSignal(null);
              }}
            >
              <Text style={styles.buttonText}>故障通報</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                Alert.alert("錯誤", "燈正在修理", [{ text: "確認" }])
              }
            >
              <Text style={styles.buttonText}>故障通報</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </>
  );
};

export default MapViewComponent;

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    // borderTopLeftRadius: 16,
    // borderTopRightRadius: 16,
  },
  modalTitle: {
    color: "#222",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#222",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    flexDirection: "column",
    gap: 10,
  },
  button1: {
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText1: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
