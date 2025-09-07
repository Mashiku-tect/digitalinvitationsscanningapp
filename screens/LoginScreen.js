import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const LoginScreen = ({ navigation, onLogin }) => {
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      setLoading(true);

      // 👇 Replace with your backend API
      const response = await axios.post(`${config.BASE_URL}/api/login`, {
        email,
        password
      });

      if (response.data.message === "Login successful") {
        const token = response.data.token;
        // ✅ Handle successful login
        console.log('Login successful, token:', token);


        // 🔒 Save token securely
        await AsyncStorage.setItem("authToken", token);

        // Call parent to update auth state
        onLogin(token);

        // Navigate to main app
        //navigation.replace("MainApp");
        navigation.reset({
  index: 0,
  routes: [
    { name: 'HomeTabs', params: { screen: 'Dashboard' } }
  ],
});

      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo/App Name */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🔒</Text>
          </View>
          <Text style={styles.appName}>Venue Scann</Text>
          <Text style={styles.tagline}>Manage Your Events</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          
          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              placeholder="Enter your username"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={styles.passwordInput}
              />
              <TouchableOpacity 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Text style={styles.eyeIconText}>
                  {isPasswordVisible ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

// ✅ styles remain same as before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f5ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  logoText: { fontSize: 40 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  tagline: { fontSize: 16, color: '#7f8c8d', textAlign: 'center' },
  formContainer: { backgroundColor: '#fff', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  welcomeText: { fontSize: 22, fontWeight: '600', color: '#2c3e50', textAlign: 'center', marginBottom: 25 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '500', color: '#34495e', marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 15, fontSize: 16, color: '#2c3e50', borderWidth: 1, borderColor: '#e8e8e8' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, borderWidth: 1, borderColor: '#e8e8e8' },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, color: '#2c3e50' },
  eyeIcon: { padding: 15 },
  eyeIconText: { fontSize: 18 },
  forgotPassword: { alignItems: 'flex-end', marginBottom: 25 },
  forgotPasswordText: { color: '#3498db', fontSize: 15, fontWeight: '500' },
  loginButton: { backgroundColor: '#3498db', borderRadius: 12, padding: 18, alignItems: 'center', shadowColor: '#3498db', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
