import test from "node:test";
import assert from "node:assert/strict";

import {
  classifySearchQuery,
  normalizeSearchKey,
  tokenizeSearchKey,
} from "./normalize";

test("classifies numbered typo queries as numbered titles", () => {
  const normalizedQuery = normalizeSearchKey("witchr 3");
  const queryTokens = tokenizeSearchKey("witchr 3");

  assert.equal(
    classifySearchQuery({
      rawQuery: "witchr 3",
      normalizedQuery,
      queryTokens,
    }),
    "numbered_title",
  );
});

test("classifies short acronym sequel queries as acronym titles", () => {
  const normalizedQuery = normalizeSearchKey("gta 6");
  const queryTokens = tokenizeSearchKey("gta 6");

  assert.equal(
    classifySearchQuery({
      rawQuery: "gta 6",
      normalizedQuery,
      queryTokens,
    }),
    "acronym_title",
  );
});

test("classifies single franchise tokens as franchise browse", () => {
  const normalizedQuery = normalizeSearchKey("zelda");
  const queryTokens = tokenizeSearchKey("zelda");

  assert.equal(
    classifySearchQuery({
      rawQuery: "zelda",
      normalizedQuery,
      queryTokens,
    }),
    "franchise_browse",
  );
});

test("classifies broad stopword queries as broad discovery", () => {
  const normalizedQuery = normalizeSearchKey("the");
  const queryTokens = tokenizeSearchKey("the");

  assert.equal(
    classifySearchQuery({
      rawQuery: "the",
      normalizedQuery,
      queryTokens,
    }),
    "broad_discovery",
  );
});
