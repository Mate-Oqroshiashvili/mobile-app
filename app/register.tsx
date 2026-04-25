import { useState, useRef, useEffect } from "react";
import {
  View, TextInput, StyleSheet, Text, Pressable, Alert,
  Animated, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { registerUser, UserRole } from "@/lib/db";

export default function RegisterScreen() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]       = useState<UserRole>("user");
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(30)).current;
  const btnScale    = useRef(new Animated.Value(1)).current;
  const roleSlider  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
    ]).start();
  }, []);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    Animated.spring(roleSlider, {
      toValue: newRole === "user" ? 0 : 1,
      useNativeDriver: false,
      tension: 70, friction: 10,
    }).start();
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("შეცდომა", "გთხოვთ შეავსოთ ყველა ველი"); return;
    }
    try {
      await registerUser({ name, email, password, role });
      Alert.alert("✅ წარმატება", "რეგისტრაცია დასრულდა", [
        { text: "შესვლა", onPress: () => router.replace("/login") },
      ]);
    } catch (e: any) {
      Alert.alert("შეცდომა", e.message === "EMAIL_EXISTS"
        ? "ეს იმეილი უკვე გამოყენებულია"
        : "შეცდომა მოხდა");
    }
  };

  const pressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  const sliderLeft = roleSlider.interpolate({ inputRange: [0, 1], outputRange: ["0%", "50%"] });

  const FIELDS = [
    { key: "name",  placeholder: "სრული სახელი", value: name,     onChange: setName,     icon: "👤", secure: false, kb: "default"       as const },
    { key: "email", placeholder: "იმეილი",       value: email,    onChange: setEmail,    icon: "✉️", secure: false, kb: "email-address" as const },
    { key: "pass",  placeholder: "პაროლი",       value: password, onChange: setPassword, icon: "🔒", secure: true,  kb: "default"       as const },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          width: "100%",
        }}>
          <Text style={styles.title}>ანგარიშის შექმნა</Text>
          <Text style={styles.subtitle}>შეავსე მონაცემები</Text>

          {FIELDS.map(f => (
            <View key={f.key} style={[styles.inputWrap, focused === f.key && styles.inputFocused]}>
              <Text style={styles.icon}>{f.icon}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                value={f.value}
                onChangeText={f.onChange}
                autoCapitalize="none"
                keyboardType={f.kb}
                secureTextEntry={f.secure}
                placeholderTextColor="#475569"
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused(null)}
              />
            </View>
          ))}

          <Text style={styles.roleLabel}>როლი</Text>
          <View style={styles.rolePicker}>
            <Animated.View style={[styles.roleSlider, { left: sliderLeft }]} />
            <Pressable style={styles.roleOpt} onPress={() => switchRole("user")}>
              <Text style={[styles.roleText, role === "user" && styles.roleTextActive]}>🎓 სტუდენტი</Text>
            </Pressable>
            <Pressable style={styles.roleOpt} onPress={() => switchRole("admin")}>
              <Text style={[styles.roleText, role === "admin" && styles.roleTextActive]}>⚙️ ადმინი</Text>
            </Pressable>
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 24 }}>
            <Pressable style={styles.button} onPress={handleRegister} onPressIn={pressIn} onPressOut={pressOut}>
              <Text style={styles.btnText}>ანგარიშის შექმნა →</Text>
            </Pressable>
          </Animated.View>

          <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 20 }}>
            <Text style={styles.link}>
              უკვე გაქვს ანგარიში?{" "}
              <Text style={{ color: "#2563eb", fontWeight: "600" }}>შესვლა</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, padding: 28, justifyContent: "center", paddingTop: 60 },
  title:          { color: "white", fontSize: 28, fontWeight: "800", marginBottom: 8, letterSpacing: -0.5 },
  subtitle:       { color: "#64748b", fontSize: 14, marginBottom: 32 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1e293b", borderRadius: 14, marginBottom: 12,
    borderWidth: 1.5, borderColor: "transparent", paddingHorizontal: 16,
  },
  inputFocused:   { borderColor: "#2563eb" },
  icon:           { fontSize: 16, marginRight: 12 },
  input:          { flex: 1, color: "white", paddingVertical: 17, fontSize: 15 },
  roleLabel:      { color: "#64748b", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  rolePicker:     { flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 14, padding: 4, position: "relative", overflow: "hidden" },
  roleSlider:     { position: "absolute", top: 4, bottom: 4, width: "50%", backgroundColor: "#2563eb", borderRadius: 10 },
  roleOpt:        { flex: 1, paddingVertical: 13, alignItems: "center" },
  roleText:       { color: "#64748b", fontWeight: "600", fontSize: 14 },
  roleTextActive: { color: "white" },
  button:         { backgroundColor: "#2563eb", padding: 18, borderRadius: 14, alignItems: "center" },
  btnText:        { color: "white", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },
  link:           { color: "#64748b", textAlign: "center", fontSize: 14 },
});