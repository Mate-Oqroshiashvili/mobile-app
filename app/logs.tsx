import { getAllUsers, getRecentLogs, type ScanLog } from "@/lib/db";
import type { User } from "@/lib/users";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function LogsScreen() {
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    (async () => {
      const [allUsers, recent] = await Promise.all([
        getAllUsers(),
        getRecentLogs(200),
      ]);
      setUsers(new Map(allUsers.map((u) => [u.id, u])));
      setLogs(recent);
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Scan history" }} />
      {logs.length === 0 ? (
        <Text style={styles.empty}>No scans yet.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={{ gap: 8, padding: 16 }}
          renderItem={({ item }) => {
            const u = users.get(item.user_id);
            const color =
              item.result === "allowed"
                ? "#22c55e"
                : item.result === "duplicate"
                  ? "#f59e0b"
                  : "#ef4444";
            return (
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u?.name ?? item.user_id}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.scanned_at_iso).toLocaleString()} ·{" "}
                    {item.turnstile_id}
                  </Text>
                </View>
                <Text style={[styles.tag, { color }]}>{item.result}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 10,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { color: "white", fontSize: 15, fontWeight: "600" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  tag: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
});
