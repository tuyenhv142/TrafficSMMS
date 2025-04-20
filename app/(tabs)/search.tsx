import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import apiClient from "./../../api/apiClient";
import { StackNavigationProp } from "@react-navigation/stack";
import { Link, useRouter } from "expo-router";
import { useAuth } from "./../../context/AuthProvider";

// Định nghĩa các kiểu dữ liệu
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

type RootStackParamList = {
  ShowMap: { selectedSignal: TrafficSignal };
};

const Search = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchText, setSearchText] = useState<string>("");
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // const navigation = useNavigation(); // Sử dụng hook navigation nếu cần điều hướng

  // Hàm lấy dữ liệu đèn giao thông từ API
  const fetchTrafficSignals = async () => {
    try {
      const response = await apiClient.get<ApiResponse>(
        "TrafficEquipment/FindAll?page=1&pageSize=22000"
      );
      // console.log("Response:", response.data);
      if (response.data?.content?.data) {
        setTrafficSignals(response.data.content.data);
      } else {
        setError("No traffic signal data available.");
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError("Failed to fetch data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrafficSignals();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTrafficSignals(); // Gọi API khi component load
  }, []);

  // Lọc danh sách đèn theo tên hoặc ID khi người dùng tìm kiếm
  const filteredSignals = trafficSignals.filter((item) =>
    item.signalNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleItemPress = (signal: TrafficSignal) => {
    navigation.navigate("ShowMap", { selectedSignal: signal });
  };

  return (
    <View style={styles.container}>
      <Button title="登出" onPress={logout} color="red" />
      {/* <TextInput
        style={styles.searchBar}
        placeholder="Search by signal number..."
        value={searchText}
        onChangeText={setSearchText}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredSignals}
          keyExtractor={(item) => item.identificationCode.toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                { backgroundColor: item.isError ? "red" : "green" },
              ]}
              onPress={() => {
                // Sử dụng Link component hoặc router.push
                // router.push({
                //   // pathname: "/(tabs)/showMap",
                //   params: { selectedSignal: JSON.stringify(item) },
                // });
              }}
            >
              <Text style={styles.itemText}>{item.signalNumber}</Text>
              <Text style={styles.statusText}>
                {item.typesOfSignal} - {item.latitude}, {item.longitude}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No results found</Text>
          }
        />
      )} */}
    </View>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
  },
  item: {
    padding: 15,
    backgroundColor: "green",
    marginBottom: 10,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    marginTop: 5,
  },
  itemText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
});
