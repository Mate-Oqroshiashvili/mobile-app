import { useCallback, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, Animated, Image, Dimensions, Alert
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getCurrentUserId, clearCurrentUserId } from "@/lib/session";
import { getUserById, User, getRecentLogs } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";

const { width } = Dimensions.get("window");
const SLIDER_ITEM_WIDTH = width - 40;

function ImageSlider() {
  const sliderImages = [
    require("@/assets/images/1.png"),
    require("@/assets/images/3.png"),
    require("@/assets/images/4.png"),
    require("@/assets/images/5.png"),
  ];

  return (
    <View style={styles.sliderContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={SLIDER_ITEM_WIDTH + 16} decelerationRate="fast" contentContainerStyle={styles.sliderContent}>
        {sliderImages.map((img, index) => (
          <View key={String(index)} style={styles.slideWrap}>
            <Image source={img} style={styles.slideImage} resizeMode="cover" />
            <View style={styles.slideOverlay} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ActionCard({ emoji, title, subtitle, color, onPress, anim }: {
  emoji: string; title: string; subtitle: string;
  color: string; onPress: () => void; anim: Animated.Value;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale }] }}>
      <Pressable style={styles.actionCard} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.chevron, { color }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [user, setUser]           = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats] = useState({ today: 0, total: 0, allowed: 0, duplicate: 0, denied: 0 });
  const router = useRouter();

  const { t, lang, setLang } = useLanguage();
  const toggleLanguage = () => setLang(lang === 'ka' ? 'en' : 'ka');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const cardAnims  = useRef<Animated.Value[]>([]).current;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        const id = await getCurrentUserId();
        if (!id) { if (isActive) router.replace("/login"); return; }
        const u = await getUserById(id);
        if (!u) { await clearCurrentUserId(); if (isActive) router.replace("/login"); return; }
        if (isActive) setUser(u);

        const logs = await getRecentLogs(500);
        const personalLogs = logs.filter(l => l.user_id === id);
        const todayStr = new Date().toISOString().slice(0, 10);
        
        if (isActive) {
          setStats({
            today: personalLogs.filter(l => l.scanned_date === todayStr).length,
            total: personalLogs.length,
            allowed: personalLogs.filter(l => l.result === "allowed").length,
            duplicate: personalLogs.filter(l => l.result === "duplicate").length,
            denied: personalLogs.filter(l => l.result !== "allowed" && l.result !== "duplicate").length
          });
          setLoading(false);
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  const numCards = user?.role === "admin" ? 5 : 3;
  while (cardAnims.length < numCards) cardAnims.push(new Animated.Value(0));

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        Animated.sequence([
          Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(statsAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.stagger(80, cardAnims.map(a => Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }))),
        ]).start();
      }
    }, [loading])
  );

  const handleLogout = () => {
    Alert.alert(
      t('logout'), 
      t('logout_msg'), 
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('logout'), 
          style: "destructive", 
          onPress: async () => {
            await clearCurrentUserId();
            router.replace("/login");
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#0ea5e9" /></View>;

  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "";

  const actions = [
    { emoji: "📷", title: t('nav_scan_title'),   subtitle: t('nav_scan_sub'),    color: "#0ea5e9", route: "/scan"     }, 
    { emoji: "👤", title: t('nav_profile_title'),subtitle: t('nav_profile_sub'), color: "#f59e0b", route: "/profile"  }, 
    { emoji: "🏛️", title: t('nav_academy_title'),subtitle: t('nav_academy_sub'), color: "#8b5cf6", route: "/academy"  },
    ...(user?.role === "admin" ? [
      { emoji: "🔑", title: t('nav_gen_title'),  subtitle: t('nav_gen_sub'),     color: "#f43f5e", route: "/generate" },
      { emoji: "📋", title: t('nav_logs_title'), subtitle: t('nav_logs_sub'),    color: "#10b981", route: "/logs"     },
    ] : []),
  ];

  return (
    <ScrollView style={styles.mainScroll} contentContainerStyle={styles.container}>
      <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>
        <View>
          <Text style={styles.greeting}>{t('greeting')}</Text>
          <Text style={styles.username}>{user?.name}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Pressable style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{lang === 'ka' ? '🇬🇧 EN' : '🇬🇪 KA'}</Text>
          </Pressable>

          <Pressable style={styles.avatar} onPress={() => router.push("/profile")}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: headerAnim }}>
        <View style={[styles.roleBadge, user?.role === "admin" ? styles.adminBadge : styles.userBadge]}>
          <Text style={styles.roleText}>{user?.role === "admin" ? t('admin_role') : t('student_role')}</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: headerAnim }}>
        <ImageSlider />
      </Animated.View>

      <Animated.View style={{ opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Text style={styles.sectionTitle}>{user?.role === "admin" ? t('campus_stats') : t('my_attendance')}</Text>
        <View style={styles.statsGrid}>
          {[
            { label: t('today'), value: stats.today, color: "#0ea5e9" },
            { label: t('allowed'), value: stats.allowed, color: "#10b981" },
            { label: t('duplicate'), value: stats.duplicate, color: "#f59e0b" },
            { label: t('denied'), value: stats.denied, color: "#ef4444" },
          ].map(s => (
            <View key={s.label} style={[styles.statBox, { borderLeftColor: s.color }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Text style={styles.sectionTitle}>{t('navigation')}</Text>
      <View style={styles.actionsContainer}>
        {actions.map((a, i) => (
          <ActionCard key={a.route} emoji={a.emoji} title={a.title} subtitle={a.subtitle} color={a.color} onPress={() => router.push(a.route as any)} anim={cardAnims[i] ?? new Animated.Value(1)} />
        ))}
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 {t('logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainScroll:      { flex: 1, backgroundColor: "#0f172a" },
  container:       { padding: 20, paddingTop: 60, paddingBottom: 40 },
  centered:        { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" },
  
  header:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  greeting:        { color: "#94a3b8", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 },
  username:        { color: "white", fontSize: 22, fontWeight: "800", letterSpacing: -0.3, marginTop: 2 },
  
  headerRight:     { flexDirection: "row", alignItems: "center", gap: 12 },
  langBtn:         { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#1e293b", borderRadius: 10, borderWidth: 1, borderColor: "#334155" },
  langBtnText:     { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  
  avatar:          { width: 46, height: 46, borderRadius: 23, backgroundColor: "#0ea5e9", justifyContent: "center", alignItems: "center" },
  avatarText:      { color: "white", fontWeight: "800", fontSize: 16 },
  
  roleBadge:       { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  adminBadge:      { backgroundColor: "#f43f5e18", borderWidth: 1, borderColor: "#f43f5e55" },
  userBadge:       { backgroundColor: "#0ea5e918", borderWidth: 1, borderColor: "#0ea5e955" },
  roleText:        { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },
  
  sliderContainer: { marginBottom: 28, marginHorizontal: -20 },
  sliderContent:   { paddingHorizontal: 20, gap: 16 },
  slideWrap:       { width: SLIDER_ITEM_WIDTH, height: 180, borderRadius: 16, overflow: "hidden", backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155" },
  slideImage:      { width: "100%", height: "100%" },
  slideOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },

  sectionTitle:    { color: "#475569", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  statsGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 28 },
  statBox:         { width: "48%", backgroundColor: "#1e293b", borderRadius: 14, padding: 16, borderLeftWidth: 3 },
  statValue:       { fontSize: 28, fontWeight: "800" },
  statLabel:       { color: "#64748b", fontSize: 11, marginTop: 4, fontWeight: "600" },
  actionsContainer:{ gap: 10, marginBottom: 32 },
  actionCard:      { backgroundColor: "#1e293b", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", gap: 16, borderWidth: 1, borderColor: "#ffffff08" },
  actionIcon:      { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  actionTitle:     { color: "white", fontSize: 15, fontWeight: "700" },
  actionSubtitle:  { color: "#64748b", fontSize: 12, marginTop: 2 },
  chevron:         { fontSize: 22 },
  logoutBtn:       { padding: 16, alignItems: "center" },
  logoutText:      { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});