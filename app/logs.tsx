import { getAllUsers } from "@/libs/db";
import { setCurrentUserId } from "@/libs/session";
import type { User } from "@/libs/users";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getAllUsers().then(setUsers);
  }, []);

  const pick = async (u: User) => {
    await setCurrentUserId(u.id);
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Pick user" }} />
      <Text style={styles.title}>Who are you?</Text>
      <Text style={styles.subtitle}>
        (temporary — replaced by real login later)
      </Text>
      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ gap: 12, paddingTop: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => pick(item)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { color: "white", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#94a3b8", fontSize: 13 },
  item: { backgroundColor: "#1e293b", padding: 18, borderRadius: 12 },
  name: { color: "white", fontSize: 17, fontWeight: "600" },
  email: { color: "#94a3b8", fontSize: 13, marginTop: 4 },
});
