import {
  View,
  TextInput,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

interface ApiResponse {
  content?: {
    data?: {
      identificationCode: number;
      signalNumber: string;
      typesOfSignal: string;
      latitude: number;
      longitude: number;
      isError: boolean;
    }[];
  };
}

interface TrafficSignal {
  identificationCode: number;
  signalNumber: string;
  typesOfSignal: string;
  latitude: number;
  longitude: number;
  isError: boolean;
}

interface HeaderViewComponentProps {
  onSelectSignal: (location: { latitude: number; longitude: number }) => void;
}

const HeaderViewComponent = ({ onSelectSignal }: HeaderViewComponentProps) => {
  const [searchText, setSearchText] = useState<string>("");
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTrafficSignals = async () => {
    try {
      const response = await apiClient.get<ApiResponse>(
        "TrafficEquipment/FindAll?page=1&pageSize=2000"
      );
      if (response.data?.content?.data) {
        setTrafficSignals(response.data.content.data);
      } else {
        console.log("No traffic signal data available.");
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficSignals();
  }, []);

  const filteredSignals = trafficSignals.filter((signal) =>
    signal.signalNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View>
      <TextInput
        style={styles.searchBar}
        placeholder="Search by signal number..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Chỉ hiển thị nếu có nội dung tìm kiếm */}
      {searchText.trim() !== "" && (
        <View style={styles.resultContainer}>
          <FlatList
            data={filteredSignals}
            keyExtractor={(item) => item.identificationCode.toString()}
            renderItem={({ item }) => (
              <Text
                style={styles.resultText}
                onPress={() =>
                  onSelectSignal({
                    latitude: item.latitude,
                    longitude: item.longitude,
                  })
                }
              >
                {item.signalNumber}
              </Text>
            )}
            style={{ maxHeight: 200 }} // Chiều cao tối đa để không chiếm hết màn hình
          />
        </View>
      )}
    </View>
  );
};

export default HeaderViewComponent;

const styles = StyleSheet.create({
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  resultContainer: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    maxHeight: 200, // Giới hạn chiều cao để cuộn
  },
  resultText: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
