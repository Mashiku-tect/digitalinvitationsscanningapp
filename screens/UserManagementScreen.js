import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import config from './config'; // Import config for API base URL
//import AsyncStorage from '@react-native-async-storage/async-storage';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigation = useNavigation();

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${config.BASE_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDelete = async (userId, userName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.delete(`${config.BASE_URL}/api/users/delete/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              Alert.alert('Success', response.data.message);
              setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            } catch (error) {
              console.error('Error deleting user:', error);
              const errorMessage = error.response?.data?.message || 'Failed to delete user. Please try again.';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadge = (status) => {
    const statusConfig = {
      active: { backgroundColor: '#DCFCE7', color: '#166534' },
      Pending: { backgroundColor: '#FEF9C3', color: '#854D0E' },
      Suspended: { backgroundColor: '#FEE2E2', color: '#991B1B' }
    };

    const config = statusConfig[status] || { backgroundColor: '#F3F4F6', color: '#374151' };

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}>
        <Text style={[styles.statusText, { color: config.color }]}>{status}</Text>
      </View>
    );
  };

  const StatCard = ({ title, value, subtitle, iconName, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Icon name={iconName} size={24} color={color} />
        </View>
      </View>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Image 
          source={require('../assets/user.png')} 
          style={styles.avatar}
          defaultSource={require('../assets/user.png')}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.userRole}>{item.role}</Text>
        </View>
      </View>
      
      <View style={styles.userContact}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userPhone}>{item.phoneNumber}</Text>
      </View>
      
      <View style={styles.userStatus}>
        {statusBadge(item.status)}
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditUser', { userId: item.id })}
        >
          <Icon name="edit" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDelete(item.id, `${item.firstName} ${item.lastName}`)}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage all users in the system</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddUser')}
        >
          <Icon name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add New User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={users.length.toString()}
            subtitle="All users in system"
            iconName="people"
            color="#3B82F6"
          />
          
          <StatCard
            title="Active Users"
            value={users.filter(user => user.status === 'active').length.toString()}
            subtitle="Currently active"
            iconName="check-circle"
            color="#10B981"
          />
          
          <StatCard
            title="Pending Users"
            value={users.filter(user => user.status === 'Pending').length.toString()}
            subtitle="Awaiting activation"
            iconName="schedule"
            color="#EAB308"
          />
          
          <StatCard
            title="Suspended"
            value={users.filter(user => user.status === 'Suspended').length.toString()}
            subtitle="Temporarily disabled"
            iconName="block"
            color="#EF4444"
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Users</Text>
            <Text style={styles.userCount}>{filteredUsers.length} users</Text>
          </View>

          {filteredUsers.length > 0 ? (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search-off" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                {searchTerm ? 'Try adjusting your search terms' : 'No users in the system'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statIcon: {
    padding: 8,
    borderRadius: 8,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  usersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userInfo: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  userContact: {
    flex: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  userStatus: {
    flex: 1,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default UserManagementScreen;