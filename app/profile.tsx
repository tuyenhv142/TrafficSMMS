import { StyleSheet, Text, View, Button } from "react-native";
import React from "react";
import { useAuth } from "./../context/AuthProvider";

const profile = () => {
  const { logout } = useAuth();
  return (
    <View style={styles.container}>
      <Button title="登出" onPress={logout} color="red" />
    </View>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
