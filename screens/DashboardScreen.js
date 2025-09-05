import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const DashboardScreen = () => {
  // Example data — replace with backend fetch later
  const stats = {
    totalEvents: 25,
    activeEvents: 4,
    completedThisWeek: 6,
    completedThisMonth: 18,
    completedThisYear: 25,
    completionRate: '72%',
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Total Events</Text>
          <Text style={styles.cardValue}>{stats.totalEvents}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Active Events</Text>
          <Text style={styles.cardValue}>{stats.activeEvents}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Completed This Week</Text>
          <Text style={styles.cardValue}>{stats.completedThisWeek}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Completed This Month</Text>
          <Text style={styles.cardValue}>{stats.completedThisMonth}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Completed This Year</Text>
          <Text style={styles.cardValue}>{stats.completedThisYear}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Event Completion Rate</Text>
          <Text style={styles.cardValue}>{stats.completionRate}</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Scan Event</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonsContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
