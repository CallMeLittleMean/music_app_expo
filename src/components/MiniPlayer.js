import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PlayerContext } from '../context/PlayerContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MiniPlayer({ currentRouteName: propRouteName }) {
  const { currentTrack, isPlaying, play, pause, next, previous, playlist, currentIndex } = useContext(PlayerContext);
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const routeName = propRouteName ?? nav.getState()?.routes?.[nav.getState().index]?.name;

  // hide on Player or Lyrics screen
  if (routeName === 'Player' || routeName === 'Lyrics') return null;
  if (!currentTrack) return null;

  const onPress = () => {
    nav.navigate('Player', { song: currentTrack, songList: playlist, index: currentIndex });
  };

  return (
    <TouchableOpacity style={[styles.container, { bottom: (insets?.bottom ?? 0) > 0 ? insets.bottom + 100 : (Platform.OS === 'ios' ? 110 : 105) }]} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.info} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
      </View>

      <View style={styles.controlsRow} pointerEvents="box-none">
        <TouchableOpacity onPress={previous} style={styles.iconBtn}>
          <Ionicons name={'play-skip-back'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.iconBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.iconBtn}>
          <Ionicons name={'play-skip-forward'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // raise the mini player above quick actions with droplet shape
  container: { 
    position: 'absolute', 
    left: 8, 
    right: 8, 
    height: 68, 
    backgroundColor: '#111', 
    borderRadius: 34,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    borderWidth: 1.5, 
    borderColor: 'rgba(155,107,255,0.25)',
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6
  },
  info: { flex: 1, paddingRight: 8, justifyContent: 'center' },
  title: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 2 },
  artist: { color: '#aaa', fontSize: 12 },
  controlsRow: { width: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 6 },
});
