import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import {
  Modal,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";

const NetworkContext = createContext({ isConnected: true });
export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(false);
  const wasDisconnected = useRef(false); // để tránh hiển thị thông báo nhiều lần

  const checkConnection = async () => {
    setChecking(true);
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setChecking(false);
  };

  const showToast = (message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("通知", message);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);

      if (state.isConnected && wasDisconnected.current) {
        showToast("網際網路重新連線");
        wasDisconnected.current = false;
      }

      if (!state.isConnected) {
        wasDisconnected.current = true;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      <Modal
        visible={!isConnected}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>沒有網路連結</Text>
            <Text style={styles.modalMessage}>
            請檢查您的網路設定
            </Text>

            <TouchableOpacity
              style={styles.reloadButton}
              onPress={checkConnection}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.reloadText}>重試</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {children}
    </NetworkContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  reloadButton: {
    backgroundColor: "#5958b2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  reloadText: {
    color: "#fff",
    fontSize: 16,
  },
});
