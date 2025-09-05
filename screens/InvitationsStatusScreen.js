import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const InvitationStatus = () => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Sample events data
  const events = [
    { id: '1', name: 'Birthday Party', date: '2025-09-10' },
    { id: '2', name: 'Wedding Ceremony', date: '2025-10-05' },
    { id: '3', name: 'Company Conference', date: '2025-08-20' },
  ];

  // Sample invitation status data
  const invitationStatuses = [
    { id: '1', eventId: '1', name: 'John Doe', phone: '+255123456789', sentDate: '2025-07-15', status: 'delivered', deliveryDate: '2025-07-15', channel: 'both' },
    { id: '2', eventId: '1', name: 'Jane Smith', phone: '+255987654321', sentDate: '2025-07-15', status: 'failed', deliveryDate: null, channel: 'sms' },
    { id: '3', eventId: '1', name: 'Robert Johnson', phone: '+255555123456', sentDate: '2025-07-15', status: 'delivered', deliveryDate: '2025-07-15', channel: 'whatsapp' },
    { id: '4', eventId: '1', name: 'Sarah Williams', phone: '+255777888999', sentDate: '2025-07-15', status: 'pending', deliveryDate: null, channel: 'both' },
    { id: '5', eventId: '2', name: 'Michael Brown', phone: '+255444555666', sentDate: '2025-08-01', status: 'delivered', deliveryDate: '2025-08-01', channel: 'both' },
    { id: '6', eventId: '2', name: 'Emily Davis', phone: '+255222333444', sentDate: '2025-08-01', status: 'read', deliveryDate: '2025-08-01', channel: 'whatsapp' },
    { id: '7', eventId: '3', name: 'David Wilson', phone: '+255666777888', sentDate: '2025-07-10', status: 'delivered', deliveryDate: '2025-07-10', channel: 'sms' },
  ];

  // Filter statuses based on selected event, search term, and status filter
  const filteredStatuses = invitationStatuses.filter(status => {
    const matchesEvent = selectedEvent ? status.eventId === selectedEvent : true;
    const matchesSearch = status.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          status.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ? true : status.status === statusFilter;
    
    return matchesEvent && matchesSearch && matchesStatus;
  });

  // Get stats for the selected event
  const getStats = () => {
    const eventStatuses = selectedEvent 
      ? invitationStatuses.filter(status => status.eventId === selectedEvent)
      : invitationStatuses;
    
    const total = eventStatuses.length;
    const delivered = eventStatuses.filter(s => s.status === 'delivered' || s.status === 'read').length;
    const failed = eventStatuses.filter(s => s.status === 'failed').length;
    const pending = eventStatuses.filter(s => s.status === 'pending').length;
    
    return { total, delivered, failed, pending };
  };

  const stats = getStats();

  // Handle resend invitation
  const resendInvitation = (id) => {
    const guest = invitationStatuses.find(s => s.id === id);
    Alert.alert(
      'Resend Invitation',
      `Resend invitation to ${guest?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Resend',
          onPress: () => {
            Alert.alert('Success', `Invitation resent to ${guest?.name}`);
          }
        }
      ]
    );
  };

  // Handle delete status
  const deleteStatus = (id) => {
    const guest = invitationStatuses.find(s => s.id === id);
    Alert.alert(
      'Delete Status',
      `Are you sure you want to delete invitation status for ${guest?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Deleted', `Status record for ${guest?.name} has been deleted`);
          }
        }
      ]
    );
  };

  // Handle status update (simulated)
  const refreshStatuses = () => {
    setRefreshing(true);
    setTimeout(() => {
      Alert.alert('Refreshed', 'Statuses updated from messaging platforms');
      setRefreshing(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return '#10B981';
      case 'read': return '#8B5CF6';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'sms': return '#3B82F6';
      case 'whatsapp': return '#10B981';
      case 'both': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getChannelText = (channel) => {
    switch (channel) {
      case 'sms': return 'SMS';
      case 'whatsapp': return 'WhatsApp';
      case 'both': return 'Both';
      default: return channel;
    }
  };

  const renderStatusItem = ({ item }) => {
    const event = events.find(e => e.id === item.eventId);
    
    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.guestAvatar}>
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.guestInfo}>
            <Text style={styles.guestName}>{item.name}</Text>
            <Text style={styles.guestPhone}>{item.phone}</Text>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statusDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Event:</Text>
            <Text style={styles.detailValue}>{event?.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sent Date:</Text>
            <Text style={styles.detailValue}>{item.sentDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Channel:</Text>
            <View style={[styles.channelBadge, { backgroundColor: getChannelColor(item.channel) + '20' }]}>
              <Text style={[styles.channelText, { color: getChannelColor(item.channel) }]}>
                {getChannelText(item.channel)}
              </Text>
            </View>
          </View>
          {item.deliveryDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivered:</Text>
              <Text style={styles.detailValue}>{item.deliveryDate}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.resendButton]}
            onPress={() => resendInvitation(item.id)}
          >
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.resendButtonText}>Resend</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteStatus(item.id)}
          >
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Invitation Status</Text>
        <Text style={styles.headerSubtitle}>Track the delivery status of your event invitations</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Filters and Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filters and Statistics</Text>
          
          {/* Event Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Event</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEvent}
                onValueChange={setSelectedEvent}
                style={styles.picker}
              >
                <Picker.Item label="All Events" value="" />
                {events.map(event => (
                  <Picker.Item 
                    key={event.id} 
                    label={`${event.name} (${event.date})`} 
                    value={event.id} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Search */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Search Guests</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Name or phone number"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Filter by Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={statusFilter}
                onValueChange={setStatusFilter}
                style={styles.picker}
              >
                <Picker.Item label="All Statuses" value="all" />
                <Picker.Item label="Delivered" value="delivered" />
                <Picker.Item label="Read" value="read" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Failed" value="failed" />
              </Picker>
            </View>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshStatuses}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator color="#374151" size="small" />
            ) : (
              <Ionicons name="refresh" size={20} color="#374151" />
            )}
            <Text style={styles.refreshButtonText}>
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.totalStat]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Sent</Text>
            </View>
            <View style={[styles.statCard, styles.deliveredStat]}>
              <Text style={styles.statNumber}>{stats.delivered}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={[styles.statCard, styles.pendingStat]}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, styles.failedStat]}>
              <Text style={styles.statNumber}>{stats.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        </View>

        {/* Status List */}
        <View style={styles.statusListContainer}>
          <Text style={styles.sectionTitle}>
            Invitation Statuses {filteredStatuses.length > 0 ? `(${filteredStatuses.length})` : ''}
          </Text>
          
          {filteredStatuses.length > 0 ? (
            <FlatList
              data={filteredStatuses}
              keyExtractor={(item) => item.id}
              renderItem={renderStatusItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>
                No invitation statuses found matching your criteria.
              </Text>
            </View>
          )}
        </View>

        {/* Bulk Actions */}
        {filteredStatuses.length > 0 && (
          <View style={styles.bulkActions}>
            <Text style={styles.resultsText}>
              Showing {filteredStatuses.length} of {invitationStatuses.length} records
            </Text>
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.bulkButton, styles.exportButton]}>
                <Ionicons name="download" size={18} color="#FFFFFF" />
                <Text style={styles.bulkButtonText}>Export to CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkButton, styles.printButton]}>
                <Ionicons name="print" size={18} color="#FFFFFF" />
                <Text style={styles.bulkButtonText}>Print Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1F2937',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalStat: {
    backgroundColor: '#EFF6FF',
  },
  deliveredStat: {
    backgroundColor: '#ECFDF5',
  },
  pendingStat: {
    backgroundColor: '#FFFBEB',
  },
  failedStat: {
    backgroundColor: '#FEF2F2',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: {
    backgroundColor: '#EFF6FF',
  },
  totalStat: {
    backgroundColor: '#EFF6FF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: {
    backgroundColor: '#EFF6FF',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Colors for stats
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  totalStat: { backgroundColor: '#EFF6FF' },
  deliveredStat: { backgroundColor: '#ECFDF5' },
  pendingStat: { backgroundColor: '#FFFBEB' },
  failedStat: { backgroundColor: '#FEF2F2' },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusListContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  guestPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadgeContainer: {
    marginLeft: 'auto',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  channelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  channelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  resendButton: {
    backgroundColor: '#EFF6FF',
  },
  resendButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButton: {
    backgroundColor: '#3B82F6',
  },
  printButton: {
    backgroundColor: '#4B5563',
  },
  bulkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InvitationStatus;