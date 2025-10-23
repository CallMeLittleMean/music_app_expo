import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { songs } from '../data/songs';
import { saveFavorites, loadFavorites } from '../services/storageService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FavoriteScreen({ route, navigation }) {
  const { favorites, setFavorites } = route.params;
  const insets = useSafeAreaInsets();

  // ✅ tạo state local để đảm bảo UI cập nhật ngay
  const [localFavorites, setLocalFavorites] = useState(favorites);

  // ✅ Tải danh sách yêu thích từ bộ nhớ cục bộ khi vào màn hình
  useEffect(() => {
    const fetchFavorites = async () => {
      const storedFavorites = await loadFavorites();
      if (storedFavorites && storedFavorites.length > 0) {
        setFavorites(storedFavorites);
        setLocalFavorites(storedFavorites);
      }
    };
    fetchFavorites();
  }, []);

  // ✅ đồng bộ khi favorites từ cha thay đổi
  useEffect(() => {
    setLocalFavorites(favorites);
    saveFavorites(favorites); // Lưu lại khi danh sách thay đổi
  }, [favorites]);

  const favoriteSongs = songs.filter(s => localFavorites.includes(s.id));

  // Hàm xóa bài hát khỏi yêu thích
  const handleRemoveFavorite = (songId) => {
    Alert.alert(
      "Xóa khỏi Yêu thích",
      "Bạn có chắc muốn xóa bài hát này khỏi danh sách Yêu thích?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const updated = localFavorites.filter(id => id !== songId);
            setFavorites(updated);
            setLocalFavorites(updated);
            await saveFavorites(updated);
          }
        }
      ]
    );
  };

  // 🎵 Phát toàn bộ favorites từ đầu
  const handlePlayAll = () => {
    if (favoriteSongs.length === 0) return;
    navigation.navigate('Player', {
      song: favoriteSongs[0],
      songList: favoriteSongs,
      index: 0,
    });
  };

  // 🔀 Phát favorites theo chế độ ngẫu nhiên
  const handleShuffle = () => {
    if (favoriteSongs.length === 0) return;
    const shuffled = [...favoriteSongs].sort(() => Math.random() - 0.5);
    navigation.navigate('Player', {
      song: shuffled[0],
      songList: shuffled,
      index: 0,
      shuffled: true,
    });
  };

  // 🗑️ Xóa tất cả favorites
  const handleClearAll = () => {
    Alert.alert(
      "Xóa tất cả",
      "Bạn có chắc muốn xóa tất cả bài hát khỏi danh sách Yêu thích?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa tất cả",
          style: "destructive",
          onPress: async () => {
            setFavorites([]);
            setLocalFavorites([]);
            await saveFavorites([]);
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.songCard}
      onPress={() => navigation.navigate('Player', { 
        song: item, 
        songList: favoriteSongs,
        index
      })}
      activeOpacity={0.8}
    >
      <Image source={item.cover} style={styles.cover} />
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={(e) => { 
            e.stopPropagation(); 
            navigation.navigate('Player', { song: item, songList: favoriteSongs, index });
          }} 
          style={styles.playBtn}
        >
          <Ionicons name="play-circle" size={32} color="#9b6bff" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={(e) => { 
            e.stopPropagation(); 
            handleRemoveFavorite(item.id);
          }} 
          style={styles.deleteBtn}
        >
          <Ionicons name="heart-dislike" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yêu Thích</Text>
        {favoriteSongs.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {favoriteSongs.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="musical-notes" size={20} color="#9b6bff" />
            <Text style={styles.statText}>{favoriteSongs.length} bài hát</Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      {favoriteSongs.length > 0 && (
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlBtn} onPress={handlePlayAll} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={24} color="#fff" />
            <Text style={styles.controlBtnText}>Phát tất cả</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.controlBtn, styles.shuffleBtn]} onPress={handleShuffle} activeOpacity={0.8}>
            <Ionicons name="shuffle" size={24} color="#fff" />
            <Text style={styles.controlBtnText}>Ngẫu nhiên</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Song List or Empty State */}
      {favoriteSongs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={80} color="#555" />
          <Text style={styles.emptyTitle}>Chưa có bài hát yêu thích</Text>
          <Text style={styles.emptyText}>Nhấn vào icon trái tim ở bất kỳ bài hát nào để thêm vào danh sách này</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteSongs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#9b6bff',
    flex: 1,
    textAlign: 'center'
  },
  clearBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600'
  },
  controlButtons: {
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
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#9b6bff',
    gap: 8,
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  shuffleBtn: {
    backgroundColor: '#ff6b35'
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  cover: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    marginRight: 12 
  },
  songInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#fff',
    marginBottom: 4
  },
  artist: { 
    fontSize: 13, 
    color: '#bbb' 
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  playBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,90,95,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,90,95,0.3)'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20
  }
});
