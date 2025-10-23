import React, { createContext, useContext, useState } from "react";

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState({});

  const toggleFavorite = (song) => {
    setFavorites(prev => prev.some(s => s.id === song.id)
      ? prev.filter(s => s.id !== song.id)
      : [...prev, song]
    );
  };

  const createPlaylist = (name) => {
    if (!name || playlists[name]) return;
    setPlaylists(prev => ({ ...prev, [name]: [] }));
  };

  const addSongToPlaylist = (playlistName, song) => {
    setPlaylists(prev => {
      const songs = prev[playlistName] || [];
      if (!songs.some(s => s.id === song.id)) {
        return { ...prev, [playlistName]: [...songs, song] };
      }
      return prev;
    });
  };

  return (
    <PlaylistContext.Provider value={{
      favorites,
      toggleFavorite,
      playlists,
      createPlaylist,
      addSongToPlaylist
    }}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => useContext(PlaylistContext);
