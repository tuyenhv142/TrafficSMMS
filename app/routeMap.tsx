import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MapView, { Polyline, Marker } from "react-native-maps";
// import apiClient from "@/api/apiClient";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";


interface TrafficSignal {
  identificationCode: number;
  latitude: number;
  longitude: number;
  road1: string;
  road2: string;
  district1: string;
  signalNumber: string;
  typesOfSignal: string;
  userId: number;
  faultCodes: number;
  repairStatus: number;
  remark: string;
  images: string[];
  expanded: boolean;
}

const routeMap = () => {
  const { data } = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasFittedMap, setHasFittedMap] = useState(false);
  const [showList, setShowList] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  //   const unRepairedSignals = trafficSignals.filter(
  //     (signal) => signal.repairStatus !== 3
  //   );

  const coordinates = currentLocation
    ? [
        [currentLocation.longitude, currentLocation.latitude],
        ...trafficSignals.map((signal) => [signal.longitude, signal.latitude]),
      ]
    : [];

    useEffect(() => {
  (async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần quyền truy cập vị trí để hiển thị bản đồ!');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    setCurrentLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  })();
}, []);

  // console.log("Coordinates sent to API:", coordinates);

  useEffect(() => {
    const getRoute = async () => {
      if (
        currentLocation &&
        trafficSignals.length > 0 &&
        trafficSignals.every((s) => s.latitude && s.longitude)
      ) {
        try {
          const data = await fetchRoute();
          setRouteData(data);
          // console.log("Route data:", data);
        } catch (err) {
          // console.error("Route fetch error:", err);
        }
      }
    };

    getRoute();
  }, [trafficSignals, currentLocation]);

  useEffect(() => {
    if (
      !hasFittedMap &&
      routeData &&
      routeData.features &&
      routeData.features.length > 0 &&
      mapRef.current
    ) {
      const routeCoordinates = routeData.features[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        })
      );

      const allCoordinates = [
        ...routeCoordinates,
        ...trafficSignals.map((signal) => ({
          latitude: signal.latitude,
          longitude: signal.longitude,
        })),
      ];

      mapRef.current.fitToCoordinates(allCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });

      setHasFittedMap(true); // đánh dấu đã fit xong
    }
  }, [routeData, trafficSignals, hasFittedMap]);

  const fetchRoute = async () => {
    const apiKey = "5b3ce3597851110001cf6248bd48b134d5f8443fb2a538a1554ee87e";
    const profile = "driving-car"; // walking, cycling, driving-car...
    //   const jobs = trafficSignals.map((signal, index) => ({
    //   id: index + 1,
    //   location: [signal.longitude, signal.latitude],
    // }));

    const body = {
      coordinates: coordinates,
      // optimize_waypoints: true,
    };

    try {
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // console.log(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log("OpenRouteService response:", data);
      return data;
    } catch (error) {
      // console.log("Fetch route error:", error);
      throw error;
    }
  };
  const sortSignalsByNearest = (
    origin: { latitude: number; longitude: number },
    signals: TrafficSignal[]
  ): TrafficSignal[] => {
    const visited: boolean[] = new Array(signals.length).fill(false);
    const sorted: TrafficSignal[] = [];
    let current = origin;

    for (let i = 0; i < signals.length; i++) {
      let minIndex = -1;
      let minDistance = Infinity;

      signals.forEach((signal, index) => {
        if (!visited[index]) {
          const distance = Math.hypot(
            signal.latitude - current.latitude,
            signal.longitude - current.longitude
          );
          if (distance < minDistance) {
            minDistance = distance;
            minIndex = index;
          }
        }
      });

      if (minIndex !== -1) {
        visited[minIndex] = true;
        sorted.push(signals[minIndex]);
        current = {
          latitude: signals[minIndex].latitude,
          longitude: signals[minIndex].longitude,
        };
      }
    }

    return sorted;
  };

  useEffect(() => {
    if (currentLocation && trafficSignals.length > 0) {
      const sorted = sortSignalsByNearest(currentLocation, trafficSignals);
      setTrafficSignals(sorted);
    }
  }, [currentLocation, trafficSignals.length]);

  useEffect(() => {
    if (data) {
      try {
        const parsedData = JSON.parse(data as string);
        setTrafficSignals(parsedData);
      } catch (error) {
        console.error("Không thể parse dữ liệu truyền vào từ route:", error);
      }
    }
  }, [data]);

  const removeSignalAtIndex = (index: number) => {
    const updatedSignals = [...trafficSignals];
    updatedSignals.splice(index, 1);
    setTrafficSignals(updatedSignals);
    setHasFittedMap(false);
  };

  const focusToLocation = (latitude: number, longitude: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000
      );
    }
  };

  useEffect(() => {
  if (showList && mapRef.current && trafficSignals.length > 0) {
    // Lấy các tọa độ của các điểm
    const points = trafficSignals.map(signal => ({
      latitude: signal.latitude,
      longitude: signal.longitude,
    }));

    // Nếu có dữ liệu tuyến đường thì thêm vào để fit hết
    let allCoordinates = points;
    if (routeData && routeData.features && routeData.features.length > 0) {
      const routeCoordinates = routeData.features[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        })
      );
      allCoordinates = [...points, ...routeCoordinates];
    }

    // Fit map về vùng có tất cả các điểm
    mapRef.current.fitToCoordinates(allCoordinates, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  }
}, [showList, trafficSignals, routeData]);


  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        ref={mapRef}
        region={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        // showsUserLocation={true}
        followsUserLocation={true}
        showsUserLocation={true}
        onUserLocationChange={(event) => {
          const coordinate = event.nativeEvent.coordinate;
          if (coordinate) {
            const { latitude, longitude } = coordinate;
            // console.log("MapView User Location:", latitude, longitude);
            setCurrentLocation({ latitude, longitude });
            // setCurrentLocation({
            //   latitude: 22.99318457718073,
            //   longitude: 120.20495235408347,
            // });
          }
        }}
      >
        {trafficSignals.map((signal, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: signal.latitude,
              longitude: signal.longitude,
            }}
            title={`點 ${idx + 1}`}
          />
        ))}

        {routeData && (
          <Polyline
            coordinates={routeData.features[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
              })
            )}
            strokeColor="blue"
            strokeWidth={4}
          />
        )}
      </MapView>

      <TouchableOpacity
        onPress={() => {setShowList(!showList);}}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "white",
          padding: 12,
          borderRadius: 30,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          elevation: 5,
          zIndex: 999,
        }}
      >
        <Text style={{ fontSize: 20 }}>📋</Text>
      </TouchableOpacity>

      {showList && (
        <View style={{ flex: 1, backgroundColor: "#f0f0f0" }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, margin: 10 }}>
            交通號誌維修路線:
          </Text>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
          >
            {trafficSignals.map((signal, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() =>
                  focusToLocation(signal.latitude, signal.longitude)
                }
                style={{
                  backgroundColor: "white",
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                }}
              >
                <Text>點 {idx + 1}</Text>
                <Text>
                  地址: {signal.latitude} - {signal.longitude}
                </Text>
                {/* <Text>區: {signal.district1}</Text> */}
                <Text>燈類型: {signal.typesOfSignal}</Text>
                <TouchableOpacity
                  onPress={() => removeSignalAtIndex(idx)}
                  style={{ marginTop: 5, alignSelf: "flex-end" }}
                >
                  <Text style={{ color: "red" }}>刪除</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default routeMap;

const styles = StyleSheet.create({});
