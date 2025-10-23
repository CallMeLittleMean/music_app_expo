import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  loadFavorites,
  saveFavorites,
  loadPlaylists,
  savePlaylists,
  loadHistory,
  saveHistory
} from '../services/storageService';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const insets = useSafeAreaInsets();

  // Playlist cá nhân
  const [playlists, setPlaylists] = useState([]); // [{ id, name, songs: [] }]
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [currentSongId, setCurrentSongId] = useState(null);

  // Lịch sử nghe nhạc
  const [history, setHistory] = useState([]); // [{ songId, timestamp }]

  // Thu gọn/mở rộng sections
  const [trendingExpanded, setTrendingExpanded] = useState(true);
  const [recommendExpanded, setRecommendExpanded] = useState(true);

  // Search modal
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  /* =========================================================
     🔹 TẢI DỮ LIỆU TỪ ASYNCSTORAGE
  ========================================================= */
  useEffect(() => {
    (async () => {
      const storedFavs = await loadFavorites();
      const storedPlaylists = await loadPlaylists();
      const storedHistory = await loadHistory();
      if (storedFavs) setFavorites(storedFavs);
      if (storedPlaylists) setPlaylists(storedPlaylists);
      if (storedHistory) setHistory(storedHistory);
    })();
  }, []);

  /* =========================================================
     🔹 CẬP NHẬT FAVORITE
  ========================================================= */
  const toggleFavorite = async (id) => {
    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    await saveFavorites(updated);
  };

  /* =========================================================
     🔹 CẬP NHẬT PLAYLIST
  ========================================================= */
  const addPlaylist = async () => {
    if (newPlaylistName.trim() === '') return;
    const updated = [
      ...playlists,
      { id: Date.now().toString(), name: newPlaylistName, songs: [] }
    ];
    setPlaylists(updated);
    await savePlaylists(updated);
    setNewPlaylistName('');
  };

  const addToPlaylist = async (playlistId, songId) => {
    const updated = playlists.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          songs: pl.songs.includes(songId)
            ? pl.songs.filter(id => id !== songId)
            : [...pl.songs, songId]
        };
      }
      return pl;
    });
    setPlaylists(updated);
    await savePlaylists(updated);
  };

  /* =========================================================
     🔹 LỊCH SỬ NGHE NHẠC
  ========================================================= */
  const addToHistory = async (songId) => {
    // Remove existing entry if present, then add to front
    const filtered = history.filter(item => item.songId !== songId);
    const updated = [{ songId, timestamp: Date.now() }, ...filtered].slice(0, 50); // Keep last 50
    setHistory(updated);
    await saveHistory(updated);
  };

  /* =========================================================
     🔹 GỢI Ý BÀI HÁT DỰA TRÊN LỊCH SỬ
  ========================================================= */
  const recommendedSongs = useMemo(() => {
    if (history.length === 0) return [];
    
    // Get recently played songs
    const recentSongIds = history.slice(0, 10).map(h => h.songId);
    const recentSongs = songs.filter(s => recentSongIds.includes(s.id));
    
    // Get artists from recent songs
    const recentArtists = [...new Set(recentSongs.map(s => s.artist))];
    
    // Find songs by same artists that haven't been played recently
    const sameSongs = songs.filter(s => 
      recentArtists.includes(s.artist) && !recentSongIds.includes(s.id)
    );
    
    // Also add random unplayed songs
    const unplayed = songs.filter(s => !recentSongIds.includes(s.id));
    
    // Combine and shuffle, limit to 5
    const combined = [...sameSongs, ...unplayed.slice(0, 3)];
    return combined.sort(() => Math.random() - 0.5).slice(0, 5);
  }, [history]);

  /* =========================================================
     🔹 TOP BÀI HÁT XU HƯỚNG (TRENDING)
  ========================================================= */
  const trendingSongs = useMemo(() => {
    // Calculate play count for each song from history
    const playCount = {};
    history.forEach(h => {
      playCount[h.songId] = (playCount[h.songId] || 0) + 1;
    });
    
    // Sort songs by play count
    const songsWithCount = songs.map(s => ({
      ...s,
      playCount: playCount[s.id] || 0
    }));
    
    // If no history, return first 5 songs as default trending
    if (history.length === 0) {
      return songs.slice(0, 5);
    }
    
    // Sort by play count descending, then take top 5
    return songsWithCount
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);
  }, [history]);

  /* =========================================================
     🔹 PLAYLIST ĐÃ NGHE GỦN ĐÂY
  ========================================================= */
  const recentPlaylists = useMemo(() => {
    if (playlists.length === 0 || history.length === 0) return [];
    
    // Get recent songs from history
    const recentSongIds = history.slice(0, 20).map(h => h.songId);
    
    // Calculate relevance score for each playlist based on recent songs
    const playlistScores = playlists.map(playlist => {
      const matchingSongs = playlist.songs.filter(songId => 
        recentSongIds.includes(songId)
      ).length;
      
      return {
        ...playlist,
        relevanceScore: matchingSongs,
        lastPlayed: Math.max(...playlist.songs
          .map(songId => {
            const historyItem = history.find(h => h.songId === songId);
            return historyItem ? historyItem.timestamp : 0;
          })
        )
      };
    });
    
    // Filter playlists that have at least one song in recent history
    // Sort by relevance score and last played time
    return playlistScores
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.lastPlayed - a.lastPlayed;
      })
      .slice(0, 5); // Show top 5 recent playlists
  }, [playlists, history]);

  /* =========================================================
     🔹 LỌC DANH SÁCH
  ========================================================= */
  const filtered = songs.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.artist.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const isFavorite = favorites.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          addToHistory(item.id); // Track history
          const index = filtered.findIndex(s => s.id === item.id);
          navigation.navigate('Player', { song: item, songList: filtered, index });
        }}
        activeOpacity={0.8}
      >
        <Image source={item.cover} style={styles.cover} />
        <View style={styles.middle}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.iconBtn}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#FF5A5F' : '#ddd'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setCurrentSongId(item.id); setModalVisible(true); }} style={styles.iconBtn}>
            <Ionicons name="musical-notes-outline" size={20} color="#ddd" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              addToHistory(item.id); // Track history
              const index = filtered.findIndex(s => s.id === item.id);
              navigation.navigate('Player', { song: item, songList: filtered, index });
            }}
            style={styles.playBtn}
          >
            <Ionicons name="play" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mean Music</Text>
        <TouchableOpacity 
          style={styles.searchBtn}
          onPress={() => setSearchModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#9b6bff" />
        </TouchableOpacity>
      </View>

      {/* Danh sách nhạc */}
      <FlatList
        data={songs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={styles.flatList}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy bài hát</Text>}
        ListHeaderComponent={
          recentPlaylists.length > 0 ? (
            <View style={styles.recentPlaylistsSection}>
              <View style={styles.sectionHeaderHome}>
                <Ionicons name="time" size={20} color="#9b6bff" />
                <Text style={styles.sectionTitleHome}>Playlist Gần Đây</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playlistHorizontalScroll}
              >
                {recentPlaylists.map(playlist => {
                  const songCount = playlist.songs?.length || 0;
                  // Get first 4 song covers for preview
                  const previewCovers = playlist.songs
                    .slice(0, 4)
                    .map(songId => songs.find(s => s.id === songId))
                    .filter(Boolean)
                    .map(s => s.cover);
                  
                  return (
                    <TouchableOpacity
                      key={playlist.id}
                      style={styles.playlistRecentCard}
                      onPress={() => {
                        // Navigate to playlist and play first song
                        const playlistSongs = playlist.songs
                          .map(id => songs.find(s => s.id === id))
                          .filter(Boolean);
                        
                        if (playlistSongs.length > 0) {
                          navigation.navigate('Player', {
                            song: playlistSongs[0],
                            songList: playlistSongs,
                            index: 0,
                            source: 'playlist',
                            playlistName: playlist.name,
                          });
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Playlist Cover Grid */}
                      <View style={styles.playlistCoverGrid}>
                        {previewCovers.length === 0 && (
                          <View style={styles.emptyPlaylistCover}>
                            <Ionicons name="musical-notes" size={40} color="#666" />
                          </View>
                        )}
                        {previewCovers.length === 1 && (
                          <Image source={previewCovers[0]} style={styles.singleCover} />
                        )}
                        {previewCovers.length >= 2 && (
                          <View style={styles.gridContainer}>
                            {previewCovers.slice(0, 4).map((cover, idx) => (
                              <Image 
                                key={idx} 
                                source={cover} 
                                style={styles.gridCover} 
                              />
                            ))}
                            {previewCovers.length < 4 && 
                              [...Array(4 - previewCovers.length)].map((_, idx) => (
                                <View key={`empty-${idx}`} style={styles.gridCoverEmpty}>
                                  <Ionicons name="musical-note" size={16} color="#444" />
                                </View>
                              ))
                            }
                          </View>
                        )}
                      </View>
                      
                      {/* Playlist Info */}
                      <View style={styles.playlistRecentInfo}>
                        <Text style={styles.playlistRecentName} numberOfLines={1}>
                          {playlist.name}
                        </Text>
                        <Text style={styles.playlistRecentCount}>
                          {songCount} bài hát
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null
        }
      />

      {/* Quick action buttons - Droplet shape container */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Favorite', { favorites, songs, setFavorites })}
        >
          <Ionicons name="heart" size={26} color="#FF5A5F" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('History', { history, songs })}
        >
          <Ionicons name="time-outline" size={26} color="#ffa500" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Browse')}
        >
          <Ionicons name="albums" size={26} color="#0dc974" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('PlaylistScreen', { playlists, setPlaylists })}
        >
          <Ionicons name="musical-notes" size={26} color="#9b6bff" />
        </TouchableOpacity>
      </View>

      {/* Search Modal with Trending & Recommendations */}
      <Modal visible={searchModalVisible} animationType="slide" transparent={false}>
        <View style={[styles.searchModalContainer, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.searchModalHeader}>
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.searchModalTitle}>Tìm Kiếm & Khám Phá</Text>
            <View style={{ width: 26 }} />
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#aaa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bài hát hoặc ca sĩ..."
              placeholderTextColor="#777"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchModalContent}
          >
            {/* Trending Section */}
            {trendingSongs.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => setTrendingExpanded(!trendingExpanded)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="flame" size={20} color="#ff6b35" />
                  <Text style={styles.sectionTitle}>Xu Hướng</Text>
                  <Ionicons 
                    name={trendingExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#aaa" 
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
                {trendingExpanded && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {trendingSongs.map((song, idx) => (
                      <TouchableOpacity
                        key={song.id}
                        style={styles.trendingCard}
                        onPress={() => {
                          addToHistory(song.id);
                          const index = songs.findIndex(s => s.id === song.id);
                          setSearchModalVisible(false);
                          navigation.navigate('Player', { song, songList: songs, index });
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.trendingBadge}>
                          <Text style={styles.trendingNumber}>#{idx + 1}</Text>
                        </View>
                        <Image source={song.cover} style={styles.trendingCover} />
                        <Text style={styles.trendingTitle} numberOfLines={1}>{song.title}</Text>
                        <Text style={styles.trendingArtist} numberOfLines={1}>{song.artist}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Recommended Section */}
            {recommendedSongs.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => setRecommendExpanded(!recommendExpanded)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bulb" size={20} color="#ffd93d" />
                  <Text style={styles.sectionTitle}>Gợi Ý Cho Bạn</Text>
                  <Ionicons 
                    name={recommendExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#aaa" 
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
                {recommendExpanded && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {recommendedSongs.map(song => (
                      <TouchableOpacity
                        key={song.id}
                        style={styles.recommendCard}
                        onPress={() => {
                          addToHistory(song.id);
                          const index = songs.findIndex(s => s.id === song.id);
                          setSearchModalVisible(false);
                          navigation.navigate('Player', { song, songList: songs, index });
                        }}
                        activeOpacity={0.8}
                      >
                        <Image source={song.cover} style={styles.recommendCover} />
                        <Text style={styles.recommendTitle} numberOfLines={1}>{song.title}</Text>
                        <Text style={styles.recommendArtist} numberOfLines={1}>{song.artist}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Search Results */}
            {query.length > 0 && (
              <View style={styles.searchResults}>
                <Text style={styles.searchResultsTitle}>
                  Kết quả tìm kiếm ({filtered.length})
                </Text>
                {filtered.map((item) => {
                  const isFavorite = favorites.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      onPress={() => {
                        addToHistory(item.id);
                        const index = filtered.findIndex(s => s.id === item.id);
                        setSearchModalVisible(false);
                        navigation.navigate('Player', { song: item, songList: filtered, index });
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={item.cover} style={styles.cover} />
                      <View style={styles.middle}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
                      </View>
                      <View style={styles.actions}>
                        <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.iconBtn}>
                          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color={isFavorite ? '#FF5A5F' : '#ddd'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            addToHistory(item.id);
                            const index = filtered.findIndex(s => s.id === item.id);
                            setSearchModalVisible(false);
                            navigation.navigate('Player', { song: item, songList: filtered, index });
                          }}
                          style={styles.playBtn}
                        >
                          <Ionicons name="play" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Modal playlist */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="musical-notes" size={24} color="#0dc974" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>
                  Thêm vào Playlist
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Danh sách playlist với ScrollView */}
            <ScrollView style={{ maxHeight: 250, marginBottom: 16 }} showsVerticalScrollIndicator={false}>
              {playlists.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Ionicons name="folder-open-outline" size={48} color="#444" />
                  <Text style={{ color: '#888', marginTop: 8, fontSize: 14 }}>Chưa có playlist nào</Text>
                </View>
              )}
              {playlists.map(pl => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistItem}
                  onPress={() => addToPlaylist(pl.id, currentSongId)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons 
                      name={pl.songs.includes(currentSongId) ? "checkmark-circle" : "albums-outline"} 
                      size={24} 
                      color={pl.songs.includes(currentSongId) ? "#0dc974" : "#9b6bff"} 
                      style={{ marginRight: 12 }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>{pl.name}</Text>
                      <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                        {pl.songs.length} bài hát
                      </Text>
                    </View>
                  </View>
                  {pl.songs.includes(currentSongId) && (
                    <View style={{ 
                      backgroundColor: 'rgba(13,201,116,0.15)', 
                      paddingHorizontal: 10, 
                      paddingVertical: 4, 
                      borderRadius: 12 
                    }}>
                      <Text style={{ color: '#0dc974', fontSize: 11, fontWeight: 'bold' }}>✓ Đã thêm</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 }} />

            {/* Tạo playlist mới */}
            <View>
              <Text style={{ color: '#9b6bff', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                TẠO PLAYLIST MỚI
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập tên playlist..."
                placeholderTextColor="#666"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
              <TouchableOpacity 
                onPress={addPlaylist} 
                style={{ 
                  backgroundColor: '#0dc974', 
                  paddingVertical: 12, 
                  paddingHorizontal: 20, 
                  borderRadius: 12, 
                  alignItems: 'center',
                  marginTop: 12,
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Tạo Playlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================
   🔸 STYLE GIỮ NGUYÊN
========================================================= */
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
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#9b6bff',
    flex: 1
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(155,107,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(155,107,255,0.3)'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 4,
    caretColor: '#fff'
  },
  flatList: { flex: 1 },
  listContainer: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 200 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 24, fontSize: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  cover: { width: 58, height: 58, borderRadius: 12, marginRight: 12 },
  middle: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  artist: { fontSize: 13, color: '#bbb' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#8c3bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4
  },
  quickActions: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    height: 70,
    backgroundColor: 'rgba(20,20,24,0.95)',
    borderRadius: 35,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(155,107,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: { 
    width: '88%', 
    maxHeight: '70%',
    backgroundColor: '#1a1a1f', 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1.5, 
    borderColor: 'rgba(155,107,255,0.3)',
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(155,107,255,0.3)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
    backgroundColor: 'rgba(20,20,24,0.8)',
    marginTop: 16,
    marginBottom: 10
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  // Trending & Recommended sections
  section: {
    marginBottom: 12,
    paddingHorizontal: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  horizontalScroll: {
    paddingRight: 16,
    gap: 12
  },
  // Trending cards
  trendingCard: {
    width: 140,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,53,0.3)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff6b35',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1
  },
  trendingNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff'
  },
  trendingCover: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%'
  },
  trendingArtist: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    width: '100%'
  },
  // Recommended cards
  recommendCard: {
    width: 140,
    backgroundColor: 'rgba(255,217,61,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,217,61,0.3)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#ffd93d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  recommendCover: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8
  },
  recommendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
    width: '100%'
  },
  recommendArtist: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    width: '100%'
  },
  // Search modal
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#0c0c0f'
  },
  searchModalHeader: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9b6bff',
    flex: 1,
    textAlign: 'center'
  },
  searchModalContent: {
    paddingBottom: 40
  },
  searchResults: {
    paddingHorizontal: 16,
    marginTop: 20
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12
  },
  // Recent Playlists on Home
  recentPlaylistsSection: {
    marginBottom: 20
  },
  sectionHeaderHome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  sectionTitleHome: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  playlistHorizontalScroll: {
    paddingRight: 16,
    gap: 12
  },
  playlistRecentCard: {
    width: 160,
    backgroundColor: 'rgba(155,107,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(155,107,255,0.3)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  playlistCoverGrid: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  emptyPlaylistCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  singleCover: {
    width: '100%',
    height: '100%'
  },
  gridContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  gridCover: {
    width: '50%',
    height: '50%'
  },
  gridCoverEmpty: {
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playlistRecentInfo: {
    gap: 4
  },
  playlistRecentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  playlistRecentCount: {
    fontSize: 13,
    color: '#aaa'
  }
});
