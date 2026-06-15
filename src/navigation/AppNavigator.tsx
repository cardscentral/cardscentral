import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { CardsListScreen } from '../screens/CardsListScreen';
import { CardDetailScreen } from '../screens/CardDetailScreen';
import { AddCardScreen } from '../screens/AddCardScreen';
import { EditCardScreen } from '../screens/EditCardScreen';
import { ScanBarcodeScreen } from '../screens/ScanBarcodeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5E5',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Cards"
        component={CardsListScreen}
        options={{
          title: t('myCards'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="loyalty" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerShadowVisible: false,
          headerTintColor: '#007AFF',
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddCard"
          component={AddCardScreen}
          options={{ title: 'Add Card' }}
        />
        <Stack.Screen
          name="EditCard"
          component={EditCardScreen}
          options={{ title: 'Edit Card' }}
        />
        <Stack.Screen
          name="CardDetail"
          component={CardDetailScreen}
          options={{ title: 'Card Details', headerTransparent: true, headerTintColor: '#FFFFFF' }}
        />
        <Stack.Screen
          name="ScanBarcode"
          component={ScanBarcodeScreen}
          options={{ title: 'Scan Barcode', headerTransparent: true, headerTintColor: '#FFFFFF' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
