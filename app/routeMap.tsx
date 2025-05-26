import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import MapView, { Polyline, Marker } from "react-native-maps";
import apiClient from "@/api/apiClient";
import { useLocalSearchParams } from "expo-router";

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

interface ApiResponse {
  content?: {
    data?: {
      id: number;
      traff_id: number;
      lat: number;
      log: number;
      road1: string;
      road2: string;
      district1: string;
      managementUnit: string;
      signalNumber: string;
      faultCodes: number;
      repairStatus: number;
      user_id: number;
      user_name: string;
      identificationCode: number;
      typesOfSignal: string;
      images: string[];
    }[];
  };
}

const routeMap = () => {
  const { data } = useLocalSearchParams();
  const mapRef = useRef<MapView | null>(null);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [hasFittedMap, setHasFittedMap] = useState(false);
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
  //   const fetchRepairDetail = async () => {
  //     try {
  //       const response = await apiClient.get<ApiResponse>(
  //         "/RepairDetails/FindAllNoDoneByAccount?page=1&pageSize=200"
  //       );
  //       // console.log("Response:", response.data);
  //       if (response.data?.content?.data) {
  //         setTrafficSignals(
  //           response.data.content.data.map((item) => ({
  //             identificationCode: item.id,
  //             latitude: item.lat,
  //             longitude: item.log,
  //             road1: item.road1,
  //             road2: item.road2,
  //             district1: item.district1,
  //             signalNumber: item.signalNumber,
  //             typesOfSignal: item.managementUnit,
  //             userId: item.user_id,
  //             faultCodes: item.faultCodes,
  //             repairStatus: item.repairStatus,
  //             remark: item.typesOfSignal,
  //             images: Array.isArray(item.images) ? item.images : [],
  //             expanded: false,
  //           }))
  //         );
  //         // console.log("response", response);
  //       } else {
  //         // setError("No traffic signal data available.");
  //       }
  //     } catch (error: any) {
  //       console.error("Fetch error:", error);
  //       //   setError("Failed to fetch data.");
  //     } finally {
  //       //   setIsLoading(false);
  //     }
  //   };

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
    </View>
  );
};

export default routeMap;

const styles = StyleSheet.create({});
