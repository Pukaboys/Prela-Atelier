import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../constants/theme';
import type { RootStackParamList } from '../types';

import TabNavigator from './TabNavigator';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmedScreen from '../screens/OrderConfirmedScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="OrderConfirmed"
          component={OrderConfirmedScreen}
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
