import { View, Text } from "react-native";
import React from "react";
import "react-native-get-random-values";
import { ScrollView } from "react-native";
import Header from "../components/Home/Header";
import Map from "../components/Home/Map";
import Content from "../components/Home/Content";
import Content2 from "../components/Home/Content2";
import { useAuth } from "./../context/AuthProvider";
import { Redirect } from "expo-router";
import Content1 from "../components/Home/Content1";

const index = () => {
  const { token, role } = useAuth();

  if (!token) {
    return <Redirect href="/login" />;
  }
  return (
    <ScrollView>
      <Header />
      <Map />
      <Content />
      <Content1 />
      <Content2 />
    </ScrollView>
  );
};

export default index;
