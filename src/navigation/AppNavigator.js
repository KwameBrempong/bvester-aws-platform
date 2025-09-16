import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthContext } from '../context/AuthContext';
import { useTheme, getEnhancedColor } from '../components/ui';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import WellfoundHomepage from '../screens/WellfoundHomepage';
import SimpleHomepage from '../screens/SimpleHomepage';
import AboutScreen from '../screens/AboutScreen';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import RecordsScreen from '../screens/sme/RecordsScreen';
import AnalysisScreen from '../screens/sme/AnalysisScreen';
import InvestmentSearchScreen from '../screens/investor/InvestmentSearchScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AddTransactionScreen from '../screens/records/AddTransactionScreen';
import BusinessListingScreen from '../screens/sme/BusinessListingScreen';
import BusinessSettingsScreen from '../screens/business/BusinessSettingsScreen';

// New screens
import BusinessDetailScreen from '../screens/investment/BusinessDetailScreen';
import InvestmentHistoryScreen from '../screens/investment/InvestmentHistoryScreen';
import InvestorProfileScreen from '../screens/investment/InvestorProfileScreen';
import MessagingScreen from '../screens/messaging/MessagingScreen';
import ConversationsListScreen from '../screens/messaging/ConversationsListScreen';

// CMS and Content screens
import CMSAdminScreen from '../screens/admin/CMSAdminScreen';
import BusinessToolsScreen from '../screens/tools/BusinessToolsScreen';
import GrowthResourcesScreen from '../screens/resources/GrowthResourcesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Homepage"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Homepage" component={SimpleHomepage} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function SMEStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SMETabs" component={SMETabNavigator} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="BusinessListing" component={BusinessListingScreen} />
      <Stack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
      <Stack.Screen name="InvestorProfile" component={InvestorProfileScreen} />
      <Stack.Screen name="BusinessTools" component={BusinessToolsScreen} />
      <Stack.Screen name="GrowthResources" component={GrowthResourcesScreen} />
      <Stack.Screen name="CMSAdmin" component={CMSAdminScreen} />
      <Stack.Screen name="Notifications" component={ConversationsListScreen} />
      <Stack.Screen name="InvestmentSearch" component={InvestmentSearchScreen} />
      <Stack.Screen name="InvestmentDashboard" component={InvestmentHistoryScreen} />
    </Stack.Navigator>
  );
}

function SMETabNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Records') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Analysis') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Records" component={RecordsScreen} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Messages" component={ConversationsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function InvestorStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InvestorTabs" component={InvestorTabNavigator} />
      <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <Stack.Screen name="InvestmentHistory" component={InvestmentHistoryScreen} />
      <Stack.Screen name="InvestorProfile" component={InvestorProfileScreen} />
      <Stack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <Stack.Screen name="Messaging" component={MessagingScreen} />
      <Stack.Screen name="BusinessTools" component={BusinessToolsScreen} />
      <Stack.Screen name="GrowthResources" component={GrowthResourcesScreen} />
      <Stack.Screen name="CMSAdmin" component={CMSAdminScreen} />
      <Stack.Screen name="Notifications" component={ConversationsListScreen} />
      <Stack.Screen name="InvestmentSearch" component={InvestmentSearchScreen} />
      <Stack.Screen name="InvestmentDashboard" component={InvestmentHistoryScreen} />
    </Stack.Navigator>
  );
}

function InvestorTabNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Portfolio') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 68
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Search" component={InvestmentSearchScreen} />
      <Tab.Screen name="Portfolio" component={InvestmentHistoryScreen} />
      <Tab.Screen name="Messages" component={ConversationsListScreen} />
      <Tab.Screen name="Profile" component={InvestorProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, userRole, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <AuthStack />;
  }

  return userRole === 'SME_OWNER' ? <SMEStackNavigator /> : <InvestorStackNavigator />;
}