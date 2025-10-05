import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from './config'; // Import config for API base URL

const AddUserScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const showToast = (message, type = 'success') => {
    Alert.alert(
      type === 'success' ? 'Success' : 'Error',
      message,
      [{ text: 'OK' }]
    );
  };

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
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsSubmitting(true);

      try {
        const token = await AsyncStorage.getItem('authToken');
        const res = await axios.post(`${config.BASE_URL}/api/users/adduser`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        console.log("Response:", res.data);
        setIsSubmitting(false);
        
        // Show success message
        showToast(res.data.message || 'User created successfully!');
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: ""
        });
        
        // Navigate back after a delay
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
        
      } catch (err) {
        setIsSubmitting(false);
        console.error(err.response?.data || err.message);

        const errorMessage = err.response?.data?.message || "Something went wrong";
        if (errorMessage === "Invalid token") {
          await AsyncStorage.removeItem('token');
          navigation.navigate('Login');
        } else {
          showToast(errorMessage, 'error');
        }
        
        setErrors({ ...errors, api: errorMessage });
      }
    }
  };

  const InputField = ({ label, field, value, error, secureTextEntry, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null
        ]}
        value={value}
        onChangeText={(text) => handleChange(field, text)}
        placeholder={`Enter ${label.toLowerCase()}`}
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Create New User</Text>
              <Text style={styles.headerSubtitle}>Add a new user to the system</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>User Details</Text>
              <Text style={styles.cardSubtitle}>Enter the basic information for the new user</Text>
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
              
              {/* Password Field with Toggle */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password ? styles.inputError : null
                    ]}
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                <Text style={styles.passwordHint}>Must be at least 8 characters</Text>
              </View>
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
                  isSubmitting ? styles.submitButtonDisabled : null
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Information Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="info" size={20} color="#1D4ED8" />
              <Text style={styles.infoTitle}>Information</Text>
            </View>
            <Text style={styles.infoText}>
              All fields marked with * are required. The user will be able to change their password after first login.
            </Text>
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
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
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default AddUserScreen;