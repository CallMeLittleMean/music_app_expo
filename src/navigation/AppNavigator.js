// src/navigation/AppNavigator.js
import React, { useState, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import LyricsScreen from '../screens/LyricsScreen';
import FavoriteScreen from '../screens/FavoriteScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import BrowseScreen from '../screens/BrowseScreen';
import BrowseDetailScreen from '../screens/BrowseDetailScreen';
import PlayerProvider from '../context/PlayerContext';
import MiniPlayer from '../components/MiniPlayer';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [currentRouteName, setCurrentRouteName] = useState('');
  const navRef = useRef(null);

  return (
    <NavigationContainer
      ref={navRef}
      onStateChange={() => {
        const route = navRef.current?.getCurrentRoute();
        setCurrentRouteName(route?.name || '');
      }}
    >
      <SafeAreaProvider>
        <PlayerProvider>
          <View style={{ flex: 1 }}>
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: '#000' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
                headerShown: false,
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Player" component={PlayerScreen} />
              <Stack.Screen name="Lyrics" component={LyricsScreen} />
              <Stack.Screen name="Favorite" component={FavoriteScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="PlaylistScreen" component={PlaylistScreen} />
              <Stack.Screen name="Browse" component={BrowseScreen} />
              <Stack.Screen name="BrowseDetail" component={BrowseDetailScreen} />
            </Stack.Navigator>
            <MiniPlayer currentRouteName={currentRouteName} />
          </View>
        </PlayerProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
