import { encodePayload } from "@/lib/qrcode";
import { Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function GenerateScreen() {
  const [turnstileId, setTurnstileId] = useState("entrance-1");
  const data = encodePayload(turnstileId);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "Generate turnstile QR" }} />
      <Text style={styles.label}>Turnstile ID</Text>
      <TextInput
        style={styles.input}
        value={turnstileId}
        onChangeText={setTurnstileId}
        autoCapitalize="none"
        placeholder="entrance-1"
        placeholderTextColor="#64748b"
      />
      <View style={styles.qrWrap}>
        <QRCode value={data} size={240} />
      </View>
      <Text style={styles.caption}>
        Print this and stick it on the turnstile (or display it on a second
        device for testing).
      </Text>
      <Text style={styles.payloadLabel}>Payload encoded in this QR:</Text>
      <Text style={styles.payloadCode}>{data}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: "center", gap: 16 },
  label: { color: "#94a3b8", alignSelf: "flex-start", fontSize: 13 },
  input: {
    backgroundColor: "#1e293b",
    color: "white",
    padding: 14,
    borderRadius: 10,
    alignSelf: "stretch",
    fontSize: 16,
  },
  qrWrap: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  caption: { color: "#94a3b8", textAlign: "center" },
  payloadLabel: { color: "#94a3b8", alignSelf: "flex-start", marginTop: 16 },
  payloadCode: { color: "#cbd5e1", fontSize: 12, alignSelf: "flex-start" },
});
