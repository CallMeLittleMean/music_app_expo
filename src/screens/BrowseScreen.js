import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { songs } from '../data/songs';

export default function BrowseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState('artists'); // artists, albums, genres

  // Group songs by artist
  const groupByArtist = () => {
    const grouped = {};
    songs.forEach(song => {
      if (!grouped[song.artist]) {
        grouped[song.artist] = {
          name: song.artist,
          songs: [],
          cover: song.cover
        };
      }
      grouped[song.artist].songs.push(song);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Group songs by album
  const groupByAlbum = () => {
    const grouped = {};
    songs.forEach(song => {
      const albumKey = song.album || 'Unknown Album';
      if (!grouped[albumKey]) {
        grouped[albumKey] = {
          name: albumKey,
          artist: song.artist,
          songs: [],
          cover: song.cover
        };
      }
      grouped[albumKey].songs.push(song);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Group songs by genre
  const groupByGenre = () => {
    const grouped = {};
    songs.forEach(song => {
      const genreKey = song.genre || 'Unknown Genre';
      if (!grouped[genreKey]) {
        grouped[genreKey] = {
          name: genreKey,
          songs: [],
          cover: song.cover
        };
      }
      grouped[genreKey].songs.push(song);
    });
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getData = () => {
    switch (selectedTab) {
      case 'artists':
        return groupByArtist();
      case 'albums':
        return groupByAlbum();
      case 'genres':
        return groupByGenre();
      default:
        return [];
    }
  };

  const handleItemPress = (item) => {
    const screenTitle = selectedTab === 'artists' ? 'Ca Sĩ' : 
                       selectedTab === 'albums' ? 'Album' : 'Thể Loại';
    
    navigation.navigate('BrowseDetail', {
      title: item.name,
      subtitle: item.artist || null,
      songs: item.songs,
      type: selectedTab,
      cover: item.cover
    });
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <Image source={item.cover} style={styles.cover} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {item.artist && selectedTab === 'albums' && (
            <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
          )}
          <Text style={styles.count}>{item.songs.length} bài hát</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#aaa" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thư Viện</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'artists' && styles.tabActive]}
          onPress={() => setSelectedTab('artists')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={selectedTab === 'artists' ? '#fff' : '#aaa'} 
          />
          <Text style={[styles.tabText, selectedTab === 'artists' && styles.tabTextActive]}>
            Ca Sĩ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'albums' && styles.tabActive]}
          onPress={() => setSelectedTab('albums')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="albums" 
            size={20} 
            color={selectedTab === 'albums' ? '#fff' : '#aaa'} 
          />
          <Text style={[styles.tabText, selectedTab === 'albums' && styles.tabTextActive]}>
            Album
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'genres' && styles.tabActive]}
          onPress={() => setSelectedTab('genres')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="musical-notes" 
            size={20} 
            color={selectedTab === 'genres' ? '#fff' : '#aaa'} 
          />
          <Text style={[styles.tabText, selectedTab === 'genres' && styles.tabTextActive]}>
            Thể Loại
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={getData()}
        keyExtractor={(item, index) => `${selectedTab}-${item.name}-${index}`}
        renderItem={renderItem}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9b6bff',
    flex: 1,
    textAlign: 'center'
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 8
  },
  tabActive: {
    backgroundColor: '#9b6bff'
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#aaa'
  },
  tabTextActive: {
    color: '#fff'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  cover: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12
  },
  info: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  artist: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 2
  },
  count: {
    fontSize: 13,
    color: '#888'
  }
});
