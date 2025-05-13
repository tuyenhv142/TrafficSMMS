import apiClient from "@/api/apiClient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { BarChart, ProgressChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface ApiResponse {
  content?: {};
}
interface ApiResponse2 {
  content: number;
}

interface ApiResponse3 {
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
  user_name: string;
  faultCodes: number;
  repairStatus: number;
  remark: string;
  images: string[];
  expanded: boolean;
}

const StatisticsScreen = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [lightError, setLightError] = useState<number[]>([]);
  const [lightError2, setLightError2] = useState<number[]>([]);
  const [lightError3, setLightError3] = useState<number[]>([]);
  const [trafficSignals, setTrafficSignals] = useState<TrafficSignal[]>([]);
  // console.log("Traffic Signals:", trafficSignals);

  // const fetchData = async () => {
  //   try {
  //     const response = await apiClient.get(
  //       "/TrafficEquipment/GetNormalDistrict"
  //     );
  //     console.log("Response:", response.data);
  //   } catch (error: any) {
  //     console.error("Fetch error:", error);
  //     // setError("Failed to fetch data.");
  //   }
  // };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<ApiResponse>(
          "/TrafficEquipment/GetNormalDistrict"
        );
        // console.log("Response:", response.data);
        const entries = Object.entries(response.data.content ?? {}) as [
          string,
          number
        ][];
        const filtered = entries.filter(([_, value]) => value > 0);

        // Cập nhật label và value:
        setLabels(filtered.map(([key]) => key));
        setValues(filtered.map(([_, value]) => value));
        // console.log("Entries:", entries);
      } catch (error: any) {
        console.error("Fetch error:", error);
      }
    };

    fetchData();
    // console.log(labels, values);
  });

  useEffect(() => {
    const fetchData2 = async () => {
      try {
        const response = await apiClient.get<ApiResponse2>(
          "/TrafficEquipment/GetNormal"
        );
        // console.log("Response:", response.data);
        if (response.data.content) {
          setLightError([response.data.content]);
          // console.log("Light Error:", response.data.content);
        }
      } catch (error: any) {
        console.error("Fetch error:", error);
      }
    };
    const fetchData3 = async () => {
      try {
        const response = await apiClient.get<ApiResponse2>(
          "/TrafficEquipment/GetNormalError"
        );
        // console.log("Response:", response.data);
        if (response.data.content) {
          setLightError2([response.data.content]);
          // console.log("Light Error:", response.data.content);
        }
      } catch (error: any) {
        console.error("Fetch error:", error);
      }
    };
    const fetchData4 = async () => {
      try {
        const response = await apiClient.get<ApiResponse3>(
          "/RepairDetails/FindAll?page=1&pageSize=200"
        );
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
              user_name: item.user_name,
              faultCodes: item.faultCodes,
              repairStatus: item.repairStatus,
              remark: item.typesOfSignal,
              images: Array.isArray(item.images) ? item.images : [],
              expanded: false,
            }))
          );
          // console.log("response", response);
        } else {
          // setError("No traffic signal data available.");
          console.log("No traffic signal data available.");
        } // console.log("Response:", response.data);
      } catch (error: any) {
        console.error("Fetch error:", error);
      }
    };

    // fetchData2();
    fetchData3();
    fetchData4();
    // console.log(labels, values);
  });

  // const lightErrorCount = trafficSignals.reduce((acc, curr) => {
  //   if (Array.isArray(curr) && curr.length > 0) {
  //     const filtered = curr.filter((item) => item.faultCodes === 1);
  //     return acc + filtered.length;
  //   }
  //   return acc;
  // }, 0);

  const 故障通報 = trafficSignals.filter(
    (item) => item.repairStatus === 0
  ).length;
  const 故障確認 = trafficSignals.filter(
    (item) => item.repairStatus === 1
  ).length;
  const 維修中 = trafficSignals.filter(
    (item) => item.repairStatus === 2
  ).length;

  // console.log(fillCount);

  const data = {
    labels: labels,
    datasets: [
      {
        data: values,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#f0f0f0",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    barPercentage: 0.6,
  };

  return (
    <ScrollView style={styles.container} horizontal={false}>
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/statistic",
          });
        }}
      >
        <View style={styles.flexRow}>
          <View style={styles.card}>
            <View style={styles.percentRow}>
              <Text style={styles.percentNumber}>{故障通報}</Text>
              <Text style={styles.percentSymbol}>個</Text>
              {/* <Text style={styles.label}>燈沒壞</Text> */}
            </View>
            <Text style={styles.label}>故障通報</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.percentRow}>
              <Text style={styles.percentNumber}>{故障確認}</Text>
              <Text style={styles.percentSymbol}>個</Text>
              {/* <Text style={styles.label}>燈沒壞</Text> */}
            </View>
            <Text style={styles.label}>故障確認</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.percentRow}>
              <Text style={styles.percentNumber}>{維修中}</Text>
              <Text style={styles.percentSymbol}>個</Text>
            </View>
            <Text style={styles.label}>維修中</Text>
          </View>
        </View>
        <View style={styles.flexRow}>
          <View style={styles.card1}>
            <View style={styles.percentRow}>
              <Text style={styles.label1}>燈壞掉 : </Text>
              <Text style={styles.percentNumber}>{lightError2}</Text>
              <Text style={styles.percentSymbol}>% </Text>
            </View>
            {/* <Text style={styles.label}>燈沒壞</Text> */}
          </View>
          {/* <View style={styles.card1}>
          <View style={styles.percentRow}>
            <Text style={styles.percentNumber}>{lightError2}</Text>
            <Text style={styles.percentSymbol}>%</Text>
          </View>
          <Text style={styles.label}>燈壞了</Text>
        </View> */}
          {/* <View style={styles.card}>
          <View style={styles.percentRow}>
            <Text style={styles.percentNumber}>{lightError}</Text>
            <Text style={styles.percentSymbol}>%</Text>
          </View>
          <Text style={styles.label}>燈沒壞</Text>
        </View> */}
        </View>
      </TouchableOpacity>
      {/* <Text style={styles.title}>各區交通號誌錯誤統計</Text> */}
      {/* {labels.length > 0 ? ( */}
      <>
        {/* <BarChart
            data={data}
            width={screenWidth}
            height={300}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
            style={styles.chart}
            withHorizontalLabels={true}
            showValuesOnTopOfBars={true}
          /> */}

        {/* <ProgressChart
            data={{
              labels: ["Swim", "Bike", "Run"], // optional
              data: [0.4, 0.6, 0.8],
            }}
            width={screenWidth}
            height={220}
            strokeWidth={16}
            radius={32}
            chartConfig={chartConfig}
            hideLegend={false}
          /> */}
      </>
      {/* ) : (
        <Text style={{ textAlign: "center", marginTop: 40 }}>Loading ...</Text>
      )} */}
    </ScrollView>
  );
};

export default StatisticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    borderRadius: 8,
    alignSelf: "center",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff", // màu tối
    borderRadius: 10,
    padding: 16,
    width: "30%",
    height: 80,
    // borderWidth: 1,
    // borderColor: "#e5e7eb", // màu xám nhạt
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  card1: {
    backgroundColor: "#fff", // màu tối
    borderRadius: 10,
    padding: 16,
    width: "100%",
    height: 80,
    // borderWidth: 1,
    // borderColor: "#e5e7eb", // màu xám nhạt
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  percentRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  percentNumber: {
    fontSize: 28,
    fontWeight: "600",
    color: "black", // màu sáng
  },
  percentSymbol: {
    fontSize: 16,
    marginLeft: 4,
    color: "black", // xanh lá
  },
  label: {
    fontSize: 16,
    marginTop: 8,
    color: "#9ca3af", // xám nhạt
  },
  label1: {
    fontSize: 25,
    marginTop: 8,
    color: "#9ca3af", // xám nhạt
  },
});
