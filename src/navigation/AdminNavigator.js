import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';
import DashboardScreen from '../screens/admin/DashboardScreen';
import BookingsAdminScreen from '../screens/admin/BookingsAdminScreen';
import StationManagementScreen from '../screens/admin/StationManagementScreen';
import SlotManagementScreen from '../screens/admin/SlotManagementScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'Station') iconName = focused ? 'cog' : 'cog-outline';
          else if (route.name === 'Slots') iconName = focused ? 'calendar-clock' : 'calendar';
          else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background, borderTopWidth: 0, elevation: 5 },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.buttonText,
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Tab.Screen name="Bookings" component={BookingsAdminScreen} options={{ tabBarIcon: ({ color, size }) => ( <Icon name="calendar-check" size={size} color={color} />),}}  />
      <Tab.Screen name="Slots" component={SlotManagementScreen} options={{ title: 'Slot Management', headerShown: false }} />
      {/* <Tab.Screen name="Station" component={StationManagementScreen} options={{ title: 'Station Management', headerShown: false }} /> */}
      <Tab.Screen name="Profile" component={AdminProfileScreen} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
};

export default AdminTabs;