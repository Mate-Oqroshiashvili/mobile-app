import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "white",
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      />
      <StatusBar style="light" />
    </LanguageProvider>
  );
}