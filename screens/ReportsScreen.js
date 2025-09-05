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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const ReportsScreen = () => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [events, setEvents] = useState([]);
  const [reportData, setReportData] = useState(null);

  // Mock event data
  useEffect(() => {
    const mockEvents = [
      { id: '1', name: 'Tech Conference 2024', date: '2024-06-15' },
      { id: '2', name: 'Annual Gala Dinner', date: '2024-07-20' },
      { id: '3', name: 'Product Launch Event', date: '2024-08-05' },
      { id: '4', name: 'Company Retreat', date: '2024-09-12' },
    ];
    setEvents(mockEvents);
  }, []);

  // Mock report data
  useEffect(() => {
    if (selectedEvent) {
      setLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        const mockReport = {
          eventName: events.find(e => e.id === selectedEvent)?.name || 'Event',
          totalGuests: 150,
          attendedGuests: 120,
          notAttendedGuests: 30,
          totalRevenue: 12500,
          totalCost: 8500,
          netProfit: 4000,
          guests: [
            { id: 1, name: 'John Smith', status: 'Attended', ticketType: 'VIP' },
            { id: 2, name: 'Emily Johnson', status: 'Attended', ticketType: 'Standard' },
            { id: 3, name: 'Michael Brown', status: 'Not Attended', ticketType: 'Standard' },
            { id: 4, name: 'Sarah Davis', status: 'Attended', ticketType: 'VIP' },
            { id: 5, name: 'Robert Wilson', status: 'Not Attended', ticketType: 'Standard' },
            { id: 6, name: 'Jennifer Miller', status: 'Attended', ticketType: 'Standard' },
            { id: 7, name: 'William Taylor', status: 'Attended', ticketType: 'VIP' },
            { id: 8, name: 'Linda Anderson', status: 'Attended', ticketType: 'Standard' },
          ]
        };
        setReportData(mockReport);
        setLoading(false);
      }, 1000);
    }
  }, [selectedEvent]);

  const generatePDF = async () => {
    if (!reportData) return;
    
    setGeneratingPDF(true);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Event Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #3B82F6; margin-bottom: 10px; }
            .company-info { margin-bottom: 20px; font-size: 14px; color: #666; }
            .event-title { font-size: 22px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .summary-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 23%; text-align: center; }
            .summary-title { font-size: 14px; color: #666; }
            .summary-value { font-size: 18px; font-weight: bold; margin-top: 5px; }
            .profit { color: #10B981; }
            .loss { color: #EF4444; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f5f5f5; }
            .attended { color: #10B981; }
            .not-attended { color: #EF4444; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">EVENTPRO</div>
            <div class="company-info">
              123 Business Avenue, Suite 456<br>
              New York, NY 10001<br>
              Phone: (555) 123-4567 | Email: info@eventpro.com
            </div>
          </div>
          
          <div class="event-title">Event Report: ${reportData.eventName}</div>
          
          <div class="summary">
            <div class="summary-box">
              <div class="summary-title">Total Guests</div>
              <div class="summary-value">${reportData.totalGuests}</div>
            </div>
            <div class="summary-box">
              <div class="summary-title">Attended</div>
              <div class="summary-value">${reportData.attendedGuests}</div>
            </div>
            <div class="summary-box">
              <div class="summary-title">Not Attended</div>
              <div class="summary-value">${reportData.notAttendedGuests}</div>
            </div>
            <div class="summary-box">
              <div class="summary-title">Net ${reportData.netProfit >= 0 ? 'Profit' : 'Loss'}</div>
              <div class="summary-value ${reportData.netProfit >= 0 ? 'profit' : 'loss'}">
                $${Math.abs(reportData.netProfit).toLocaleString()}
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Status</th>
                <th>Ticket Type</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.guests.map(guest => `
                <tr>
                  <td>${guest.name}</td>
                  <td class="${guest.status === 'Attended' ? 'attended' : 'not-attended'}">${guest.status}</td>
                  <td>${guest.ticketType}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            Report generated on ${new Date().toLocaleDateString()} | EventPro Management System
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        // On Android, use a file viewer
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (permissions.granted) {
          const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            `EventReport_${reportData.eventName.replace(/\s+/g, '_')}_${new Date().getTime()}`,
            'application/pdf'
          );
          
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await FileSystem.StorageAccessFramework.writeAsStringAsync(
            destinationUri,
            base64,
            { encoding: FileSystem.EncodingType.Base64 }
          );
          
          Alert.alert('Success', 'PDF saved to your device');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Event Reports</Text>
        <Text style={styles.headerSubtitle}>Generate detailed event reports</Text>
      </View>

      {/* Event Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Event</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedEvent}
            onValueChange={(value) => setSelectedEvent(value)}
            style={styles.picker}
          >
            <Picker.Item label="Choose an event..." value="" />
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading report data...</Text>
        </View>
      ) : reportData ? (
        <ScrollView style={styles.reportContainer}>
          {/* Report Header */}
          <View style={styles.reportHeader}>
            <Text style={styles.eventName}>{reportData.eventName}</Text>
            <Text style={styles.reportDate}>
              Report generated on {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Guests</Text>
                <Text style={styles.summaryValue}>{reportData.totalGuests}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Attended</Text>
                <Text style={[styles.summaryValue, styles.attendedText]}>
                  {reportData.attendedGuests}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Not Attended</Text>
                <Text style={[styles.summaryValue, styles.notAttendedText]}>
                  {reportData.notAttendedGuests}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Attendance Rate</Text>
                <Text style={styles.summaryValue}>
                  {((reportData.attendedGuests / reportData.totalGuests) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Revenue</Text>
                <Text style={styles.summaryValue}>
                  ${reportData.totalRevenue.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Cost</Text>
                <Text style={styles.summaryValue}>
                  ${reportData.totalCost.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.netCard]}>
                <Text style={styles.summaryTitle}>Net Profit/Loss</Text>
                <Text style={[
                  styles.summaryValue,
                  reportData.netProfit >= 0 ? styles.profitText : styles.lossText
                ]}>
                  {reportData.netProfit >= 0 ? '+' : '-'}${Math.abs(reportData.netProfit).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Guest List */}
          <View style={styles.guestSection}>
            <Text style={styles.sectionTitle}>Guest List</Text>
            <View style={styles.guestList}>
              {reportData.guests.map(guest => (
                <View key={guest.id} style={styles.guestItem}>
                  <View style={styles.guestInfo}>
                    <Text style={styles.guestName}>{guest.name}</Text>
                    <Text style={styles.guestType}>{guest.ticketType}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    guest.status === 'Attended' ? styles.attendedBadge : styles.notAttendedBadge
                  ]}>
                    <Text style={styles.statusText}>{guest.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity 
            style={[styles.downloadButton, generatingPDF && styles.disabledButton]}
            onPress={generatePDF}
            disabled={generatingPDF}
          >
            {generatingPDF ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.downloadButtonText}>Download PDF Report</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="stats-chart" size={64} color="#D1D5DB" />
          <Text style={styles.placeholderText}>
            Select an event to view its report
          </Text>
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  reportContainer: {
    flex: 1,
    padding: 16,
  },
  reportHeader: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  reportDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  netCard: {
    width: '100%',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  attendedText: {
    color: '#10B981',
  },
  notAttendedText: {
    color: '#EF4444',
  },
  profitText: {
    color: '#10B981',
  },
  lossText: {
    color: '#EF4444',
  },
  guestSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  guestList: {
    marginTop: 12,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  guestType: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attendedBadge: {
    backgroundColor: '#ECFDF5',
  },
  notAttendedBadge: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ReportsScreen;