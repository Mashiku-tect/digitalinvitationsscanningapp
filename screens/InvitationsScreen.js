import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SendInvitations = () => {
  const [message, setMessage] = useState(`You're invited to our special event! We can't wait to celebrate with you.`);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendMethod, setSendMethod] = useState('both'); // 'sms', 'whatsapp', 'both'

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/getallevents', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Send invitations
  const sendInvitations = async () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event to send invitations for.');
      return;
    }

    setSending(true);
    setSendProgress(0);
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Call the backend API to send invitations
      const response = await axios.post(
        'http://localhost:5000/api/invitations/send',
        {
          eventId: selectedEvent,
          message: message,
          method: sendMethod
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setSendProgress(percentCompleted);
          }
        }
      );
      
      Alert.alert('Success', 'Invitations sent successfully!');
    } catch (error) {
      console.error('Error sending invitations:', error);
      Alert.alert('Error', 'Failed to send invitations. Please try again.');
    } finally {
      setSending(false);
      setSendProgress(100);
    }
  };

  // Preview message with guest name
  const previewMessage = (guestName = 'Guest') => {
    return message.replace(/{name}/g, guestName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send Invitations</Text>
        <Text style={styles.headerSubtitle}>Send personalized invitations via SMS and WhatsApp</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Selection & Message Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Selection & Message</Text>
          
          {/* Event Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Event *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEvent}
                onValueChange={(value) => setSelectedEvent(value)}
                style={styles.picker}
                enabled={!loadingEvents}
              >
                <Picker.Item label="-- Select an Event --" value="" />
                {events.map(event => (
                  <Picker.Item 
                    key={event.id} 
                    label={`${event.eventName} - ${new Date(event.eventDate).toLocaleDateString()}`} 
                    value={event.id} 
                  />
                ))}
              </Picker>
            </View>
            {loadingEvents && (
              <Text style={styles.loadingText}>Loading events...</Text>
            )}
          </View>
          
          {/* Message Composition */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Invitation Message *</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              placeholder="Write your invitation message here..."
            />
            <Text style={styles.helperText}>
              Use {'{name}'} to personalize with guest names
            </Text>
          </View>

          {/* Send Method Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Send Via *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[styles.radioOption, sendMethod === 'both' && styles.radioOptionSelected]}
                onPress={() => setSendMethod('both')}
              >
                <View style={[styles.radioCircle, sendMethod === 'both' && styles.radioCircleSelected]}>
                  {sendMethod === 'both' && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>Both SMS & WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, sendMethod === 'sms' && styles.radioOptionSelected]}
                onPress={() => setSendMethod('sms')}
              >
                <View style={[styles.radioCircle, sendMethod === 'sms' && styles.radioCircleSelected]}>
                  {sendMethod === 'sms' && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>SMS Only</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.radioOption, sendMethod === 'whatsapp' && styles.radioOptionSelected]}
                onPress={() => setSendMethod('whatsapp')}
              >
                <View style={[styles.radioCircle, sendMethod === 'whatsapp' && styles.radioCircleSelected]}>
                  {sendMethod === 'whatsapp' && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>WhatsApp Only</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Message Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Message Preview:</Text>
            <Text style={styles.previewText}>{previewMessage()}</Text>
          </View>
        </View>

        {/* Send Button Card */}
        <View style={styles.card}>
          <View style={styles.sendButtonContainer}>
            <View style={styles.sendInfo}>
              <Text style={styles.sendTitle}>Send invitations for selected event</Text>
              <Text style={styles.sendSubtitle}>
                {sendMethod === 'both' && 'Via SMS and WhatsApp'}
                {sendMethod === 'sms' && 'Via SMS only'}
                {sendMethod === 'whatsapp' && 'Via WhatsApp only'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={sendInvitations}
              disabled={sending || !selectedEvent}
              style={[styles.sendButton, (sending || !selectedEvent) && styles.sendButtonDisabled]}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Invitations</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {sending && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Sending progress</Text>
                <Text style={styles.progressPercentage}>{sendProgress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${sendProgress}%` }]} 
                />
              </View>
              <Text style={styles.progressText}>
                Sending invitations to all guests of the selected event...
              </Text>
            </View>
          )}
        </View>

        {/* Information Card */}
        <View style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Select an event to send invitations for</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Customize your invitation message</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Choose how to send (SMS, WhatsApp, or both)</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Invitations will be sent to all guests of the selected event</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>WhatsApp: Message + Invitation Card | SMS: Message + Download Link</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    height: 150,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radioOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#3B82F6',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  previewContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#1E40AF',
    lineHeight: 24,
  },
  sendButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  sendInfo: {
    flex: 1,
  },
  sendTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  sendSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default SendInvitations;