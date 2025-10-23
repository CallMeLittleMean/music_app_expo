import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { usePlaylist } from "../context/PlaylistContext";

export default function SongItem({ song }) {
  const { favorites, toggleFavorite } = usePlaylist();

  const isFavorite = favorites.some((s) => s.id === song.id);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{song.title}</Text>
      <TouchableOpacity onPress={() => toggleFavorite(song)}>
        <Text style={{ color: isFavorite ? "red" : "gray" }}>
          {isFavorite ? "❤️ Bỏ thích" : "🤍 Yêu thích"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 16 },
});
