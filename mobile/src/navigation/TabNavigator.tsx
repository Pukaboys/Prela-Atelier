import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Typography } from '../constants/theme';
import { useCartStore } from '../store/cartStore';
import type { TabParamList } from '../types';

import HomeScreen from '../screens/HomeScreen';
import CollectionsScreen from '../screens/CollectionsScreen';
import CustomOrderScreen from '../screens/CustomOrderScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({
  label,
  focused,
  glyph,
  badgeCount,
}: {
  label: string;
  focused: boolean;
  glyph: string;
  badgeCount?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <View>
        <Text style={[styles.glyph, focused && styles.glyphActive]}>{glyph}</Text>
        {badgeCount != null && badgeCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  const totalItems = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0),
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" glyph="H" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Shop" glyph="S" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Bespoke"
        component={CustomOrderScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Bespoke" glyph="B" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Cart"
              glyph="C"
              focused={focused}
              badgeCount={totalItems}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" glyph="P" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  glyph: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: Typography.fontSans,
    fontWeight: '700',
  },
  glyphActive: {
    color: Colors.accent,
  },
  label: {
    fontSize: Typography.xs,
    fontFamily: Typography.fontSans,
    color: Colors.textMuted,
    letterSpacing: Typography.trackingWidest,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '700',
  },
});
