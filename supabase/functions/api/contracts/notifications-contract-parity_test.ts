import {
  NOTIFICATION_DESTINATION_KIND_VALUES,
  NOTIFICATION_EVENT_TYPE_VALUES,
  NOTIFICATION_TIMING_PRESET_VALUES,
} from "./notifications.ts";
import {
  notificationDestinationKindValues,
  notificationEventTypeValues,
  notificationTimingPresetValues,
} from "../../../../packages/types/src/notifications.ts";

Deno.test(
  "notification event type literals stay in sync with shared package contract",
  () => {
    assertSameValues(
      NOTIFICATION_EVENT_TYPE_VALUES,
      notificationEventTypeValues,
    );
  },
);

Deno.test(
  "notification timing preset literals stay in sync with shared package contract",
  () => {
    assertSameValues(
      NOTIFICATION_TIMING_PRESET_VALUES,
      notificationTimingPresetValues,
    );
  },
);

Deno.test(
  "notification destination kind literals stay in sync with shared package contract",
  () => {
    assertSameValues(
      NOTIFICATION_DESTINATION_KIND_VALUES,
      notificationDestinationKindValues,
    );
  },
);

function assertSameValues(left: readonly string[], right: readonly string[]) {
  if (left.length !== right.length) {
    throw new Error(
      `Expected same number of values, got left=${left.length}, right=${right.length}`,
    );
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      throw new Error(
        `Value mismatch at index ${index}: left='${left[index]}', right='${right[index]}'`,
      );
    }
  }
}
