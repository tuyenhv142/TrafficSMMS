import React from "react";
import { View, StyleSheet } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

interface HeaderProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
  }) => void;
}

const Test = ({ onLocationSelected }: HeaderProps) => {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="搜尋地點..."
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details) {
            const {
              geometry: {
                location: { lat, lng },
              },
            } = details;
            onLocationSelected({ latitude: lat, longitude: lng });
          }
        }}
        query={{
          key: "AIzaSyCNPqyJ8qQrE8OjuvpyU66bPrNe1Ej9MRU",
          language: "zh-TW", // tiếng Trung phồn thể (Đài Loan)
          components: "country:tw", // chỉ hiển thị kết quả trong Đài Loan
        }}
        styles={{
          textInput: styles.input,
        }}
      />
    </View>
  );
};

export default Test;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    zIndex: 999,
    borderRadius: 8,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    // borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
});
