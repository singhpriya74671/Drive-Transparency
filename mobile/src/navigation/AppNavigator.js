import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View } from "react-native";

import HomeScreen        from "../screens/HomeScreen";
import DashboardScreen   from "../screens/DashboardScreen";
import VehicleInputScreen from "../screens/VehicleInputScreen";

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home:      { active: "🏠", inactive: "🏠" },
  Dashboard: { active: "📊", inactive: "📊" },
  Check:     { active: "🔍", inactive: "🔍" },
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {TAB_ICONS[name]?.active || "•"}
    </Text>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: "#0f172a" },
        headerTintColor:  "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: "DriveTransparency" }} />
    </Stack.Navigator>
  );
}

function CheckStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: "#0f172a" },
        headerTintColor:  "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="VehicleInput" component={VehicleInputScreen} options={{ title: "Vehicle Check" }} />
      <Stack.Screen name="Dashboard"    component={DashboardScreen}    options={{ title: "Health Report" }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0f172a",
            borderTopColor:  "#1e293b",
            paddingBottom:   8,
            paddingTop:      4,
            height:          60,
          },
          tabBarActiveTintColor:   "#6366f1",
          tabBarInactiveTintColor: "#4b5563",
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Home"      component={HomeStack}    options={{ tabBarLabel: "Home" }} />
        <Tab.Screen name="Check"     component={CheckStack}   options={{ tabBarLabel: "Check" }} />
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "Report" }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
