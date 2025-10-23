import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BrowseDetailScreen({ route, navigation }) {
  const { title, subtitle, songs, type, cover } = route.params;
  const insets = useSafeAreaInsets();

  const handlePlaySong = (song, index) => {
    navigation.navigate('Player', {
      song,
      songList: songs,
      index,
      source: type,
      playlistName: title
    });
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    navigation.navigate('Player', {
      song: songs[0],
      songList: songs,
      index: 0,
      source: type,
      playlistName: title
    });
  };

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    navigation.navigate('Player', {
      song: shuffled[0],
      songList: shuffled,
      index: 0,
      source: type,
      playlistName: title,
      shuffled: true
    });
  };

  const renderSongItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => handlePlaySong(item, index)}
      activeOpacity={0.8}
    >
      <Text style={styles.songNumber}>{index + 1}</Text>
      <Image source={item.cover} style={styles.songCover} />
      <View style={styles.songInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {type === 'albums' ? item.artist : item.album || 'Unknown Album'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handlePlaySong(item, index)}
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
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Cover and Info */}
      <View style={styles.coverSection}>
        <Image source={cover} style={styles.coverImage} />
        <View style={styles.coverInfo}>
          <Text style={styles.coverTitle} numberOfLines={2}>{title}</Text>
          {subtitle && <Text style={styles.coverSubtitle}>{subtitle}</Text>}
          <Text style={styles.songCount}>{songs.length} bài hát</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, styles.playAllBtn]}
          onPress={handlePlayAll}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={24} color="#fff" />
          <Text style={styles.controlBtnText}>Phát tất cả</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.shuffleBtn]}
          onPress={handleShuffle}
          activeOpacity={0.8}
        >
          <Ionicons name="shuffle" size={24} color="#fff" />
          <Text style={styles.controlBtnText}>Ngẫu nhiên</Text>
        </TouchableOpacity>
      </View>

      {/* Song List */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderSongItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0f'
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#9b6bff'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2
  },
  coverSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  coverInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  coverTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8
  },
  coverSubtitle: {
    fontSize: 15,
    color: '#bbb',
    marginBottom: 8
  },
  songCount: {
    fontSize: 14,
    color: '#888'
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  controlBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  playAllBtn: {
    backgroundColor: '#9b6bff'
  },
  shuffleBtn: {
    backgroundColor: '#ff6b35'
  },
  controlBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 12
  },
  songNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
    width: 24,
    textAlign: 'center'
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 8
  },
  songInfo: {
    flex: 1
  },
  songTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  songArtist: {
    fontSize: 13,
    color: '#aaa'
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#9b6bff',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
