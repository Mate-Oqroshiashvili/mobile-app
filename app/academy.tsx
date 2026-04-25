import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Animated, Pressable } from "react-native";
import { Stack } from "expo-router";

// STEP IT Academy-ს ოფიციალური სასწავლო მიმართულებები
const COURSES = [
  {
    id: "step_sd",
    title: "პროგრამული უზრუნველყოფის შემუშავება",
    tech: "C++, C#, Java, Python, Web Dev",
    duration: "2.5 წელი",
    level: "პროფესიონალური",
    color: "#0ea5e9", // Step Blue
    desc: "ისწავლეთ პროგრამირება ნულიდან პროფესიონალის დონემდე. შექმენით დესკტოპ, ვებ და მობაილ აპლიკაციები. კურსი მოიცავს ალგორითმებს, მონაცემთა ბაზებს და ობიექტზე ორიენტირებულ პროგრამირებას.",
    syllabus: [
      "პროგრამირების საფუძვლები C++",
      "ობიექტზე ორიენტირებული პროგრამირება (OOP)",
      "Web დეველოპმენტი (HTML, CSS, JS, React/Angular)",
      "ბექენდ ტექნოლოგიები (C# .NET, Java ან Python)"
    ],
    outcomes: "შეძლებთ იმუშაოთ Software Developer-ად, შექმნათ რთული არქიტექტურის მქონე პროგრამული პროდუქტები.",
  },
  {
    id: "step_cg",
    title: "კომპიუტერული გრაფიკა და დიზაინი",
    tech: "Adobe CC, Autodesk 3ds Max, Maya",
    duration: "2.5 წელი",
    level: "პროფესიონალური",
    color: "#f59e0b", // Step Yellow/Orange
    desc: "დაეუფლეთ 2D და 3D გრაფიკას, ვებ-დიზაინს, ფოტო/ვიდეო მონტაჟსა და ანიმაციას. კურსი ამზადებს უნივერსალურ დიზაინერებს თანამედროვე ბაზრისთვის.",
    syllabus: [
      "რასტრული და ვექტორული გრაფიკა (Photoshop, Illustrator)",
      "UI/UX ვებ-დიზაინი და პროტოტიპირება (Figma)",
      "3D მოდელირება და ანიმაცია (3ds Max, Maya)",
      "ვიდეო მონტაჟი და ეფექტები (Premiere Pro, After Effects)"
    ],
    outcomes: "შეძლებთ იმუშაოთ გრაფიკულ დიზაინერად, 3D არტისტად ან UI/UX სპეციალისტად.",
  },
  {
    id: "step_nw",
    title: "ქსელები და კიბერუსაფრთხოება",
    tech: "Cisco, Windows Server, Linux, Ethical Hacking",
    duration: "2.5 წელი",
    level: "პროფესიონალური",
    color: "#10b981", // Green
    desc: "გახდით მოთხოვნადი IT ინჟინერი. ისწავლეთ კორპორატიული ქსელების აგება, სერვერების ადმინისტრირება და სისტემების დაცვა კიბერშეტევებისგან.",
    syllabus: [
      "აპარატურული უზრუნველყოფა და კომპიუტერული ქსელები (Cisco)",
      "სისტემური ადმინისტრირება (Windows Server & Linux)",
      "ქლაუდ ტექნოლოგიები (AWS, Azure)",
      "კიბერუსაფრთხოება და ეთიკური ჰაკინგი"
    ],
    outcomes: "შეძლებთ იმუშაოთ სისტემურ ადმინისტრატორად, ქსელის ინჟინრად და კიბერუსაფრთხოების სპეციალისტად.",
  },
  {
    id: "step_kids",
    title: "Junior IT Academy (9-14 წელი)",
    tech: "Robotics, Scratch, Python, 3D Print",
    duration: "ეტაპობრივი",
    level: "საბავშვო",
    color: "#ec4899", // Pink
    desc: "კომპიუტერული ტექნოლოგიების საფუძვლები ბავშვებისთვის. რობოტექნიკა, თამაშების შექმნა, 3D ბეჭდვა და ბლოკური პროგრამირება - ეს ყველაფერი სახალისო ფორმატით.",
    syllabus: [
      "კომპიუტერული წიგნიერება და ინტერნეტ უსაფრთხოება",
      "თამაშების შექმნა (Scratch, Kodu, Construct)",
      "რობოტექნიკა (Lego Mindstorms, Arduino)",
      "3D მოდელირება და ბეჭდვა"
    ],
    outcomes: "ბავშვი ისწავლის ლოგიკურ აზროვნებას, გუნდურ მუშაობას და გადადგამს პირველ ნაბიჯებს IT სფეროში.",
  }
];

