import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const ScanPermissionsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanners, setScanners] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch event details
      const eventResponse = await axios.get(`${config.BASE_URL}/api/events/eventdetails/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvent(eventResponse.data.event);

      // Fetch current scanners and all users
      await fetchScanPermissions();
      await fetchAllUsers();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchScanPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${config.BASE_URL}/api/events/${eventId}/scan-permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanners(response.data.scanners || []);
    } catch (error) {
      console.error('Error fetching scan permissions:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${config.BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data || []);
      setFilteredUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, allUsers]);

  // Check if user is already a scanner
  const isUserScanner = (userId) => {
    return scanners.some(scanner => scanner.tenant_id === userId);
  };

  const getScannerPermissionId = (userId) => {
    const scanner = scanners.find(scanner => scanner.tenant_id === userId);
    return scanner ? scanner.id : null;
  };

  const addScanner = async (userId) => {
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        Alert.alert('Success', response.data.message);
      }
      
      await fetchScanPermissions();
    } catch (error) {
      if (error.response && error.response.data) {
        const { success, message } = error.response.data;
        Alert.alert('Error', message);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setUpdating(false);
    }
  };

  const removeScanner = async (permissionId) => {
    Alert.alert(
      'Remove Scanner',
      'Are you sure you want to remove this user\'s scan permission?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.delete(
                `${config.BASE_URL}/api/events/${eventId}/scan-permissions/${permissionId}`, 
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (response.data.success) {
                Alert.alert('Success', response.data.message);
              }
              
              await fetchScanPermissions();
            } catch (error) {
              console.error('Error removing scanner:', error);
              if (error.response && error.response.data && error.response.data.message) {
                Alert.alert('Error', error.response.data.message);
              } else {
                Alert.alert('Error', 'An unexpected error occurred.');
              }
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getUserInitials = (user) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderScannerItem = ({ item }) => (
    <View style={styles.scannerItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getUserInitials(item.tenant)}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.tenant?.firstName} {item.tenant?.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.tenant?.email}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => removeScanner(item.id)}
        disabled={updating}
        style={[styles.removeButton, updating && styles.disabledButton]}
      >
        <Ionicons name="trash" size={16} color="#DC2626" />
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUserItem = ({ item }) => {
    const isScanner = isUserScanner(item.id);
    const permissionId = getScannerPermissionId(item.id);
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getUserInitials(item)}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRole}>{item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'User'}</Text>
          </View>
        </View>
        
        {isScanner ? (
          <TouchableOpacity
            onPress={() => removeScanner(permissionId)}
            disabled={updating}
            style={[styles.removeButton, updating && styles.disabledButton]}
          >
            <Ionicons name="trash" size={16} color="#DC2626" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => addScanner(item.id)}
            disabled={updating}
            style={[styles.addButton, updating && styles.disabledButton]}
          >
            <Ionicons name="add-circle" size={16} color="#059669" />
            <Text style={styles.addButtonText}>Add Scanner</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading scan permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.navigationButtons}>
            
            
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.navButton}
            >
              <Ionicons name="arrow-back" size={20} color="#3B82F6" />
              <Text style={[styles.navButtonText, styles.primaryNavButton]}>Back to Event</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.title}>Manage Scan Permissions</Text>
        </View>

        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventName}>{event.eventName}</Text>
              <Text style={styles.eventDetails}>
                {formatDate(event.eventDate)} at {event.eventTime}
              </Text>
              <Text style={styles.eventLocation}>{event.location}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              event.active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                event.active ? styles.activeText : styles.inactiveText
              ]}>
                {event.active ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Current Scanners Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Scanners</Text>
            <Text style={styles.sectionSubtitle}>
              Users who have permission to scan tickets for this event
            </Text>
            
            {scanners.length > 0 ? (
              <FlatList
                data={scanners}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderScannerItem}
                scrollEnabled={false}
                style={styles.list}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No scanners assigned yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add users from the list below
                </Text>
              </View>
            )}
          </View>

          {/* Add Scanners Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Scanners</Text>
            <Text style={styles.sectionSubtitle}>
              Search and add users who can scan tickets for this event
            </Text>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Users List */}
            {loadingUsers ? (
              <View style={styles.loadingUsers}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingUsersText}>Loading users...</Text>
              </View>
            ) : filteredUsers.length > 0 ? (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUserItem}
                scrollEnabled={false}
                style={styles.list}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  {searchTerm ? 'No users found' : 'No users available'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchTerm ? 'Try a different search term' : 'No users available to add'}
                </Text>
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
    backgroundColor: '#F0F4F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  primaryNavButton: {
    color: '#3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventDetails: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#065F46',
  },
  inactiveText: {
    color: '#374151',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  list: {
    marginTop: 8,
  },
  scannerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingUsersText: {
    fontSize: 14,
    color: '#6B7280',
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
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanPermissionsScreen;