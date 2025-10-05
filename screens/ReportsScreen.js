import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform
} from "react-native";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import config from './config';

const EventReport = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute();
  const { id } = route.params;
  console.log("Fetching report for event ID:", id);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${config.BASE_URL}/api/events/reports/${id}`);
      setReport(res.data);
    } catch (err) {
      console.error("Error fetching report:", err);
      Alert.alert("Error", "Failed to fetch event report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleDownloadPDF = async () => {
    try {
      Alert.alert("Download", "Preparing your PDF report...");
      
      // For web or if you need to handle PDF differently in mobile
      if (Platform.OS === 'web') {
        const res = await axios.get(
          `${config.BASE_URL}/api/events/report/pdf/${id}`,
          { responseType: "blob" }
        );

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `event-report-${report.eventName}.pdf`);
        document.body.appendChild(link);
        link.click();
      } else {
        // For mobile - this would need proper implementation based on your backend
        // This is a placeholder for mobile PDF handling
        const pdfUrl = `${config.BASE_URL}/api/events/report/pdf/${id}`;
        Linking.openURL(pdfUrl);
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Icon name="sentiment-dissatisfied" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>No Report Available</Text>
          <Text style={styles.errorText}>
            Sorry, we couldn't find a report for this event.
          </Text>
        </View>
      </View>
    );
  }

  const StatCard = ({ title, value, iconName, color, borderColor }) => (
    <View style={[styles.statCard, { borderLeftColor: borderColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Icon name={iconName} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  const GuestStatBox = ({ title, value, backgroundColor }) => (
    <View style={[styles.guestStatBox, { backgroundColor }]}>
      <Text style={styles.guestStatTitle}>{title}</Text>
      <Text style={styles.guestStatValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{report.eventName} – Event Report</Text>
          <Text style={styles.subtitle}>Detailed analytics and insights for your event</Text>
        </View>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPDF}>
          <Icon name="download" size={20} color="#FFF" />
          <Text style={styles.downloadButtonText}>Download PDF Report</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Invited"
          value={report.totalInvited}
          iconName="people"
          color="#3B82F6"
          borderColor="#3B82F6"
        />
        <StatCard
          title="Checked In"
          value={report.totalCheckedIn}
          iconName="check-circle"
          color="#10B981"
          borderColor="#10B981"
        />
        <StatCard
          title="Attendance Rate"
          value={`${report.attendanceRate}%`}
          iconName="bar-chart"
          color="#8B5CF6"
          borderColor="#8B5CF6"
        />
        <StatCard
          title="Event Date"
          value={report.date}
          iconName="event"
          color="#F59E0B"
          borderColor="#F59E0B"
        />
      </View>

      <View style={styles.contentContainer}>
        {/* Guest Statistics */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="people-outline" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Guest Statistics</Text>
          </View>
          <View style={styles.guestStatsGrid}>
            <GuestStatBox
              title="Single Invitations"
              value={report.singleInvites}
              backgroundColor="#EFF6FF"
            />
            <GuestStatBox
              title="Double Invitations"
              value={report.doubleInvites}
              backgroundColor="#ECFDF5"
            />
            <GuestStatBox
              title="Single Checked-in"
              value={report.singleCheckedIn}
              backgroundColor="#F5F3FF"
            />
            <GuestStatBox
              title="Double (Partial)"
              value={report.doublePartial}
              backgroundColor="#FEF3C7"
            />
            <GuestStatBox
              title="Double (Full)"
              value={report.doubleFull}
              backgroundColor="#EEF2FF"
            />
          </View>
        </View>

        {/* Check-in Timeline */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="access-time" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Check-in Timeline</Text>
          </View>
          <View style={styles.timelineContainer}>
            {report.timeline.map((slot, idx) => (
              <View key={idx} style={styles.timelineRow}>
                <Text style={styles.timelineTime}>{slot.time}</Text>
                <Text style={styles.timelineCount}>{slot.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Guest List Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={20} color="#6366F1" />
            <Text style={styles.cardTitle}>Guest List Preview</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Name</Text>
              <Text style={styles.headerCell}>Type</Text>
              <Text style={styles.headerCell}>RSVP</Text>
              <Text style={styles.headerCell}>Status</Text>
            </View>
            {report.guestList.slice(0, 5).map((guest, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{guest.name}</Text>
                <View style={styles.tableCell}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{guest.type}</Text>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[
                    styles.statusBadge, 
                    guest.rsvp === 'Yes' ? styles.statusYes : styles.statusNo
                  ]}>
                    <Text style={[
                      styles.statusText,
                      guest.rsvp === 'Yes' ? styles.statusTextYes : styles.statusTextNo
                    ]}>
                      {guest.rsvp}
                    </Text>
                  </View>
                </View>
                <View style={styles.tableCell}>
                  <View style={[
                    styles.statusBadge, 
                    guest.status === 'Checked In' ? styles.statusCheckedIn : styles.statusPending
                  ]}>
                    <Text style={[
                      styles.statusText,
                      guest.status === 'Checked In' ? styles.statusTextCheckedIn : styles.statusTextPending
                    ]}>
                      {guest.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {report.guestList.length > 5 && (
            <Text style={styles.footerText}>
              Showing first 5 guests. Download the full report for complete list.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748B",
  },
  errorCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    margin: 16,
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  headerCard: {
    backgroundColor: "#FFF",
    margin: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: "#4F46E5",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  downloadButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    borderRadius: 10,
    padding: 8,
    marginRight: 12,
  },
  statTitle: {
    fontSize: 12,
    color: "#64748B",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginLeft: 8,
  },
  guestStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  guestStatBox: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  guestStatTitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  guestStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  timelineTime: {
    fontSize: 14,
    color: "#64748B",
  },
  timelineCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
    marginBottom: 8,
  },
  headerCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tableCell: {
    flex: 1,
  },
  typeBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 12,
    color: "#3B82F6",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusYes: {
    backgroundColor: "#ECFDF5",
  },
  statusNo: {
    backgroundColor: "#FEF2F2",
  },
  statusCheckedIn: {
    backgroundColor: "#ECFDF5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusTextYes: {
    color: "#059669",
  },
  statusTextNo: {
    color: "#DC2626",
  },
  statusTextCheckedIn: {
    color: "#059669",
  },
  statusTextPending: {
    color: "#D97706",
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
  },
});

export default EventReport;