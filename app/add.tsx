import {
  StyleSheet,
  Text,
  View,
  Alert,
  Button,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import apiClient from "../api/apiClient";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect
import * as ImagePicker from "expo-image-picker";
import { Colors } from "./../constants/Colors";

interface Signal {
  id: number;
  categoryCode: number;
  identificationCode: number;
  signalNumber: string;
  latitude: number;
  longitude: number;
  statusError: number;
  typesOfSignal: string;
  isError: boolean;
  managementUnit?: string;
  jobClassification?: number;
  signalInstallation?: number;
  useStatus?: number;
  dataStatus?: number;
  remark?: string;
  length?: number;
  account_user?: any;
}

type RootStackParamList = {
  ShowMap: { selectedSignal?: Signal };
};

type ShowMapRouteProp = RouteProp<RootStackParamList, "ShowMap">;

const getFaultCodeDescription = (code: number) => {
  switch (code) {
    case 1:
      return "號誌設備故障";
    case 2:
      return "號誌停電";
    default:
      return "未知錯誤";
  }
};

const add = () => {
  const [selectedImages, setSelectedImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const route = useRoute<ShowMapRouteProp>();
  const router = useRouter();
  const [signal, setSignal] = useState<Signal | null>(null);
  const rawSignal = route.params?.selectedSignal;
  // const signal: Signal | null = rawSignal
  //   ? typeof rawSignal === "string"
  //     ? JSON.parse(rawSignal)
  //     : rawSignal
  //   : null;

  console.log(signal);
  const [userid, setUserid] = useState<string | null>(null); // Store user ID state
  const [faultCode, setFaultCode] = useState(0);
  const [repairStatus, setRepairStatus] = useState("0");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const signalFromRoute = rawSignal
      ? typeof rawSignal === "string"
        ? JSON.parse(rawSignal)
        : rawSignal
      : null;

    setSignal(signalFromRoute); // Cập nhật state signal
  }, [rawSignal]);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    setIsLoading(true);
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem("user_id");
      setUserid(storedUserId); // Set the user ID in the state
    };

    fetchUserId();
    setIsLoading(false);
  }, []);

  // Handle submit of the report
  const handleSubmit = async () => {
    if (!signal) {
      Alert.alert("錯誤", "未找到消息，請重試", [{ text: "確認" }]);
      return; // Make sure user ID and signal are available
    }

    if (faultCode === 0) {
      Alert.alert("錯誤", "請選擇錯誤", [{ text: "確認" }]);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("traff_id", signal.id.toString());
    formData.append("FaultCodes", faultCode.toString());
    formData.append("RepairStatus", parseInt(repairStatus).toString());
    formData.append("user_id", "");
    formData.append("Remark", remark);
    formData.append("test", "ok");

    selectedImages.forEach((image, index) => {
      const isLocalFile = image.uri.startsWith("file://");
      const uri = isLocalFile ? image.uri : `file://${image.uri}`;
      const mimeType =
        image.mimeType || (image.type === "video" ? "video/mp4" : "image/jpeg");
      const ext = mimeType.split("/")[1];

      formData.append("images", {
        uri: uri,
        name: `media_${Date.now()}_${index}.${ext}`, // Ví dụ: image_123456.jpg
        type: image.mimeType || "image/jpeg",
      } as any);

      console.log("SSS", image);
    });

    // const reportData = {
    //   traff_id: signal.id,
    //   FaultCodes: faultCode,
    //   RepairStatus: parseInt(repairStatus),
    //   user_id: parseInt(userid), // Use the fetched user ID
    //   Remark: remark,
    // };

    console.log(formData);

    try {
      await apiClient.post("/RepairDetails/Add", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("成功", "故障通報成功！");
      setSignal(null);
      setSelectedImages([]);
      // console.log(reportData);
      router.back();
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("錯誤", "故障通報錯誤!");
    } finally {
      setIsLoading(false);
    }
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      // Gộp tất cả ảnh cũ và mới, loại trùng theo uri
      const allAssets = [...selectedImages, ...result.assets];
      const uniqueAssets = Array.from(
        new Map(allAssets.map((asset) => [asset.uri, asset])).values()
      );

      // Giới hạn 8 ảnh
      const limitedAssets = uniqueAssets.slice(0, 8);

      setSelectedImages(limitedAssets);

      if (limitedAssets.length < uniqueAssets.length) {
        Alert.alert("限制", "最多只能選擇 8 張圖片/影片！");
      }
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    setSignal(null);
    router.back();
    // router.push("/map");
  };

  // Reload data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // You can fetch data again here if needed
      console.log("Fetching data when the screen is focused");

      return () => {
        // Clean up if necessary (you can perform actions when the screen is unfocused)
        console.log("Screen unfocused");
      };
    }, [])
  );

  if (!signal) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>未選擇電子資訊。</Text>
        <Button title="回首頁" onPress={handleCancel} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Overlay loading toàn màn hình */}
      {isLoading && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              elevation: 9999,
            },
          ]}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#fff", marginTop: 10 }}>
            上傳中，請稍後...
          </Text>
        </View>
      )}

      <ScrollView style={styles.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <MapView
              style={styles.map}
              mapType="satellite"
              region={{
                latitude: signal.latitude,
                longitude: signal.longitude,
                latitudeDelta: 0.0005,
                longitudeDelta: 0.0005,
              }}
              zoomEnabled={false}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: signal.latitude,
                  longitude: signal.longitude,
                }}
                title={`號誌編號: ${signal.signalNumber}`}
                description={`識別碼: ${signal.identificationCode}`}
              />
            </MapView>
            <Text style={styles.title}>號誌編號: {signal.signalNumber}</Text>
            <Text>識別碼: {signal.identificationCode}</Text>
            <Text>
              座標: {signal.latitude}, {signal.longitude}
            </Text>
            <Text>號誌種類: {signal.typesOfSignal}</Text>
            <Text style={styles.label}>故障代碼:</Text>
            <Picker
              selectedValue={faultCode}
              style={styles.picker}
              onValueChange={(itemValue) => setFaultCode(itemValue)}
            >
              <Picker.Item label="請選擇交通號誌錯誤" value={0} />
              <Picker.Item label="號誌設備故障" value={1} />
              <Picker.Item label="號誌停電" value={2} />
            </Picker>
            <Button
              color={Colors.primaryColor}
              title="選擇圖片或影片"
              onPress={pickMedia}
            />
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}
            >
              {selectedImages.map((img, index) => (
                <View key={index} style={{ position: "relative", margin: 4 }}>
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const newImages = [...selectedImages];
                      newImages.splice(index, 1);
                      setSelectedImages(newImages);
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
            <View style={styles.form}>
              <Text style={styles.label}>備註:</Text>
              <TextInput
                style={styles.textArea}
                value={remark}
                onChangeText={setRemark}
                multiline
                numberOfLines={4}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Button
                    color={Colors.primaryColor}
                    title="通報"
                    onPress={handleSubmit}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button color="red" title="取消" onPress={handleCancel} />
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default add;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  map: {
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "red",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  form: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    borderRadius: 6,
  },
  picker: {
    height: 60,
    width: "100%",
    marginBottom: 12,
  },
  description: {
    marginBottom: 12,
    fontSize: 14,
    color: "#666",
  },
});
