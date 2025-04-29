import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  PixelRatio,
  Dimensions,
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { Redirect, useRouter } from "expo-router"; // Import useRouter từ expo-router
import { useAuth } from "./../context/AuthProvider";
import { CheckBox, Icon } from "@rneui/themed"; // Import useAuth từ AuthContext

const { width, height } = Dimensions.get("window");
const ratio = PixelRatio.get();
const Login = () => {
  const { token, signin, logout } = useAuth(); // Lấy token và signIn từ AuthContext
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();
  const [check1, setCheck1] = useState(false);

  const handleLogin = async () => {
    if (name == "" || password == "") {
      Alert.alert("錯誤", "郵箱或密碼不能為空!");
    } else {
      try {
        await signin({ name: name, password: password });
      } catch (error) {
        Alert.alert("錯誤", "郵箱或密碼不正確!");
      }
    }
    // console.log(name, password);
    // logout();
  };

  if (token) return <Redirect href="/" />;
  return (
    <View style={styles.container}>
      <View style={styles.container2}>
        <Image
          style={styles.iconLogin}
          source={require("./../assets/images/iconTrafficLogin.png")}
        ></Image>
        <Text style={styles.text}>您好，歡迎使用</Text>
        <Text style={styles.text}>交通號誌維修管理系統</Text>
        <Text style={styles.text1}>即時管理，迅速維修</Text>

        <Image
          style={styles.imgLogin}
          source={require("./../assets/images/TSMMS_logo.png")}
        ></Image>
      </View>
      <View style={styles.bottom}>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="電子郵件/E-mail"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input1}
          placeholder="密碼/Password"
          secureTextEntry
        />

        <CheckBox
          checked={check1}
          checkedColor="#ccc"
          checkedTitle="儲存我的帳號/Remember me"
          containerStyle={{
            width: "100%",
            backgroundColor: "#5958b2",
            height: 35,
          }}
          onIconPress={() => setCheck1(!check1)}
          onPress={() => setCheck1(!check1)}
          size={18}
          textStyle={{ color: "#fff", fontSize: 11, fontWeight: "100" }}
          title="儲存我的帳號/Remember me"
          titleProps={{}}
          uncheckedColor="#fff"
        />

        <TouchableOpacity onPress={handleLogin} style={styles.btn}>
          <Text style={styles.btnText}>登入</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn2}>
          <Text style={styles.btnText2}>註冊新使用者</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    // padding: 35,
    // backgroundColor: "#fff",
  },
  container2: {
    height: height * 0.65,
    paddingHorizontal: width * 0.1,
    paddingTop: 35,
    backgroundColor: "#fff",
  },

  iconLogin: {
    width: width * 0.1,
    height: width * 0.1,
    resizeMode: "contain",
    marginBottom: 10,
  },
  text: {
    fontSize: 30,
    fontWeight: "bold",
  },
  text1: {
    fontSize: 15,
    marginTop: 25,

    // fontWeight: "bold",
  },
  imgLogin: {
    width: width * 1.0,
    height: height * 0.44,
    resizeMode: "contain",
    alignSelf: "center",
  },
  bottom: {
    flex: 1,
    backgroundColor: "#5958b2",
    paddingHorizontal: width * 0.1,
    paddingTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    // borderColor: "#fff",
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  input1: {
    borderWidth: 1,
    // borderColor: "#fff",
    backgroundColor: "#fff",
    padding: 10,
    // marginBottom: 10,
    borderRadius: 5,
  },
  btn: {
    backgroundColor: "#fff",
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    // marginTop: 10,
  },
  btnText: {
    textAlign: "center",
    justifyContent: "center",
    fontSize: 23,
    fontWeight: "bold",
  },
  btn2: {
    marginTop: 15,
  },
  btnText2: {
    textAlign: "center",
    justifyContent: "center",
    fontSize: 15,
    color: "#fff", // fontWeight: "bold",
  },
  checkbox: {
    backgroundColor: "#5958b2",
  },
});

export default Login;
