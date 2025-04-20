import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import MapView, {
  Marker,
  Region,
  Callout,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import apiClient from "./../api/apiClient";
import _, { isError } from "lodash";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import mapStyle1 from "./../mapStyle.json"; // Import your custom map style if needed
import Modal from "react-native-modal";

interface TrafficSignal {
  identificationCode: number;
  signalNumber: string;
  typesOfSignal: string;
  latitude: number;
  longitude: number;
  isError: boolean;
  statusError: number;
  status: number;
}

type RootStackParamList = {
  ShowMap: { selectedSignal?: TrafficSignal };
};

type ShowMapRouteProp = RouteProp<RootStackParamList, "ShowMap">;

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

const getRepairStatusDescription = (status: number) => {
  switch (status) {
    case 0:
      return "尚未確認";
    case 1:
      return "已分配工程師";
    case 2:
      return "工程師正在維修中";
    case 3:
      return "已完成維修";
    default:
      return "null";
  }
};

const ShowMap = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedSignal = params.selectedSignal
    ? JSON.parse(params.selectedSignal as string)
    : null;
  const [selectedSignal1, setSelectedSignal1] = useState<TrafficSignal | null>(
    null
  );
  const route = useRoute<ShowMapRouteProp>();
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<boolean>(true);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">(
    "standard"
  );
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 23.0346,
    longitude: 120.2887,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [lastFetchedRegion, setLastFetchedRegion] = useState(mapRegion);
  const [showErrorsOnly, setShowErrorsOnly] = useState<boolean>(false);
  const [selectedSignalId, setSelectedSignalId] = useState<number | null>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});

  const toggleMapType = () => {
    setMapType((prevType) => (prevType === "hybrid" ? "standard" : "hybrid"));
  };

  const toggleShowErrorsOnly = () => {
    setShowErrorsOnly((prevState) => !prevState);
  };
  const clickMapStyle = () => {
    setMapStyle((prevState) => !prevState);
  };

  const fetchTrafficSignals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<{
        content?: { data?: TrafficSignal[] };
      }>("TrafficEquipment/FindAll?page=1&pageSize=22000");

      if (response.data?.content?.data) {
        setTrafficSignals((prev) => {
          const newData = response.data?.content?.data || [];
          return JSON.stringify(prev) === JSON.stringify(newData)
            ? prev
            : newData;
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrafficSignals();
  }, [fetchTrafficSignals]);

  const handleCancelSelection = useCallback(() => {
    setSelectedSignalId(null);
    router.setParams({ selectedSignal: null });

    if (selectedSignalId && markerRefs.current[selectedSignalId]) {
      markerRefs.current[selectedSignalId]?.hideCallout();
    }

    setTimeout(() => {
      setSelectedSignalId(null);
      router.setParams({ selectedSignal: null });
    }, 300);
  }, [selectedSignalId, router]);

  useEffect(() => {
    const distance = getDistance(
      lastFetchedRegion.latitude,
      lastFetchedRegion.longitude,
      mapRegion.latitude,
      mapRegion.longitude
    );

    if (distance >= 1) {
      fetchTrafficSignals();
      setLastFetchedRegion(mapRegion);
      // handleCancelSelection();
    }
  }, [mapRegion]);

  const handleRegionChange = useMemo(
    () =>
      _.debounce((region: Region) => {
        setIsLoading(true);
        setMapRegion(region);
        setTimeout(() => setIsLoading(false), 500);
      }, 500),
    []
  );

  useEffect(() => {
    return () => {
      handleRegionChange.cancel();
    };
  }, []);

  const visibleSignals = useMemo(() => {
    return trafficSignals.filter((signal) => {
      if (
        !signal.latitude ||
        !signal.longitude ||
        isNaN(signal.latitude) ||
        isNaN(signal.longitude)
      ) {
        return false;
      }

      if (showErrorsOnly) return signal.isError;

      const distance = getDistance(
        signal.latitude,
        signal.longitude,
        mapRegion.latitude,
        mapRegion.longitude
      );

      return (
        distance <= 1 ||
        (selectedSignalId === signal.identificationCode &&
          selectedSignal?.identificationCode === signal.identificationCode)
      );
    });
  }, [
    trafficSignals,
    showErrorsOnly,
    mapRegion,
    selectedSignalId,
    selectedSignal,
  ]);

  useEffect(() => {
    if (selectedSignal) {
      const isNewLocation =
        mapRegion.latitude !== selectedSignal.latitude ||
        mapRegion.longitude !== selectedSignal.longitude;

      if (isNewLocation) {
        setMapRegion({
          latitude: selectedSignal.latitude,
          longitude: selectedSignal.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        const markerRef = markerRefs.current[selectedSignal.identificationCode];
        if (markerRef && !markerRef.calloutShown) {
          markerRef.showCallout();
          markerRef.calloutShown = true;
        }
      }
    }
  }, [selectedSignal, mapRegion]);

  useEffect(() => {
    if (selectedSignal) {
      const markerRef =
        selectedSignalId !== null ? markerRefs.current[selectedSignalId] : null;
      if (markerRef) {
        markerRef.hideCallout();
      }

      setSelectedSignalId(selectedSignal.identificationCode);

      setTimeout(() => {
        const newMarkerRef =
          markerRefs.current[selectedSignal.identificationCode];
        if (newMarkerRef) {
          newMarkerRef.showCallout();
        }
      }, 500);
    } else {
      Object.keys(markerRefs.current).forEach((key) => {
        const markerRef = markerRefs.current[key];
        if (markerRef) {
          markerRef.hideCallout();
        }
      });
    }
  }, [selectedSignal, selectedSignalId]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType={mapType}
        initialRegion={mapRegion}
        customMapStyle={mapStyle ? mapStyle1 : []}
        // region={mapRegion}
        onRegionChangeComplete={handleRegionChange}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        accessibilityLanguage="tw"
      >
        {visibleSignals.map((signal) => (
          <Marker
            key={signal.identificationCode}
            coordinate={{
              latitude: signal.latitude,
              longitude: signal.longitude,
            }}
            // title={signal.signalNumber}
            // description={signal.isError ? "Error" : "Normal"}
            // image={require("../assets/traffic-light.png")}
            pinColor={signal.isError ? "red" : "green"}
            tracksViewChanges={false}
            ref={(ref) => {
              markerRefs.current[signal.identificationCode] = ref;
            }}
            // description={signal.signalNumber}
            onPress={() => {
              handleCancelSelection();
              setSelectedSignalId(signal.identificationCode);
              setSelectedSignal1(signal);
              router.setParams({ selectedSignal: JSON.stringify(signal) });
              const markerRef = markerRefs.current[signal.identificationCode];
              // if (markerRef) {
              //   markerRef.showCallout();
              // }
            }}
          >
            {/* {selectedSignalId === signal.identificationCode && (
              <Callout
                tooltip={false}
                onPress={handleCancelSelection}
                style={{
                  backgroundColor: "white",
                  // padding: 10,
                  borderRadius: 5,
                  minWidth: 200,
                  elevation: 5,
                  zIndex: 1000,
                }}
              >
                <View style={{ padding: 10 }}>
                  <Text>Name: {signal.signalNumber}</Text>
                  <Text>Code: {signal.identificationCode}</Text>
                  <Text>
                    Status Error: {getFaultCodeDescription(signal.statusError)}
                  </Text>
                  <Text>
                    Repair Status: {getRepairStatusDescription(signal.status)}
                  </Text>
                  <TouchableOpacity
                    style={{
                      marginTop: 5,
                      padding: 5,
                      backgroundColor: "gray",
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "white", textAlign: "center" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            )} */}
          </Marker>
          // <Marker
          //   key={signal.identificationCode}
          //   coordinate={{
          //     latitude: signal.latitude,
          //     longitude: signal.longitude,
          //   }}
          //   pinColor={signal.isError ? "red" : "green"}
          //   ref={(ref) => {
          //     markerRefs.current[signal.identificationCode] = ref;
          //   }}
          //   onPress={() => {
          //     setSelectedSignalId(signal.identificationCode);
          //     router.setParams({ selectedSignal: JSON.stringify(signal) });
          //     const markerRef = markerRefs.current[signal.identificationCode];
          //     if (markerRef) {
          //       markerRef.showCallout();
          //     }
          //   }}
          // >
          //   {selectedSignalId === signal.identificationCode && (
          //     <Callout
          //       tooltip
          //       onPress={handleCancelSelection}
          //       style={{
          //         backgroundColor: "white",
          //         padding: 10,
          //         borderRadius: 5,
          //       }}
          //     >
          //       <View style={{ padding: 10 }}>
          //         <Text>Name : {signal.signalNumber}</Text>
          //         <Text>Code : {signal.identificationCode}</Text>
          //         <Text>
          //           Status Error: {getFaultCodeDescription(signal.statusError)}
          //         </Text>
          //         <Text>
          //           Repair Status: {getRepairStatusDescription(signal.status)}
          //         </Text>
          //         <TouchableOpacity
          //           style={{
          //             marginTop: 5,
          //             padding: 5,
          //             backgroundColor: "gray",
          //             borderRadius: 5,
          //           }}
          //         >
          //           <Text style={{ color: "white", textAlign: "center" }}>
          //             Cancel
          //           </Text>
          //         </TouchableOpacity>
          //       </View>
          //     </Callout>
          //   )}
          // </Marker>
        ))}
      </MapView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleMapType}>
          <Text style={styles.buttonText}>
            {mapType === "standard" ? "🌍" : "🗺"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleShowErrorsOnly}>
          <Text style={styles.buttonText}>{showErrorsOnly ? "✅" : "🚨"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={clickMapStyle}>
          <Text style={styles.buttonText}>{mapStyle ? "i" : "o"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        {/* <Text style={styles.infoText}>Center location</Text>
        <Text style={styles.infoText}>
          latitude: {mapRegion.latitude.toFixed(6)} | longitude:{" "}
          {mapRegion.longitude.toFixed(6)}
        </Text> */}
        <Text style={styles.infoText}>號誌顯示 {visibleSignals.length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    flexDirection: "column",
    gap: 10,
  },
  button: {
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
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#222",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#ccc",
    marginBottom: 8,
  },
  button1: {
    backgroundColor: "#ffcc00",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText1: {
    color: "#000",
    fontWeight: "bold",
  },
});

export default ShowMap;
