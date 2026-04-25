import { useCallback, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Animated
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { getCurrentUserId, clearCurrentUserId } from "@/lib/session";
import { getUserById, getRecentLogs, User, ScanLog } from "@/lib/db";

export default function ProfileScreen() {
  const [user, setUser]       = useState<User | null>(null);
  const [logs, setLogs]       = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const avatarScale   = useRef(new Animated.Value(0.5)).current;
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const statAnims     = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const activityAnim  = useRef(new Animated.Value(0)).current;

  // useFocusEffect ეკრანზე შემოსვლისას აახლებს ლოგებს
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        const id = await getCurrentUserId();
        if (!id) {
          if (isActive) router.replace("/login");
          return;
        }
        
        const u = await getUserById(id);
        if (!u) {
          if (isActive) router.replace("/login");
          return;
        }
        
        if (isActive) setUser(u);
        
        const all = await getRecentLogs(500);
        if (isActive) {
          setLogs(all.filter(l => l.user_id === id));
          setLoading(false);
        }
      })();

      return () => { isActive = false; };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        // ანიმაციების გადატვირთვა ყოველ შემოსვლაზე
        avatarScale.setValue(0.5);
        avatarOpacity.setValue(0);
        statAnims.forEach(a => a.setValue(0));
        activityAnim.setValue(0);

        Animated.sequence([
          Animated.parallel([
            Animated.spring(avatarScale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
            Animated.timing(avatarOpacity, { toValue: 1, duration: 400,         useNativeDriver: true }),
          ]),
          Animated.stagger(80, statAnims.map(a =>
            Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 })
          )),
          Animated.timing(activityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]).start();
      }
    }, [loading])
  );

  if (loading) return (
    <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>
  );

  const allowed   = logs.filter(l => l.result === "allowed").length;
  const duplicate = logs.filter(l => l.result === "duplicate").length;
  const denied    = logs.filter(l => l.result !== "allowed" && l.result !== "duplicate").length;
  const initials  = user?.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const STATS = [
    { label: "სულ",       value: logs.length,      color: "#2563eb" },
    { label: "დაშვება",   value: allowed,          color: "#22c55e" },
    { label: "გამეორება", value: duplicate,        color: "#f59e0b" },
    { label: "უარი",      value: denied,           color: "#ef4444" },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "პროფილი" }} />

      <Animated.View style={[styles.avatarWrap, {
        opacity: avatarOpacity,
        transform: [{ scale: avatarScale }],
      }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, user?.role === "admin" ? styles.adminBadge : styles.userBadge]}>
          <Text style={styles.roleText}>{user?.role === "admin" ? "⚙️ ადმინი" : "🎓 სტუდენტი"}</Text>
        </View>
      </Animated.View>

      <Text style={styles.sectionTitle}>ჩემი სტატისტიკა</Text>
      <View style={styles.statsGrid}>
        {STATS.map((s, i) => (
          <Animated.View key={s.label} style={[styles.statCard, {
            opacity: statAnims[i],
            transform: [
              { scale:      statAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              { translateY: statAnims[i].interpolate({ inputRange: [0, 1], outputRange: [12,  0] }) },
            ],
          }]}>
            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={{ opacity: activityAnim }}>
        <Text style={styles.sectionTitle}>ბოლო სკანირებები</Text>
        {logs.slice(0, 5).map(l => {
          const color = l.result === "allowed" ? "#22c55e" : l.result === "duplicate" ? "#f59e0b" : "#ef4444";
          return (
            <View key={l.id} style={styles.actRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actTurnstile}>{l.turnstile_id}</Text>
                <Text style={styles.actTime}>{new Date(l.scanned_at_iso).toLocaleString("ka-GE")}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: color + "22" }]}>
                <Text style={[styles.tagText, { color }]}>{l.result}</Text>
              </View>
            </View>
          );
        })}
        {logs.length === 0 && <Text style={styles.empty}>სკანირება ჯერ არ ყოფილა</Text>}
      </Animated.View>

      <Pressable style={styles.logoutBtn} onPress={async () => { await clearCurrentUserId(); router.replace("/login"); }}>
        <Text style={styles.logoutText}>🚪 გამოსვლა</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, paddingTop: 20, paddingBottom: 40 },
  centered:     { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  avatarWrap:   { alignItems: "center", marginBottom: 32 },
  avatar:       { width: 86, height: 86, borderRadius: 43, backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center", marginBottom: 14, borderWidth: 3, borderColor: "#1d4ed8" },
  avatarText:   { color: "white", fontSize: 30, fontWeight: "800" },
  name:         { color: "white", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  email:        { color: "#64748b", fontSize: 13, marginTop: 4 },
  roleBadge:    { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  adminBadge:   { backgroundColor: "#7c3aed18", borderWidth: 1, borderColor: "#7c3aed55" },
  userBadge:    { backgroundColor: "#15803d18", borderWidth: 1, borderColor: "#15803d55" },
  roleText:     { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },
  sectionTitle: { color: "#475569", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  statsGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  statCard:     { flex: 1, minWidth: "45%", backgroundColor: "#1e293b", borderRadius: 14, padding: 18, alignItems: "center", borderWidth: 1, borderColor: "#ffffff08" },
  statNum:      { fontSize: 30, fontWeight: "800" },
  statLabel:    { color: "#64748b", fontSize: 12, marginTop: 3, fontWeight: "600" },
  actRow:       { flexDirection: "row", alignItems: "center", backgroundColor: "#1e293b", padding: 14, borderRadius: 12, gap: 12, marginBottom: 8, borderWidth: 1, borderColor: "#ffffff08" },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  actTurnstile: { color: "white", fontSize: 14, fontWeight: "600" },
  actTime:      { color: "#64748b", fontSize: 11, marginTop: 2 },
  tag:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText:      { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  empty:        { color: "#475569", textAlign: "center", marginVertical: 20 },
  logoutBtn:    { marginTop: 32, padding: 16, alignItems: "center" },
  logoutText:   { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});