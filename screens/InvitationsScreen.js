import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const SendInvitations = ({ navigation }) => {
  const [message, setMessage] = useState(`You're invited to our special event! We can't wait to celebrate with you.`);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.get(`${config.BASE_URL}/api/getallevents`, {
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

    fetchEvents();
  }, []);

  // Send invitations
  const sendInvitations = async () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event to send invitations for.');
      return;
    }

    setSending(true);
    setSendProgress(0);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // Call the backend API to send invitations
      const response = await axios.post(
        `${config.BASE_URL}/api/invitations/send`,
        {
          eventId: selectedEvent,
          message: message
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
      setTimeout(() => setSendProgress(0), 2000);
    }
  };

  // Preview message with guest name
  const previewMessage = (guestName = 'Guest') => {
    return message.replace(/{name}/g, guestName);
  };

  const renderEventPicker = () => {
    if (loadingEvents) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      );
    }

    return (
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedEvent}
          onValueChange={(itemValue) => setSelectedEvent(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="-- Select an Event --" value="" />
          {events.map(event => (
            <Picker.Item 
              key={event.id} 
              value={event.id}
              label={`${event.eventName} - ${new Date(event.eventDate).toLocaleDateString()}`}
            />
          ))}
        </Picker>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Send Invitations</Text>
        <Text style={styles.subtitle}>Send personalized invitations to your guests</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Event Selection & Message</Text>
        
        {/* Event Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Event *</Text>
          {renderEventPicker()}
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

        {/* Message Preview Button */}
        <TouchableOpacity 
          style={styles.previewButton}
          onPress={() => setPreviewModalVisible(true)}
        >
          <Icon name="visibility" size={18} color="#3B82F6" />
          <Text style={styles.previewButtonText}>Preview Message</Text>
        </TouchableOpacity>
      </View>

      {/* Send Button */}
      <View style={styles.card}>
        <View style={styles.sendContainer}>
          <View style={styles.sendInfo}>
            <Text style={styles.sendTitle}>Send invitations for selected event</Text>
            <Text style={styles.sendSubtitle}>
              Invitations will be sent to all guests of the selected event
            </Text>
          </View>
          <TouchableOpacity
            onPress={sendInvitations}
            disabled={sending || !selectedEvent}
            style={[styles.sendButton, (sending || !selectedEvent) && styles.sendButtonDisabled]}
          >
            {sending ? (
              <>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.sendButtonText}>Sending...</Text>
              </>
            ) : (
              <>
                <Icon name="send" size={18} color="#FFF" />
                <Text style={styles.sendButtonText}>Send Invitations</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {sending && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Sending progress</Text>
              <Text style={styles.progressPercent}>{sendProgress}%</Text>
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
        <View style={styles.infoItem}>
          <Icon name="check-circle" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>Select an event to send invitations for</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="check-circle" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>Customize your invitation message</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="check-circle" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>Invitations will be sent to all guests of the selected event</Text>
        </View>
      </View>

      {/* Message Preview Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={previewModalVisible}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Preview</Text>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>{previewMessage()}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
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
  },
  card: {
    backgroundColor: '#FFF',
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
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    height: 150,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 8,
  },
  previewButtonText: {
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
  },
  sendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sendInfo: {
    flex: 1,
    marginRight: 16,
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
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    color: '#1E40AF',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
  },
  previewText: {
    color: '#1E40AF',
    lineHeight: 22,
  },
});

export default SendInvitations;