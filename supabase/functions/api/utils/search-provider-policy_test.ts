import {
  getMinLocalPageCoverage,
  getProviderUsedTrigger,
  getMinLocalResultsBeforeFallback,
  getProviderDecisionReason,
  getProviderPageBudget,
  isBroadSparseFreshLocalSufficient,
  isSparseBroadFirstPageLocal,
  shouldServeLocalResults,
} from "./search-provider-policy.ts";

Deno.test("serves local results when provider is not needed", () => {
  const shouldServe = shouldServeLocalResults(false, false, false, false);
  if (!shouldServe) {
    throw new Error("Expected local results when provider is not needed");
  }
});

Deno.test("uses provider when refresh is forced", () => {
  const shouldServe = shouldServeLocalResults(true, false, true, true);
  if (shouldServe) {
    throw new Error("Expected provider path when forceRefresh=true");
  }
});

Deno.test(
  "sparse broad first page is detected from visible-page or total-count sparsity",
  () => {
    const sparseFromVisible = isSparseBroadFirstPageLocal(
      "broad",
      1,
      3,
      20,
      false,
    );
    const sparseFromTotal = isSparseBroadFirstPageLocal(
      "broad",
      1,
      8,
      3,
      false,
    );
    const protectedHead = isSparseBroadFirstPageLocal("broad", 1, 3, 20, true);

    if (!sparseFromVisible) {
      throw new Error("Expected sparse detection from visible page count");
    }

    if (!sparseFromTotal) {
      throw new Error("Expected sparse detection from total local count");
    }

    if (protectedHead) {
      throw new Error(
        "Expected protected broad head to disable sparse classification",
      );
    }
  },
);

Deno.test(
  "provider page budget expands only for sparse broad first page",
  () => {
    const sparseBudget = getProviderPageBudget(true);
    const defaultBudget = getProviderPageBudget(false);

    if (sparseBudget !== 3) {
      throw new Error(`Expected sparse provider budget=3, got ${sparseBudget}`);
    }

    if (defaultBudget !== 1) {
      throw new Error(
        `Expected default provider budget=1, got ${defaultBudget}`,
      );
    }
  },
);

Deno.test("provider decision reason reflects trigger path", () => {
  const forcedReason = getProviderDecisionReason(true, false);
  const sparseReason = getProviderDecisionReason(false, true);
  const genericReason = getProviderDecisionReason(false, false);

  if (forcedReason !== "forced_refresh") {
    throw new Error(`Expected forced_refresh reason, got ${forcedReason}`);
  }

  if (sparseReason !== "sparse_broad_local") {
    throw new Error(`Expected sparse_broad_local reason, got ${sparseReason}`);
  }

  if (genericReason !== "provider_used") {
    throw new Error(`Expected provider_used reason, got ${genericReason}`);
  }
});

Deno.test("fresh sparse broad local page can stay local", () => {
  const freshSparseBroad = isBroadSparseFreshLocalSufficient(
    "broad",
    1,
    true,
    3,
    0,
  );
  const staleSparseBroad = isBroadSparseFreshLocalSufficient(
    "broad",
    1,
    true,
    3,
    1,
  );

  if (!freshSparseBroad) {
    throw new Error("Expected fresh sparse broad page to stay local");
  }

  if (staleSparseBroad) {
    throw new Error("Expected stale sparse broad page to require provider");
  }
});

Deno.test(
  "minimum local results fallback threshold honors broad page-one override",
  () => {
    const broadPageOne = getMinLocalResultsBeforeFallback("broad", 1);
    const broadPageTwo = getMinLocalResultsBeforeFallback("broad", 2);
    const specificPageOne = getMinLocalResultsBeforeFallback("specific", 1);

    if (broadPageOne !== 5) {
      throw new Error(
        `Expected broad page-one threshold=5, got ${broadPageOne}`,
      );
    }

    if (broadPageTwo !== 1) {
      throw new Error(
        `Expected broad page-two threshold=1, got ${broadPageTwo}`,
      );
    }

    if (specificPageOne !== 1) {
      throw new Error(`Expected specific threshold=1, got ${specificPageOne}`);
    }
  },
);

Deno.test(
  "minimum local coverage threshold honors broad page-one override",
  () => {
    const broadPageOne = getMinLocalPageCoverage("broad", 1);
    const broadPageTwo = getMinLocalPageCoverage("broad", 2);
    const specificPageOne = getMinLocalPageCoverage("specific", 1);

    if (broadPageOne !== 0.25) {
      throw new Error(
        `Expected broad page-one coverage=0.25, got ${broadPageOne}`,
      );
    }

    if (broadPageTwo !== 0.8) {
      throw new Error(
        `Expected broad page-two coverage=0.8, got ${broadPageTwo}`,
      );
    }

    if (specificPageOne !== 0.8) {
      throw new Error(`Expected specific coverage=0.8, got ${specificPageOne}`);
    }
  },
);

Deno.test("provider_used trigger explains why provider was needed", () => {
  const coverageOnly = getProviderUsedTrigger({
    sufficientLocal: false,
    freshLocal: true,
    needsProvider: true,
  });
  const freshnessOnly = getProviderUsedTrigger({
    sufficientLocal: true,
    freshLocal: false,
    needsProvider: true,
  });
  const both = getProviderUsedTrigger({
    sufficientLocal: false,
    freshLocal: false,
    needsProvider: true,
  });
  const none = getProviderUsedTrigger({
    sufficientLocal: true,
    freshLocal: true,
    needsProvider: false,
  });

  if (coverageOnly !== "coverage") {
    throw new Error(`Expected coverage trigger, got ${coverageOnly}`);
  }

  if (freshnessOnly !== "freshness") {
    throw new Error(`Expected freshness trigger, got ${freshnessOnly}`);
  }

  if (both !== "coverage_and_freshness") {
    throw new Error(`Expected combined trigger, got ${both}`);
  }

  if (none !== undefined) {
    throw new Error(
      `Expected no trigger when provider is not needed, got ${none}`,
    );
  }
});
