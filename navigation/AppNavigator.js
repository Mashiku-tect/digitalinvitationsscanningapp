import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import ScannerScreen from '../screens/ScannerScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ReportsScreen from '../screens/ReportsScreen';
//import GenerateCards from '../screens/GenerateCards';
import SettingsScreen from '../screens/SettingsScreen';
import CreateEventScreen from '../screens/CreateEventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import EventLogsScreen from '../screens/EventLogsScreen'; 
import DashboardScreen from '../screens/DashboardScreen';
//import InvitationsStatusScreen from '../screens/GenerateCards';
import EditEventScreen from '../screens/EditEventScreen';
import InvitationsScreen from '../screens/InvitationsScreen';

import AddUserScreen from '../screens/AddUserScreen';
import EditUserScreen from '../screens/EditUserScreen';

import ScanPermissionsScreen from '../screens/ScanPermissionScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Bottom Tabs (main daily actions)
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
           if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Create Events') iconName = 'create';
          else if (route.name === 'Events') iconName = 'calendar';
          else if (route.name === 'Profile') iconName = 'person';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Create Events" component={CreateEventScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      
    </Tab.Navigator>
  );
}

// Home Stack (for screens pushed on top of tabs)
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen 
        name="HomeTabs" 
        component={BottomTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="EventLogs" component={EventLogsScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      
      <Stack.Screen name="ScanPermissions" component={ScanPermissionsScreen} />
      {/* <Stack.Screen name="GenerateCards" component={GenerateCards} /> */}
      {/* <Stack.Screen name="InvitationsStatus" component={InvitationsStatusScreen} /> */}
    </Stack.Navigator>
  );
}

//User Management Stack
function UserManagementStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Users" component={UserManagementScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="EditUser" component={EditUserScreen} />
    </Stack.Navigator>
  );
}

// Drawer Navigator (main app navigation)
export default function AppNavigator() {
  return (
    <Drawer.Navigator >
      {/* Home drawer item → wraps tabs + stack */}
      <Drawer.Screen 
        name="Home" 
        component={HomeStack}  // <-- Important: use HomeStack, not BottomTabs
        options={{ drawerIcon: ({color, size}) => <Ionicons name="home" size={size} color={color}/> }}
      />

      {/* Boss/Admin only screens */}
      <Drawer.Screen 
        name="User Management" 
        component={UserManagementStack} 
        options={{ drawerIcon: ({color, size}) => <Ionicons name="people" size={size} color={color}/> }}
      />
      
      <Drawer.Screen 
        name="Send Invitations" 
        component={InvitationsScreen} 
        options={{ drawerIcon: ({color, size}) => <Ionicons name="send" size={size} color={color}/> }}
      />
     
      
    </Drawer.Navigator>
  );
}
