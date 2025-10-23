// services/AudioManager.js
import { Audio } from 'expo-av';

class AudioManager {
  sound = null;
  currentTrack = null;
  isLoaded = false;

  async load(track, { shouldPlay = true, volume = 1.0 } = {}) {
    // nếu đang phát bài cũ -> dừng và giải phóng
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {}
    }

    this.sound = new Audio.Sound();
    this.currentTrack = track;

    try {
      await this.sound.loadAsync(track.uri, { shouldPlay, volume });
      this.isLoaded = true;
    } catch (e) {
      console.warn('AudioManager load error:', e);
      this.isLoaded = false;
    }
  }

  async play() {
    if (!this.sound) return;
    try {
      await this.sound.playAsync();
    } catch (e) {}
  }

  async pause() {
    if (!this.sound) return;
    try {
      await this.sound.pauseAsync();
    } catch (e) {}
  }

  async stop() {
    if (!this.sound) return;
    try {
      await this.sound.stopAsync();
    } catch (e) {}
  }

  async unload() {
    if (!this.sound) return;
    try {
      await this.sound.unloadAsync();
    } catch (e) {}
    this.sound = null;
    this.isLoaded = false;
  }

  async getStatus() {
    if (!this.sound) return null;
    try {
      return await this.sound.getStatusAsync();
    } catch {
      return null;
    }
  }

  setOnPlaybackStatusUpdate(callback) {
    if (!this.sound) return;
    this.sound.setOnPlaybackStatusUpdate(callback);
  }

  async setVolume(value) {
    if (!this.sound) return;
    try {
      await this.sound.setVolumeAsync(value);
    } catch {}
  }

  async setPosition(pos) {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(pos);
    } catch {}
  }
}

export default new AudioManager(); // singleton
