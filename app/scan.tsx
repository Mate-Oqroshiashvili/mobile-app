import { findAllowedScanForToday, getUserById, insertScanLog } from "@/lib/db";
import { decodePayload, todayLocalYYYYMMDD } from "@/lib/qrcode";
import { getCurrentUserId } from "@/lib/session";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type ScanResult =
  | { kind: "allowed"; turnstileId: string }
  | { kind: "duplicate"; turnstileId: string; previousAtIso: string }
  | { kind: "invalid_qr" }
  | { kind: "unknown_user" };

const SCAN_SIZE = 250;

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult | null>(null);
  const handlingRef = useRef(false);

  // Scanning anims
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const scanLine = useRef(new Animated.Value(0)).current;

  // Result anims
  const resultScale = useRef(new Animated.Value(0.8)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.15,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.7,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      const line = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLine, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLine, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      line.start();
      return () => {
        pulse.stop();
        line.stop();
      };
    } else {
      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  const onScanned = async ({ data }: { data: string }) => {
    if (handlingRef.current) return;
    handlingRef.current = true;

    try {
      const userId = await getCurrentUserId();
      const user = userId ? await getUserById(userId) : null;
      const nowIso = new Date().toISOString();
      const today = todayLocalYYYYMMDD();

      // 1. ვამოწმებთ QR-ის ვალიდურობას უსაფრთხოდ (try/catch ბლოკით, რომ აპლიკაცია არ გაკრაშოს)
      let payload;
      try {
        payload = decodePayload(data);
      } catch (err) {
        payload = null;
      }

      if (!payload) {
        // არასწორი QR-ის შემთხვევაში ვწერთ ლოგს (თუ მომხმარებელი იდენტიფიცირებულია), რათა სტატისტიკაში აისახოს
        if (user) {
          await insertScanLog({
            user_id: user.id,
            turnstile_id: "უცნობი",
            academy_id: "უცნობი",
            scanned_at_iso: nowIso,
            scanned_date: today,
            result: "invalid_qr",
          });
        }
        setResult({ kind: "invalid_qr" });
        return;
      }

      if (!user) {
        setResult({ kind: "unknown_user" });
        return;
      }

      // 2. ვამოწმებთ არის თუ არა დღეს უკვე სკანირებული (duplicate)
      const existing = await findAllowedScanForToday(
        user.id,
        payload.turnstileId,
        today,
      );

      if (existing) {
        // უსაფრთხოდ ვიღებთ წინა სკანირების დროს
        const prevTime =
          typeof existing === "object" && existing.scanned_at_iso
            ? existing.scanned_at_iso
            : nowIso;

        await insertScanLog({
          user_id: user.id,
          turnstile_id: payload.turnstileId,
          academy_id: payload.academyId,
          scanned_at_iso: nowIso,
          scanned_date: today,
          result: "duplicate",
        });
        setResult({
          kind: "duplicate",
          turnstileId: payload.turnstileId,
          previousAtIso: prevTime,
        });
        return;
      }

      // 3. თუ ყველაფერი რიგზეა - ვრთავთ დაშვებას
      await insertScanLog({
        user_id: user.id,
        turnstile_id: payload.turnstileId,
        academy_id: payload.academyId,
        scanned_at_iso: nowIso,
        scanned_date: today,
        result: "allowed",
      });
      setResult({ kind: "allowed", turnstileId: payload.turnstileId });
    } catch (e) {
      console.error(e);
      // რაიმე გაუთვალისწინებელი შეცდომის დროს ვაჩვენებთ "უარყოფილს", რომ სკანერი არ გაიჭედოს
      setResult({ kind: "invalid_qr" });
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted)
    return (
      <View style={styles.container}>
        <Text style={styles.text}>კამერის ნებართვა საჭიროა.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>ნებართვის მიცემა</Text>
        </Pressable>
      </View>
    );

  const lineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 4],
  });

  // უსაფრთხო დროის დაფორმატება დუბლიკატისთვის
  const getPrevTime = () => {
    if (result?.kind === "duplicate" && result.previousAtIso) {
      try {
        return new Date(result.previousAtIso).toLocaleTimeString("ka-GE", {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return "";
      }
    }
    return "";
  };

  const RESULTS: Record<
    string,
    { emoji: string; color: string; title: string; body: string }
  > = {
    allowed: {
      emoji: "✅",
      color: "#22c55e",
      title: "წვდომა დაშვებულია",
      body: `Turnstile ${result?.kind === "allowed" ? result.turnstileId : ""} გაიხსნება.`,
    },
    duplicate: {
      emoji: "⚠️",
      color: "#f59e0b",
      title: "უკვე სკანირებული",
      body: `დღეს სკანირება უკვე მოხდა ${getPrevTime()}-ზე.`,
    },
    invalid_qr: {
      emoji: "❌",
      color: "#ef4444",
      title: "უარყოფილი",
      body: "არასწორი ან ამოუცნობი QR კოდი.",
    },
    unknown_user: {
      emoji: "👤",
      color: "#ef4444",
      title: "უცნობი მომხმარებელი",
      body: "გთხოვ შეხვიდე ანგარიშში.",
    },
  };
  const res = result ? RESULTS[result.kind] : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "QR სკანირება" }} />

      {!result ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={onScanned}
          />
          <View style={styles.overlay} />

          {/* Scan frame */}
          <View style={styles.frame}>
            {/* Pulse ring */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            {/* Corner brackets */}
            {[styles.tl, styles.tr, styles.bl, styles.br].map((corner, i) => (
              <View key={i} style={[styles.corner, corner]} />
            ))}
            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: lineTranslate }] },
              ]}
            />
          </View>
          <Text style={styles.hint}>QR კოდი ჩარჩოში მოათავსე</Text>
        </>
      ) : (
        res && (
          <Animated.View
            style={[
              styles.resultBox,
              {
                opacity: resultOpacity,
                transform: [{ scale: resultScale }],
              },
            ]}
          >
            <View
              style={[styles.resultIcon, { backgroundColor: res.color + "22" }]}
            >
              <Text style={{ fontSize: 46 }}>{res.emoji}</Text>
            </View>
            <Text style={[styles.resultTitle, { color: res.color }]}>
              {res.title}
            </Text>
            <Text style={styles.resultBody}>{res.body}</Text>

            <Pressable style={styles.btn} onPress={() => router.back()}>
              <Text style={styles.btnText}>დასრულება</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                { backgroundColor: "#334155", marginTop: 10 },
              ]}
              onPress={() => {
                resultScale.setValue(0.8);
                resultOpacity.setValue(0);
                handlingRef.current = false;
                setResult(null);
              }}
            >
              <Text style={styles.btnText}>კიდევ სკანირება</Text>
            </Pressable>
          </Animated.View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  pulseRing: {
    position: "absolute",
    width: SCAN_SIZE + 24,
    height: SCAN_SIZE + 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "white",
    borderWidth: 3,
  },
  tl: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  tr: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  br: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  hint: { color: "#94a3b8", marginTop: 24, fontSize: 14 },
  resultBox: { alignItems: "center", gap: 12, padding: 28 },
  resultIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  resultTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  resultBody: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
  },
  btnText: { color: "white", fontSize: 15, fontWeight: "700" },
  text: { color: "white", marginBottom: 16, fontSize: 15 },
});
