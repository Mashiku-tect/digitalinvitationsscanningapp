import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EventsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📅 Events will be listed here</Text>
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold" },
});
