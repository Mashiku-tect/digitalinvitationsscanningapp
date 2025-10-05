import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const CreateEvent = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().setHours(new Date().getHours() + 2)), // Default to 2 hours later
    location: '',
    description: '',
    category: 'personal',
    excelFile: null,
    fileName: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const categories = [
    { value: 'personal', label: 'Personal' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newStartTime = selectedTime;
      setFormData(prev => ({
        ...prev,
        startTime: newStartTime
      }));

      // Auto-adjust end time if it's before start time
      const currentEndTime = prev.endTime;
      if (currentEndTime < newStartTime) {
        const newEndTime = new Date(newStartTime);
        newEndTime.setHours(newStartTime.getHours() + 2); // Add 2 hours
        setFormData(prev => ({
          ...prev,
          endTime: newEndTime
        }));
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setFormData(prev => ({
        ...prev,
        endTime: selectedTime
      }));
    }
  };

  const validateTimes = () => {
    const startTime = formData.startTime;
    const endTime = formData.endTime;
    
    if (endTime <= startTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return false;
    }
    
    // Check if event duration is reasonable (not more than 24 hours)
    const duration = (endTime - startTime) / (1000 * 60 * 60); // duration in hours
    if (duration > 24) {
      Alert.alert('Long Duration', 'Event duration seems too long. Please check your times.');
      return false;
    }
    
    return true;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/csv',
          'text/comma-separated-values'
        ],
        copyToCacheDirectory: true
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('User canceled document picker');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
        
        if (!validExtensions.includes(fileExtension)) {
          setUploadStatus('error');
          Alert.alert('Error', 'Please upload a valid Excel file (.xlsx, .xls, or .csv)');
          return;
        }

        setFormData(prev => ({
          ...prev,
          excelFile: file,
          fileName: file.name
        }));
        setUploadStatus('success');
        Alert.alert('Success', 'Excel file uploaded successfully!');
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.location || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate times
    if (!validateTimes()) {
      return;
    }

    // Validate Excel file upload
    if (!formData.excelFile) {
      Alert.alert('Error', 'Please upload an Excel file with guest data');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // Create FormData
      const data = new FormData();
      data.append("name", formData.name);
      data.append("date", formData.date.toISOString().split('T')[0]);
      data.append("time", formData.startTime.toTimeString().split(' ')[0]);
      data.append("endTime", formData.endTime.toTimeString().split(' ')[0]);
      data.append("location", formData.location);
      data.append("description", formData.description);
      data.append("category", formData.category);
      
      // For file upload in React Native - use the correct file structure
      data.append("excelFile", {
        uri: formData.excelFile.uri,
        type: formData.excelFile.mimeType || 'application/vnd.ms-excel',
        name: formData.excelFile.name || 'guest_list.xlsx'
      });

      console.log('Sending request with form data');

      const res = await axios.post(
        `${config.BASE_URL}/api/events`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      Alert.alert('Success', res.data.message || 'Event created successfully!');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigation.navigate("Events");
      }, 1500);
    } catch (err) {
      console.error('Error creating event:', err);
      let errorMessage = "Error creating event";
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = err.message || "Unknown error occurred";
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventDuration = () => {
    const start = formData.startTime;
    const end = formData.endTime;
    const duration = (end - start) / (1000 * 60 * 60); // hours
    
    if (duration < 1) {
      const minutes = Math.round(duration * 60);
      return `${minutes} minutes`;
    } else if (duration === 1) {
      return '1 hour';
    } else {
      return `${Math.round(duration * 10) / 10} hours`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Loading Overlay */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={loading}
        onRequestClose={() => {}}
      >
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Creating your event...</Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Create New Event</Text>
        <Text style={styles.subtitle}>Fill out the form below to create a new event with guest data</Text>
      </View>

      {/* Form */}
      <View style={styles.formCard}>
        {/* Event Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Enter event name"
          />
        </View>

        {/* Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity 
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatDate(formData.date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Start and End Time */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text>{formatTime(formData.startTime)}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={formData.startTime}
                mode="time"
                display="default"
                onChange={handleStartTimeChange}
              />
            )}
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity 
              style={styles.input}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text>{formatTime(formData.endTime)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={formData.endTime}
                mode="time"
                display="default"
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        </View>

        {/* Duration Display */}
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Event Duration:</Text>
          <Text style={styles.durationValue}>{getEventDuration()}</Text>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => handleChange('location', text)}
            placeholder="Enter event location"
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.category}
              onValueChange={(value) => handleChange('category', value)}
              style={styles.picker}
            >
              {categories.map(category => (
                <Picker.Item key={category.value} label={category.label} value={category.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Excel File Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Guest List (Excel File) *</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
            <Text style={styles.uploadButtonText}>
              {formData.fileName ? 'Change Excel File' : 'Upload Excel File'}
            </Text>
          </TouchableOpacity>
          
          {formData.fileName ? (
            <View style={[
              styles.fileInfo, 
              uploadStatus === 'success' ? styles.successFile : styles.defaultFile
            ]}>
              <Text style={styles.fileName}>{formData.fileName}</Text>
              <Text style={styles.fileStatus}>
                {uploadStatus === 'success' 
                  ? 'File successfully uploaded. Make sure it contains guest names, emails, and any other relevant information.'
                  : 'Please upload an Excel file with your guest list.'}
              </Text>
            </View>
          ) : (
            <Text style={styles.uploadHint}>
              Upload an Excel file (.xlsx, .xls) or CSV containing your guest list
            </Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder="Describe your event..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Form Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={loading ? styles.disabledSubmitButton : styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Event</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Help Text */}
      <View style={styles.helpText}>
        <Text style={styles.helpTextLine}>All fields marked with * are required</Text>
        <Text style={styles.helpTextLine}>Your Excel file should include guest names, emails, and any other relevant information</Text>
        <Text style={styles.helpTextLine}>End time must be after start time</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingText: {
    marginTop: 10,
    color: '#374151',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  fileInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  defaultFile: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  successFile: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fileName: {
    fontWeight: '500',
    marginBottom: 4,
  },
  fileStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  uploadHint: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    marginTop: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  disabledSubmitButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  helpText: {
    alignItems: 'center',
    marginBottom: 32,
  },
  helpTextLine: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default CreateEvent;