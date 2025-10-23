// // // src/screens/PlayerScreen.js
// // import React, { useEffect, useState, useRef } from 'react';
// // import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// // import { Audio } from 'expo-av';
// // import Slider from '@react-native-community/slider';
// // import { Ionicons } from '@expo/vector-icons';
// // import { getFavorites, saveFavorites } from '../services/storageService';
// // import { songs } from '../data/songs';

// // export default function PlayerScreen({ route, navigation }) {
// //   // ✅ lấy đúng tham số truyền vào
// //   const { song: initialSong, songList: incomingList = [] } = route.params || {};

// //   // ✅ danh sách thực tế (favorite / playlist / mặc định)
// //   const songList = incomingList.length > 0 ? incomingList : songs;
// //   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

// //   const [currentIndex, setCurrentIndex] = useState(initialIndex);
// //   const [isPlaying, setIsPlaying] = useState(false);
// //   const [position, setPosition] = useState(0);
// //   const [duration, setDuration] = useState(1);
// //   const [repeatMode, setRepeatMode] = useState('off');
// //   const [isShuffle, setIsShuffle] = useState(false);
// //   const [favorites, setFavorites] = useState([]);

// //   const soundRef = useRef(null);
// //   const cacheRef = useRef({});
// //   const positionRef = useRef(null);

// //   // ✅ load danh sách yêu thích
// //   useEffect(() => {
// //     (async () => {
// //       const favs = await getFavorites();
// //       setFavorites(favs || []);
// //     })();
// //     Audio.setAudioModeAsync({
// //       allowsRecordingIOS: false,
// //       staysActiveInBackground: true,
// //       playsInSilentModeIOS: true,
// //     });
// //   }, []);

// //   useEffect(() => {
// //     loadSong(currentIndex);
// //     preloadAdjacent(currentIndex);
// //     return () => clearPositionInterval();
// //   }, [currentIndex]);

// //   useEffect(() => () => unloadCurrentSound(), []);

// //   const clearPositionInterval = () => {
// //     if (positionRef.current) {
// //       clearInterval(positionRef.current);
// //       positionRef.current = null;
// //     }
// //   };

// //   const unloadCurrentSound = async () => {
// //     clearPositionInterval();
// //     if (soundRef.current) {
// //       try {
// //         await soundRef.current.stopAsync();
// //       } catch {}
// //       soundRef.current.setOnPlaybackStatusUpdate(null);
// //       soundRef.current = null;
// //     }
// //   };

// //   const preloadAdjacent = async (index) => {
// //     const toPreload = [index - 1, index + 1].filter(i => i >= 0 && i < songList.length);
// //     await Promise.allSettled(
// //       toPreload.map(async i => {
// //         if (!cacheRef.current[i]) {
// //           try {
// //             const { sound } = await Audio.Sound.createAsync(songList[i].uri, { shouldPlay: false });
// //             cacheRef.current[i] = sound;
// //           } catch {}
// //         }
// //       })
// //     );
// //   };

// //   async function loadSong(index) {
// //     try {
// //     clearPositionInterval();
// //     await unloadCurrentSound();

// //     const track = songList[index];
// //     if (!track) {
// //       console.warn('⚠️ Không tìm thấy bài hát ở index:', index);
// //       return;
// //     }

// //     console.log('🎵 Đang load bài:', track.title, track.uri);

// //     let newSound = cacheRef.current[index];
// //     const shouldPlay = true;

// //     // 🔹 Nếu đã có sound trong cache
// //     if (newSound) {
// //       const status = await newSound.getStatusAsync().catch(() => null);
// //       if (!status?.isLoaded) {
// //         const result = await Audio.Sound.createAsync(track.uri, { shouldPlay }).catch(() => null);
// //         newSound = result?.sound ?? null;
// //         cacheRef.current[index] = newSound;
// //       } else {
// //         await newSound.setPositionAsync(0);
// //         await newSound.playAsync();
// //       }
// //     } 
// //     // 🔹 Nếu chưa có trong cache, tạo mới
// //     else {
// //       const result = await Audio.Sound.createAsync(track.uri, { shouldPlay }).catch(() => null);
// //       newSound = result?.sound ?? null;
// //       cacheRef.current[index] = newSound;
// //     }

// //     // 🔹 Kiểm tra newSound có tồn tại không
// //     if (!newSound) {
// //       console.warn('⚠️ Không thể tạo sound cho bài:', track.title);
// //       return;
// //     }

// //     // Gán soundRef và setup update callback
// //     soundRef.current = newSound;
// //     newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

// //     const status = await newSound.getStatusAsync().catch(() => null);
// //     if (!status?.isLoaded) {
// //       console.warn('⚠️ Sound chưa load được:', track.title);
// //       return;
// //     }

// //     setDuration(status.durationMillis ?? 1);
// //     setPosition(status.positionMillis ?? 0);
// //     setIsPlaying(true);

// //     // Cập nhật vị trí phát định kỳ
// //     positionRef.current = setInterval(async () => {
// //       try {
// //         const st = await newSound.getStatusAsync();
// //         if (st.isLoaded) setPosition(st.positionMillis);
// //       } catch {}
// //     }, 250);
// //   } catch (e) {
// //     console.warn('loadSong error', e);
// //   }
// //   }
// // async function onPlaybackStatusUpdate(status) {
// //   if (!status?.isLoaded) return;
// //   setPosition(status.positionMillis ?? 0);
// //   setDuration(status.durationMillis ?? 1);

