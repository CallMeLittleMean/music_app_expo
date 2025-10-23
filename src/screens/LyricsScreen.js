import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, FlatList, TouchableOpacity, Animated, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerContext } from '../context/PlayerContext';
import { parseLRC, formatTime } from '../utils/helpers';
import { shapeOfYouLyrics } from '../../assets/lyrics/shapeOfYou';
import { havanaLyrics } from '../../assets/lyrics/havana';

// Map of lyrics by song ID or key
const lyricsMap = {
  shapeOfYou: shapeOfYouLyrics,
  havana: havanaLyrics,
  // Add more songs here as needed
};

// Optional fallback: static mapping of LRC asset modules for devices where text assets work
const lrcAssetMap = {
  shapeOfYou: require('../../assets/lyrics/Shape_OF_You.lrc'),
  havana: require('../../assets/lyrics/Havana.lrc'),
};

export default function LyricsScreen({ navigation }) {
  const { currentTrack, isPlaying, play, pause, next, previous, position, duration } = useContext(PlayerContext);
  const [lines, setLines] = useState([]); // {time, text}
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Load LRC whenever track changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      console.log('🎵 LyricsScreen - currentTrack:', currentTrack?.title, 'lyrics key:', currentTrack?.lyrics);
      if (!currentTrack?.lyrics) {
        console.log('⚠️ No lyrics key for this track');
        if (!cancelled) setLines([]);
        return;
      }

      // 1) If lyrics provided directly as a bundled asset module (e.g., require('...lrc') in songs.js)
      if (typeof currentTrack.lyrics !== 'string') {
        try {
          const asset = Asset.fromModule(currentTrack.lyrics);
          await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          if (uri) {
            const res = await fetch(uri);
            const text = await res.text();
            const clean = text.replace(/^\uFEFF/, '');
            console.log('🗂️ Direct module .lrc length:', clean.length);
            const parsed = parseLRC(clean);
            if (!cancelled) setLines(parsed);
            return;
          }
        } catch (e) {
          console.log('⚠️ Direct module LRC read error:', e?.message || e);
        }
      }

      // 2) Preferred: in-bundle JS string map entry
      const lyricsText = lyricsMap[currentTrack.lyrics];
      if (lyricsText && typeof lyricsText === 'string' && lyricsText.length > 0) {
        console.log('📝 Using JS lyrics, length:', lyricsText.length);
        const parsed = parseLRC(lyricsText);
        if (!cancelled) setLines(parsed);
        return;
      }

      // 3) Fallback: try reading .lrc asset by key mapping (works on many Android devices; may be 0B on some iOS)
      const mod = lrcAssetMap[currentTrack.lyrics];
      if (mod) {
        try {
          const asset = Asset.fromModule(mod);
          await asset.downloadAsync();
          const uri = asset.localUri || asset.uri;
          if (uri) {
            const res = await fetch(uri);
            const text = await res.text();
            const clean = text.replace(/^\uFEFF/, '');
            console.log('🗂️ Fallback .lrc length:', clean.length);
            const parsed = parseLRC(clean);
            if (!cancelled) setLines(parsed);
            return;
          }
        } catch (e) {
          console.log('⚠️ LRC fallback error:', e?.message || e);
        }
      }

      // 4) Give up
      console.log('⚠️ No lyrics available after fallbacks for key:', currentTrack.lyrics);
      if (!cancelled) setLines([]);
    };
    load();
    return () => { cancelled = true; };
  }, [currentTrack?.lyrics]);

  // compute active line from position
  useEffect(() => {
    if (!lines.length) return;
    const t = position;
    let idx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (t >= lines[i].time) idx = i; else break;
    }
    if (idx !== activeIndex) {
      setActiveIndex(idx);
      try {
        listRef.current?.scrollToIndex({ index: Math.max(0, idx - 3), animated: true });
      } catch (e) {
        // ignore scroll errors if index out of range
      }
    }
  }, [position, lines, activeIndex]);

  const renderItem = ({ item, index }) => {
    const active = index === activeIndex;
    return (
      <View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
        <Text style={[styles.lyric, active && styles.lyricActive]}>
          {item.text}
        </Text>
      </View>
    );
  };

  const keyExtractor = (item, i) => `${item.time}-${i}`;

  const progress = duration ? position / duration : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {currentTrack?.cover && (
        <ImageBackground source={currentTrack.cover} style={styles.bg} blurRadius={40} />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lyrics</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={lines}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 40 }}
          showsVerticalScrollIndicator={false}
        />
        {(!lines || lines.length === 0) && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ccc' }}>Chưa có lời bài hát cho bài này.</Text>
          </View>
        )}
      </View>

      {/* bottom controls */}
      <View style={styles.bottom}>
        <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack?.title}</Text>
        <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack?.artist}</Text>

        <View style={styles.progressRow}>
          <Text style={styles.time}>{formatTime(position)}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={previous}>
            <Ionicons name="play-skip-back" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.playBtn}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={next}>
            <Ionicons name="play-skip-forward" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0f' },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.9 },
  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  lyric: { color: 'rgba(255,255,255,0.7)', fontSize: 18, textAlign: 'center' },
  lyricActive: { color: '#fff', fontWeight: '700' },
  bottom: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 26 : 16, paddingTop: 6, backgroundColor: 'rgba(0,0,0,0.25)' },
  trackTitle: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  trackArtist: { color: '#ddd', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: '#9b6bff' },
  time: { width: 42, color: '#ccc', fontSize: 12, textAlign: 'center' },
  controls: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8c3bff', alignItems: 'center', justifyContent: 'center' },
});
