import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';

const CheckInLogsScreen = ({route}) => {
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState(null);
  const [checkInLogs, setCheckInLogs] = useState([]);

  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
      //try to log event Id
     //console.log('Scanning for Event ID:', route.params.eventId);
    }
    //fetchEventLogs();
    fetchEvents();
  }, [route.params]);

  useEffect(() => {
  if (eventId) {
    fetchEventLogs();
  }
}, [eventId]);

//console.log("Event ID for logs:", eventId);

  //fetch check-in logs
   const fetchEventLogs = async () => {
      try {
        const token= await AsyncStorage.getItem("authToken"); // replace with secure storage
        const res = await axios.get(
          `${config.BASE_URL}/api/events/checkins/${eventId}`, // sample event id
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  //console.log("Event logs response:", res.data);
        //setEvent(res.data);
        setCheckInLogs(res.data || []);
        //console.log("Check-in logs:", checkInLogs);
        
      } catch (err) {
        console.error("Failed to fetch event:", err);
      } finally {
        setIsLoading(false);
      }
    };

  //fetch event data
  const fetchEvents = async () => {
    setIsLoading(true); 
    try {
      const token= await AsyncStorage.getItem("authToken"); // replace with secure storage
      const res = await axios.get(
        `${config.BASE_URL}/api/getallevents/`, // sample event id
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEvent(res.data.events);
    } catch (err) {
      console.error("Failed to fetch event:", err);
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

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>No event data found</Text>
      </View>
    );
  }

  const checkInRate = Math.round(
    (event[0].scannedGuestsCount / event[0].totalGuests) * 100
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
              {item.firstName[0]}
              {item.lastName[0]}
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
              {new Date(item.scannedAt).toLocaleString()}
            </Text>
            <Text style={styles.logScannedBy}>
              Scanned by: {item.scannedByUser.firstName}{" "}
              {item.scannedByUser.lastName}
            </Text>
          </View>
        </View>
        <View style={styles.logFooter}>
          <Text style={styles.logType}>
            Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
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
    keyExtractor={(item) => item.id.toString()}
    renderItem={renderLog}
    contentContainerStyle={{ paddingBottom: 40 }}
    ListHeaderComponent={
      <>
        <View style={styles.headerCard}>
          <Text style={styles.eventTitle}>{event[0].eventName}</Text>
          <Text style={styles.eventSubtitle}>
            {new Date(event[0].eventDate).toDateString()} • {event[0].location}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Attendees</Text>
            <Text style={styles.statValue}>{event[0].totalGuests}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Check-ins Recorded</Text>
            <Text style={styles.statValue}>
              {event[0].scannedGuestsCount || 0}
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
    alignItems: "center",
  },
  statLabel: { fontSize: 12, color: "#6b7280" },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  logsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  logCard: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    elevation: 1,
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
  },
  completed: { backgroundColor: "#dcfce7", color: "#166534" },
  pending: { backgroundColor: "#fef9c3", color: "#854d0e" },
  neutral: { backgroundColor: "#f3f4f6", color: "#374151" },
});

export default CheckInLogsScreen;
