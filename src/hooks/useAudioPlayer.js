import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
/**
 * useAudioPlayer
 * Xử lý Bluetooth / tai nghe (Play-Pause-Next-Prev)
 * - Tự tắt khi đang chạy trong Expo Go (để tránh native module error)
 * - Hoạt động bình thường khi chạy trong dev/prod build có `react-native-track-player`
 */
export default function useAudioPlayer({
  onPlayPause,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onStop,
} = {}) {
  const availableRef = useRef(false);
  const subsRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === 'web') {
      console.warn('useAudioPlayer: running on web — TrackPlayer disabled.');
      return;
    }
    // 🚫 Nếu đang chạy trong Expo Go, bỏ qua toàn bộ phần native
    const isExpoGo =
      Constants?.appOwnership === 'expo' ||
      Constants?.executionEnvironment === 'storeClient';

    if (isExpoGo) {
      console.log(
        '🎧 useAudioPlayer: đang chạy trong Expo Go — Bluetooth controls bị vô hiệu hóa.\n' +
          '👉 Hãy tạo Development Build để dùng tai nghe điều khiển nhạc.'
      );
      availableRef.current = false;
      return () => {};
    }

    // ✅ Nếu không phải Expo Go → thử load react-native-track-player
    (async () => {
      try {
        // eslint-disable-next-line global-require
        const TrackPlayer = require('react-native-track-player');

        if (!mounted || !TrackPlayer) return;

        await TrackPlayer.setupPlayer().catch(() => {});

        await TrackPlayer.updateOptions({
          stopWithApp: false,
          capabilities: [
            TrackPlayer.CAPABILITY_PLAY,
            TrackPlayer.CAPABILITY_PAUSE,
            TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
            TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
            TrackPlayer.CAPABILITY_STOP,
          ],
          compactCapabilities: [
            TrackPlayer.CAPABILITY_PLAY,
            TrackPlayer.CAPABILITY_PAUSE,
          ],
        });

        const add = (event, handler) => {
          try {
            const sub = TrackPlayer.addEventListener(event, handler);
            subsRef.current.push(sub);
          } catch {}
        };

        add('remote-play', () => (onPlay ? onPlay() : onPlayPause?.()));
        add('remote-pause', () => (onPause ? onPause() : onPlayPause?.()));
        add('remote-stop', () => onStop?.());
        add('remote-next', () => onNext?.());
        add('remote-previous', () => onPrevious?.());

        availableRef.current = true;
        console.log('🎧 Bluetooth remote controls đã được kích hoạt.');
      } catch (err) {
        console.warn(
          '⚠️ useAudioPlayer: react-native-track-player chưa được cài hoặc không hoạt động.',
          err?.message || err
        );
        availableRef.current = false;
      }
    })();

    return () => {
      mounted = false;
      try {
        subsRef.current.forEach((s) => s?.remove?.());
        subsRef.current = [];
      } catch {}
    };
  }, []);

  return {
    isRemoteControlsAvailable: () => !!availableRef.current,
  };
}
