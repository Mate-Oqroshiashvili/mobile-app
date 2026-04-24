import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "white",
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
