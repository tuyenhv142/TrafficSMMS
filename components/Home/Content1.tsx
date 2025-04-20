import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Colors } from "../../constants/Colors";
import { useFocusEffect, useRouter } from "expo-router";
import apiClient from "../../api/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthProvider";

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
interface ApiResponse {
  content?: {
    data?: {
      id: number;
      traff_id: number;
      lat: number;
      log: number;
      managementUnit: string;
      signalNumber: string;
      faultCodes: number;
      repairStatus: number;
      user_id: number;
      user_name: string;
      identificationCode: number;
      typesOfSignal: string;
    }[];
  };
}
const Content1 = () => {
  interface ApiUpdateResponse {
    success: boolean;
    error: string;
    errorCode: number;
    content: string;
  }
  interface TrafficSignal {
    identificationCode: number;
    latitude: number;
    longitude: number;
    signalNumber: string;
    typesOfSignal: string;
    userId: number;
    faultCodes: number;
    repairStatus: number;
    remark: string;
  }
  const router = useRouter();
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [userid, setUserid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { role } = useAuth();
  const fetchRepairDetail = async () => {
    try {
      const response = await apiClient.get<ApiResponse>(
        "/RepairDetails/FindAllNoDoneByAdmin?page=1&pageSize=20"
      );
      // console.log("Response:", response.data);
      if (response.data?.content?.data) {
        setTrafficSignals(
          response.data.content.data.map((item) => ({
            identificationCode: item.id,
            latitude: item.lat,
            longitude: item.log,
            signalNumber: item.signalNumber,
            typesOfSignal: item.managementUnit,
            userId: item.user_id,
            faultCodes: item.faultCodes,
            repairStatus: item.repairStatus,
            remark: item.typesOfSignal,
          }))
        );
        // console.log("response", response);
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
  useFocusEffect(
    useCallback(() => {
      console.log("Current Role:", role);
      //   if (role !== "1" && role !== "2") {
      //     alert("您沒有權限訪問此頁面。");
      //     // router.replace("/");
      //   }
    }, [role])
  );
  const confirmRepairStatus = async (id: number) => {
    try {
      const requestBody = {
        id: id, // ID của đèn tín hiệu
      };
      const response = await apiClient.put<ApiUpdateResponse>(
        `RepairDetails/Update`,
        requestBody
      );
      // if (response.data.success === false) {
      //   throw new Error("Failed to update signal");
      // }
      console.log("Response:", response.data);
    } catch (error) {
      console.error("Error updating repair status:", error);
    }
  };
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("user_id");
      setUserid(storedUserId); // Set the user ID in the state
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    fetchRepairDetail(); // Gọi API khi component load
  }, []);
  const filteredSignals = trafficSignals.filter(
    (item) =>
      item.userId === null ||
      (userid !== null && item.userId == parseInt(userid))
  );
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.text}>故障號誌</Text>
        <FontAwesome5 name="bars" size={28} color={Colors.primaryColor} />
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredSignals}
          horizontal={true}
          keyExtractor={(item) => item.identificationCode.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.item,
                item.repairStatus === 3 ? styles.fixedItem : styles.errorItem,
              ]}
              onPress={() => {
                if (role !== "1" && role !== "2") {
                  alert("您沒有權限訪問此頁面。");
                  return;
                }
                router.push({
                  pathname: "/trafficSignalDetail",
                  params: {
                    index: index.toString(),
                    signals: JSON.stringify(filteredSignals),
                  },
                });
                confirmRepairStatus(item.identificationCode);
              }}
            >
              <View style={styles.infoContainer}>
                <Text style={styles.signalNumber}>{item.signalNumber}</Text>
                <Text style={styles.statusText}>
                  Error: {getFaultCodeDescription(item.faultCodes)}
                </Text>
                <Text style={styles.statusText}>
                  Status: {getRepairStatusDescription(item.repairStatus)}
                </Text>
                {item.remark ? (
                  <Text style={styles.remarkText}>Note: {item.remark}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default Content1;

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingLeft: 20,
    paddingRight: 20,
  },
  errorItem: {
    backgroundColor: Colors.primaryColor,
  },
  fixedItem: {
    backgroundColor: "#34C759",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
  map: {
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  item: {
    marginLeft: 10,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: 180,
  },
  remarkText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 5,
    fontStyle: "italic",
  },
  infoContainer: {
    flexDirection: "column",
  },
  signalNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "red",
    fontWeight: "bold",
  },
  statusText: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
});
