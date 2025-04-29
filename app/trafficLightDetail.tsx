import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import MapView, { Marker } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";

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

const TrafficLightDetail = () => {
  const [selectedMedia, setSelectedMedia] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const router = useRouter();
  const { index, signals } = useLocalSearchParams();
  console.log("Params:", signals);
  console.log("Index:", index);

  // const parsedSignals = JSON.parse(signals as string);
  // const currentIndex = parseInt(index as string);
  // const signal = parsedSignals[currentIndex];
  const [parsedSignals, setParsedSignals] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [signal, setSignal] = useState<any>(null);
  // console.log("Signal:", signal);
  const [repairStatus, setRepairStatus] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (signals && index) {
        try {
          const parsedSignals = useMemo(() => {
            try {
              return JSON.parse(signals as string);
            } catch (error) {
              console.error("Lỗi phân tích signals:", error);
              return [];
            }
          }, [signals]);

          const currentIndex = parseInt(index as string);
          const currentSignal = parsedSignals[currentIndex];
          // const currentSignal = parsed.find(
          //   (s: {
          //     identificationCode: { toString: () => string | string[] };
          //   }) => s.identificationCode.toString() === index
          // );

          setParsedSignals(parsedSignals);
          setCurrentIndex(currentIndex);
          setSignal(currentSignal);
          setRepairStatus(currentSignal?.repairStatus ?? 2);
        } catch (error) {
          console.error("Error parsing signals or index:", error);
        }
      }
    }, [signals, index])
  );

  //   const handleSave = async () => {
  //     try {
  //       const requestBody = {
  //         id: signal.identificationCode, // ID của đèn tín hiệu
  //         status: repairStatus, // Trạng thái của đèn tín hiệu
  //         faultCodes: 0,
  //         // repairStatus: 3,
  //         // user_id: 1, // ID người dùng, có thể thay đổi theo logic
  //         // remark: signal.remark || "已完成更換燈泡",
  //       };
  //       console.log("Request Body:", requestBody);
  //       if (repairStatus == 1 || repairStatus == 0) {
  //         alert("請選擇更新狀態");
  //         return;
  //       }
  //       const response = await apiClient.put<ApiUpdateResponse>(
  //         `RepairDetails/UpdateByAccout`,
  //         requestBody
  //       );
  //       if (response.data.success === false) {
  //         throw new Error("Failed to update signal");
  //       }
  //       router.back();
  //       console.log("Response:", response.data);
  //       alert("Save Success");
  //     } catch (error) {
  //       console.log(error);
  //       alert("Save Failed");
  //     }
  //   };

  //   const pickMedia = async () => {
  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.All,
  //       allowsMultipleSelection: true,
  //       quality: 1,
  //     });

  //     if (!result.canceled) {
  //       const allAssets = [...selectedMedia, ...result.assets];
  //       const uniqueAssets = Array.from(
  //         new Map(allAssets.map((asset) => [asset.uri, asset])).values()
  //       );
  //       const limitedAssets = uniqueAssets.slice(0, 8);
  //       setSelectedMedia(limitedAssets);

  //       if (limitedAssets.length < uniqueAssets.length) {
  //         Alert.alert("限制", "最多只能上傳 8 張圖片或影片");
  //       }
  //     }
  //   };

  if (!signal) {
    return <Text>Loading...</Text>;
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
              pathname: "/trafficLightDetail",
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
          onPress={() =>
            router.push({
              pathname: "/trafficLightDetail",
              params: {
                index: (currentIndex + 1).toString(),
                signals: JSON.stringify(parsedSignals),
              },
            })
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
      <Text style={styles.text}>
        更新狀態: {getRepairStatusDescription(signal.repairStatus)}
      </Text>
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

      {/* <Button
        color={Colors.primaryColor}
        title="選擇圖片/影片 (最多8個)"
        onPress={pickMedia}
      /> */}

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

      {/* {signal && (
        <>
          <Text style={[styles.text, { marginTop: 12 }]}>選擇更新狀態：</Text>
          <Picker
            selectedValue={repairStatus}
            onValueChange={(value) => setRepairStatus(value)}
            style={styles.picker}
          >
            <Picker.Item label="工程師正在維修中" value={2} />
            <Picker.Item label="已完成維修" value={3} />
          </Picker>

          <Button
            color={Colors.primaryColor}
            title="Done"
            onPress={handleSave}
          />
        </>
      )} */}
    </ScrollView>
  );
};

export default TrafficLightDetail;

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
});
