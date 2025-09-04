import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.subtitle}>User details will go here</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.replace("Login")}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 30 },
  button: { backgroundColor: "#ff4d4d", padding: 15, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
