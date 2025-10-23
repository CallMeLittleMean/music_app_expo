import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { songs } from '../data/songs';
import { Ionicons } from '@expo/vector-icons';
import { savePlaylists, loadPlaylists, loadHistory } from '../services/storageService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlaylistScreen({ route, navigation }) {
  const { playlists: initialPlaylists = [], setPlaylists } = route.params || {};
  const insets = useSafeAreaInsets();

  const [localPlaylists, setLocalPlaylists] = useState(initialPlaylists);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  
  // Create playlist modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [createStep, setCreateStep] = useState(1); // 1: name, 2: choose songs or empty
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  // Add songs to existing playlist modal
  const [addSongsModalVisible, setAddSongsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Load playlists từ AsyncStorage khi mở màn
  useEffect(() => {
    const fetchPlaylists = async () => {
      const stored = await loadPlaylists();
      if (stored && stored.length > 0) {
        setLocalPlaylists(stored);
        if (typeof setPlaylists === 'function') setPlaylists(stored);
      }
    };
    fetchPlaylists();
  }, []);

  // ✅ Load history for song selection
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await loadHistory();
      setHistoryData(history || []);
    };
    fetchHistory();
  }, []);

  // ✅ Đồng bộ khi playlists thay đổi từ cha
  useEffect(() => {
    setLocalPlaylists(initialPlaylists);
    if (selectedPlaylist) {
      const updated = initialPlaylists.find(pl => pl.id === selectedPlaylist.id);
      setSelectedPlaylist(updated || null);
    }
  }, [initialPlaylists]);

  // ✅ Lưu playlists mỗi khi localPlaylists thay đổi
  useEffect(() => {
    if (localPlaylists) savePlaylists(localPlaylists);
  }, [localPlaylists]);

  // 🗑 Xóa bài hát trong playlist
  const handleDeleteSong = (playlistId, songId) => {
    Alert.alert(
      'Xóa bài hát',
      'Bạn có chắc muốn xóa bài hát này khỏi playlist?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setLocalPlaylists(prevLocal => {
              const updated = prevLocal.map(pl =>
                pl.id === playlistId
                  ? { ...pl, songs: pl.songs.filter(id => id !== songId) }
                  : pl
              );
              const newSelected = updated.find(pl => pl.id === playlistId) || null;
              setSelectedPlaylist(newSelected);
              if (typeof setPlaylists === 'function') setPlaylists(updated);
              return updated;
            });
          },
        },
      ]
    );
  };

  // 🗑 Xóa cả playlist
  const handleDeletePlaylist = (playlistId) => {
    Alert.alert(
      'Xóa playlist',
      'Bạn có chắc muốn xóa playlist này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setLocalPlaylists(prevLocal => {
              const updated = prevLocal.filter(pl => pl.id !== playlistId);
              if (selectedPlaylist?.id === playlistId) {
                setSelectedPlaylist(null);
              }
              if (typeof setPlaylists === 'function') setPlaylists(updated);
              return updated;
            });
          },
        },
      ]
    );
  };

  // ➕ Create new playlist
  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên playlist');
      return;
    }

    const newPlaylist = {
      id: Date.now().toString(),
      name: playlistName.trim(),
      songs: selectedSongs, // Array of song IDs
    };

    setLocalPlaylists(prevLocal => {
      const updated = [...prevLocal, newPlaylist];
      if (typeof setPlaylists === 'function') setPlaylists(updated);
      return updated;
    });

    // Reset modal
    setCreateModalVisible(false);
    setPlaylistName('');
    setCreateStep(1);
    setSelectedSongs([]);
    
    Alert.alert('Thành công', `Đã tạo playlist "${newPlaylist.name}"`);
  };

  // Toggle song selection
  const toggleSongSelection = (songId) => {
    setSelectedSongs(prev => {
      if (prev.includes(songId)) {
        return prev.filter(id => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  // Create empty playlist
  const handleCreateEmpty = () => {
    setSelectedSongs([]);
    handleCreatePlaylist();
  };

  // Open create modal
  const openCreateModal = () => {
    setPlaylistName('');
    setSelectedSongs([]);
    setCreateStep(1);
    setCreateModalVisible(true);
  };

  // ➕ Add songs to existing playlist
  const openAddSongsModal = () => {
    if (!selectedPlaylist) return;
    setSelectedSongs([...selectedPlaylist.songs]); // Pre-select existing songs
    setSearchQuery('');
    setAddSongsModalVisible(true);
  };

  const handleAddSongsToPlaylist = () => {
    if (!selectedPlaylist) return;

    setLocalPlaylists(prevLocal => {
      const updated = prevLocal.map(pl => {
        if (pl.id === selectedPlaylist.id) {
          return { ...pl, songs: selectedSongs };
        }
        return pl;
      });
      
      const newSelected = updated.find(pl => pl.id === selectedPlaylist.id);
      setSelectedPlaylist(newSelected || null);
      if (typeof setPlaylists === 'function') setPlaylists(updated);
      return updated;
    });

    setAddSongsModalVisible(false);
    Alert.alert('Thành công', 'Đã cập nhật playlist');
  };

  // 🎵 Khi chọn bài hát trong playlist — chỉ phát danh sách của playlist đó
  const handlePlaySongInPlaylist = (song) => {
    if (!selectedPlaylist || !selectedPlaylist.songs) return;

    const playlistSongs = selectedPlaylist.songs
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    const index = playlistSongs.findIndex(s => s.id === song.id);

    navigation.navigate('Player', {
      song,
      songList: playlistSongs, // 👈 chỉ danh sách bài hát trong playlist
      index, // 👈 thêm index để PlayerScreen biết vị trí bài hát
      source: 'playlist',
      playlistName: selectedPlaylist.name,
    });
  };

  // 🎵 Phát toàn bộ playlist từ đầu
  const handlePlayAll = () => {
    if (!selectedPlaylist || !selectedPlaylist.songs || selectedPlaylist.songs.length === 0) return;

    const playlistSongs = selectedPlaylist.songs
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    navigation.navigate('Player', {
      song: playlistSongs[0],
      songList: playlistSongs,
      index: 0,
      source: 'playlist',
      playlistName: selectedPlaylist.name,
    });
  };

  // 🔀 Phát playlist theo chế độ ngẫu nhiên
  const handleShuffle = () => {
    if (!selectedPlaylist || !selectedPlaylist.songs || selectedPlaylist.songs.length === 0) return;

    const playlistSongs = selectedPlaylist.songs
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    // Shuffle the playlist
    const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);

    navigation.navigate('Player', {
      song: shuffled[0],
      songList: shuffled,
      index: 0,
      source: 'playlist',
      playlistName: selectedPlaylist.name,
      shuffled: true, // Đánh dấu đã shuffle
    });
  };

  // 🎵 Phát playlist từ danh sách (không cần vào trong)
  const handlePlayPlaylist = (playlist) => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      Alert.alert('Thông báo', 'Playlist này chưa có bài hát nào');
      return;
    }

    const playlistSongs = playlist.songs
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    navigation.navigate('Player', {
      song: playlistSongs[0],
      songList: playlistSongs,
      index: 0,
      source: 'playlist',
      playlistName: playlist.name,
    });
  };

  // 📂 Giao diện từng playlist
  const renderPlaylistItem = ({ item }) => {
    const songCount = item.songs?.length || 0;
    
    return (
      <View style={styles.playlistCard}>
        <TouchableOpacity
          style={styles.playlistMain}
          onPress={() => {
            const latest = localPlaylists.find(pl => pl.id === item.id) || item;
            setSelectedPlaylist(latest);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.playlistIcon}>
            <Ionicons name="musical-notes" size={24} color="#9b6bff" />
          </View>
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.playlistCount}>{songCount} bài hát</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => handlePlayPlaylist(item)} 
          style={styles.playlistPlayBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={36} color="#9b6bff" />
        </TouchableOpacity>
      </View>
    );
  };

  // 🎵 Giao diện từng bài trong playlist
  const renderSongItem = ({ item }) => {
    const song = songs.find(s => s.id === item);
    if (!song) return null;

    return (
      <TouchableOpacity
        style={styles.songItem}
        onPress={() => handlePlaySongInPlaylist(song)}
      >
        <Image source={song.cover} style={styles.songImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{song.title}</Text>
          <Text style={{ color: '#aaa', fontSize: 14 }}>{song.artist}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteSong(selectedPlaylist.id, song.id)}>
          <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (selectedPlaylist) setSelectedPlaylist(null);
            else navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedPlaylist ? selectedPlaylist.name : 'Playlists'}
        </Text>

        {selectedPlaylist && (
          <TouchableOpacity 
            onPress={() => handleDeletePlaylist(selectedPlaylist.id)} 
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
          </TouchableOpacity>
        )}
        {!selectedPlaylist && (
          <TouchableOpacity 
            onPress={openCreateModal} 
            style={styles.createButton}
          >
            <Ionicons name="add-circle" size={28} color="#9b6bff" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📜 Giao diện hiển thị */}
      {selectedPlaylist ? (
        <>
          {/* 🎵 Nút Play All, Shuffle và Add Songs */}
          <View style={styles.playlistControls}>
            {selectedPlaylist.songs && selectedPlaylist.songs.length > 0 && (
              <>
                <TouchableOpacity 
                  style={[styles.controlButton, styles.playAllButton]} 
                  onPress={handlePlayAll}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle" size={24} color="#fff" />
                  <Text style={styles.controlButtonText}>Phát tất cả</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, styles.shuffleButton]} 
                  onPress={handleShuffle}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shuffle" size={24} color="#fff" />
                  <Text style={styles.controlButtonText}>Ngẫu nhiên</Text>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.addSongsButton]} 
              onPress={openAddSongsModal}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.controlButtonText}>Thêm bài</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={selectedPlaylist?.songs || []}
            keyExtractor={item => item.toString()}
            renderItem={renderSongItem}
            contentContainerStyle={{ paddingTop: 10 }}
            ListEmptyComponent={
              <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                Chưa có bài hát nào
              </Text>
            }
          />
        </>
      ) : (
        <FlatList
          data={localPlaylists}
          keyExtractor={item => item.id}
          renderItem={renderPlaylistItem}
          contentContainerStyle={{ paddingTop: 10 }}
          ListEmptyComponent={
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
              Chưa có playlist nào
            </Text>
          }
        />
      )}

      {/* ➕ Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setCreateModalVisible(false);
          setPlaylistName('');
          setCreateStep(1);
          setSelectedSongs([]);
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouchable} 
            activeOpacity={1} 
            onPress={() => {
              setCreateModalVisible(false);
              setPlaylistName('');
              setCreateStep(1);
              setSelectedSongs([]);
            }}
          />
          <View style={styles.modalContent}>
            {/* Step 1: Enter playlist name */}
            {createStep === 1 && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tạo Playlist Mới</Text>
                  <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên playlist..."
                  placeholderTextColor="#666"
                  value={playlistName}
                  onChangeText={setPlaylistName}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.modalButton, styles.nextButton]}
                  onPress={() => {
                    if (!playlistName.trim()) {
                      Alert.alert('Lỗi', 'Vui lòng nhập tên playlist');
                      return;
                    }
                    setCreateStep(2);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Tiếp theo</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Choose songs from history or create empty */}
            {createStep === 2 && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setCreateStep(1)}>
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Thêm Bài Hát</Text>
                  <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={selectedSongs.length > 0 ? handleCreatePlaylist : handleCreateEmpty}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={selectedSongs.length > 0 ? "musical-notes" : "folder-outline"} 
                      size={32} 
                      color="#9b6bff" 
                    />
                    <Text style={styles.optionText}>
                      {selectedSongs.length > 0 
                        ? `Tạo "${playlistName}" với ${selectedSongs.length} bài hát`
                        : 'Tạo playlist rỗng'
                      }
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>HOẶC</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Text style={styles.sectionTitle}>
                    Chọn từ lịch sử ({selectedSongs.length} đã chọn)
                  </Text>

                  <ScrollView style={styles.songsList} showsVerticalScrollIndicator={false}>
                    {historyData.length === 0 ? (
                      <Text style={styles.emptyHistory}>Chưa có lịch sử nghe nhạc</Text>
                    ) : (
                      // Get unique songs from history
                      Array.from(new Set(historyData.map(h => h.songId)))
                        .map(songId => songs.find(s => s.id === songId))
                        .filter(Boolean)
                        .map(song => {
                          const isSelected = selectedSongs.includes(song.id);
                          return (
                            <TouchableOpacity
                              key={song.id}
                              style={[
                                styles.historySongItem,
                                isSelected && styles.historySongItemSelected
                              ]}
                              onPress={() => toggleSongSelection(song.id)}
                              activeOpacity={0.8}
                            >
                              <Image source={song.cover} style={styles.historySongCover} />
                              <View style={styles.historySongInfo}>
                                <Text style={styles.historySongTitle} numberOfLines={1}>
                                  {song.title}
                                </Text>
                                <Text style={styles.historySongArtist} numberOfLines={1}>
                                  {song.artist}
                                </Text>
                              </View>
                              <Ionicons
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={isSelected ? "#9b6bff" : "#666"}
                              />
                            </TouchableOpacity>
                          );
                        })
                    )}
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ➕ Add Songs to Playlist Modal */}
      <Modal
        visible={addSongsModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddSongsModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm Bài Hát</Text>
            <TouchableOpacity onPress={handleAddSongsToPlaylist}>
              <Ionicons name="checkmark" size={28} color="#9b6bff" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#aaa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bài hát..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected count */}
          <View style={styles.selectedCount}>
            <Text style={styles.selectedCountText}>
              {selectedSongs.length} bài hát đã chọn
            </Text>
          </View>

          {/* Song list */}
          <FlatList
            data={songs.filter(song => 
              song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              song.artist.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedSongs.includes(item.id);
              return (
                <TouchableOpacity
                  style={[
                    styles.addSongItem,
                    isSelected && styles.addSongItemSelected
                  ]}
                  onPress={() => toggleSongSelection(item.id)}
                  activeOpacity={0.8}
                >
                  <Image source={item.cover} style={styles.addSongCover} />
                  <View style={styles.addSongInfo}>
                    <Text style={styles.addSongTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.addSongArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? "#9b6bff" : "#666"}
                  />
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.addSongsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  backButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  deleteButton: {
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
  playlistControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  controlButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  playAllButton: {
    backgroundColor: '#9b6bff',
  },
  shuffleButton: {
    backgroundColor: '#ff6b35',
  },
  addSongsButton: {
    backgroundColor: '#0dc974',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Playlist cards in list view
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  playlistMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(155,107,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(155,107,255,0.3)'
  },
  playlistInfo: {
    flex: 1
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  playlistCount: {
    fontSize: 13,
    color: '#aaa'
  },
  playlistPlayBtn: {
    marginLeft: 8
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 16
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  // Create button in header
  createButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center'
  },
  modalOverlayTouchable: {
    flex: 1
  },
  modalContent: {
    backgroundColor: '#1a1a1f',
    borderRadius: 24,
    marginHorizontal: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(155,107,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(155,107,255,0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  nextButton: {
    backgroundColor: '#9b6bff'
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(155,107,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(155,107,255,0.3)',
    borderRadius: 16,
    gap: 12,
    borderStyle: 'dashed'
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9b6bff',
    textAlign: 'center',
    flex: 1
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#aaa',
    marginBottom: 12
  },
  songsList: {
    maxHeight: 300
  },
  emptyHistory: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 30
  },
  historySongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  historySongItemSelected: {
    backgroundColor: 'rgba(155,107,255,0.12)',
    borderColor: 'rgba(155,107,255,0.3)'
  },
  historySongCover: {
    width: 50,
    height: 50,
    borderRadius: 8
  },
  historySongInfo: {
    flex: 1
  },
  historySongTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  historySongArtist: {
    fontSize: 13,
    color: '#aaa'
  },
  // Add songs modal
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 4
  },
  selectedCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9b6bff'
  },
  addSongsList: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  addSongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  addSongItemSelected: {
    backgroundColor: 'rgba(155,107,255,0.12)',
    borderColor: 'rgba(155,107,255,0.3)'
  },
  addSongCover: {
    width: 50,
    height: 50,
    borderRadius: 8
  },
  addSongInfo: {
    flex: 1
  },
  addSongTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  addSongArtist: {
    fontSize: 13,
    color: '#aaa'
  }
});
