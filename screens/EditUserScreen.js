import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from './config'; // Import config for API base URL
import Toast from 'react-native-toast-message';

const EditUserScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    status: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        //throw new Error('No authentication token found');
        return;
      }

      const response = await axios.get(`${config.BASE_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const userData = response.data;
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phoneNumber || '',
        role: userData.role || '',
        status: userData.status || 'active'
      });
      setOriginalData(userData);

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
          text1:errormessage
        })
      }
      //console.error('Error fetching user data:', error);
      //Alert.alert('Error', 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if form data has changed
    const changed = JSON.stringify(formData) !== JSON.stringify({
      ...originalData,
      phone: originalData.phoneNumber || ''
    });
    setHasChanges(changed);
  }, [formData, originalData]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const token = await AsyncStorage.getItem('authToken');
        const updateData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phone,
          role: formData.role,
          status: formData.status
        };

        const response = await axios.put(
          `${config.BASE_URL}/api/users/update/${userId}`,
          updateData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
        if(Platform.OS==='android'){
                 ToastAndroid.showWithGravity(
            'User updated successfully!',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
          );
        
              }
              else{
                Toast.show(
                  {
                    type:'success',
                    text1:'Success',
                    text2:'User updated successfully!'
                  }
                )
              }
        
        //Alert.alert('Success', response.data.message || 'User updated successfully!');
        
        // Navigate back after success
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
        
      } catch (error) {
       // console.error('Error updating user:', error);
        const errorMessage = error.response?.data?.message || "Failed to update user";
        
        if (errorMessage === "Invalid token") {
          await AsyncStorage.removeItem('token');
         // navigation.navigate('Login');
        } else {
          //Alert.alert('Error', errorMessage);
          if(Platform.OS==='android'){
                   ToastAndroid.showWithGravity(
              errorMessage,
              ToastAndroid.LONG,
              ToastAndroid.CENTER
            );
          
                }
                else{
                  Toast.show(
                    {
                      type:'error',
                      text1:'Error',
                      text2:errorMessage
                    }
                  )
                }
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  

  const InputField = ({ label, field, value, error, keyboardType = 'default', editable = true }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null
        ]}
        value={value}
        onChangeText={(text) => handleChange(field, text)}
        placeholder={`Enter ${label.toLowerCase()}`}
        keyboardType={keyboardType}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        editable={editable}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const SelectField = ({ label, field, value, error, options }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value ? styles.selectOptionActive : null
            ]}
            onPress={() => handleChange(field, option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              value === option.value ? styles.selectOptionTextActive : null
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Edit User</Text>
              <Text style={styles.headerSubtitle}>
                Update {originalData.firstName} {originalData.lastName}'s information
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>User Details</Text>
              {/* <Text style={styles.cardSubtitle}>Update the user's information</Text> */}
            </View>
            
            <View style={styles.form}>
              <InputField
                label="First Name"
                field="firstName"
                value={formData.firstName}
                error={errors.firstName}
              />
              
              <InputField
                label="Last Name"
                field="lastName"
                value={formData.lastName}
                error={errors.lastName}
              />
              
              <InputField
                label="Email Address"
                field="email"
                value={formData.email}
                error={errors.email}
                keyboardType="email-address"
              />
              
              <InputField
                label="Phone Number"
                field="phone"
                value={formData.phone}
                error={errors.phone}
                keyboardType="phone-pad"
              />

              <SelectField
                label="Role"
                field="role"
                value={formData.role}
                error={errors.role}
                options={[
                  { label: 'Boss', value: 'boss' },
                  { label: 'Tenant', value: 'tenant' }
                ]}
              />

              <SelectField
                label="Status"
                field="status"
                value={formData.status}
                error={errors.status}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Pending', value: 'Pending' },
                  { label: 'Suspended', value: 'Suspended' }
                ]}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!hasChanges || isSubmitting) ? styles.submitButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={!hasChanges || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Update User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

         

          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: '#3B82F6',
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    minWidth: 80,
    alignItems: 'center',
  },
  selectOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dangerZone: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    overflow: 'hidden',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEE2E2',
    gap: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  dangerActions: {
    padding: 16,
  },
  resetPasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    gap: 8,
    marginBottom: 8,
  },
  resetPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  dangerDescription: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoGrid: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default EditUserScreen;