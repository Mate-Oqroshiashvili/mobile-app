import { useState } from "react";
import { View, TextInput, StyleSheet, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "@/lib/db";
import { setCurrentUserId } from "@/lib/session";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const user = await loginUser(email, password);
    if (user) {
      await setCurrentUserId(user.id);
      router.replace("/");
    } else {
      Alert.alert("შეცდომა", "იმეილი ან პაროლი არასწორია");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ავტორიზაცია</Text>
      <TextInput placeholder="იმეილი" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#64748b" />
      <TextInput placeholder="პაროლი" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#64748b" />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.btnText}>შესვლა</Text>
      </Pressable>
      <Pressable onPress={() => router.push("/register")} style={{marginTop: 20}}>
        <Text style={styles.link}>რეგისტრაცია</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#0f172a" },
  title: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 40, textAlign: "center" },
  input: { backgroundColor: "#1e293b", color: "white", padding: 18, borderRadius: 12, marginBottom: 15 },
  button: { backgroundColor: "#2563eb", padding: 20, borderRadius: 12, alignItems: "center" },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  link: { color: "#94a3b8", textAlign: "center" }
});