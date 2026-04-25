import { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  Pressable,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { loginUser } from "@/lib/db";
import { setCurrentUserId } from "@/lib/session";
import { useLanguage } from "@/lib/LanguageContext"; // 👈 ჩვენი ენის მოდული

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const router = useRouter();

  // ვიძახებთ ენის ლოგიკას
  const { t, lang, setLang } = useLanguage();

  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 9,
        }),
      ]),
    ]).start();
  }, []);

  const shake = () => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -8,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pressIn = () =>
    Animated.spring(btnScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
    }).start();
  const pressOut = () =>
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();

  const handleLogin = async () => {
    const user = await loginUser(email, password);
    if (user) {
      await setCurrentUserId(user.id);
      router.replace("/");
    } else {
      shake();
      Alert.alert(t("error"), t("email_error")); // 👈 თარგმნილი Alert
    }
  };

  // ენის გადამრთველი ფუნქცია
  const toggleLanguage = () => {
    setLang(lang === "ka" ? "en" : "ka");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🌐 ენის გადამრთველი ღილაკი */}
        <Pressable style={styles.langSwitchBtn} onPress={toggleLanguage}>
          <Text style={styles.langSwitchText}>{t("lang_switch")}</Text>
        </Pressable>

        {/* ლოგო */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Text style={{ fontSize: 38 }}>🎓</Text>
          </View>
          <Text style={styles.appName}>{t("login_title")}</Text>
          <Text style={styles.tagline}>{t("login_subtitle")}</Text>
        </Animated.View>

        {/* ფორმა */}
        <Animated.View
          style={{
            opacity: formOpacity,
            transform: [{ translateY: formSlide }, { translateX: shakeX }],
            width: "100%",
          }}
        >
          <View
            style={[
              styles.inputWrap,
              focused === "email" && styles.inputFocused,
            ]}
          >
            <Text style={styles.icon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder={t("email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#475569"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View
            style={[
              styles.inputWrap,
              focused === "pass" && styles.inputFocused,
            ]}
          >
            <Text style={styles.icon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder={t("password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#475569"
              onFocus={() => setFocused("pass")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={styles.button}
              onPress={handleLogin}
              onPressIn={pressIn}
              onPressOut={pressOut}
            >
              <Text style={styles.btnText}>{t("login_btn")}</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => router.push("/register")}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.link}>
              {t("no_account")}
              <Text style={{ color: "#0ea5e9", fontWeight: "600" }}>
                {t("register_link")}
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 28, justifyContent: "center" },

  // ენის ღილაკის სტილი
  langSwitchBtn: {
    position: "absolute",
    top: 60,
    left: 28, // 👈 right: 28 შეიცვალა left: 28-ით!
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 10,
  },
  langSwitchText: { color: "#e2e8f0", fontSize: 13, fontWeight: "700" },

  logoWrap: { alignItems: "center", marginBottom: 48 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 26,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0ea5e955",
  },
  appName: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tagline: {
    color: "#0ea5e9",
    fontSize: 13,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 1,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 16,
  },
  inputFocused: { borderColor: "#0ea5e9" },
  icon: { fontSize: 16, marginRight: 12 },
  input: { flex: 1, color: "white", paddingVertical: 17, fontSize: 15 },

  button: {
    backgroundColor: "#0ea5e9",
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  link: { color: "#64748b", textAlign: "center", fontSize: 14 },
});
