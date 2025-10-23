import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';

export const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off | one | all
  const [volume, setVolume] = useState(1.0); // Volume từ 0.0 đến 1.0

  const soundRef = useRef(null);
  const isLoadingRef = useRef(false);
  const pollTimerRef = useRef(null);
  const endHandledRef = useRef(false);
  const mountedRef = useRef(true);
  // Refs to avoid stale closures in timers
  const currentIndexRef = useRef(0);
  const playlistRef = useRef([]);
  const repeatModeRef = useRef('off');
  const isShuffleRef = useRef(false);

  // helper: pick random index not equal to exclude (if possible)
  const randomIndex = useCallback((exclude) => {
    const list = playlistRef.current; // Use ref to avoid stale closure
    if (!list || list.length <= 1) return exclude ?? 0;
    let idx;
    do { idx = Math.floor(Math.random() * list.length); } while (idx === exclude);
    return idx;
  }, []); // No dependencies needed since we use ref

  // Setup audio mode on mount
  useEffect(() => {
    mountedRef.current = true;
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    }).catch(() => {});
    // Start a lightweight polling fallback so UI always progresses even if native callbacks throttle
    try {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    } catch (e) {}
    pollTimerRef.current = setInterval(async () => {
      const s = soundRef.current;
      if (!s) return;
      try {
        const st = await s.getStatusAsync();
        if (st?.isLoaded) {
          setPosition(st.positionMillis ?? 0);
          setDuration(st.durationMillis ?? 1);
          setIsPlaying(!!st.isPlaying);
          // Fallback: if we're within ~400ms of the end and haven't handled end yet, advance
          const dur = st.durationMillis ?? 0;
          const pos = st.positionMillis ?? 0;
          if (dur > 0 && pos >= dur - 400 && !endHandledRef.current) {
            endHandledRef.current = true;
            const rpt = repeatModeRef.current;
            if (rpt === 'one') {
              try {
                await s.setPositionAsync(0);
                await s.playAsync();
              } catch (e) {}
            } else {
              const list = playlistRef.current || [];
              const current = currentIndexRef.current || 0;
              const doShuffle = isShuffleRef.current;
              let nextIdx;
              if (doShuffle) {
                if (!list || list.length <= 1) {
                  nextIdx = current;
                } else {
                  let idx;
                  do { idx = Math.floor(Math.random() * list.length); } while (idx === current);
                  nextIdx = idx;
                }
              } else {
                nextIdx = (current + 1 >= list.length) ? (rpt === 'all' ? 0 : -1) : current + 1;
              }
              if (nextIdx === -1) {
                try { await s.stopAsync(); } catch (e) {}
                setIsPlaying(false);
              } else {
                // do not await to avoid blocking the interval
                setTimeout(() => { loadIndex(nextIdx, { play: true }); }, 20);
              }
            }
          }
        }
      } catch (e) {}
    }, 100);
    return () => {
      mountedRef.current = false;
      try { if (pollTimerRef.current) clearInterval(pollTimerRef.current); } catch (e) {}
    };
  }, []);

  // keep refs in sync with state
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);

  // Update volume when changed
  useEffect(() => {
    const updateVolume = async () => {
      if (soundRef.current) {
        try {
          await soundRef.current.setVolumeAsync(volume);
        } catch (error) {
          console.error('Error setting volume:', error);
        }
      }
    };
    updateVolume();
  }, [volume]);

  // Safely unload current sound
  const unloadCurrent = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      s.setOnPlaybackStatusUpdate(null);
      await s.stopAsync().catch(() => {});
      await s.unloadAsync().catch(() => {});
    } catch (e) {}
    soundRef.current = null;
  }, []);

  // Playback status handler
  const onPlaybackStatusUpdate = useCallback((status) => {
    // NOTE: keep this callback synchronous — async functions can cause missed events
    if (!status || !mountedRef.current) return;
    if (!status.isLoaded) return;

    setPosition(status.positionMillis ?? 0);
    setDuration(status.durationMillis ?? 1);
    setIsPlaying(!!status.isPlaying);
    // If user scrubbed back far from the end, re-arm end handling
    const d = status.durationMillis ?? 0;
    const p = status.positionMillis ?? 0;
    if (d > 0 && d - p > 1000) {
      endHandledRef.current = false;
    }

    if (status.didJustFinish) {
      if (endHandledRef.current) return; // already handled for this track
      endHandledRef.current = true;
      // handle repeat one by restarting the current sound - use ref to avoid stale closure
      if (repeatModeRef.current === 'one') {
        try {
          if (soundRef.current) {
            // schedule without awaiting
            soundRef.current.setPositionAsync(0).catch(() => {});
            soundRef.current.playAsync().catch(() => {});
          }
        } catch (e) {}
        return;
      }

      // compute next index - use refs to avoid stale closures
      const current = currentIndexRef.current;
      const list = playlistRef.current;
      const repeat = repeatModeRef.current;
      const shuffle = isShuffleRef.current;
      
      const nextIdx = shuffle 
        ? randomIndex(current) 
        : (current + 1 >= list.length ? (repeat === 'all' ? 0 : -1) : current + 1);

      if (nextIdx === -1) {
        // repeat off and at end -> stop
        try { if (soundRef.current) soundRef.current.stopAsync().catch(() => {}); } catch (e) {}
        setIsPlaying(false);
        setPosition(status.durationMillis ?? (status.positionMillis ?? 0));
        return;
      }

      // schedule loading of the next track to avoid reentrancy in the playback callback
      setTimeout(() => { loadIndex(nextIdx, { play: true }); }, 50);
    }
  }, [randomIndex, loadIndex]);

  // Core: load track by index and optionally play
  const loadIndex = useCallback(async (index, { play = true } = {}) => {
    const list = playlistRef.current; // Use ref instead of state to avoid stale closure
    console.log('🎵 loadIndex called - index:', index, 'play:', play, 'playlist length:', list?.length);
    if (!list || list.length === 0) {
      console.log('⚠️ No playlist available');
      return;
    }
    if (index < 0 || index >= list.length) {
      console.log('⚠️ Index out of range');
      return;
    }
    // We are starting a new track load, clear end-handled flag
    endHandledRef.current = false;
    // If selecting the same index and a sound already exists, resume without reloading
    if (index === currentIndexRef.current && soundRef.current) {
      console.log('✅ Same track, resuming playback');
      try { if (play) await soundRef.current.playAsync(); } catch (e) {}
      return;
    }
    if (isLoadingRef.current) {
      console.log('⚠️ Already loading');
      return;
    }
    isLoadingRef.current = true;
    try {
      const track = list[index];
      console.log('🎼 Loading track:', track?.title, 'has lyrics:', !!track?.lyrics);
      if (!track) return;

      // unload existing sound first
      await unloadCurrent();

      // create sound and attach handler
      const { sound, status } = await Audio.Sound.createAsync(track.uri, { shouldPlay: !!play });
      soundRef.current = sound;
      // ensure frequent progress updates for smooth progress bar/lyrics sync
      // Ultra-frequent progress updates for very smooth UI/lyrics sync (may impact battery/CPU)
      try { await sound.setProgressUpdateIntervalAsync(10); } catch (e) {}
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

      setCurrentIndex(index);
      setCurrentTrack(track);
      setDuration(status?.durationMillis ?? 1);
      setPosition(status?.positionMillis ?? 0);
      setIsPlaying(!!status?.isPlaying);
      console.log('✅ Track loaded successfully, isPlaying:', !!status?.isPlaying);
    } catch (e) {
      console.warn('❌ PlayerContext.loadIndex error', e);
    } finally {
      isLoadingRef.current = false;
    }
  }, [unloadCurrent, onPlaybackStatusUpdate]); // Removed playlist and currentIndex from dependencies since we use refs

  // Public controls
  const play = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) { console.warn('play error', e); }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (e) { console.warn('pause error', e); }
  }, []);

  const seek = useCallback(async (ms) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(ms);
      setPosition(ms);
    } catch (e) { console.warn('seek error', e); }
  }, []);

  const next = useCallback(async () => {
    const list = playlistRef.current; // Use ref
    const current = currentIndexRef.current;
    const shuffle = isShuffleRef.current;
    if (!list || list.length === 0) return;
    const nextIdx = shuffle ? randomIndex(current) : ((current + 1) % list.length);
    await loadIndex(nextIdx, { play: true });
  }, [randomIndex, loadIndex]); // Use refs, remove state dependencies

  const previous = useCallback(async () => {
    const list = playlistRef.current; // Use ref
    const current = currentIndexRef.current;
    const shuffle = isShuffleRef.current;
    if (!list || list.length === 0) return;
    const prevIdx = shuffle ? randomIndex(current) : (current === 0 ? list.length - 1 : current - 1);
    await loadIndex(prevIdx, { play: true });
  }, [randomIndex, loadIndex]); // Use refs, remove state dependencies

  const toggleShuffle = useCallback(() => setIsShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeatMode(r => (r === 'off' ? 'one' : r === 'one' ? 'all' : 'off')), []);

  // When playlist changed externally, ensure currentIndex still valid and update currentTrack
  useEffect(() => {
    if (!playlist || playlist.length === 0) {
      // stop playback
      (async () => { await unloadCurrent(); setCurrentTrack(null); setIsPlaying(false); setPosition(0); setDuration(1); })();
      return;
    }
    if (currentIndex < 0 || currentIndex >= playlist.length) {
      setCurrentIndex(0);
      loadIndex(0, { play: false });
      return;
    }
    // if playlist changed but track id differs, reload current index to refresh uri refs
    const track = playlist[currentIndex];
    if (track && (!currentTrack || currentTrack.id !== track.id)) {
      // do not autoplay when playlist updated externally unless isPlaying was true previously
      loadIndex(currentIndex, { play: isPlaying });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  const value = {
    // state
    playlist,
    setPlaylist,
    currentIndex,
    setCurrentIndex: (i) => {
      if (typeof i !== 'number') return;
      if (i === currentIndex && soundRef.current) {
        play();
        return;
      }
      loadIndex(i, { play: true });
    },
    currentTrack,
    isPlaying,
    position,
    duration,
    isShuffle,
    repeatMode,
    volume,
    setVolume,
    // refs / sound
    soundRef,
    // controls
    loadIndex,
    play,
    pause,
    seek,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export default PlayerProvider;
