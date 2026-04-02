import { useAuth } from "@/auth/auth-provider";
import { defaultStackScreenOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function NotificationsLayout() {
  const { user, isReady } = useAuth();
  const shouldShowHeader = isReady && Boolean(user);

  return (
    <Stack screenOptions={defaultStackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Notifications",
          headerLargeTitleEnabled: shouldShowHeader,
        }}
      />
    </Stack>
  );
}
