import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GuestLogsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventName = 'Event' } = route.params;
  
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'checked-in', 'not-checked-in'

  useEffect(() => {
    fetchGuestLogs();
  }, [eventId]);

  const fetchGuestLogs = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/events/${eventId}/guests`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Transform the data to include check-in information
      const guestData = response.data.guests || response.data || [];
      setGuests(guestData);
    } catch (error) {
      console.error('Error fetching guest logs:', error);
      Alert.alert('Error', 'Failed to fetch guest logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGuestLogs();
  };

  const filteredGuests = guests.filter(guest => {
    switch (filter) {
      case 'checked-in':
        return guest.checkedIn;
      case 'not-checked-in':
        return !guest.checkedIn;
      default:
        return true;
    }
  });

  const getStatusIcon = (checkedIn) => {
    return checkedIn ? 'checkmark-circle' : 'time';
  };

  const getStatusColor = (checkedIn) => {
    return checkedIn ? '#10B981' : '#6B7280';
  };

  const getStatusText = (checkedIn) => {
    return checkedIn ? 'Checked In' : 'Not Checked In';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGuestItem = ({ item }) => (
    <View style={styles.guestCard}>
      <View style={styles.guestHeader}>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>
            {item.firstName} {item.lastName}
          </Text>
          {item.email && <Text style={styles.guestEmail}>{item.email}</Text>}
          {item.phone && <Text style={styles.guestPhone}>{item.phone}</Text>}
        </View>
        
        <View style={styles.statusContainer}>
          <Ionicons 
            name={getStatusIcon(item.checkedIn)} 
            size={20} 
            color={getStatusColor(item.checkedIn)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.checkedIn) }]}>
            {getStatusText(item.checkedIn)}
          </Text>
        </View>
      </View>

      {item.checkedIn && item.checkInTime && (
        <View style={styles.checkInInfo}>
          <Ionicons name="time" size={16} color="#6B7280" />
          <Text style={styles.checkInTime}>
            Checked in: {formatDateTime(item.checkInTime)}
          </Text>
        </View>
      )}

      {item.type && (
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      )}
    </View>
  );

  const FilterButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading guest logs...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Guest Logs</Text>
          <Text style={styles.eventName}>{eventName}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.guestCount}>
            {filteredGuests.length} {filteredGuests.length === 1 ? 'guest' : 'guests'}
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton title="All" value="all" isActive={filter === 'all'} />
        <FilterButton title="Checked In" value="checked-in" isActive={filter === 'checked-in'} />
        <FilterButton title="Not Checked In" value="not-checked-in" isActive={filter === 'not-checked-in'} />
      </View>

      {/* Guest List */}
      <FlatList
        data={filteredGuests}
        keyExtractor={(item) => item._id || item.id || Math.random().toString()}
        renderItem={renderGuestItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              {filter === 'all' ? 'No guests found' : `No ${filter.replace('-', ' ')} guests`}
            </Text>
            <Text style={styles.emptyStateText}>
              {filter === 'all' 
                ? 'No guests have been added to this event yet.'
                : `No guests match the "${filter.replace('-', ' ')}" filter.`
              }
            </Text>
          </View>
        }
      />

      {/* Summary Stats */}
      {guests.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {guests.filter(g => g.checkedIn).length}
            </Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {guests.filter(g => !g.checkedIn).length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {guests.length}
            </Text>
            <Text style={styles.statLabel}>Total Guests</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  eventName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  guestCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guestInfo: {
    flex: 1,
    marginRight: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  guestEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  guestPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'center',
    minWidth: 100,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  checkInTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default GuestLogsScreen;