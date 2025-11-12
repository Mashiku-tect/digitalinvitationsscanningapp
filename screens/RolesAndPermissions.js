import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch,
  Platform,
  ToastAndroid
} from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import config from './config';
import Toast from 'react-native-toast-message';

const UserPermissions = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;
  
  const [user, setUser] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);

  const defaultPermissions = [
    {"id":"73cc64f3-baec-11f0-a366-f430b9110f54","name":"user_add","description":"Can add a new user"},
    {"id":"73cc6b29-baec-11f0-a366-f430b9110f54","name":"user_edit","description":"Can edit user details"},
    {"id":"73cc6c93-baec-11f0-a366-f430b9110f54","name":"user_delete","description":"Can delete users"},
    {"id":"73cc6d8a-baec-11f0-a366-f430b9110f54","name":"user_view","description":"Can view users"},
    {"id":"73cc6f05-baec-11f0-a366-f430b9110f54","name":"user_set_permissions","description":"Can assign permissions to users"},
    {"id":"73cc6fb0-baec-11f0-a366-f430b9110f54","name":"event_add","description":"Can create events"},
    {"id":"73cc705b-baec-11f0-a366-f430b9110f54","name":"event_edit","description":"Can edit events"},
    {"id":"73cc7107-baec-11f0-a366-f430b9110f54","name":"event_delete","description":"Can delete events"},
    {"id":"73cc71a8-baec-11f0-a366-f430b9110f54","name":"event_view","description":"Can view events"},
    {"id":"73cc7247-baec-11f0-a366-f430b9110f54","name":"event_view_report","description":"Can view event reports"},
    {"id":"73cc72ea-baec-11f0-a366-f430b9110f54","name":"event_manage_scanners","description":"Can manage scanners for an event"},
    {"id":"73cc73a0-baec-11f0-a366-f430b9110f54","name":"event_cancel","description":"Can cancel events"},
    {"id":"73cc741a-baec-11f0-a366-f430b9110f54","name":"event_mark_completed","description":"Can mark events as completed"},
    {"id":"73cc74ae-baec-11f0-a366-f430b9110f54","name":"scanninglogs_view","description":"Can view QR code scanning logs"},
    {"id":"73cc752f-baec-11f0-a366-f430b9110f54","name":"dashboard_view","description":"Can view dashboard"},
    {"id":"73cc75ed-baec-11f0-a366-f430b9110f54","name":"invitation_generate","description":"Can generate invitation cards"},
    {"id":"73cc7661-baec-11f0-a366-f430b9110f54","name":"invitation_send","description":"Can send invitations"},
    {"id":"d8b88424-bd33-11f0-8d4d-f430b9110f54","name":"call_status_update","description":"user can update the call status of the guest"}
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if(!token){
          return;
        }
        
        // Fetch user details
        const userResponse = await axios.get(`${config.BASE_URL}/api/users/getuserinfo/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);

        // Fetch user's current permissions
        const permissionsResponse = await axios.get(`${config.BASE_URL}/api/users/permissions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract just the permission IDs from the response
        const userPermissionIds = permissionsResponse.data.map(p => p.id);
        
        setUserPermissions(userPermissionIds);
        setAllPermissions(defaultPermissions);
        setHasAccess(true);
        
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setHasAccess(false);
        }
        //console.error('Error fetching user data:', error);
        if(Platform.OS==='android'){
                 ToastAndroid.showWithGravity(
            'Failed to load user data',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
        
              }
              else{
                Toast.show(
                  {
                    type:'error',
                    text1:'Error',
                    text2:'Failed to load user data'
                  }
                )
              }
        //Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (hasAccess === false) {
      navigation.navigate('Home');
    }
  }, [hasAccess, navigation]);

  const handlePermissionToggle = (permissionId) => {
    setUserPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      return newPermissions;
    });
  };

  const handleSelectAll = (category) => {
    const categoryPermissions = allPermissions
      .filter(p => p.name.startsWith(category))
      .map(p => p.id);
    
    setUserPermissions(prev => {
      const hasAllCategory = categoryPermissions.every(id => prev.includes(id));
      if (hasAllCategory) {
        // Remove all category permissions
        return prev.filter(id => !categoryPermissions.includes(id));
      } else {
        // Add all category permissions
        const newPerms = [...prev];
        categoryPermissions.forEach(id => {
          if (!newPerms.includes(id)) {
            newPerms.push(id);
          }
        });
        return newPerms;
      }
    });
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await axios.put(`${config.BASE_URL}/api/users/${userId}/permissions`, 
        { permissions: userPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
     // Alert.alert('Success', 'Permissions updated successfully!');
     if(Platform.OS==='android'){
              ToastAndroid.showWithGravity(
         'Permissions updated successfully!',
         ToastAndroid.LONG,
         ToastAndroid.CENTER
       );
     
           }
           else{
             Toast.show(
               {
                 type:'success',
                 text1:'Success',
                 text2:'Permissions updated successfully!'
               }
             )
           }
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.details || '';
      //console.error('Error updating permissions:', error);
      Alert.alert('Error', `Failed to update permissions: ${errorMessage} ${errorDetails}`);
    } finally {
      setSaving(false);
    }
  };

  const groupPermissionsByCategory = () => {
    const groups = {};
    allPermissions.forEach(permission => {
      const category = permission.name.split('_')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    return groups;
  };

  const isPermissionSelected = (permissionId) => {
    return userPermissions.includes(permissionId);
  };

  if (loading || hasAccess === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading user permissions...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const permissionGroups = groupPermissionsByCategory();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Manage User Permissions</Text>
          <Text style={styles.subtitle}>
            For: {user?.firstname} {user?.lastname} ({user?.email})
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Permissions List */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.permissionsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>User Permissions</Text>
            <Text style={styles.cardSubtitle}>
              Select the permissions you want to grant to this user
            </Text>
          </View>

          <View style={styles.permissionsContent}>
            {Object.entries(permissionGroups).map(([category, categoryPermissions]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Permissions
                  </Text>
                  <TouchableOpacity onPress={() => handleSelectAll(category)}>
                    <Text style={styles.selectAllText}>
                      {categoryPermissions.every(p => userPermissions.includes(p.id)) 
                        ? 'Deselect All' 
                        : 'Select All'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.permissionsGrid}>
                  {categoryPermissions.map(permission => {
                    const isSelected = isPermissionSelected(permission.id);
                    return (
                      <TouchableOpacity
                        key={permission.id}
                        style={[
                          styles.permissionItem,
                          isSelected && styles.permissionItemSelected
                        ]}
                        onPress={() => handlePermissionToggle(permission.id)}
                      >
                        <View style={styles.permissionContent}>
                          <View style={styles.permissionInfo}>
                            <Text style={styles.permissionName}>
                              {permission.name}
                            </Text>
                            <Text style={styles.permissionDescription}>
                              {permission.description}
                            </Text>
                          </View>
                          <Switch
                            value={isSelected}
                            onValueChange={() => handlePermissionToggle(permission.id)}
                            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                            thumbColor={isSelected ? '#2563eb' : '#9ca3af'}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSavePermissions}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Permissions</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4b5563',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  permissionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  permissionsContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  selectAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  permissionsGrid: {
    gap: 8,
  },
  permissionItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  permissionItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  permissionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default UserPermissions;