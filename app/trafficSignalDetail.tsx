import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import apiClient from "./../api/apiClient";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
// import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";
import { Colors } from "./../constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
// import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Video, ResizeMode } from "expo-av";

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

interface ApiUpdateResponse {
  success: boolean;
  error: string;
  errorCode: number;
  content: string;
}

interface ApiResponse {
  content?: {
    data?: {
      id: number;
      name: string;
      total: number;
      identity: number;
    }[];
  };
}

interface Engineer {
  id: number;
  name: string;
  total: number;
  identity: number;
}

const screenWidth = Dimensions.get("window").width;

const TrafficSignalDetail = () => {
  const [selectedMedia, setSelectedMedia] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const router = useRouter();
  const { index, signals } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [engineer, setEngineer] = useState<Engineer[]>([]);
  console.log("Engineer:", engineer);
  // console.log("Params:", signals);
  // console.log("Index:", index);

  // const parsedSignals = JSON.parse(signals as string);
  // const currentIndex = parseInt(index as string);
  // const signal = parsedSignals[currentIndex];
  const [parsedSignals, setParsedSignals] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [signal, setSignal] = useState<any>(null);
  // console.log("Signal:", signal);
  const [repairStatus, setRepairStatus] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [idEngineer, setIdEngineer] = useState<number>(0);
  const [filteredData, setFilteredData] = useState<Engineer[]>([]);
  console.log("Filtered Data:", filteredData);

  // const handleSearch = (text: string) => {
  //   setQuery(text);
  //   const results = engineer.filter(
  //     (item) =>
  //       item.identity == 2 &&
  //       item.name.toLowerCase().includes(text.toLowerCase())
  //   );
  //   setFilteredData(results);
  // };

  const results = engineer.filter(
    (item) =>
      item.identity == 2 &&
      item.name.toLowerCase().includes(query.toLowerCase())
  );

  useFocusEffect(
    useCallback(() => {
      if (signals && index) {
        try {
          setIsLoading(true);
          const parsed = JSON.parse(signals as string);
          const currentIndex = parseInt(index as string);
          const currentSignal = parsed[currentIndex];
          // const currentSignal = parsed.find(
          //   (s: {
          //     identificationCode: { toString: () => string | string[] };
          //   }) => s.identificationCode.toString() === index
          // );

          setParsedSignals(parsed);
          setCurrentIndex(currentIndex);
          setSignal(currentSignal);
          setRepairStatus(currentSignal?.repairStatus ?? 2);
          searchEngineer();
        } catch (error) {
          console.error("Error parsing signals or index:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }, [signals, index])
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  // const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [currentIndex1, setCurrentIndex1] = useState<number>(0);
  const mediaList = Array.isArray(signal?.images)
    ? signal.images.filter(Boolean).slice(0, 8)
    : [];

  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenPreview = (index: number) => {
    setCurrentIndex1(index);
    setPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
  };

  const handleNext = () => {
    if (currentIndex1 < mediaList.length - 1) {
      setCurrentIndex1(currentIndex1 + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex1 > 0) {
      setCurrentIndex1(currentIndex1 - 1);
    }
  };
  const handleConfirm = async () => {
    try {
      const requestBody = {
        id: signal.identificationCode, // ID của đèn tín hiệu
        // status: status, // Trạng thái của đèn tín hiệu
        // faultCodes: 0,
        // repairStatus: 3,
        // user_id: 1, // ID người dùng, có thể thay đổi theo logic
        // remark: signal.remark || "已完成更換燈泡",
      };
      console.log("Request Body:", requestBody);
      // if (repairStatus == 1 || repairStatus == 0) {
      //   alert("請選擇更新狀態");
      //   return;
      // }
      const response = await apiClient.put<ApiUpdateResponse>(
        "/RepairDetails/Update",
        requestBody
      );
      if (response.data.success === false) {
        throw new Error("Failed to update signal");
      }
      router.back();
      console.log("Response:", response.data);
      alert("Save Success");
    } catch (error) {
      console.log(error);
      alert("Save Failed");
    }
  };

  const searchEngineer = async () => {
    try {
      const response = await apiClient.get<ApiResponse>("/User/searchName");
      if (response.data?.content?.data) {
        setEngineer(
          response.data.content.data.map((item) => ({
            id: item.id,
            name: item.name,
            total: item.total,
            identity: item.identity,
          }))
        );
        // console.log("response", response);
      } else {
        console.log("No traffic signal data available.");
      }
      const data = response.data as { content: string };
      console.log("Search Results:", data.content);
      return response.data;
    } catch (error) {
      console.error("Error during search:", error);
      throw new Error("Failed to fetch search results");
    }
  };

  const handleChooseEngineer = async () => {
    try {
      if (idEngineer == 0) {
        alert("請選擇工程師！");
        return;
      }
      const requestBody = {
        id: signal.identificationCode, // ID của đèn tín hiệu
        id_user: idEngineer, // Trạng thái của đèn tín hiệu
        // faultCodes: 0,
        // repairStatus: 3,
        // user_id: 1, // ID người dùng, có thể thay đổi theo logic
        // remark: signal.remark || "已完成更換燈泡",
      };
      console.log("Request Body:", requestBody);
      const response = await apiClient.put<ApiUpdateResponse>(
        "/RepairDetails/UpdateConfimData",
        requestBody
      );
      if (response.data.success === false) {
        throw new Error("Failed to update signal");
      }
      router.back();
      console.log("Response:", response.data);
      alert("Save Success");
    } catch (error) {
      console.log(error);
      alert("Save Failed");
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const allAssets = [...selectedMedia, ...result.assets];
      const uniqueAssets = Array.from(
        new Map(allAssets.map((asset) => [asset.uri, asset])).values()
      );
      const limitedAssets = uniqueAssets.slice(0, 8);
      setSelectedMedia(limitedAssets);

      if (limitedAssets.length < uniqueAssets.length) {
        Alert.alert("限制", "最多只能上傳 8 張圖片或影片");
      }
    }
  };

  if (isLoading || !signal) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* <Text style={styles.title}>交通號誌詳情</Text> */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 5,
          marginBottom: 10,
        }}
      >
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={() =>
            router.push({
              pathname: "/trafficSignalDetail",
              params: {
                index: (currentIndex - 1).toString(),
                signals: JSON.stringify(parsedSignals),
              },
            })
          }
        >
          <Text
            style={{
              color: currentIndex === 0 ? "gray" : "#000",
              borderBottomColor: "#000",
              borderBottomWidth: 1,
            }}
          >
            上一筆
          </Text>
          {/* <FontAwesome5
            name="arrow-left"
            size={20}
            color={Colors.primaryColor}
            style={{ alignSelf: "center" }}
          /> */}
        </TouchableOpacity>
        <Text style={styles.text}>識別碼: {signal.identificationCode}</Text>
        <TouchableOpacity
          disabled={currentIndex === parsedSignals.length - 1}
          onPress={
            () =>
              // setQuery(""),
              router.push({
                pathname: "/trafficSignalDetail",
                params: {
                  index: (currentIndex + 1).toString(),
                  signals: JSON.stringify(parsedSignals),
                },
              })
            // setQuery(null)
          }
        >
          <Text
            style={{
              color:
                currentIndex === parsedSignals.length - 1 ? "gray" : "#000",
              borderBottomColor: "#000",
              borderBottomWidth: 1,
            }}
          >
            下一筆
          </Text>
          {/* <FontAwesome5
            name="arrow-right"
            size={20}
            color={Colors.primaryColor}
            style={{ alignSelf: "center" }}
          /> */}
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>號誌編號: {signal.signalNumber}</Text>
      <Text style={styles.text}>號誌種類: {signal.typesOfSignal}</Text>
      {signal?.faultCodes !== undefined && (
        <Text style={styles.text}>
          故障: {getFaultCodeDescription(signal.faultCodes)}
        </Text>
      )}
      {signal.remark ? (
        <Text style={styles.text}>Note: {signal.remark}</Text>
      ) : null}
      {/* <Text style={styles.text}>
        更新狀態: {getRepairStatusDescription(signal.repairStatus)}
      </Text> */}

      {signal.repairStatus === 1 && (
        <>
          <TouchableOpacity
            style={{
              backgroundColor: "#ccc",
              padding: 10,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 10,
            }}
            onPress={() => setModalVisible(true)}
          >
            <Text>選擇工程師</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="工程師已選擇"
            // focusable={false}
            value={query}
            // onChangeText={handleSearch}
            style={styles.searchBar}
            editable={false}
          />

          <Modal visible={modalVisible} animationType="slide">
            <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
              <Text
                style={{
                  marginBottom: 15,
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                請選擇工程師
              </Text>

              <TextInput
                placeholder="搜尋工程師"
                value={query}
                onChangeText={setQuery}
                style={styles.searchBar}
              />

              <FlatList
                data={results}
                keyExtractor={(item) => item.name.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderColor: "#eee",
                    }}
                    onPress={() => {
                      setQuery(item.name.toString());
                      setIdEngineer(item.id);
                      // setFilteredData([]);
                      setModalVisible(false); // Đóng modal sau khi chọn
                    }}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              <Button title="關閉" onPress={() => setModalVisible(false)} />
            </View>
          </Modal>
        </>
      )}

      {signal.latitude && signal.longitude ? (
        <MapView
          style={styles.map}
          mapType="satellite"
          region={{
            latitude: signal.latitude,
            longitude: signal.longitude,
            latitudeDelta: 0.0005,
            longitudeDelta: 0.0005,
          }}
        >
          <Marker
            coordinate={{
              latitude: signal?.latitude,
              longitude: signal?.longitude,
            }}
            title={`號誌: ${signal.signalNumber}`}
          />
        </MapView>
      ) : null}

      {/* {signal.repairStatus === 0 && */}
      {Array.isArray(signal.images) &&
      signal.images.filter(Boolean).length > 0 ? (
        <View>
          <Text style={{ textAlign: "center", margin: 10 }}>目前圖片/影片</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {mediaList.map((imgUrl: string, index: number) => {
              if (!imgUrl) return null;

              const encodedUrl = encodeURI(imgUrl);
              const isVideo = imgUrl.endsWith(".mp4");

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    // setPreviewMedia(encodedUrl);
                    // setPreviewVisible(true);
                    handleOpenPreview(index);
                  }}
                  style={{ width: screenWidth / 4 - 16, height: 80 }}
                >
                  {isVideo ? (
                    <Video
                      source={{ uri: encodedUrl }}
                      style={{
                        width: 80,
                        height: 80,
                        backgroundColor: "#000",
                      }}
                      resizeMode={ResizeMode.CONTAIN}
                      isMuted
                      isLooping
                      shouldPlay={false}
                    />
                  ) : (
                    <Image
                      source={{ uri: encodedUrl }}
                      style={{ width: 80, height: 80, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={{ textAlign: "center", margin: 10 }}>無圖片資料</Text>
      )}

      {/* Modal hiển thị khi click */}
      <Modal visible={previewVisible} transparent={true} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleClosePreview}
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              padding: 10,
              backgroundColor: "#fff",
              borderRadius: 20,
              zIndex: 999,
            }}
          >
            <Text style={{ fontWeight: "bold", borderRadius: 100 }}>X</Text>
          </TouchableOpacity>
          {mediaList.length > 0 && (
            <>
              {mediaList[currentIndex1].endsWith(".mp4") ? (
                <Video
                  source={{ uri: encodeURI(mediaList[currentIndex1]) }}
                  style={{
                    width: Dimensions.get("window").width * 0.9,
                    height: 300,
                  }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                />
              ) : (
                <Image
                  source={{ uri: encodeURI(mediaList[currentIndex1]) }}
                  style={{
                    width: Dimensions.get("window").width * 0.9,
                    height: 300,
                    borderRadius: 10,
                  }}
                  resizeMode="contain"
                />
              )}

              {/* Điều hướng trước/sau */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 20,
                }}
              >
                <TouchableOpacity
                  onPress={handlePrev}
                  disabled={currentIndex1 === 0}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor: currentIndex1 === 0 ? "#ccc" : "#fff",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>←</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNext}
                  disabled={currentIndex1 === mediaList.length - 1}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    backgroundColor:
                      currentIndex1 === mediaList.length - 1 ? "#ccc" : "#fff",
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontWeight: "bold" }}>→</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {/* <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setPreviewVisible(false)}
          > */}
          {/* {previewMedia ? (
            previewMedia.endsWith(".mp4") ? (
              <Video
                source={{ uri: previewMedia }}
                style={{ width: "90%", height: 300 }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
              />
            ) : (
              <Image
                source={{ uri: previewMedia }}
                style={{ width: "90%", height: 300, borderRadius: 10 }}
                resizeMode="contain"
              />
            )
          ) : null} */}

          {/* </TouchableOpacity> */}
        </View>
      </Modal>

      {
        signal.repairStatus === 0 ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 10,
              justifyContent: "center",
            }}
          >
            <View style={{ margin: 5 }}>
              <Text style={{ textAlign: "center" }}>
                請確認一下交通號誌是否有問題？
              </Text>
            </View>
          </View>
        ) : null
        // <Text style={{ textAlign: "center", margin: 10 }}>請選擇工程師</Text>
        // <Button
        //   color={Colors.primaryColor}
        //   title="選擇圖片/影片 (最多8個)"
        //   onPress={pickMedia}
        // />
      }

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
        {selectedMedia.map((img, index) => (
          <View key={index} style={{ position: "relative", margin: 4 }}>
            <Image
              source={{ uri: img.uri }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
            />
            <TouchableOpacity
              onPress={() => {
                const newImages = [...selectedMedia];
                newImages.splice(index, 1);
                setSelectedMedia(newImages);
              }}
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 12,
                width: 24,
                height: 24,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1,
              }}
            >
              <Text style={{ color: "white", fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {/* {signal.repairStatus === 0 && (
        <Button color={Colors.primaryColor} title="完畢" onPress={handleSave} />
      )} */}

      {signal && (
        <>
          {signal.repairStatus === 0 ? (
            <View
              style={{
                marginBottom: 40,
                display: "flex",
                flexDirection: "row",
                // gap: 10,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ width: "48%" }}>
                <Button
                  color={Colors.primaryColor}
                  title="確認"
                  onPress={() => handleConfirm()}
                />
              </View>
              <View style={{ width: "48%" }}>
                <Button
                  color="red"
                  title="拒絕"
                  // onPress={() => handleConfirm(4)}
                />
              </View>
            </View>
          ) : signal.repairStatus === 1 ? (
            <View
              style={{
                marginBottom: 40,
              }}
            >
              {/* <Text style={[styles.text, { marginTop: 12 }]}>
                選擇更新狀態：
              </Text>
              <Picker
                selectedValue={repairStatus}
                onValueChange={(value) => setRepairStatus(value)}
                style={styles.picker}
              >
                <Picker.Item label="工程師正在維修中" value={2} />
                <Picker.Item label="已完成維修" value={3} />
              </Picker> */}

              {/* {/* <View style={{ borderRadius: 100 }}> */}
              <Button
                color={Colors.primaryColor}
                title="確認"
                onPress={() => handleChooseEngineer()}
              />
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
};

export default TrafficSignalDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 12,
    height: 60,
  },
  map: {
    height: 200,
    borderRadius: 10,
    marginVertical: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    width: "100%",
  },
});
