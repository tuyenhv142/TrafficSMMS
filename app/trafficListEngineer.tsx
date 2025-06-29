import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../api/apiClient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "./../constants/Colors";
import MapView, { Polyline, Marker } from "react-native-maps";
import { set } from "lodash";

const getFaultCodeDescription2 = (code: number) => {
  switch (code) {
    case 0:
      return "設備故障";
    case 1:
      return "設備故障";
    case 2:
      return "設備停電";
    default:
      return "null";
  }
};

// Hàm chuyển đổi RepairStatus thành tên
const getRepairStatusDescription = (status: number) => {
  switch (status) {
    case 0:
      return "故障通報";
    case 1:
      return "故障確認";
    case 2:
      return "等確認";
    case 3:
      return "已完成維修";
    case 4:
      return "closed";
    default:
      return "null";
  }
};
const trafficListEngineer = () => {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const { role } = useAuth();
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userid, setUserid] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectFill, setSelectFill] = useState("全部");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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
  interface ApiUpdateResponse {
    success: boolean;
    error: string;
    errorCode: number;
    content: string;
  }

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchRepairDetail();
  //     // if (role !== "1" && role !== "2") {
  //     //   router.replace("/");
  //     // }
  //     // // Gọi API mỗi khi tab được focus
  //   }, [])
  // );
  useFocusEffect(
    useCallback(() => {
      console.log("Current Role:", role);
      //   if (role !== 2) {
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

  const fetchRepairDetail = async () => {
    try {
      const response = await apiClient.get<ApiResponse>(
        "/RepairDetails/FindAllNoDoneByAccount?page=1&pageSize=200"
      );
      // console.log("Response:", response.data);
      if (response.data?.content?.data) {
        setTrafficSignals(
          response.data.content.data.map((item) => ({
            identificationCode: item.id,
            latitude: item.lat,
            longitude: item.log,
            road1: item.road1,
            road2: item.road2,
            district1: item.district1,
            signalNumber: item.signalNumber,
            typesOfSignal: item.managementUnit,
            userId: item.user_id,
            faultCodes: item.faultCodes,
            repairStatus: item.repairStatus,
            remark: item.typesOfSignal,
            images: Array.isArray(item.images) ? item.images : [],
            expanded: false,
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
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRepairDetail();
    setRefreshing(false);
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

  // const filteredSignals = trafficSignals.filter(
  //   (item) => item.faultCodes !== 0
  // );
  const filteredSignals = trafficSignals.filter(
    (item) =>
      item.userId === null ||
      (userid !== null && item.userId == parseInt(userid))
  );

  const fill = filteredSignals
    .filter((item) =>
      item.signalNumber.toLowerCase().includes(searchText.toLowerCase())
    )
    .filter((item) => {
      if (selectFill === "全部") return true;

      const statusMap: Record<string, number> = {
        // 尚未確認: 0,
        // 故障通報: 0,
        // 故障確認: 1,
        等確認: 2,
        已完成維修: 3,
        // closed: 4,
      };

      return item.repairStatus === statusMap[selectFill];
    });

  console.log(fill);

  // Loading guard
  if (role === undefined || role === null || role === "") {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const isAuthorized = role === "2";
  const toggleCheckbox = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // if (!isAuthorized) {
  //   return <Text style={styles.errorText}>您沒有權限訪問此頁面。</Text>;
  // }

  return (
    <View style={styles.container}>
      <View
        style={{
          // display: "flex",
          flexDirection: "row",
          // justifyContent: "center",
          alignItems: "center",
          // alignContent: "center",
          // paddingHorizontal: 10,
          height: 40,
          marginBottom: 10,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            borderRadius: 8,
            borderColor: "#ccc",
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 0, // tránh padding dọc đẩy text lên xuống
            height: 40,
            marginRight: 10,
          }}
          placeholder="依訊號編號搜尋..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          onPress={() => {
            const allExpanded = trafficSignals.every((s) => s.expanded);
            setTrafficSignals((prev) =>
              prev.map((signal) => ({ ...signal, expanded: !allExpanded }))
            );
          }}
        >
          {trafficSignals.every((s) => s.expanded) ? (
            // <FontAwesome5 name="compress" size={24} color="black" />
            <Image
              style={{ height: 35, width: 35 }}
              source={require("./../assets/images/9329176_0.png")}
            ></Image>
          ) : (
            <Image
              style={{ height: 35, width: 35 }}
              source={require("./../assets/images/9329163_0.png")}
            ></Image>
            // <FontAwesome5 name="expand" size={24} color="black" />
          )}
          {/* <Image></Image> */}
        </TouchableOpacity>
      </View>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}
      >
        {[
          "全部",
          //   "故障通報",
          // "故障確認",
          "等確認",
          "已完成維修",
        ].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setSelectFill(status)}
            style={{
              backgroundColor:
                selectFill === status ? Colors.primaryColor : "#E5E5EA",
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 12,
              marginRight: 8,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: selectFill === status ? "#fff" : "#000" }}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <FlatList
            data={fill}
            keyExtractor={(item) => item.identificationCode.toString()}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.item,
                  item.repairStatus === 3 ? styles.fixedItem : styles.errorItem,
                ]}
              >
                <View style={styles.infoContainer}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      onPress={() => toggleCheckbox(item.identificationCode)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: "#000",
                        marginRight: 10,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {selectedItems.includes(item.identificationCode) && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: "#000",
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setTrafficSignals((prev) =>
                            prev.map((signal) =>
                              signal.identificationCode ===
                              item.identificationCode
                                ? { ...signal, expanded: !signal.expanded }
                                : signal
                            )
                          );
                        }}
                      >
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            height: 50,
                            alignItems: "center",
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                fontSize: 14,
                                // fontWeight: "bold",
                                color: "#000",
                                // width: "30%",
                              }}
                            >
                              號誌編號: {item.signalNumber}
                            </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                // fontWeight: "bold",
                                color: "#000",
                                // width: "30%",
                              }}
                            >
                              號誌類型: {item.typesOfSignal}
                            </Text>
                          </View>
                          <View
                            style={{
                              borderRadius: 50,
                              backgroundColor:
                                item.repairStatus === 1
                                  ? "#B53A3A"
                                  : item.repairStatus === 2
                                  ? "#eeca5d"
                                  : item.repairStatus === 3
                                  ? "#76c1ff"
                                  : "#c5c5c5",
                              padding: 5,
                              width: "30%",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                // fontWeight: "bold",
                                // width: "100%",
                                color:
                                  item.repairStatus !== 1 ? "#000" : "#fff",
                              }}
                            >
                              {getRepairStatusDescription(item.repairStatus)}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Largebox hiển thị nếu expanded */}
                  {item.expanded && (
                    <View
                      style={{
                        marginTop: 10,
                        borderTopColor: "#000",
                        borderTopWidth: 0.5,
                      }}
                    >
                      {/* <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    > */}
                      <Text style={styles.statusText1}>
                        緯度: {item.latitude}
                      </Text>
                      <Text style={styles.statusText1}>
                        經度: {item.longitude}
                      </Text>
                      {/* <Text style={styles.statusText1}>
                      行政區: {item.district1}
                    </Text>
                    <Text style={styles.statusText1}>
                      道路: {item.road1} , {item.road2}
                    </Text> */}
                      {/* </View> */}
                      <View>
                        <View>
                          {item.userId == null ? (
                            <Text style={styles.statusText1}>維修紀錄: 無</Text>
                          ) : (
                            <>
                              <Text style={styles.statusText1}>
                                維修紀錄: {item.userId}
                              </Text>
                              <Text style={styles.statusText1}>
                                上次維修日期: {item.signalNumber}
                              </Text>
                              <Text style={styles.statusText1}>
                                上次故障原因:{" "}
                                {getFaultCodeDescription2(item.faultCodes)}
                              </Text>
                              {/* <Text style={styles.statusText1}>
                              維修工程師:{" "}
                              {item.userId == 1 ? "杜文長" : "黃文選"}
                            </Text> */}
                            </>
                          )}
                        </View>
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 10,
                            borderTopColor: "#000",
                            borderTopWidth: 0.5,
                          }}
                        >
                          <TouchableOpacity
                          // onPress={() => {
                          //   setSelectedItems((prev) =>
                          //     prev.includes(item.identificationCode)
                          //       ? prev.filter(
                          //           (id) => id !== item.identificationCode
                          //         )
                          //       : [...prev, item.identificationCode]
                          //   );
                          //   const selectedSignals = trafficSignals.filter(
                          //     (signal) =>
                          //       selectedItems.includes(
                          //         signal.identificationCode
                          //       )
                          //   );
                          //   router.push({
                          //     pathname: "/routeMap",
                          //     params: {
                          //       data: JSON.stringify(selectedSignals),
                          //     },
                          //   });
                          // }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#000",
                                marginTop: 5,
                                borderBottomColor: "#000",
                                borderBottomWidth: 1,
                              }}
                            >
                              規劃路徑
                            </Text>
                          </TouchableOpacity>
                          {/* <TouchableOpacity
                          onPress={() => {
                            router.push({
                              pathname: "/trafficSignalDetail",
                              params: {
                                index: index.toString(),
                                signals: JSON.stringify(fill),
                              },
                            });
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#000",
                              marginTop: 5,
                              borderBottomColor: "#000",
                              borderBottomWidth: 1,
                            }}
                          >
                            顯示詳細資料
                          </Text>
                        </TouchableOpacity> */}
                          <TouchableOpacity
                            onPress={() => {
                              router.push({
                                pathname: "/trafficSignalEngineer",
                                params: {
                                  index: index.toString(),
                                  signals: JSON.stringify(fill),
                                },
                              });
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#000",
                                marginTop: 5,
                                borderBottomColor: "#000",
                                borderBottomWidth: 1,
                              }}
                            >
                              顯示詳細資料
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* <Text style={styles.statusText1}>
                      使用者: {item.userId ?? "無"}
                    </Text> */}
                      {/* Có thể thêm nhiều dòng khác nếu muốn */}
                    </View>
                  )}
                </View>
              </View>
            )}
            // renderItem={({ item }) => (
            //   <TouchableOpacity
            //     style={[
            //       styles.item,
            //       item.repairStatus === 3 ? styles.fixedItem : styles.errorItem,
            //     ]}
            //     onPress={() => {
            //       router.push({
            //         pathname: "/trafficSignalDetail",
            //         params: { signal: JSON.stringify(item) },
            //       });
            //       confirmRepairStatus(item.identificationCode);
            //     }}
            //   >
            //     <View style={styles.infoContainer}>
            //       <Text style={styles.signalNumber}>{item.signalNumber}</Text>
            //       <Text style={styles.statusText}>
            //         Error: {getFaultCodeDescription(item.faultCodes)}
            //       </Text>
            //       <Text style={styles.statusText}>
            //         Status: {getRepairStatusDescription(item.repairStatus)}
            //       </Text>
            //       {item.remark ? (
            //         <Text style={styles.remarkText}>Note: {item.remark}</Text>
            //       ) : null}
            //     </View>
            //   </TouchableOpacity>
            // )}
            ListEmptyComponent={<Text style={styles.emptyText}>沒有資料</Text>}
          />
          {selectedItems.length > 0 && (
            <TouchableOpacity
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                backgroundColor: "#007BFF",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 50,
                elevation: 5,
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
              }}
              onPress={() => {
                const selectedSignals = trafficSignals.filter((signal) =>
                  selectedItems.includes(signal.identificationCode)
                );
                router.push({
                  pathname: "/routeMap",
                  params: {
                    data: JSON.stringify(selectedSignals),
                  },
                });
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                規劃路徑
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default trafficListEngineer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  item: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  errorItem: {
    backgroundColor: "#E5E5EA",
  },
  fixedItem: {
    backgroundColor: "#E5E5EA",
  },
  infoContainer: {
    flexDirection: "column",
    // alignItems: "center",
  },
  signalNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  statusText: {
    fontSize: 14,
    color: "#000",
    marginTop: 5,
    maxWidth: "40%",
  },
  statusText1: {
    fontSize: 14,
    color: "#000",
    marginTop: 5,
  },
  remarkText: {
    fontSize: 12,
    color: "#fff",
    marginTop: 5,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
  },
  errorText: {
    textAlign: "center",
    marginTop: 20,
    color: "red",
    fontWeight: "bold",
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    width: "90%",
  },
});
