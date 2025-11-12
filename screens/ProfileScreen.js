import React, { useState,useEffect } from 'react';
import axios from 'axios';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Switch,
   ActivityIndicator,
   Platform,
   ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation, onLogout }) => {
  const [userData, setUserData] = useState({ });
 const [updating,setUpdating]=useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

 

useEffect(() => {
  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${config.BASE_URL}/api/user/userdetails`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      //console.log(response.data.user)

      setUserData(response.data.user);
    } catch (error) {
      const errormessage=error.response.data.message;
      if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            errormessage,
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'error',
          text1:'Errro',
          text2:errormessage
        })
      }
      //console.error("Error fetching user details:", error);
    }
  };

  // ✅ Call it here (not inside itself)
  fetchUserDetails();
}, []);


  const handlePasswordChange = async () => {
   if (
  !passwordData?.newPassword?.trim() ||
  !passwordData?.confirmPassword?.trim() ||
  !passwordData?.currentPassword?.trim()
) {
  if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            'Fill All Input Fields',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'error',
          text1:'Error',
          text2:'Fill All Input Fields'
        })
      }

      return;
}

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      //Alert.alert('Error', 'New passwords do not match');
      if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            'New passwords do not match',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'error',
          text1:'Error',
          text2:'New passwords do not match'
        })
      }
      return;
    }

    if (passwordData.newPassword.trim().length < 8) {
      //Alert.alert('Error', 'Password must be at least 8 characters long');
       if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            'New password must be at least 8 characters long',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'error',
          text1:'Error',
          text2:'New password must be at least 8 characters long'
        })
      }
      return;
    }

    const payload={
      currentpassword:passwordData.currentPassword,
      newpassword:passwordData.newPassword
    }
    const token=await AsyncStorage.getItem('authToken');
    if(!token) return;


    try{
      setUpdating(true);
  const response=await axios.post(`${config.BASE_URL}/api/user/newpassword`,
      payload
    ,{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })

    // Here you would typically make an API call to change the password
   // Alert.alert('Success', 'Password changed successfully');
   if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            'Password changed successfully',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'success',
          text1:'Success',
          text2:'Password changed successfully'
        })
      }
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    }
    catch(error){
      const errormessage=error.response.data.message;
      if(Platform.OS==='android'){
         ToastAndroid.showWithGravity(
            errormessage,
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
      }
      else{
        Toast.show({
          type:'success',
          text1:'Success',
          text2:errormessage
        })
      }
      
      //console.log(errormessage)
      //Alert.alert(errormessage)
    }
    finally{
      setUpdating(false)
    }
  
  };

 const handleLogout = () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear token
            await AsyncStorage.removeItem('authToken');

            // Reset navigation from root
  //     navigation
  // .getParent()      // BottomTabs
  // .getParent()      // HomeStack
  // .getParent()      // Drawer
  // .getParent()      // Root Stack
  // ?.reset({
  //   index: 0,
  //   routes: [{ name: 'Login' }],
  // });
   if (onLogout) {
              onLogout();
            }


          } catch (error) {
            //console.log('Error clearing token:', error);
          }
        }
      }
    ]
  );
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../assets/user.png')}
              style={styles.avatar}
            />
            {/* <TouchableOpacity style={styles.editButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity> */}
          </View>

          <Text style={styles.userName}>{userData.firstName} {userData.lastName} </Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userData.role}</Text>
          </View>
        </View>

        

        {/* Change Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={18} color="#8a8d97" style={styles.inputIcon} />
            <TextInput
              placeholder="Current Password"
              placeholderTextColor="#8a8d97"
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key" size={18} color="#8a8d97" style={styles.inputIcon} />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#8a8d97"
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="key" size={18} color="#8a8d97" style={styles.inputIcon} />
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor="#8a8d97"
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
              style={styles.input}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
  style={styles.changePasswordButton}
  onPress={handlePasswordChange}
  disabled={updating} // ✅ disable while updating
>
  {updating ? (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <ActivityIndicator size="small" color="#fff" />
      <Text style={[styles.changePasswordText, { marginLeft: 8 }]}>
        Updating...
      </Text>
    </View>
  ) : (
    <Text style={styles.changePasswordText}>Update Password</Text>
  )}
</TouchableOpacity>

        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#ff6b6b" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Event Manager v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4e6bff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: '#4e6bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: '#1a1a1a',
    fontSize: 16,
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#1a1a1a',
    fontSize: 16,
  },
  changePasswordButton: {
    backgroundColor: '#4e6bff',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  changePasswordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff2f2',
    height: 50,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#8a8d97',
    fontSize: 12,
  },
});