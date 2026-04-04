import NetInfo, {
  type NetInfoState,
  useNetInfo,
} from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { useEffect } from "react";
import { Platform } from "react-native";

function isOnline(state: Pick<NetInfoState, "isConnected" | "isInternetReachable">) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function useIsOffline() {
  const netInfo = useNetInfo();
  return !isOnline(netInfo);
}

export function ReactQueryOnlineManager() {
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const unsubscribe = onlineManager.setEventListener((setOnline) => {
      const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
        setOnline(isOnline(state));
      });

      void NetInfo.fetch().then((state) => {
        setOnline(isOnline(state));
      });

      return netInfoUnsubscribe;
    });

    return unsubscribe;
  }, []);

  return null;
}
