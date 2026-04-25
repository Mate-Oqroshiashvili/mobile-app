import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useRouter, Link } from "expo-router";
import { getCurrentUserId, clearCurrentUserId } from "@/lib/session";
import { getUserById, User } from "@/lib/db";

export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const id = await getCurrentUserId();
      if (!id) return router.replace("/login");
      const u = await getUserById(id);
      if (!u) {
        await clearCurrentUserId();
        return router.replace("/login");
      }
      setUser(u);
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>გამარჯობა, {user?.name}!</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <Link href="/scan" asChild>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>QR კოდის დასკანერება</Text>
          </Pressable>
        </Link>

        {user?.role === "admin" && (
          <>
            <Link href="/generate" asChild>
              <Pressable style={[styles.actionBtn, styles.adminBtn]}>
                <Text style={styles.actionBtnText}>QR-ის გენერაცია</Text>
              </Pressable>
            </Link>
            <Link href="/logs" asChild>
              <Pressable style={[styles.actionBtn, styles.adminBtn]}>
                <Text style={styles.actionBtnText}>სკანირების ისტორია</Text>
              </Pressable>
            </Link>
          </>
        )}
      </View>

      <Pressable style={styles.logoutBtn} onPress={async () => {
        await clearCurrentUserId();
        router.replace("/login");
      }}>
        <Text style={styles.logoutText}>გამოსვლა</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", alignItems: "center", padding: 20, paddingTop: 60 },
  centered: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  welcome: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  badge: { backgroundColor: "#2563eb", paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 40 },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  
  actionsContainer: { width: "100%", gap: 15 },
  actionBtn: { backgroundColor: "#22c55e", padding: 18, borderRadius: 12, alignItems: "center", width: "100%" },
  adminBtn: { backgroundColor: "#475569" },
  actionBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },

  logoutBtn: { marginTop: "auto", marginBottom: 30, padding: 15 },
  logoutText: { color: "#ef4444", fontWeight: "bold", fontSize: 16 }
});