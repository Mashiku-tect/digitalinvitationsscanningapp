import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import config from './config'; // Import config for API base URL
import AsyncStorage from '@react-native-async-storage/async-storage'; // Make sure to import AsyncStorage

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: {
      week: 0,
      month: 0,
      year: 0
    },
    completionRate: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    cancellationRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch dashboard statistics
      const statsResponse = await axios.get(`${config.BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (statsResponse.data.success) {
        setStats(statsResponse.data);
      }

      // Fetch recent activity
      const activityResponse = await axios.get(`${config.BASE_URL}/api/dashboard/recent-activity`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await fetchDashboardData();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusFromFlags = (activity) => {
    if (activity.cancelled) return 'Cancelled';
    if (activity.completed) return 'Completed';
    if (activity.active) return 'Upcoming';
    return 'Inactive';
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return styles.upcomingBadge;
      case 'completed':
        return styles.completedBadge;
      case 'cancelled':
        return styles.cancelledBadge;
      case 'inactive':
      default:
        return styles.inactiveBadge;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Stats Card Component
  const StatCard = ({ title, value, subtitle, icon, borderColor }) => (
    <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
      <View style={styles.statHeader}>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: `${borderColor}20` }]}>
          {icon}
        </View>
      </View>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  // Recent Activity Item
  const renderActivityItem = ({ item }) => {
    const status = getStatusFromFlags(item);
    return (
      <View style={styles.activityItem}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{item.eventName}</Text>
          <Text style={styles.activityDate}>{formatDate(item.eventDate)}</Text>
        </View>
        <View style={styles.activityMeta}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.revenueText}>{formatCurrency(item.revenue)}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading dashboard data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Event Dashboard</Text>
          <Text style={styles.headerSubtitle}>Overview of your digital invitation events</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Events"
            value={stats.totalEvents.toString()}
            subtitle="All events created"
            borderColor="#3B82F6"
            icon={
              <Text style={[styles.icon, { color: '#3B82F6' }]}>📅</Text>
            }
          />

          <StatCard
            title="Active Events"
            value={stats.activeEvents.toString()}
            subtitle="Waiting for completion"
            borderColor="#EAB308"
            icon={
              <Text style={[styles.icon, { color: '#EAB308' }]}>⏰</Text>
            }
          />

          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle="Events successfully completed"
            borderColor="#10B981"
            icon={
              <Text style={[styles.icon, { color: '#10B981' }]}>✅</Text>
            }
          />

          <StatCard
            title="Cancellation Rate"
            value={`${stats.cancellationRate}%`}
            subtitle="Events cancelled by users"
            borderColor="#EF4444"
            icon={
              <Text style={[styles.icon, { color: '#EF4444' }]}>❌</Text>
            }
          />
        </View>

        {/* Revenue and Completed Events Row */}
        <View style={styles.middleRow}>
          {/* Revenue Card */}
          <View style={[styles.card, styles.revenueCard]}>
            <Text style={styles.cardTitle}>Revenue Overview</Text>
            
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <View style={[styles.revenueIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.revenueIconText, { color: '#1D4ED8' }]}>💰</Text>
                </View>
                <View>
                  <Text style={styles.revenueLabel}>Total Revenue</Text>
                  <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
                </View>
              </View>

              <View style={styles.revenueItem}>
                <View style={[styles.revenueIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.revenueIconText, { color: '#D97706' }]}>⏳</Text>
                </View>
                <View>
                  <Text style={styles.revenueLabel}>Pending Payments</Text>
                  <Text style={styles.revenueValue}>{formatCurrency(stats.pendingPayments)}</Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${stats.totalRevenue + stats.pendingPayments > 0 
                        ? (stats.totalRevenue / (stats.totalRevenue + stats.pendingPayments)) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Collected</Text>
                <Text style={styles.progressLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Completed Events Card */}
          <View style={[styles.card, styles.completedCard]}>
            <Text style={styles.cardTitle}>Completed Events</Text>
            
            <View style={styles.completedList}>
              <View style={styles.completedItem}>
                <Text style={styles.completedLabel}>This Week</Text>
                <Text style={styles.completedValue}>{stats.completedEvents.week}</Text>
              </View>
              
              <View style={styles.completedItem}>
                <Text style={styles.completedLabel}>This Month</Text>
                <Text style={styles.completedValue}>{stats.completedEvents.month}</Text>
              </View>
              
              <View style={styles.completedItem}>
                <Text style={styles.completedLabel}>This Year</Text>
                <Text style={styles.completedValue}>{stats.completedEvents.year}</Text>
              </View>
            </View>

            {/* Progress Visualization */}
            <View style={styles.completedProgress}>
              <View style={styles.completedProgressBar}>
                <View 
                  style={[
                    styles.completedProgressWeek,
                    { 
                      width: `${stats.completedEvents.month > 0 
                        ? (stats.completedEvents.week / stats.completedEvents.month) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.completedProgressMonth,
                    { 
                      width: `${stats.completedEvents.month > 0 
                        ? ((stats.completedEvents.month - stats.completedEvents.week) / stats.completedEvents.month) * 100 
                        : 0}%` 
                    }
                  ]} 
                />
              </View>
              <View style={styles.completedProgressLabels}>
                <Text style={styles.completedProgressLabel}>Week</Text>
                <Text style={styles.completedProgressLabel}>Month</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.card, styles.activityCard]}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          
          {recentActivity.length > 0 ? (
            <FlatList
              data={recentActivity}
              renderItem={renderActivityItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No recent activity found</Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  statsGrid: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  statHeader: {
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
  icon: {
    fontSize: 20,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  middleRow: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  revenueCard: {
    marginBottom: 16,
  },
  completedCard: {
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  revenueIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  revenueIconText: {
    fontSize: 16,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedList: {
    marginBottom: 20,
  },
  completedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  completedLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  completedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  completedProgress: {
    marginTop: 8,
  },
  completedProgressBar: {
    height: 6,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  completedProgressWeek: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  completedProgressMonth: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  completedProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  completedProgressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  upcomingBadge: {
    backgroundColor: '#FEF3C7',
  },
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },
  inactiveBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default Dashboard;