// //   if (status.didJustFinish) {
// //     if (repeatMode === 'one') {
// //       if (soundRef.current && status.isLoaded) {
// //         await soundRef.current.setPositionAsync(0);
// //         await soundRef.current.playAsync();
// //       }
// //     } else {
// //       // Dừng sound hiện tại để tránh conflict
// //       if (soundRef.current) {
// //         try {
// //           await soundRef.current.stopAsync();
// //         } catch {}
// //       }

// //       // Tính index bài kế
// //       setCurrentIndex(prev => {
// //         if (isShuffle) {
// //           return randomIndex(prev); // 🔥 random khi shuffle bật
// //         }
// //         const next = prev + 1;
// //         if (next >= songList.length) {
// //           return repeatMode === 'all' ? 0 : prev;
// //         }
// //         return next;
// //       });
// //     }
// //   }
// // }


// //   const playPause = async () => {
// //     const s = soundRef.current;
// //     if (!s) return;

// //     try {
// //       const st = await s.getStatusAsync();
// //       if (!st.isLoaded) return;

// //       if (st.isPlaying) {
// //         await s.pauseAsync();
// //         setIsPlaying(false);
// //       } else {
// //         await s.playAsync();
// //         setIsPlaying(true);
// //       }
// //     } catch (e) {
// //       console.warn('playPause error', e);
// //     }
// //   };


// //   const randomIndex = (exclude) => {
// //     let idx;
// //     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
// //     return idx;
// //   };

// //   const nextSong = () => {
// //     setCurrentIndex(prev =>
// //       isShuffle ? randomIndex(prev) : (prev + 1) % songList.length
// //     );
// //   };

// //   const prevSong = () => {
// //     setCurrentIndex(prev =>
// //       isShuffle ? randomIndex(prev) : prev === 0 ? songList.length - 1 : prev - 1
// //     );
// //   };

// //   const seek = async (value) => {
// //     if (!soundRef.current) return;
// //     const seekPos = Math.max(0, Math.min(1, value)) * duration;
// //     await soundRef.current.setPositionAsync(seekPos);
// //     setPosition(seekPos);
// //   };

// //   const toggleRepeat = () =>
// //     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
// //   const toggleShuffle = () => setIsShuffle(p => !p);

// //   // ❤️ Toggle favorite
// //   const toggleFavorite = async () => {
// //     const currentSong = songList[currentIndex];
// //     let updatedFavorites = [...favorites];
// //     if (favorites.some(f => f.id === currentSong.id)) {
// //       updatedFavorites = updatedFavorites.filter(f => f.id !== currentSong.id);
// //     } else {
// //       updatedFavorites.push(currentSong);
// //     }
// //     setFavorites(updatedFavorites);
// //     await saveFavorites(updatedFavorites);
// //   };

// //   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
// //   const formatTime = (ms) => {
// //     const sec = Math.floor((ms || 0) / 1000);
// //     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
// //   };

// //   const currentSong = songList[currentIndex] || {};

// //   return (
// //     <View style={styles.container}>
// //       {/* Nút back */}
// //       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
// //         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
// //       </TouchableOpacity>

// //       {/* Tên bài hát */}
// //       <Text style={styles.title}>{currentSong.title}</Text>
// //       <Text style={styles.artist}>{currentSong.artist}</Text>

      

// //       {/* Thanh tiến trình */}
// //       <View style={styles.progressContainer}>
// //         <Text style={styles.timeText}>{formatTime(position)}</Text>
// //         <Slider
// //           style={styles.slider}
// //           minimumValue={0}
// //           maximumValue={1}
// //           value={duration ? position / duration : 0}
// //           onSlidingComplete={seek}
// //           minimumTrackTintColor="#00D4AA"
// //           maximumTrackTintColor="#404040"
// //         />
// //         <Text style={styles.timeText}>{formatTime(duration)}</Text>
// //       </View>

// //       {/* Bộ điều khiển */}
// //       <View style={styles.controlsContainer}>
// //         <TouchableOpacity onPress={toggleShuffle}>
// //           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
// //           <Ionicons name="play-skip-back" size={28} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.playButton} onPress={playPause}>
// //           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
// //           <Ionicons name="play-skip-forward" size={28} color="#fff" />
// //         </TouchableOpacity>
// //         <TouchableOpacity onPress={toggleRepeat}>
// //           <Ionicons name="repeat" size={24} color={repeatMode === 'off' ? '#aaa' : '#0dc974'} />
// //           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
// //         </TouchableOpacity>
// //       </View>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
// //   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
// //   favoriteButton: { position: 'absolute', top: 70, right: 20, zIndex: 10 },
// //   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
// //   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
// //   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
// //   slider: { flex: 1, marginHorizontal: 10 },
// //   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
// //   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
// //   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
// //   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
// //   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// // });



// // src/screens/PlayerScreen.js
// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off -> one -> all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);

//   // For smooth seeking UX
//   const [isSeeking, setIsSeeking] = useState(false);
//   const [tempPosition, setTempPosition] = useState(0);

//   const soundRef = useRef(null);
//   const isLoadingRef = useRef(false);

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();

//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     }).catch(() => {});
//   }, []);

//   // load initial song on mount or when loadSong is explicitly requested
//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => {
//       // cleanup on unmount
//       if (soundRef.current) {
//         try {
//           soundRef.current.setOnPlaybackStatusUpdate(null);
//           soundRef.current.unloadAsync().catch(() => {});
//         } catch {}
//         soundRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // note: we call loadSong manually when we want to change songs