export default function AcademyScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnims = useRef(COURSES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
      ]),
      Animated.stagger(100, cardAnims.map(anim => 
        Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
      ))
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: "STEP IT Academy" }} />

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* STEP-ის Hero სექცია */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Text style={styles.heroIcon}>🎓</Text> 
          </View>
          <Text style={styles.heroTitle}>STEP IT Academy</Text>
          <Text style={styles.heroSubtitle}>განვითარდი და განავითარე</Text>
          <Text style={styles.heroText}>
            1999 წლიდან STEP IT Academy ამზადებს პროფესიონალებს IT სფეროში. ჩვენი კურსდამთავრებულები მუშაობენ წამყვან ტექნოლოგიურ კომპანიებში მთელი მსოფლიოს მასშტაბით.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>22</Text>
            <Text style={styles.statPillLabel}>ქვეყანა</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>250K+</Text>
            <Text style={styles.statPillLabel}>კურსდამთავრებული</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>პროფესიული მიმართულებები</Text>
      </Animated.View>

      <View style={styles.coursesGrid}>
        {COURSES.map((course, i) => (
          <Animated.View 
            key={course.id} 
            style={[styles.courseCard, { opacity: cardAnims[i], transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }], borderTopColor: course.color }]}
          >
            <View style={styles.courseHeader}>
              <View style={[styles.iconBox, { backgroundColor: course.color + "15" }]}>
                <Text style={styles.courseEmoji}>💻</Text> 
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>⏳ {course.duration}</Text>
              </View>
            </View>
            
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={[styles.courseTech, { color: course.color }]}>{course.tech}</Text>
            
            <Text style={styles.detailsTitle}>სასწავლო პროგრამა:</Text>
            {course.syllabus.map((item, index) => (
              <Text key={index} style={styles.detailsItem}>• {item}</Text>
            ))}
            
            <Text style={styles.detailsTitle}>კურსის დასრულების შემდეგ:</Text>
            <Text style={styles.detailsOutcomes}>{course.outcomes}</Text>
            
            <View style={[styles.levelBadge, { borderColor: course.color + "50" }]}>
                <Text style={[styles.detailsLevel, { color: course.color }]}>{course.level}</Text>
            </View>

            <Text style={styles.courseDesc}>{course.desc}</Text>
            
            <Pressable style={[styles.enrollBtn, { backgroundColor: course.color }]}>
              <Text style={styles.enrollBtnText}>სილაბუსის ჩამოტვირთვა (PDF)</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  content: { padding: 20, paddingBottom: 60 },
  heroCard: { backgroundColor: "#1e293b", borderRadius: 24, padding: 24, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#334155" },
  heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#0ea5e922", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  heroIcon: { fontSize: 32 },
  heroTitle: { color: "white", fontSize: 26, fontWeight: "900", letterSpacing: -0.5, textAlign: "center" },
  heroSubtitle: { color: "#0ea5e9", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 6, marginBottom: 16 },
  heroText: { color: "#94a3b8", textAlign: "center", fontSize: 14, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  statPill: { flex: 1, backgroundColor: "#1e293b", borderRadius: 16, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "#ffffff08" },
  statPillNum: { color: "white", fontSize: 24, fontWeight: "800" },
  statPillLabel: { color: "#64748b", fontSize: 11, textTransform: "uppercase", fontWeight: "700", marginTop: 4 },
  sectionTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "800", marginBottom: 16 },
  coursesGrid: { gap: 16 },
  courseCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 20, borderTopWidth: 4, borderWidth: 1, borderColor: "#334155" },
  courseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  courseEmoji: { fontSize: 24 },
  durationBadge: { backgroundColor: "#0f172a", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "#334155" },
  durationText: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },
  courseTitle: { color: "white", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  courseTech: { fontSize: 13, fontWeight: "700", marginBottom: 16 },
  courseDesc: { color: "#94a3b8", fontSize: 13, lineHeight: 20, marginTop: 16, marginBottom: 20 },
  enrollBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
  enrollBtnText: { color: "white", fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
  
  detailsTitle: { color: "#94a3b8", fontSize: 13, fontWeight: "700", marginTop: 10, marginBottom: 6 },
  detailsItem: { color: "white", fontSize: 13, paddingLeft: 8, lineHeight: 22 },
  detailsOutcomes: { color: "white", fontSize: 13, lineHeight: 20 },
  detailsLevel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  levelBadge: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 }
});