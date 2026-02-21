import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Shuffle, Clock } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 88,
          paddingTop: 12,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#a78bfa',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Decide',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                borderRadius: 12,
                padding: 8,
              }}
            >
              <Shuffle size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                borderRadius: 12,
                padding: 8,
              }}
            >
              <Clock size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
