import { useState } from "react";
import { View, TextInput, StyleSheet, Text, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { registerUser, UserRole } from "@/lib/db";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("შეცდომა", "გთხოვთ შეავსოთ ყველა ველი");
      return;
    }

    try {
      await registerUser({ name, email, password, role });
      Alert.alert("წარმატება", "რეგისტრაცია დასრულდა", [
        { text: "შესვლა", onPress: () => router.replace("/login") }
      ]);
    } catch (e: any) {
      if (e.message === "EMAIL_EXISTS") {
        Alert.alert("შეცდომა", "ეს იმეილი უკვე გამოყენებულია");
      } else {
        Alert.alert("ბაზის შეცდომა", "მონაცემების შენახვა ვერ მოხერხდა.");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>რეგისტრაცია</Text>
      
      <TextInput placeholder="სრული სახელი" style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#64748b" />
      <TextInput placeholder="იმეილი" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#64748b" />
      <TextInput placeholder="პაროლი" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#64748b" />
      
      <View style={styles.roleRow}>
        <Pressable style={[styles.roleBtn, role === 'user' && styles.activeBtn]} onPress={() => setRole('user')}>
          <Text style={styles.roleText}>სტუდენტი</Text>
        </Pressable>
        <Pressable style={[styles.roleBtn, role === 'admin' && styles.activeBtn]} onPress={() => setRole('admin')}>
          <Text style={styles.roleText}>ადმინი</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.btnText}>ანგარიშის შექმნა</Text>
      </Pressable>
      
      <Pressable onPress={() => router.replace("/login")} style={{marginTop: 20}}>
        <Text style={styles.link}>უკვე გაქვს აქაუნთი? შესვლა</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center", backgroundColor: "#0f172a" },
  title: { color: "white", fontSize: 28, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  input: { backgroundColor: "#1e293b", color: "white", padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 15, backgroundColor: "#1e293b", borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  activeBtn: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  roleText: { color: "white", fontWeight: "600" },
  button: { backgroundColor: "#2563eb", padding: 20, borderRadius: 12, alignItems: "center", marginTop: 10 },
  btnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  link: { color: "#94a3b8", textAlign: "center" }
});