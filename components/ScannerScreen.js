import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScannerScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🔍 Scanner will be here</Text>
    </View>
  );
};

export default ScannerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
});
