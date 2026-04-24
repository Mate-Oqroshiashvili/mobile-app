import { getUserById } from "@/libs/db";
import { clearCurrentUserId, getCurrentUserId } from "@/libs/session";
import type { User } from "@/libs/users";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const id = await getCurrentUserId();
        if (!id) {
          router.replace("/login");
          return;
        }
        const u = await getUserById(id);
        if (active) {
          setUser(u);
          setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [router]),
  );

  if (loading)
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Loading…</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Academy Check-In" }} />
      <Text style={styles.greeting}>Hello, {user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <View style={styles.buttons}>
        <Btn
          label="📷  Scan turnstile QR"
          color="#2563eb"
          onPress={() => router.push("/scan")}
        />
        <Btn
          label="🔳  Generate QR (admin)"
          color="#0891b2"
          onPress={() => router.push("/generate")}
        />
        <Btn
          label="📋  Scan history"
          color="#7c3aed"
          onPress={() => router.push("/logs")}
        />
        <Btn
          label="🚪  Switch user"
          color="#475569"
          onPress={async () => {
            await clearCurrentUserId();
            router.replace("/login");
          }}
        />
      </View>
    </View>
  );
}

function Btn({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  greeting: { color: "white", fontSize: 28, fontWeight: "700" },
  email: { color: "#94a3b8", fontSize: 14, marginBottom: 32 },
  buttons: { gap: 12 },
  button: { padding: 18, borderRadius: 12 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
