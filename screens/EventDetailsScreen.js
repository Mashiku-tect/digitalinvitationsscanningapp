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
  FlatList,
  Modal,
  TextInput
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

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [updating, setUpdating] = useState(false);
  
  // New states for scan permissions management
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

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

  // Fetch scan permissions and tenants
  const fetchScanPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(`${config.BASE_URL}/api/events/${eventId}/scan-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setScanners(response.data.scanners || []);
      
      // Also fetch all available tenants
      const tenantsResponse = await axios.get(`${config.BASE_URL}/api/users/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTenants(tenantsResponse.data.tenants || []);
      
      // Filter out tenants who are already scanners
      const scannerIds = response.data.scanners.map(scanner => scanner.tenant_id);
      const available = tenantsResponse.data.tenants.filter(tenant => 
        !scannerIds.includes(tenant.id)
      );
      setAvailableTenants(available);
      
    } catch (error) {
      console.error('Error fetching scan permissions:', error);
      Alert.alert('Error', 'Failed to load scanner permissions');
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Open permission management modal
  const openPermissionModal = async () => {
    setShowPermissionModal(true);
    await fetchScanPermissions();
  };

  // Add tenant as scanner
  const addScanner = async (tenantId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: tenantId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh the lists
      await fetchScanPermissions();
      Alert.alert('Success', 'Tenant added as scanner successfully!');
    } catch (error) {
      console.error('Error adding scanner:', error);
      Alert.alert('Error', 'Failed to add tenant as scanner');
    }
  };

  // Remove tenant from scanners
  const removeScanner = async (scannerId) => {
    Alert.alert(
      'Remove Scanner',
      'Are you sure you want to remove this tenant\'s scan permission?',
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
              const token = await AsyncStorage.getItem('authToken');
              await axios.delete(`${config.BASE_URL}/api/events/${eventId}/scan-permissions/${scannerId}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              // Refresh the lists
              await fetchScanPermissions();
              Alert.alert('Success', 'Scan permission removed successfully!');
            } catch (error) {
              console.error('Error removing scanner:', error);
              Alert.alert('Error', 'Failed to remove scan permission');
            }
          }
        }
      ]
    );
  };

  // Cancel event function
  const cancelEvent = async () => {
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Cancel Event',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const token = await AsyncStorage.getItem('authToken');
              const response = await axios.put(
                `${config.BASE_URL}/api/events/cancel/${eventId}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );
              
              // Update the event state with cancelled status
              setEvent({ ...event, active: false, cancelled: true });
              Alert.alert('Success', 'Event cancelled successfully!');
            } catch (error) {
              console.error('Error cancelling event:', error);
              Alert.alert('Error', 'Failed to cancel event');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
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

  const viewReport = () => {
    navigation.navigate('Reports', { 
      id: eventId,
    });
  };

  const manageScanners = () => {
    navigation.navigate('ScanPermissions', { eventId });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGuests = guests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(guests.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Get page numbers to display (max 5 at a time)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
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
      <Text style={styles.guestCell}>{(currentPage - 1) * itemsPerPage + index + 1}</Text>
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

  const pageNumbers = getPageNumbers();

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
            {/* Manage Scanners Button */}
            <TouchableOpacity
              onPress={manageScanners}
              style={[styles.actionButton, styles.scannerButton]}
            >
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Manage Scanners</Text>
            </TouchableOpacity>

            {/* View Report Button */}
            <TouchableOpacity
              onPress={viewReport}
              style={[styles.actionButton, styles.reportButton]}
            >
              <Ionicons name="document-text" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>View Report</Text>
            </TouchableOpacity>

            {event.active && !event.cancelled && (
              <>
                {/* Cancel Event Button */}
                <TouchableOpacity
                  onPress={cancelEvent}
                  disabled={updating}
                  style={[styles.actionButton, styles.cancelButton, updating && styles.disabledButton]}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Cancel Event</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Mark as Completed Button */}
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
              </>
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
              event.cancelled ? styles.cancelledBadge : 
              event.active ? styles.upcomingBadge : styles.completedBadge
            ]}>
              <Text style={[
                styles.statusText,
                event.cancelled ? styles.cancelledText : 
                event.active ? styles.upcomingText : styles.completedText
              ]}>
                {event.cancelled ? 'Cancelled' : event.active ? 'Upcoming' : 'Completed'}
              </Text>
            </View>
          </View>

          {/* Cancelled Event Notice */}
          {event.cancelled && (
            <View style={styles.cancelledNotice}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <View style={styles.cancelledTextContainer}>
                <Text style={styles.cancelledTitle}>Event Cancelled</Text>
                <Text style={styles.cancelledMessage}>This event has been cancelled and is no longer active.</Text>
              </View>
            </View>
          )}

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
              <>
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
                    data={currentGuests}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderGuestItem}
                    scrollEnabled={false}
                  />
                </View>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationContainer}>
                    <Text style={styles.paginationInfo}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, guests.length)} of {guests.length} Records
                    </Text>
                    <View style={styles.paginationControls}>
                      <TouchableOpacity
                        onPress={goToPreviousPage}
                        disabled={currentPage === 1}
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                          Previous
                        </Text>
                      </TouchableOpacity>
                      
                      {pageNumbers.map((page) => (
                        <TouchableOpacity
                          key={page}
                          onPress={() => paginate(page)}
                          style={[
                            styles.paginationButton,
                            currentPage === page ? styles.paginationButtonActive : styles.paginationButtonInactive
                          ]}
                        >
                          <Text style={[
                            styles.paginationButtonText,
                            currentPage === page ? styles.paginationButtonTextActive : styles.paginationButtonTextInactive
                          ]}>
                            {page}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      
                      <TouchableOpacity
                        onPress={goToNextPage}
                        disabled={currentPage === totalPages}
                        style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                      >
                        <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                          Next
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noGuestsBox}>
                <Text style={styles.noGuestsText}>No guests added yet.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Scan Permissions Modal */}
      <Modal
        visible={showPermissionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Scan Permissions</Text>
              <TouchableOpacity 
                onPress={() => setShowPermissionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loadingPermissions ? (
              <View style={styles.loadingPermissions}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingPermissionsText}>Loading permissions...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {/* Current Scanners */}
                <View style={styles.scannerSection}>
                  <Text style={styles.sectionTitle}>Current Scanners</Text>
                  {scanners.length > 0 ? (
                    scanners.map((scanner) => (
                      <View key={scanner.id} style={styles.scannerItem}>
                        <View style={styles.scannerInfo}>
                          <Text style={styles.scannerName}>
                            {scanner.tenant?.firstName} {scanner.tenant?.lastName}
                          </Text>
                          <Text style={styles.scannerEmail}>{scanner.tenant?.email}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeScanner(scanner.id)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noScannersText}>No scanners assigned yet.</Text>
                  )}
                </View>

                {/* Add New Scanner */}
                <View style={styles.scannerSection}>
                  <Text style={styles.sectionTitle}>Add Scanner</Text>
                  {availableTenants.length > 0 ? (
                    availableTenants.map((tenant) => (
                      <View key={tenant.id} style={styles.scannerItem}>
                        <View style={styles.scannerInfo}>
                          <Text style={styles.scannerName}>
                            {tenant.firstName} {tenant.lastName}
                          </Text>
                          <Text style={styles.scannerEmail}>{tenant.email}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => addScanner(tenant.id)}
                          style={styles.addButton}
                        >
                          <Text style={styles.addButtonText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noScannersText}>No available tenants to add.</Text>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    justifyContent: 'flex-end',
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
  },
  scannerButton: {
    backgroundColor: '#EA580C', // Orange color
  },
  reportButton: {
    backgroundColor: '#10B981', // Green color
  },
  cancelButton: {
    backgroundColor: '#EAB308', // Yellow color
  },
  completeButton: {
    backgroundColor: '#8B5CF6', // Purple color
  },
  editButton: {
    backgroundColor: '#3B82F6', // Blue color
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Red color
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
  cancelledNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  cancelledTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  cancelledMessage: {
    fontSize: 14,
    color: '#DC2626',
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
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
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
  cancelledText: {
    color: '#DC2626',
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
    marginBottom: 16,
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
  paginationContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paginationButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  paginationButtonInactive: {
    backgroundColor: '#FFFFFF',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationButtonTextActive: {
    color: '#FFFFFF',
  },
  paginationButtonTextInactive: {
    color: '#374151',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  loadingPermissions: {
    padding: 40,
    alignItems: 'center',
  },
  loadingPermissionsText: {
    marginTop: 12,
    color: '#6B7280',
  },
  scannerSection: {
    marginBottom: 24,
  },
  scannerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  scannerInfo: {
    flex: 1,
  },
  scannerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  scannerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  noScannersText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default EventDetails;