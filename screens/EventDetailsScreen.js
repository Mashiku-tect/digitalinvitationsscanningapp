import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const EventDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventName } = route.params;

  //console.log('Event ID:', route.params);
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${config.BASE_URL}/api/events/eventdetails/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvent(response.data.event);
      setGuests(response.data.event.Guests || response.data.guests || []);
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.delete(`${config.BASE_URL}/api/events/delete/${eventId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
               navigation.navigate('HomeTabs', { screen: 'Events' });
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const markAsCompleted = async () => {
    Alert.alert(
      'Mark as Completed',
      'Are you sure you want to mark this event as completed?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Mark Complete',
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.put(
                `${config.BASE_URL}/api/events/complete/${eventId}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              
              setEvent({ ...event, active: false });
              Alert.alert('Success', 'Event marked as completed successfully!');
            } catch (error) {
              console.error('Error marking event as completed:', error);
              Alert.alert('Error', 'Failed to mark event as completed');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <TouchableOpacity 
            onPress={() => navigation.replace('Events')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderGuestItem = ({ item, index }) => (
    <View style={styles.guestRow}>
      <Text style={styles.guestCell}>{index + 1}</Text>
      <Text style={styles.guestCell}>{item.firstName || 'N/A'}</Text>
      <Text style={styles.guestCell}>{item.lastName || 'N/A'}</Text>
      <Text style={styles.guestCell}>{item.phone || 'N/A'}</Text>
      <Text style={styles.guestCell}>{item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'N/A'}</Text>
      <View style={styles.guestCell}>
        <View style={[
          styles.statusBadge,
          item.status === 'Confirmed' ? styles.confirmedBadge : styles.pendingBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Confirmed' ? styles.confirmedText : styles.pendingText
          ]}>
            {item.status || 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back to Events</Text>
          </TouchableOpacity>
          
          <View style={styles.actionButtons}>
            {event.active && (
              <TouchableOpacity
                onPress={markAsCompleted}
                disabled={updating}
                style={[styles.actionButton, styles.completeButton, updating && styles.disabledButton]}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={() => navigation.navigate('EditEvent', { id: eventId })}
              style={[styles.actionButton, styles.editButton]}
            >
              <Ionicons name="create" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={deleteEvent}
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.eventTitle}>{event.eventName}</Text>
            <View style={[
              styles.statusBadge,
              event.active ? styles.upcomingBadge : styles.completedBadge
            ]}>
              <Text style={[
                styles.statusText,
                event.active ? styles.upcomingText : styles.completedText
              ]}>
                {event.active ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{formatDate(event.eventDate)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="time" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{event.eventTime}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{event.location}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="grid" size={20} color="#3B82F6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>
                    {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{event.description}</Text>
            </View>
          </View>

          <View style={styles.guestsContainer}>
            <Text style={styles.sectionTitle}>Guest List ({guests.length} guests)</Text>
            {guests.length > 0 ? (
              <View style={styles.guestsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.headerCell}>S/N</Text>
                  <Text style={styles.headerCell}>First Name</Text>
                  <Text style={styles.headerCell}>Last Name</Text>
                  <Text style={styles.headerCell}>Phone</Text>
                  <Text style={styles.headerCell}>Type</Text>
                  <Text style={styles.headerCell}>Status</Text>
                </View>
                <FlatList
                  data={guests}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderGuestItem}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View style={styles.noGuestsBox}>
                <Text style={styles.noGuestsText}>No guests added yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3B82F6',
    marginLeft: 4,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  completeButton: {
    backgroundColor: '#8B5CF6',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upcomingBadge: {
    backgroundColor: '#D1FAE5',
  },
  completedBadge: {
    backgroundColor: '#F3F4F6',
  },
  confirmedBadge: {
    backgroundColor: '#D1FAE5',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  upcomingText: {
    color: '#065F46',
  },
  completedText: {
    color: '#374151',
  },
  confirmedText: {
    color: '#065F46',
  },
  pendingText: {
    color: '#92400E',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  detailContent: {
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  descriptionBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  descriptionText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  guestsContainer: {
    marginBottom: 20,
  },
  guestsTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  guestRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  guestCell: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  noGuestsBox: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  noGuestsText: {
    color: '#6B7280',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default EventDetails;