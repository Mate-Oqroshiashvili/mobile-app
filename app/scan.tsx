import { findAllowedScanForToday, getUserById, insertScanLog } from "@/lib/db";
import { decodePayload, todayLocalYYYYMMDD } from "@/lib/qrcode";
import { getCurrentUserId } from "@/lib/session";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type ScanResult =
  | { kind: "allowed"; turnstileId: string }
  | { kind: "duplicate"; turnstileId: string; previousAtIso: string }
  | { kind: "invalid_qr" }
  | { kind: "unknown_user" };

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult | null>(null);
  const handlingRef = useRef(false); // prevent the camera firing the same scan many times

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain)
      requestPermission();
  }, [permission, requestPermission]);

  const onScanned = async ({ data }: { data: string }) => {
    if (handlingRef.current) return;
    handlingRef.current = true;

    try {
      const payload = decodePayload(data);
      if (!payload) {
        setResult({ kind: "invalid_qr" });
        return;
      }

      const userId = await getCurrentUserId();
      const user = userId ? await getUserById(userId) : null;
      if (!user) {
        setResult({ kind: "unknown_user" });
        return;
      }

      const today = todayLocalYYYYMMDD();
      const existing = await findAllowedScanForToday(
        user.id,
        payload.turnstileId,
        today,
      );
      const nowIso = new Date().toISOString();

      if (existing) {
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
          previousAtIso: existing.scanned_at_iso,
        });
        return;
      }

      await insertScanLog({
        user_id: user.id,
        turnstile_id: payload.turnstileId,
        academy_id: payload.academyId,
        scanned_at_iso: nowIso,
        scanned_date: today,
        result: "allowed",
      });
      setResult({ kind: "allowed", turnstileId: payload.turnstileId });

      // TODO: when backend exists → POST /turnstile/open with { userId, turnstileId }.
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission needed.</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Scan QR" }} />
      {!result ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onScanned}
        />
      ) : (
        <View style={styles.resultBox}>
          {result.kind === "allowed" && (
            <>
              <Text style={[styles.icon, { color: "#22c55e" }]}>✅</Text>
              <Text style={styles.title}>Access granted</Text>
              <Text style={styles.body}>
                Turnstile {result.turnstileId} would open now.
              </Text>
            </>
          )}
          {result.kind === "duplicate" && (
            <>
              <Text style={[styles.icon, { color: "#f59e0b" }]}>⚠️</Text>
              <Text style={styles.title}>Already scanned today</Text>
              <Text style={styles.body}>
                You scanned this turnstile at{" "}
                {new Date(result.previousAtIso).toLocaleTimeString()}.
              </Text>
            </>
          )}
          {result.kind === "invalid_qr" && (
            <>
              <Text style={[styles.icon, { color: "#ef4444" }]}>❌</Text>
              <Text style={styles.title}>Not an academy QR</Text>
              <Text style={styles.body}>This QR code isn’t recognized.</Text>
            </>
          )}
          {result.kind === "unknown_user" && (
            <>
              <Text style={[styles.icon, { color: "#ef4444" }]}>❌</Text>
              <Text style={styles.title}>Unknown user</Text>
              <Text style={styles.body}>Please log in again.</Text>
            </>
          )}
          <Pressable style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Done</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, { backgroundColor: "#475569", marginTop: 8 }]}
            onPress={() => {
              handlingRef.current = false;
              setResult(null);
            }}
          >
            <Text style={styles.btnText}>Scan another</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  text: { color: "white", marginBottom: 16 },
  btn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    minWidth: 220,
    alignItems: "center",
  },
  btnText: { color: "white", fontSize: 16, fontWeight: "600" },
  resultBox: { alignItems: "center", gap: 12 },
  icon: { fontSize: 64 },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  body: {
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
});
