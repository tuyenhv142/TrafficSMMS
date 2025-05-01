import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api/apiClient";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const getFaultCodeDescription = (code: number) => {
  switch (code) {
    case 0:
      return "正常";
    case 1:
      return "故障";
    case 2:
      return "故障";
    default:
      return "null";
  }
};
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
      return "尚未確認";
    case 1:
      return "已分配工程師";
    case 2:
      return "維修中";
    case 3:
      return "維修完成";
    default:
      return "null";
  }
};
const trafficLightList = () => {
  const router = useRouter();
  const { role } = useAuth();
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userid, setUserid] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [selectFill, setSelectFill] = useState("全部");
  interface ApiResponse {
    content?: {
      data?: {
        identificationCode: number;
        signalNumber: string;
        latitude: number;
        longitude: number;
        road1: string;
        road2: string;
        districs: string;
        typesOfSignal: string;
        statusError: number;
        statusErrorUpdate: number;
        isError: boolean;
        isErrorUpdate: boolean;
        totalUpdate: number;
        account_userUpdate: string;
        dateUpdate: string;
      }[];
    };
  }
  interface TrafficSignal {
    identificationCode: number;
    signalNumber: string;
    latitude: number;
    longitude: number;
    road1: string;
    road2: string;
    districs: string;
    typesOfSignal: string;
    statusError: number;
    statusErrorUpdate: number;
    isError: boolean;
    isErrorUpdate: boolean;
    totalUpdate: number;
    account_userUpdate: string;
    dateUpdate: string;
    expanded: boolean;
  }
  interface ApiUpdateResponse {
    success: boolean;
    error: string;
    errorCode: number;
    content: string;
  }

  useFocusEffect(
    useCallback(() => {
      fetchRepairDetail();
      // if (role !== "1" && role !== "2") {
      //   router.replace("/");
      // }
      // // Gọi API mỗi khi tab được focus
    }, [])
  );
  // useFocusEffect(
  //   useCallback(() => {
  //     console.log("Current Role:", role);
  //     if (role !== "1" && role !== "2") {
  //       alert("您沒有權限訪問此頁面。");
  //       // router.replace("/");
  //     }
  //   }, [role])
  // );

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
        "/TrafficEquipment/FindAll?page=1&pageSize=22000"
      );
      // console.log("Response:", response.data);
      if (response.data?.content?.data) {
        setTrafficSignals(
          response.data.content.data.map((signal) => ({
            ...signal,
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
  // const filteredSignals = trafficSignals.filter(
  //   (item) =>
  //     item.userId === null ||
  //     (userid !== null && item.userId == parseInt(userid))
  // );

  const fill = trafficSignals.filter((item) =>
    item.signalNumber.toLowerCase().includes(searchText.toLowerCase())
  );
  // .filter((item) => {
  //   if (selectFill === "全部") return true;

  //   const statusMap: Record<string, number> = {
  //     尚未確認: 0,
  //     已分配工程師: 1,
  //     工程師正在維修中: 2,
  //     已完成維修: 3,
  //   };

  //   return item.repairStatus === statusMap[selectFill];

  // Loading guard
  if (role === undefined || role === null || role === "") {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // const isAuthorized = role === "1" || role === "2";

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
              source={require("./../assets/images/9329163_0.png")}
            ></Image>
          ) : (
            <Image
              style={{ height: 35, width: 35 }}
              source={require("./../assets/images/9329176_0.png")}
            ></Image>
            // <FontAwesome5 name="expand" size={24} color="black" />
          )}
          {/* <Image></Image> */}
        </TouchableOpacity>
      </View>

      {/* <View
        style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}
      >
        {[
          "全部",
          "尚未確認",
          "已分配工程師",
          "工程師正在維修中",
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
      </View> */}

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={fill}
          keyExtractor={(item) => item.identificationCode.toString()}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item, index }) => (
            <View style={[styles.item, styles.fixedItem]}>
              <View style={styles.infoContainer}>
                <TouchableOpacity
                  onPress={() => {
                    setTrafficSignals((prev) =>
                      prev.map((signal) =>
                        signal.identificationCode === item.identificationCode
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
                          fontSize: 13,
                          // fontWeight: "bold",
                          color: "#000",
                          // width: "30%",
                        }}
                      >
                        號誌編號: {item.signalNumber}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          // fontWeight: "bold",
                          color: "#000",
                          // width: "33%",
                        }}
                      >
                        號誌類型: {item.typesOfSignal}
                      </Text>
                    </View>

                    <View
                      style={{
                        borderRadius: 50,
                        backgroundColor: item.isError ? "#B53A3A" : "#63E258",
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
                          color: item.isError ? "#fff" : "#000",
                        }}
                      >
                        {item.isError && item.statusError !== 0
                          ? "故障"
                          : "正常"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {/* Button Toggle Expand */}
                {/* <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: "/trafficSignalDetail",
                      params: { signal: JSON.stringify(item) },
                    });
                    confirmRepairStatus(item.identificationCode);
                  }}
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-start",
                    borderWidth: 1,
                    borderColor: "#000",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text style={{ color: "#000" }}>
                    {item.expanded ? "隱藏詳細資料" : "顯示詳細資料"}
                  </Text>
                </TouchableOpacity> */}

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
                    <Text style={styles.statusText1}>
                      行政區: {item.districs}
                    </Text>
                    <Text style={styles.statusText1}>
                      道路: {item.road1} , {item.road2}
                    </Text>
                    {/* </View> */}
                    <View
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <View>
                        {!item.isErrorUpdate ? (
                          <Text style={styles.statusText1}>維修紀錄: 無</Text>
                        ) : (
                          <>
                            <Text style={styles.statusText1}>
                              維修紀錄: {item.totalUpdate}
                            </Text>
                            <Text style={styles.statusText1}>
                              上次維修日期: {item.dateUpdate}
                            </Text>
                            <Text style={styles.statusText1}>
                              上次故障原因:{" "}
                              {getFaultCodeDescription2(item.statusErrorUpdate)}
                            </Text>
                            <Text style={styles.statusText1}>
                              維修工程師: {item.account_userUpdate}
                            </Text>
                          </>
                        )}
                      </View>
                      {/* <TouchableOpacity
                        onPress={() => {
                          if (!isLoading) {
                            router.push({
                              pathname: "/trafficLightDetail",
                              params: {
                                index: index.toString(),
                                signals: JSON.stringify(fill),
                              },
                            });
                          } else {
                            // Hiển thị thông báo khi người dùng cố gắng chuyển hướng khi dữ liệu chưa tải
                            alert("Đang tải dữ liệu, vui lòng đợi.");
                          }
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
          // ListEmptyComponent={
          //   <Text style={styles.emptyText}>No results found</Text>
          // }
        />
      )}
    </View>
  );
};

export default trafficLightList;

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