//   // ---------- helper: safely unload current sound ----------
//   const unloadCurrent = async () => {
//     if (soundRef.current) {
//       try {
//         soundRef.current.setOnPlaybackStatusUpdate(null);
//         await soundRef.current.stopAsync().catch(() => {});
//         await soundRef.current.unloadAsync().catch(() => {});
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   // ---------- main loader (can be called directly) ----------
//   const loadSong = async (index) => {
//     if (index < 0 || index >= songList.length) return;
//     // avoid concurrent loads
//     if (isLoadingRef.current) return;
//     isLoadingRef.current = true;
//     try {
//       const track = songList[index];
//       if (!track) return;

//       // Unload previous
//       await unloadCurrent();

//       // Create and play
//       const result = await Audio.Sound.createAsync(track.uri, { shouldPlay: true }).catch(e => {
//         console.warn('createAsync error', e);
//         return null;
//       });

//       const sound = result?.sound ?? null;
//       if (!sound) {
//         console.warn('Không tạo được sound cho', track?.title);
//         isLoadingRef.current = false;
//         return;
//       }

//       soundRef.current = sound;
//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

//       const st = await sound.getStatusAsync().catch(() => null);
//       setDuration(st?.durationMillis ?? 1);
//       setPosition(st?.positionMillis ?? 0);
//       setIsPlaying(!!st?.isPlaying);
//       setCurrentIndex(index); // keep index in sync
//     } catch (e) {
//       console.warn('loadSong error', e);
//     } finally {
//       isLoadingRef.current = false;
//     }
//   };

//   // ---------- playback status handler ----------
//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status) return;
//     if (!status.isLoaded) return;

//     // don't overwrite UI while user is seeking (but keep duration)
//     setDuration(status.durationMillis ?? 1);
//     if (!isSeeking) {
//       setPosition(status.positionMillis ?? 0);
//     }

//     setIsPlaying(!!status.isPlaying);

//     if (status.didJustFinish) {
//       // finished playing
//       if (repeatMode === 'one') {
//         // replay same track without unloading
//         try {
//           if (soundRef.current) {
//             await soundRef.current.setPositionAsync(0);
//             await soundRef.current.playAsync();
//           }
//         } catch (e) { console.warn('replay error', e); }
//         return;
//       }

//       // compute next index depending on shuffle / repeat all / off
//       const nextIndex = (() => {
//         if (isShuffle) {
//           // if only 1 song, return same
//           if (songList.length <= 1) return currentIndex;
//           // pick random != currentIndex
//           let idx;
//           do { idx = Math.floor(Math.random() * songList.length); } while (idx === currentIndex);
//           return idx;
//         } else {
//           const n = currentIndex + 1;
//           if (n >= songList.length) {
//             return repeatMode === 'all' ? 0 : -1; // -1 means stop
//           }
//           return n;
//         }
//       })();

//       if (nextIndex === -1) {
//         // repeat off and at end -> stop & keep position at duration
//         try {
//           if (soundRef.current) {
//             await soundRef.current.stopAsync().catch(() => {});
//           }
//         } catch {}
//         setIsPlaying(false);
//         setPosition(duration);
//         return;
//       }

//       // load next song immediately (avoid race by calling loadSong directly)
//       loadSong(nextIndex);
//     }
//   };

//   // ---------- play/pause ----------
//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const st = await s.getStatusAsync().catch(() => null);
//     if (!st || !st.isLoaded) return;
//     try {
//       if (st.isPlaying) {
//         await s.pauseAsync();
//         setIsPlaying(false);
//       } else {
//         await s.playAsync();
//         setIsPlaying(true);
//       }
//     } catch (e) {
//       console.warn('playPause error', e);
//     }
//   };

//   // ---------- seek UX: immediate visual + commit on release ----------
//   const onSeekValueChange = (value) => {
//     setIsSeeking(true);
//     const pos = Math.max(0, Math.min(1, value)) * (duration || 1);
//     setTempPosition(pos);
//     setPosition(pos); // show immediate feedback
//   };

//   const onSeekComplete = async (value) => {
//     setIsSeeking(false);
//     if (!soundRef.current) return;
//     const pos = Math.max(0, Math.min(1, value)) * (duration || 1);
//     try {
//       await soundRef.current.setPositionAsync(pos);
//       setPosition(pos);
//     } catch (e) {
//       console.warn('seek error', e);
//     }
//   };

//   // ---------- next / prev ----------
//   const randomIndex = (exclude) => {
//     if (songList.length <= 1) return exclude;
//     let idx;
//     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     if (isShuffle) {
//       loadSong(randomIndex(currentIndex));
//     } else {
//       const n = (currentIndex + 1) % songList.length;
//       loadSong(n);
//     }
//   };

//   const prevSong = () => {
//     if (isShuffle) {
//       loadSong(randomIndex(currentIndex));
//     } else {
//       const p = currentIndex === 0 ? songList.length - 1 : currentIndex - 1;
//       loadSong(p);
//     }
//   };

//   // ---------- controls ----------
//   const toggleRepeat = () =>
//     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle(p => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some(f => f.id === currentSong.id)) {
//       updated = updated.filter(f => f.id !== currentSong.id);
//     } else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated).catch(() => {});
//   };

