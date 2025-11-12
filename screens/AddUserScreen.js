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
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from './config';

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
  const [focusedField, setFocusedField] = useState(null);
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

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
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
    dismissKeyboard(); // Dismiss keyboard when submitting
    
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

  const InputField = ({ label, field, value, error, secureTextEntry, keyboardType = 'default', autoCompleteType = 'off' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          focusedField === field ? styles.inputFocused : null
        ]}
        value={value}
        onChangeText={(text) => handleChange(field, text)}
        onFocus={() => handleFocus(field)}
        onBlur={handleBlur}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
        secureTextEntry={secureTextEntry && !showPassword}
        keyboardType={keyboardType}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCompleteType={autoCompleteType}
        autoCorrect={false}
        returnKeyType="next"
        blurOnSubmit={false}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
     
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled" // This fixes the keyboard dismiss issue
          >
            {/* Header */}
            <View style={styles.header}>
              {/* <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity> */}
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Create New User</Text>
                {/* <Text style={styles.headerSubtitle}>Add a new user to the system</Text> */}
              </View>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Icon name="person-add" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>User Details</Text>
                  <Text style={styles.cardSubtitle}>Enter the basic information for the new user</Text>
                </View>
              </View>
              
              <View style={styles.form}>
                <InputField
                  label="First Name"
                  field="firstName"
                  value={formData.firstName}
                  error={errors.firstName}
                  autoCompleteType="name"
                />
                
                <InputField
                  label="Last Name"
                  field="lastName"
                  value={formData.lastName}
                  error={errors.lastName}
                  autoCompleteType="name"
                />
                
                <InputField
                  label="Email Address"
                  field="email"
                  value={formData.email}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCompleteType="email"
                />
                
                <InputField
                  label="Phone Number"
                  field="phone"
                  value={formData.phone}
                  error={errors.phone}
                  keyboardType="phone-pad"
                  autoCompleteType="tel"
                />
                
                {/* Password Field with Toggle */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={[
                    styles.passwordContainer,
                    errors.password ? styles.inputError : null,
                    focusedField === 'password' ? styles.inputFocused : null
                  ]}>
                    <TextInput
                      style={styles.passwordInput}
                      value={formData.password}
                      onChangeText={(text) => handleChange('password', text)}
                      onFocus={() => handleFocus('password')}
                      onBlur={handleBlur}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      autoCompleteType="password"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon 
                        name={showPassword ? "visibility" : "visibility-off"} 
                        size={20} 
                        color={focusedField === 'password' ? "#3B82F6" : "#6B7280"} 
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <View style={styles.errorContainer}>
                      <Icon name="error-outline" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  )}
                  <Text style={styles.passwordHint}>Must be at least 8 characters</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()}
                >
                  <Icon name="close" size={20} color="#6B7280" />
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
                    <>
                      <Icon name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Create User</Text>
                    </>
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
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginLeft:130
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    backgroundColor: '#3B82F6',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  inputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordToggle: {
    padding: 16,
  },
  passwordHint: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginTop: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});

export default AddUserScreen;