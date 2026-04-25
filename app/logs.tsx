import { getAllUsers, getRecentLogs, type ScanLog, type User } from "@/lib/db";
import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View, Pressable, Animated } from "react-native";

type Filter = "all" | "allowed" | "duplicate" | "invalid_qr";

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: "all",        label: "ყველა",     color: "#94a3b8" },
  { key: "allowed",    label: "✅ დაშვება",  color: "#22c55e" },
  { key: "duplicate",  label: "⚠️ გამეორება", color: "#f59e0b" },
  { key: "invalid_qr", label: "❌ არასწორი",  color: "#ef4444" },
];

export default function LogsScreen() {
  const [logs, setLogs]           = useState<ScanLog[]>([]);
  const [users, setUsers]         = useState<Map<string, User>>(new Map());
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<Filter>("all");
  const [searchFocused, setFocus] = useState(false);

  const tabAnim  = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const [allUsers, recent] = await Promise.all([getAllUsers(), getRecentLogs(200)]);
      setUsers(new Map(allUsers.map(u => [u.id, u])));
      setLogs(recent);
      Animated.timing(listAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    })();
  }, []);

  useEffect(() => {
    const idx = FILTERS.findIndex(f => f.key === filter);
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: false, tension: 80, friction: 10 }).start();
  }, [filter]);

  const filtered = logs.filter(l => {
    const u = users.get(l.user_id);
    const matchSearch = search.trim() === "" ||
      (u?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      l.turnstile_id.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === "all" || l.result === filter);
  });

  const colorFor = (r: string) =>
    r === "allowed" ? "#22c55e" : r === "duplicate" ? "#f59e0b" : "#ef4444";

  const activeColor = FILTERS.find(f => f.key === filter)?.color ?? "#94a3b8";

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <Stack.Screen options={{ title: "სკანირების ისტორია" }} />

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, searchFocused && styles.searchFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="მოძებნე სახელი ან turnstile..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Text style={{ color: "#475569", fontSize: 16 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterWrap}>
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <Pressable key={f.key} style={styles.filterTab} onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterLabel, filter === f.key && { color: f.color }]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.tabTrack}>
          <Animated.View style={[styles.tabIndicator, {
            backgroundColor: activeColor,
            left: tabAnim.interpolate({
              inputRange:  [0, 1, 2, 3],
              outputRange: ["0%", "25%", "50%", "75%"],
            }),
          }]} />
        </View>
      </View>

      <Text style={styles.count}>{filtered.length} ჩანაწერი</Text>

      <Animated.View style={{ flex: 1, opacity: listAnim }}>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>სკანირება არ მოიძებნა</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={l => String(l.id)}
            contentContainerStyle={{ gap: 8, padding: 16 }}
            renderItem={({ item }) => {
              const u     = users.get(item.user_id);
              const color = colorFor(item.result);
              return (
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{u?.name ?? item.user_id}</Text>
                    <Text style={styles.meta}>
                      {new Date(item.scanned_at_iso).toLocaleString("ka-GE")} · {item.turnstile_id}
                    </Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.tagText, { color }]}>{item.result}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap:    { padding: 16, paddingBottom: 8 },
  searchBox:     { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: "transparent", gap: 10 },
  searchFocused: { borderColor: "#2563eb" },
  searchIcon:    { fontSize: 14 },
  searchInput:   { flex: 1, color: "white", paddingVertical: 14, fontSize: 14 },
  filterWrap:    { paddingHorizontal: 16, marginBottom: 4 },
  filterRow:     { flexDirection: "row" },
  filterTab:     { flex: 1, paddingVertical: 10, alignItems: "center" },
  filterLabel:   { color: "#475569", fontSize: 11, fontWeight: "700" },
  tabTrack:      { height: 2, backgroundColor: "#1e293b", borderRadius: 1 },
  tabIndicator:  { position: "absolute", top: 0, height: 2, width: "25%", borderRadius: 1 },
  count:         { color: "#334155", fontSize: 11, paddingHorizontal: 16, marginBottom: 4 },
  empty:         { color: "#475569", textAlign: "center", marginTop: 48 },
  row:           { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", padding: 14, borderRadius: 12, gap: 12, borderWidth: 1, borderColor: "#ffffff08" },
  dot:           { width: 10, height: 10, borderRadius: 5 },
  name:          { color: "white", fontSize: 14, fontWeight: "600" },
  meta:          { color: "#64748b", fontSize: 11, marginTop: 2 },
  tag:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText:       { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
});