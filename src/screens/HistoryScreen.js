import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen({ route, navigation }) {
  const { history = [], songs = [] } = route.params || {};
  const insets = useSafeAreaInsets();

  // Map history to full song objects
  const historySongs = history
    .map(item => {
      const song = songs.find(s => s.id === item.songId);
      return song ? { ...song, playedAt: item.timestamp } : null;
    })
    .filter(Boolean);

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        const idx = songs.findIndex(s => s.id === item.id);
        navigation.navigate('Player', { song: item, songList: songs, index: idx });
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.number}>{index + 1}</Text>
      <Image source={item.cover} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          const idx = songs.findIndex(s => s.id === item.id);
          navigation.navigate('Player', { song: item, songList: songs, index: idx });
        }}
        style={styles.playBtn}
      >
        <Ionicons name="play" size={18} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch Sử Nghe Nhạc</Text>
        <View style={styles.backBtn} />
      </View>

      {/* List */}
      <FlatList
        data={historySongs}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Chưa có lịch sử nghe nhạc</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0f' },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffa500' },
  listContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginBottom: 10
  },
  number: { width: 28, color: '#aaa', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  cover: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 3 },
  artist: { fontSize: 13, color: '#bbb' },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8c3bff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#777', fontSize: 16, marginTop: 16 }
});
