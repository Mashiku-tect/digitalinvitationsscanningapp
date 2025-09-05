import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  

  // Fetch user events from backend API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Get authentication token
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        navigation.navigate('Login');
        return;
      }

      // API call to fetch events
      const response = await axios.get(
        'https://4cd65a47da20.ngrok-free.app/api/getallevents', 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data) {
        setEvents(response.data.events || []);
        
      } else {
        setError(response.data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      let errorMessage = 'Failed to fetch events';
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          await AsyncStorage.removeItem('userToken');
          navigation.navigate('Login');
        } else {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString; // Return original string if date parsing fails
    }
  };

  const handleEventAction = (action, eventId, eventName) => {
    switch (action) {
      case 'details':
        navigation.navigate("EventDetails", { eventId, eventName });
        break;
      case 'scan':
        navigation.navigate("Scanner", { eventId, eventName });
        break;
      case 'logs':
        navigation.navigate("EventLogs", { eventId, eventName });
        break;
      default:
        break;
    }
  };

  const renderItem = ({ item }) => (
    //add a console log to see the item data
    //console.log('Rendering event item:', item) || 

    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleEventAction('details', item.id, item.eventName)}
    >
      <Image
        source={{ 
          uri: item.image || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
        }}
        style={styles.cardImage}
        defaultSource={require('../assets/placeholder-image.jpg')} // Add a placeholder image
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.eventName || 'Untitled Event'}</Text>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.detailText}>
              {item.eventDate ? formatDate(item.eventDate) : 'Date not set'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.detailText}>
              {item.location || 'Location not specified'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.detailText}>
              {item.attendees ? `${item.attendees} attendees` : 'No attendees info'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="grid" size={14} color="#666" />
            <Text style={styles.detailText}>
              {item.category ? `${item.category.charAt(0).toUpperCase() + item.category.slice(1)}` : 'No category'}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]} 
            onPress={() => handleEventAction('details', item.id, item.eventName)}
          >
            <Ionicons name="eye" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.scanButton]} 
            onPress={() => handleEventAction('scan', item.id, item.eventName)}
          >
            <Ionicons name="scan" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logsButton]} 
            onPress={() => handleEventAction('logs', item.id, item.eventName)}
          >
            <Ionicons name="list" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Logs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <Text style={styles.headerSubtitle}>Manage your events and check-ins</Text>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('Create Events')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Event</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={events}
        keyExtractor={(item) =>  item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchEvents}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {error ? (
              <>
                <Ionicons name="alert-circle" size={64} color="#EF4444" />
                <Text style={styles.emptyStateText}>Error Loading Events</Text>
                <Text style={styles.emptyStateSubtext}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchEvents}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Ionicons name="calendar" size={64} color="#c2c2c2" />
                <Text style={styles.emptyStateText}>No events yet</Text>
                {/* <Text style={styles.emptyStateSubtext}>Create your first event to get started</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => navigation.navigate('Create Events')}
                >
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity> */}
              </>
            )}
          </View>
        }
      />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  details: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  viewButton: {
    backgroundColor: '#4e6bff',
  },
  scanButton: {
    backgroundColor: '#10b981',
  },
  logsButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4a4a4a',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8a8d97',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default EventsScreen;