//   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

//   const currentSong = songList[currentIndex] || {};

//   return (
//     <View style={styles.container}>
//       <Image source={currentSong.cover} style={styles.cover} />
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? (position / duration) : 0}
//           onValueChange={onSeekValueChange}
//           onSlidingComplete={onSeekComplete}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>

//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons name="repeat" size={24} color={repeatMode === 'off' ? '#aaa' : '#0dc974'} />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// });



// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off → one → all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);
//   const [volume, setVolume] = useState(1.0);

//   const soundRef = useRef(null);
//   const rotateAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     });
//   }, []);

//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => unloadSound();
//   }, [currentIndex]);

//   useEffect(() => {
//     if (isPlaying) {
//       startRotation();
//     } else {
//       stopRotation();
//     }
//   }, [isPlaying]);

//   const handleVolumeChange = async (value) => {
//     setVolume(value);
//     if (sound) {
//       await sound.setVolumeAsync(value);
//     }
//   };

//   const startRotation = () => {
//     Animated.loop(
//       Animated.timing(rotateAnim, {
//         toValue: 1,
//         duration: 8000,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const stopRotation = () => {
//     rotateAnim.stopAnimation();
//   };

//   const unloadSound = async () => {
//     if (soundRef.current) {
//       try {
//         await soundRef.current.stopAsync();
//         await soundRef.current.unloadAsync();
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   const loadSong = async (index) => {
//     try {
//       await unloadSound();
//       const track = songList[index];
//       if (!track) return;

//       const { sound } = await Audio.Sound.createAsync(track.uri, { shouldPlay: true });
//       soundRef.current = sound;
//       setIsPlaying(true);

//       const status = await sound.getStatusAsync();
//       setDuration(status.durationMillis || 1);
//       setPosition(status.positionMillis || 0);

//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
//     } catch (e) {
//       console.warn('loadSong error:', e);
//     }
//   };

//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status?.isLoaded) return;

//     setPosition(status.positionMillis ?? 0);
//     setDuration(status.durationMillis ?? 1);
//     setIsPlaying(status.isPlaying);

//     if (status.didJustFinish) {
//       if (repeatMode === 'one') {
//         await soundRef.current.setPositionAsync(0);
//         await soundRef.current.playAsync();
//       } else {
//         if (repeatMode === 'off' && currentIndex === songList.length - 1) {
//           setIsPlaying(false);
//           return;
//         }
//         const nextIndex = isShuffle
//           ? randomIndex(currentIndex)
//           : (currentIndex + 1) % songList.length;
//         setCurrentIndex(nextIndex);
//       }
//     }
//   };

//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const status = await s.getStatusAsync();
//     if (status.isPlaying) {
//       await s.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       await s.playAsync();
//       setIsPlaying(true);
//     }
//   };

//   const seek = async (value) => {
//     if (!soundRef.current) return;
//     const pos = value * duration;
//     await soundRef.current.setPositionAsync(pos);
//     setPosition(pos);
//   };

//   const randomIndex = (exclude) => {
//     let idx;
//     do { idx = Math.floor(Math.random() * songList.length); } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     const next = isShuffle ? randomIndex(currentIndex) : (currentIndex + 1) % songList.length;
//     setCurrentIndex(next);
//   };

//   const prevSong = () => {
//     const prev = isShuffle
//       ? randomIndex(currentIndex)
//       : currentIndex === 0
//       ? songList.length - 1
//       : currentIndex - 1;
//     setCurrentIndex(prev);
//   };

//   const loadAudio = async () => {
//     if (sound) {
//       await sound.unloadAsync();
//     }

//     const { sound: newSound, status } = await Audio.Sound.createAsync(
//       { uri: song.url },
//       { shouldPlay: true, volume: volume }, // ⚙️ Áp dụng âm lượng hiện tại
//       updateStatus
//     );

//     setSound(newSound);
//     setIsPlaying(true);
//   };

  

//   const toggleRepeat = () =>
//     setRepeatMode(p => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle(p => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some(f => f.id === currentSong.id))
//       updated = updated.filter(f => f.id !== currentSong.id);
//     else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated);
//   };

//   const isFavorite = favorites.some(f => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

  

//   const currentSong = songList[currentIndex] || {};
//   const rotateInterpolate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       {/* 🎵 Cover Art */}
//       <Animated.Image
//         source={currentSong.cover}
//         style={[
//           styles.coverImage,
//           { transform: [{ rotate: rotateInterpolate }] },
//         ]}
//       />

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? position / duration : 0}
//           onSlidingComplete={seek}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//        <View style={styles.volumeContainer}>
//         <Ionicons name="volume-low" size={20} color="#fff" />
//         <Slider
//           style={styles.volumeSlider}
//           minimumValue={0}
//           maximumValue={1}
//           value={volume}
//           onValueChange={handleVolumeChange}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Ionicons name="volume-high" size={20} color="#fff" />
//       </View>

