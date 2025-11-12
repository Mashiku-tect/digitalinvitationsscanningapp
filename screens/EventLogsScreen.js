import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const CheckInLogsScreen = ({route}) => {
  const [events, setEvents] = useState([]); // Changed from event to events (array)
  const [currentEvent, setCurrentEvent] = useState(null); // Added for specific event
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState(null);
  const [checkInLogs, setCheckInLogs] = useState([]);

  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
    }
    fetchEvents();
  }, [route.params]);

  useEffect(() => {
    if (eventId) {
      fetchEventLogs();
    }
  }, [eventId]);

  // When events are loaded, find the specific event
  useEffect(() => {
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(event => event._id === eventId || event.id === eventId);
      setCurrentEvent(foundEvent);
    }
  }, [events, eventId]);

  //fetch check-in logs
  const fetchEventLogs = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await axios.get(
        `${config.BASE_URL}/api/events/checkins/${eventId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCheckInLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch event logs:", err);
    }
  };

  //fetch event data
  const fetchEvents = async () => {
    setIsLoading(true); 
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await axios.get(
        `${config.BASE_URL}/api/getallevents/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      //console.log("events", res.data.events);
      setEvents(res.data.events);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8 }}>Loading check-in data...</Text>
      </View>
    );
  }

  if (!currentEvent) {
    return (
      <View style={styles.center}>
        <Text>No event data found for this ID</Text>
      </View>
    );
  }

  // Calculate check-in rate for the specific event
  const checkInRate = Math.round(
    (currentEvent.scannedGuestsCount / currentEvent.totalGuests) * 100
  );

  const renderLog = ({ item }) => {
    let statusMessage = "";
    if (item.type === "single") {
      statusMessage =
        item.remainednumberofscans === 0 ? "✅ Completed" : "⏳ Not yet scanned";
    } else if (item.type === "double") {
      if (item.remainednumberofscans === 1) {
        statusMessage = "🔁 1 scan remaining";
      } else if (item.remainednumberofscans === 0) {
        statusMessage = "✅ Completed";
      } else {
        statusMessage = `⏳ ${item.remainednumberofscans} scans remaining`;
      }
    }

    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.firstName?.[0] || 'G'}
              {item.lastName?.[0] || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.logName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.logPhone}>{item.phone}</Text>
          </View>
          <View style={{ marginLeft: "auto", alignItems: "flex-end" }}>
            <Text style={styles.logTime}>
              {item.scannedAt ? new Date(item.scannedAt).toLocaleString() : 'No scan time'}
            </Text>
            <Text style={styles.logScannedBy}>
              Scanned by: {item.scannedByUser?.firstName || 'Unknown'}{" "}
              {item.scannedByUser?.lastName || ''}
            </Text>
          </View>
        </View>
        <View style={styles.logFooter}>
          <Text style={styles.logType}>
            Type: {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Unknown'}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              statusMessage.includes("Completed")
                ? styles.completed
                : statusMessage.includes("remaining")
                ? styles.pending
                : styles.neutral,
            ]}
          >
            {statusMessage}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={checkInLogs}
        keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
        renderItem={renderLog}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <Text style={styles.eventTitle}>{currentEvent.eventName}</Text>
              <Text style={styles.eventSubtitle}>
                {new Date(currentEvent.eventDate).toDateString()} • {currentEvent.location}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Attendees</Text>
                <Text style={styles.statValue}>{currentEvent.totalGuests}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Check-ins Recorded</Text>
                <Text style={styles.statValue}>
                  {currentEvent.scannedGuestsCount || 0}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Check-in Rate</Text>
                <Text style={styles.statValue}>{checkInRate}%</Text>
              </View>
            </View>

            <Text style={styles.logsTitle}>Check-in Logs</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#6b7280', marginTop: 20 }}>No check-in logs found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  eventSubtitle: { marginTop: 4, fontSize: 14, color: "#6b7280" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", margin: 8 },
  statCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: "center",
  },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  logsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginVertical: 8,
    color: "#111827",
  },
  logCard: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logHeader: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: "#1d4ed8", fontWeight: "bold" },
  logName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  logPhone: { fontSize: 12, color: "#6b7280" },
  logTime: { fontSize: 12, fontWeight: "600", color: "#111827" },
  logScannedBy: { fontSize: 12, color: "#6b7280" },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
  logType: { fontSize: 12, color: "#6b7280" },
  statusBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    fontWeight: "600",
  },
  completed: { backgroundColor: "#dcfce7", color: "#166534" },
  pending: { backgroundColor: "#fef9c3", color: "#854d0e" },
  neutral: { backgroundColor: "#f3f4f6", color: "#374151" },
});

export default CheckInLogsScreen;