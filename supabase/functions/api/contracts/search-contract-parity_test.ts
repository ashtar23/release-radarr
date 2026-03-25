import {
  SEARCH_DECISION_REASON_VALUES,
  SEARCH_INTENT_MODE_VALUES,
  SEARCH_PROVIDER_USED_TRIGGER_VALUES,
  SEARCH_SERVED_BY_VALUES,
} from "./search.ts";
import {
  searchDecisionReasonValues,
  searchIntentModeValues,
  searchProviderUsedTriggerValues,
  searchServedByValues,
} from "../../../../packages/types/src/search-contract.ts";

Deno.test(
  "search servedBy literals stay in sync with shared package contract",
  () => {
    assertSameValues(SEARCH_SERVED_BY_VALUES, searchServedByValues);
  },
);

Deno.test(
  "search decisionReason literals stay in sync with shared package contract",
  () => {
    assertSameValues(SEARCH_DECISION_REASON_VALUES, searchDecisionReasonValues);
  },
);

Deno.test(
  "search intentMode literals stay in sync with shared package contract",
  () => {
    assertSameValues(SEARCH_INTENT_MODE_VALUES, searchIntentModeValues);
  },
);

Deno.test(
  "search providerUsedTrigger literals stay in sync with shared package contract",
  () => {
    assertSameValues(
      SEARCH_PROVIDER_USED_TRIGGER_VALUES,
      searchProviderUsedTriggerValues,
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