//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons
//             name="repeat"
//             size={24}
//             color={repeatMode === 'off' ? '#aaa' : '#0dc974'}
//           />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>

      
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   coverImage: {
//     width: 250,
//     height: 250,
//     borderRadius: 125,
//     marginTop: 100,
//     marginBottom: 30,
//     borderWidth: 3,
//     borderColor: '#00D4AA',
//   },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
//   favoriteBtn: { marginTop: 30 },
//   shuffleButton: { position: 'absolute', bottom: 40 },
//   volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '70%', marginTop: 10 },
//   volumeSlider: { flex: 1, height: 40, marginHorizontal: 10 },
// });







// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
// import { Audio } from 'expo-av';
// import Slider from '@react-native-community/slider';
// import { Ionicons } from '@expo/vector-icons';
// import { getFavorites, saveFavorites } from '../services/storageService';
// import { songs } from '../data/songs';

// export default function PlayerScreen({ route, navigation }) {
//   const { song: initialSong, songList: incomingList = [] } = route.params || {};
//   const songList = incomingList.length > 0 ? incomingList : songs;
//   const initialIndex = Math.max(0, songList.findIndex(s => s.id === initialSong?.id));

//   const [currentIndex, setCurrentIndex] = useState(initialIndex);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(1);
//   const [repeatMode, setRepeatMode] = useState('off'); // off → one → all
//   const [isShuffle, setIsShuffle] = useState(false);
//   const [favorites, setFavorites] = useState([]);
//   const [volume, setVolume] = useState(1.0);

//   const soundRef = useRef(null);
//   const rotateAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     (async () => {
//       const favs = await getFavorites();
//       setFavorites(favs || []);
//     })();

//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//     });
//   }, []);

//   useEffect(() => {
//     loadSong(currentIndex);
//     return () => unloadSound();
//   }, [currentIndex]);

//   useEffect(() => {
//     if (isPlaying) startRotation();
//     else stopRotation();
//   }, [isPlaying]);

//   const startRotation = () => {
//     Animated.loop(
//       Animated.timing(rotateAnim, {
//         toValue: 1,
//         duration: 8000,
//         useNativeDriver: true,
//       })
//     ).start();
//   };

//   const stopRotation = () => {
//     rotateAnim.stopAnimation();
//   };

//   const unloadSound = async () => {
//     if (soundRef.current) {
//       try {
//         await soundRef.current.stopAsync();
//         await soundRef.current.unloadAsync();
//       } catch {}
//       soundRef.current = null;
//     }
//   };

//   const loadSong = async (index) => {
//     try {
//       await unloadSound();
//       const track = songList[index];
//       if (!track) return;

//       const { sound } = await Audio.Sound.createAsync(
//         track.uri,
//         { shouldPlay: true, volume } // ✅ Dùng volume hiện tại
//       );
//       soundRef.current = sound;
//       setIsPlaying(true);

//       const status = await sound.getStatusAsync();
//       setDuration(status.durationMillis || 1);
//       setPosition(status.positionMillis || 0);

//       sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
//     } catch (e) {
//       console.warn('loadSong error:', e);
//     }
//   };

//   const onPlaybackStatusUpdate = async (status) => {
//     if (!status?.isLoaded) return;

//     setPosition(status.positionMillis ?? 0);
//     setDuration(status.durationMillis ?? 1);
//     setIsPlaying(status.isPlaying);

//     if (status.didJustFinish) {
//       if (repeatMode === 'one') {
//         await soundRef.current.setPositionAsync(0);
//         await soundRef.current.playAsync();
//       } else {
//         if (repeatMode === 'off' && currentIndex === songList.length - 1) {
//           setIsPlaying(false);
//           return;
//         }
//         const nextIndex = isShuffle
//           ? randomIndex(currentIndex)
//           : (currentIndex + 1) % songList.length;
//         setCurrentIndex(nextIndex);
//       }
//     }
//   };

//   const playPause = async () => {
//     const s = soundRef.current;
//     if (!s) return;
//     const status = await s.getStatusAsync();
//     if (status.isPlaying) {
//       await s.pauseAsync();
//       setIsPlaying(false);
//     } else {
//       await s.playAsync();
//       setIsPlaying(true);
//     }
//   };

//   const seek = async (value) => {
//     if (!soundRef.current) return;
//     const pos = value * duration;
//     await soundRef.current.setPositionAsync(pos);
//     setPosition(pos);
//   };

//   const handleVolumeChange = async (value) => {
//     setVolume(value);
//     if (soundRef.current) {
//       await soundRef.current.setVolumeAsync(value);
//     }
//   };

//   const randomIndex = (exclude) => {
//     let idx;
//     do {
//       idx = Math.floor(Math.random() * songList.length);
//     } while (idx === exclude);
//     return idx;
//   };

//   const nextSong = () => {
//     const next = isShuffle
//       ? randomIndex(currentIndex)
//       : (currentIndex + 1) % songList.length;
//     setCurrentIndex(next);
//   };

//   const prevSong = () => {
//     const prev = isShuffle
//       ? randomIndex(currentIndex)
//       : currentIndex === 0
//       ? songList.length - 1
//       : currentIndex - 1;
//     setCurrentIndex(prev);
//   };

//   const toggleRepeat = () =>
//     setRepeatMode((p) => (p === 'off' ? 'one' : p === 'one' ? 'all' : 'off'));
//   const toggleShuffle = () => setIsShuffle((p) => !p);

//   const toggleFavorite = async () => {
//     const currentSong = songList[currentIndex];
//     let updated = [...favorites];
//     if (favorites.some((f) => f.id === currentSong.id))
//       updated = updated.filter((f) => f.id !== currentSong.id);
//     else updated.push(currentSong);
//     setFavorites(updated);
//     await saveFavorites(updated);
//   };

//   const isFavorite = favorites.some((f) => f.id === songList[currentIndex]?.id);
//   const formatTime = (ms) => {
//     const sec = Math.floor((ms || 0) / 1000);
//     return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
//   };

//   const currentSong = songList[currentIndex] || {};
//   const rotateInterpolate = rotateAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ['0deg', '360deg'],
//   });

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Ionicons name="arrow-back" size={28} color="#29ac2dff" />
//       </TouchableOpacity>

//       {/* 🎵 Cover Art */}
//       <Animated.Image
//         source={currentSong.cover}
//         style={[
//           styles.coverImage,
//           { transform: [{ rotate: rotateInterpolate }] },
//         ]}
//       />

//       <Text style={styles.title}>{currentSong.title}</Text>
//       <Text style={styles.artist}>{currentSong.artist}</Text>

//       {/* Progress bar */}
//       <View style={styles.progressContainer}>
//         <Text style={styles.timeText}>{formatTime(position)}</Text>
//         <Slider
//           style={styles.slider}
//           minimumValue={0}
//           maximumValue={1}
//           value={duration ? position / duration : 0}
//           onSlidingComplete={seek}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Text style={styles.timeText}>{formatTime(duration)}</Text>
//       </View>

//       {/* 🔊 Volume bar */}
//       <View style={styles.volumeContainer}>
//         <Ionicons name="volume-low" size={20} color="#fff" />
//         <Slider
//           style={styles.volumeSlider}
//           minimumValue={0}
//           maximumValue={1}
//           value={volume}
//           onValueChange={handleVolumeChange}
//           minimumTrackTintColor="#00D4AA"
//           maximumTrackTintColor="#404040"
//         />
//         <Ionicons name="volume-high" size={20} color="#fff" />
//       </View>

//       {/* Controls */}
//       <View style={styles.controlsContainer}>
//         <TouchableOpacity onPress={toggleShuffle}>
//           <Ionicons name="shuffle" size={24} color={isShuffle ? '#0dc974' : '#aaa'} />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={prevSong}>
//           <Ionicons name="play-skip-back" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.playButton} onPress={playPause}>
//           <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.controlButton} onPress={nextSong}>
//           <Ionicons name="play-skip-forward" size={28} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity onPress={toggleRepeat}>
//           <Ionicons
//             name="repeat"
//             size={24}
//             color={repeatMode === 'off' ? '#aaa' : '#0dc974'}
//           />
//           {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 20 },
//   backButton: { position: 'absolute', top: 70, left: 20, zIndex: 10 },
//   coverImage: {
//     width: 250,
//     height: 250,
//     borderRadius: 125,
//     marginTop: 100,
//     marginBottom: 30,
//     borderWidth: 3,
//     borderColor: '#00D4AA',
//   },
//   title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 4 },
//   artist: { fontSize: 18, color: '#aaa', textAlign: 'center', marginBottom: 40 },
//   progressContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 30 },
//   slider: { flex: 1, marginHorizontal: 10 },
//   timeText: { color: '#aaa', fontSize: 12, width: 40, textAlign: 'center' },
//   volumeContainer: { flexDirection: 'row', alignItems: 'center', width: '70%', marginBottom: 25 },
//   volumeSlider: { flex: 1, height: 40, marginHorizontal: 10 },
//   controlsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
//   controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
//   playButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center' },
//   repeatOne: { position: 'absolute', top: -6, right: -4, fontSize: 10, color: '#0dc974', fontWeight: 'bold' },
// });








// Redesigned PlayerScreen using global PlayerContext so playback persists across screens
import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Image, Platform, Share, Alert, Modal, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerContext } from '../context/PlayerContext';
import { songs } from '../data/songs';
import { formatTime } from '../utils/helpers';
import { loadFavorites, saveFavorites } from '../services/storageService';

