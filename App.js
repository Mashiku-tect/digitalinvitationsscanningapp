import React, { useState,useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';
import { checkLoginStatus } from './utils/auth';

import LoginScreen from './screens/LoginScreen';

import AppNavigator from './navigation/AppNavigator'; // now in separate file

const Stack = createNativeStackNavigator();



export default function App() {
  const [loading, setLoading] = useState(true);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Check login status on app start
  useEffect(() => {
  const verifyToken = async () => {
    const token = await checkLoginStatus();
    setIsLoggedIn(!!token);
    setLoading(false);
  };
  verifyToken();
}, []);
 
if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
