import type { NotificationPreferences } from "@repo/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

import { useAuth } from "@/auth/auth-provider";

import {
  notificationsConfigError,
  updateNotificationPreferences,
} from "../data-access/notifications";
import { getNotificationPreferencesQueryKey } from "../queries/notifications-query-key";

type UpdateNotificationPreferencesInput = Pick<
  NotificationPreferences,
  "channels" | "events" | "timingPresets"
>;

const PREFERENCES_SAVE_DEBOUNCE_MS = 1200;

function buildOptimisticPreferences(input: UpdateNotificationPreferencesInput) {
  return {
    preferences: {
      channels: input.channels,
      events: input.events,
      timingPresets: input.timingPresets,
      updatedAt: new Date().toISOString(),
    },
  };
}

function arePreferencesEqual(
  left: UpdateNotificationPreferencesInput,
  right: UpdateNotificationPreferencesInput,
) {
  return (
    left.channels.inApp === right.channels.inApp &&
    left.channels.push === right.channels.push &&
    left.events.releaseDateChanged === right.events.releaseDateChanged &&
    left.events.releaseApproaching === right.events.releaseApproaching &&
    left.timingPresets.length === right.timingPresets.length &&
    left.timingPresets.every(
      (preset, index) => preset === right.timingPresets[index],
    )
  );
}

function useUpdateNotificationPreferencesMutation() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const latestPreferencesRef =
    useRef<UpdateNotificationPreferencesInput | null>(null);
  const activePreferencesRef =
    useRef<UpdateNotificationPreferencesInput | null>(null);
  const activePersistPromiseRef = useRef<Promise<void> | null>(null);
  const pendingFlushOnSettleRef = useRef(false);

  const isUnmountingRef = useRef(false);
  const lastInteractionAtRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushLatestPreferencesRef = useRef<(() => void) | null>(null);

  const clearDebounceTimer = useCallback(() => {
    if (!debounceTimerRef.current) {
      return;
    }

    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }, []);

  const scheduleFlush = useCallback(
    (delayMs = PREFERENCES_SAVE_DEBOUNCE_MS) => {
      if (!userId) {
        return;
      }

      clearDebounceTimer();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        flushLatestPreferencesRef.current?.();
      }, delayMs);
    },
    [clearDebounceTimer, userId],
  );

  const flushLatestPreferences = useCallback(() => {
    if (!userId) {
      return;
    }

    const nextPreferences = latestPreferencesRef.current;
    if (!nextPreferences) {
      return;
    }

    const activePreferences = activePreferencesRef.current;
    if (activePersistPromiseRef.current) {
      if (
        !activePreferences ||
        !arePreferencesEqual(activePreferences, nextPreferences)
      ) {
        pendingFlushOnSettleRef.current = true;
      }
      return;
    }

    activePreferencesRef.current = nextPreferences;

    const persistPromise = updateNotificationPreferences(nextPreferences)
      .then((result) => {
        const latestDraft = latestPreferencesRef.current;
        const hasNewerDraft =
          latestDraft !== null &&
          !arePreferencesEqual(latestDraft, nextPreferences);

        if (!hasNewerDraft) {
          queryClient.setQueryData(
            getNotificationPreferencesQueryKey(userId),
            result,
          );
        }
      })
      .catch(() => {
        const latestDraft = latestPreferencesRef.current;
        const hasNewerDraft =
          latestDraft !== null &&
          !arePreferencesEqual(latestDraft, nextPreferences);

        if (!hasNewerDraft) {
          void queryClient.invalidateQueries({
            queryKey: getNotificationPreferencesQueryKey(userId),
          });
        }
      })
      .finally(() => {
        activePersistPromiseRef.current = null;
        activePreferencesRef.current = null;

        const latestDraft = latestPreferencesRef.current;
        if (!latestDraft) {
          return;
        }

        if (
          pendingFlushOnSettleRef.current ||
          !arePreferencesEqual(latestDraft, nextPreferences)
        ) {
          pendingFlushOnSettleRef.current = false;

          if (isUnmountingRef.current) {
            flushLatestPreferencesRef.current?.();
            return;
          }

          const elapsedMs = Date.now() - lastInteractionAtRef.current;
          const nextDelayMs = Math.max(
            0,
            PREFERENCES_SAVE_DEBOUNCE_MS - elapsedMs,
          );
          scheduleFlush(nextDelayMs);
        }
      });

    activePersistPromiseRef.current = persistPromise;
  }, [queryClient, scheduleFlush, userId]);

  flushLatestPreferencesRef.current = flushLatestPreferences;

  useEffect(() => {
    isUnmountingRef.current = false;

    return () => {
      isUnmountingRef.current = true;
      clearDebounceTimer();

      const latestDraft = latestPreferencesRef.current;
      if (!userId || !latestDraft) {
        return;
      }

      const activePreferences = activePreferencesRef.current;
      if (activePersistPromiseRef.current) {
        if (
          !activePreferences ||
          !arePreferencesEqual(activePreferences, latestDraft)
        ) {
          pendingFlushOnSettleRef.current = true;
        }
        return;
      }

      flushLatestPreferencesRef.current?.();
    };
  }, [clearDebounceTimer, userId]);

  const queueUpdate = useCallback(
    (input: UpdateNotificationPreferencesInput) => {
      if (!userId) {
        return;
      }

      if (notificationsConfigError) {
        throw new Error(notificationsConfigError);
      }

      lastInteractionAtRef.current = Date.now();
      latestPreferencesRef.current = input;

      queryClient.setQueryData(
        getNotificationPreferencesQueryKey(userId),
        buildOptimisticPreferences(input),
      );

      scheduleFlush();
    },
    [queryClient, scheduleFlush, userId],
  );

  return {
    queueUpdate,
  };
}

export { useUpdateNotificationPreferencesMutation };