export default function PlayerScreen({ route, navigation }) {
  const { song: startSong, songList, index } = route.params || {};
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState([]);
  const [downloadVisible, setDownloadVisible] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('downloading'); // 'downloading' or 'success' or 'already'
  const [downloadedSongs, setDownloadedSongs] = useState([]); // Danh sách bài đã tải
  const {
    playlist,
    setPlaylist,
    currentIndex,
    setCurrentIndex,
    currentTrack,
    isPlaying,
    position,
    duration,
    play,
    pause,
    seek,
    next,
    previous,
    isShuffle,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    volume,
    setVolume,
  } = useContext(PlayerContext);

  // Animation values cho gợn sóng và pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  // Animation cho gợn sóng khi đang phát nhạc
  useEffect(() => {
    if (isPlaying) {
      // Pulse animation cho disc
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 1
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave1, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 2 (delayed)
      Animated.loop(
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(wave2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(wave2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 3 (more delayed)
      Animated.loop(
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(wave3, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(wave3, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset về giá trị ban đầu khi dừng
      pulseAnim.setValue(1);
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
    }
  }, [isPlaying]);

  // Load favorites and downloaded songs
  useEffect(() => {
    (async () => {
      const fav = await loadFavorites();
      setFavorites(fav || []);
      
      // Load downloaded songs
      const downloaded = await loadDownloadedSongs();
      setDownloadedSongs(downloaded || []);
    })();
  }, []);

  // Initialize playlist/index when opened from Home/others and auto-play
  useEffect(() => {
    console.log('🎵 PlayerScreen mounted - route params:', { startSong: startSong?.title, songList: songList?.length, index });
    const list = songList && songList.length ? songList : songs;
    
    // Always update playlist when coming from a different source
    // This ensures playlist context matches what user selected (home, favorites, or playlist)
    if (songList && songList.length > 0) {
      console.log('📋 Updating playlist with', list.length, 'songs from route params');
      setPlaylist(list);
    } else if (!playlist || playlist.length === 0) {
      console.log('📋 Setting default playlist with all songs');
      setPlaylist(songs);
    }
    
    // Set index and auto-play
    if (typeof index === 'number') {
      console.log('🎯 Setting index to', index, '- song:', list[index]?.title);
      setCurrentIndex(index);
      // Auto-play when user selects a song
      setTimeout(() => {
        console.log('▶️ Auto-playing...');
        play();
      }, 200);
    } else if (startSong) {
      const i = list.findIndex((s) => s.id === startSong.id);
      console.log('🔍 Found song at index', i, '- song:', startSong.title);
      if (i >= 0) {
        setCurrentIndex(i);
        setTimeout(() => {
          console.log('▶️ Auto-playing...');
          play();
        }, 200);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = duration ? position / duration : 0;
  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;

  // Load downloaded songs from AsyncStorage
  const loadDownloadedSongs = async () => {
    try {
      const stored = await AsyncStorage.getItem('downloadedSongs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading downloaded songs:', error);
      return [];
    }
  };

  // Save downloaded songs to AsyncStorage
  const saveDownloadedSongs = async (songIds) => {
    try {
      await AsyncStorage.setItem('downloadedSongs', JSON.stringify(songIds));
    } catch (error) {
      console.error('Error saving downloaded songs:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!currentTrack) return;
    let newFav;
    if (isFavorite) {
      newFav = favorites.filter(id => id !== currentTrack.id);
    } else {
      newFav = [...favorites, currentTrack.id];
    }
    setFavorites(newFav);
    await saveFavorites(newFav);
  };

  // Share song function
  const handleShareSong = async () => {
    if (!currentTrack) return;
    
    try {
      const message = 
        `🎵 Đang nghe "${currentTrack.title}" - ${currentTrack.artist}\n\n` +
        `Album: ${currentTrack.album || 'Unknown'}\n` +
        `Thể loại: ${currentTrack.genre || 'Unknown'}\n\n` +
        `Tải app Mean Music để nghe nhạc hay!`;

      const result = await Share.share({
        message: message,
        title: `Chia sẻ: ${currentTrack.title}`
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chia sẻ bài hát');
      console.error(error);
    }
  };

  const handleDownloadSong = async () => {
    if (!currentTrack) return;
    
    // Kiểm tra xem bài hát đã được tải chưa
    const isAlreadyDownloaded = downloadedSongs.includes(currentTrack.id);
    
    if (isAlreadyDownloaded) {
      // Nếu đã tải rồi, hiển thị thông báo
      setDownloadStatus('already');
      setDownloadVisible(true);
    } else {
      // Nếu chưa tải, bắt đầu tải
      setDownloadStatus('downloading');
      setDownloadVisible(true);
      
      // Simulate download - sau 3s sẽ thành công
      setTimeout(async () => {
        setDownloadStatus('success');
        
        // Lưu vào danh sách đã tải
        const newDownloaded = [...downloadedSongs, currentTrack.id];
        setDownloadedSongs(newDownloaded);
        await saveDownloadedSongs(newDownloaded);
      }, 3000);
    }
  };

  const closeDownloadModal = () => {
    setDownloadVisible(false);
    setTimeout(() => {
      setDownloadStatus('downloading');
    }, 300);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {currentTrack?.cover && (
        <ImageBackground source={currentTrack.cover} style={styles.bg} blurRadius={40} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Disc/cover với gợn sóng */}
      {currentTrack?.cover && (
        <View style={styles.discWrapper}>
          {/* Gợn sóng 3 */}
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: wave3.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 0.3, 0],
                }),
                transform: [
                  {
                    scale: wave3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
              },
            ]}
          />
          {/* Gợn sóng 2 */}
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: wave2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 0.3, 0],
                }),
                transform: [
                  {
                    scale: wave2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
              },
            ]}
          />
          {/* Gợn sóng 1 */}
          <Animated.View
            style={[
              styles.wave,
              {
                opacity: wave1.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 0.3, 0],
                }),
                transform: [
                  {
                    scale: wave1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.6],
                    }),
                  },
                ],
              },
            ]}
          />
          {/* Disc với pulse animation */}
          <Animated.View
            style={[
              styles.discOuter,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Image source={currentTrack.cover} style={styles.discImage} />
          </Animated.View>
        </View>
      )}

      {/* Title/artist */}
      <Text style={styles.title} numberOfLines={1}>{currentTrack?.title || ''}</Text>
      <Text style={styles.artist} numberOfLines={1}>{currentTrack?.artist || ''}</Text>

      {/* Mock waveform */}
      <View style={styles.waveBar}><View style={[styles.waveFill, { width: `${progress * 100}%` }]} /></View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.time}>{formatTime(position)}</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={1}
          value={progress}
          onSlidingComplete={(v) => seek(v * (duration || 1))}
          minimumTrackTintColor="#9b6bff"
          maximumTrackTintColor="#444"
          thumbTintColor="#c69cff"
        />
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleShuffle}>
          <Ionicons name="shuffle" size={22} color={isShuffle ? '#c69cff' : '#aaa'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={previous} style={styles.ctrlBtn}>
          <Ionicons name="play-skip-back" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={isPlaying ? pause : play} style={styles.playBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={next} style={styles.ctrlBtn}>
          <Ionicons name="play-skip-forward" size={28} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleRepeat}>
          <Ionicons name="repeat" size={22} color={repeatMode === 'off' ? '#aaa' : '#c69cff'} />
          {repeatMode === 'one' && <Text style={styles.repeatOne}>1</Text>}
        </TouchableOpacity>
      </View>

      {/* Share, Download and Favorite buttons below controls */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity onPress={handleShareSong} style={styles.actionBtn}>
          <Ionicons name="share-social" size={32} color="#9b6bff" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleDownloadSong} style={styles.actionBtn}>
          <Ionicons 
            name={downloadedSongs.includes(currentTrack?.id) ? "checkmark-circle" : "download-outline"} 
            size={32} 
            color={downloadedSongs.includes(currentTrack?.id) ? "#0dc974" : "#ffd93d"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={toggleFavorite} style={styles.actionBtn}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={32} color={isFavorite ? '#FF5A5F' : '#aaa'} />
        </TouchableOpacity>
      </View>

      {/* Volume Control */}
      <View style={styles.volumeContainer}>
        <Ionicons name="volume-low" size={20} color="#aaa" />
        <Slider
          style={styles.volumeSlider}
          value={volume}
          onValueChange={setVolume}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#9b6bff"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#9b6bff"
        />
        <Ionicons name="volume-high" size={20} color="#aaa" />
      </View>

      {/* Download Modal */}
      <Modal visible={downloadVisible} transparent animationType="fade">
        <View style={styles.downloadModalBg}>
          <View style={styles.downloadModalContainer}>
            {downloadStatus === 'downloading' ? (
              <>
                <View style={styles.downloadIconContainer}>
                  <Ionicons name="cloud-download" size={60} color="#ffd93d" />
                </View>
                <Text style={styles.downloadTitle}>Đang tải nhạc...</Text>
                <Text style={styles.downloadSubtitle}>{currentTrack?.title}</Text>
                <View style={styles.loadingBar}>
                  <View style={styles.loadingBarFill} />
                </View>
              </>
            ) : downloadStatus === 'success' ? (
              <>
                <View style={styles.downloadIconContainer}>
                  <Ionicons name="checkmark-circle" size={60} color="#0dc974" />
                </View>
                <Text style={styles.downloadTitle}>Tải về thành công!</Text>
                <Text style={styles.downloadSubtitle}>
                  Giờ bạn có thể nghe nhạc offline
                </Text>
                <TouchableOpacity 
                  onPress={closeDownloadModal}
                  style={styles.downloadCloseBtn}
                >
                  <Text style={styles.downloadCloseBtnText}>Đóng</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.downloadIconContainer, { backgroundColor: 'rgba(155,107,255,0.15)' }]}>
                  <Ionicons name="checkmark-done-circle" size={60} color="#9b6bff" />
                </View>
                <Text style={styles.downloadTitle}>Nhạc đã được tải sẵn</Text>
                <Text style={styles.downloadSubtitle}>
                  {currentTrack?.title}
                </Text>
                <TouchableOpacity 
                  onPress={closeDownloadModal}
                  style={[styles.downloadCloseBtn, { backgroundColor: '#9b6bff' }]}
                >
                  <Text style={styles.downloadCloseBtnText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom curved button to open Lyrics */}
      <TouchableOpacity style={styles.lyricsTab} onPress={() => navigation.navigate('Lyrics')} activeOpacity={0.9}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Lyrics</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0f', alignItems: 'center' },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.9 },
  header: { height: 64, paddingHorizontal: 16, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  discWrapper: { 
    marginTop: 24, 
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discOuter: { 
    width: 240, 
    height: 240, 
    borderRadius: 120, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.25)' 
  },
  discImage: { width: 210, height: 210, borderRadius: 105 },
  wave: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderColor: '#9b6bff',
    backgroundColor: 'transparent',
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 22, marginTop: 8 },
  artist: { color: '#ddd', fontSize: 14, marginBottom: 16 },
  waveBar: { alignSelf: 'stretch', marginHorizontal: 24, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 4, marginBottom: 10 },
  waveFill: { height: '100%', backgroundColor: 'rgba(155,107,255,0.45)' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, alignSelf: 'stretch' },
  time: { width: 42, color: '#ccc', fontSize: 12, textAlign: 'center' },
  controls: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '80%' },
  ctrlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#8c3bff', alignItems: 'center', justifyContent: 'center' },
  repeatOne: { position: 'absolute', right: -4, top: -4, color: '#c69cff', fontSize: 10, fontWeight: '700' },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(155,107,255,0.2)',
    gap: 12
  },
  volumeSlider: {
    flex: 1,
    height: 40
  },
  favoriteBtn: { 
    marginTop: 16, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255,90,95,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,90,95,0.3)'
  },
  lyricsTab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 20 : 12, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  
  // Download Modal Styles
  downloadModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  downloadModalContainer: {
    width: '80%',
    backgroundColor: '#1a1a1f',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(155,107,255,0.3)',
    shadowColor: '#9b6bff',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10
  },
  downloadIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,217,61,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  downloadTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center'
  },
  downloadSubtitle: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20
  },
  loadingBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 10
  },
  loadingBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffd93d',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  downloadCloseBtn: {
    backgroundColor: '#0dc974',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 10
  },
  downloadCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
