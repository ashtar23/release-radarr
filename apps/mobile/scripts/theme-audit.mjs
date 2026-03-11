#!/usr/bin/env node

/**
 * Mobile theme audit.
 *
 * Checks:
 * - token role matrix coverage and uniqueness
 * - contrast ratios for key text and non-text pairs
 *
 * WCAG thresholds:
 * - normal text: >= 4.5:1
 * - large text: >= 3.0:1
 * - non-text UI boundaries/focus indicators: >= 3.0:1
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const THEME_FILE = path.resolve(process.cwd(), 'src/constants/theme.ts');

function fail(message) {
  console.error(`[theme:audit] ${message}`);
  process.exit(1);
}

function extractObjectLiteral(source, exportName) {
  const marker = `export const ${exportName} =`;
  const start = source.indexOf(marker);
  if (start === -1) fail(`Could not find "${exportName}" in ${THEME_FILE}`);

  const literalStart = start + marker.length;
  const literalEnd = source.indexOf(' as const', literalStart);
  if (literalEnd === -1) fail(`Could not parse "${exportName}" as const literal in ${THEME_FILE}`);

  return source.slice(literalStart, literalEnd).trim();
}

function evaluateLiteral(literal, exportName) {
  try {
    return Function(`"use strict"; return (${literal});`)();
  } catch (error) {
    fail(`Failed to evaluate "${exportName}" literal: ${String(error)}`);
  }
}

function getByPath(objectValue, tokenPath) {
  return tokenPath.split('.').reduce((accumulator, key) => accumulator?.[key], objectValue);
}

function flattenStringLeaves(input, prefix = '') {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return {};

  return Object.entries(input).reduce((accumulator, [key, value]) => {
    const pathKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      accumulator[pathKey] = value;
      return accumulator;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(accumulator, flattenStringLeaves(value, pathKey));
    }

    return accumulator;
  }, {});
}

function clampByte(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, value));
}

function clampUnit(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function parseHexColor(value) {
  const hex = value.slice(1);
  if (hex.length === 3) {
    const [r, g, b] = hex.split('');
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: 1,
    };
  }

  if (hex.length === 4) {
    const [r, g, b, a] = hex.split('');
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
      a: clampUnit(parseInt(a + a, 16) / 255),
    };
  }

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }

  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: clampUnit(parseInt(hex.slice(6, 8), 16) / 255),
    };
  }

  return null;
}

function parseRgbColor(value) {
  const matches = value
    .trim()
    .match(/^rgba?\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)(?:\s*,\s*([+-]?\d+(?:\.\d+)?))?\s*\)$/i);

  if (!matches) return null;

  const [, r, g, b, alpha] = matches;
  return {
    r: clampByte(Number(r)),
    g: clampByte(Number(g)),
    b: clampByte(Number(b)),
    a: alpha === undefined ? 1 : clampUnit(Number(alpha)),
  };
}

function parseColor(value) {
  if (typeof value !== 'string') return null;
  if (value.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (value.startsWith('#')) return parseHexColor(value);
  if (value.toLowerCase().startsWith('rgb')) return parseRgbColor(value);
  return null;
}

function blend(foreground, background) {
  const fgAlpha = clampUnit(foreground.a);
  const bgAlpha = clampUnit(background.a);
  const outAlpha = fgAlpha + bgAlpha * (1 - fgAlpha);

  if (outAlpha === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  return {
    r: clampByte((foreground.r * fgAlpha + background.r * bgAlpha * (1 - fgAlpha)) / outAlpha),
    g: clampByte((foreground.g * fgAlpha + background.g * bgAlpha * (1 - fgAlpha)) / outAlpha),
    b: clampByte((foreground.b * fgAlpha + background.b * bgAlpha * (1 - fgAlpha)) / outAlpha),
    a: outAlpha,
  };
}

function toOpaque(color, underlay) {
  if (color.a >= 1) return color;
  return blend(color, underlay);
}

function srgbToLinear(value) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  const r = srgbToLinear(color.r);
  const g = srgbToLinear(color.g);
  const b = srgbToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(colorA, colorB) {
  const luminanceA = relativeLuminance(colorA);
  const luminanceB = relativeLuminance(colorB);
  const brighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (brighter + 0.05) / (darker + 0.05);
}

const contrastChecks = [
  { id: 'text-primary-on-base', fg: 'text', bg: 'background', min: 4.5, category: 'normal-text' },
  { id: 'text-secondary-on-base', fg: 'textSecondary', bg: 'background', min: 4.5, category: 'normal-text' },
  {
    id: 'placeholder-on-base',
    fg: 'input.placeholder',
    bg: 'background',
    min: 4.5,
    category: 'normal-text',
  },
  {
    id: 'link-primary-on-base',
    fg: 'interactive.linkPrimary',
    bg: 'background',
    min: 4.5,
    category: 'normal-text',
  },
  {
    id: 'error-text-on-base',
    fg: 'status.error',
    bg: 'background',
    min: 4.5,
    category: 'normal-text',
  },
  {
    id: 'title-text-on-elevated-surface',
    fg: 'text',
    bg: 'backgroundElement',
    min: 3,
    category: 'large-text',
  },
  {
    id: 'title-text-on-selected-surface',
    fg: 'text',
    bg: 'backgroundSelected',
    min: 3,
    category: 'large-text',
  },
  {
    id: 'link-primary-on-elevated-surface',
    fg: 'interactive.linkPrimary',
    bg: 'backgroundElement',
    min: 3,
    category: 'large-text',
  },
  {
    id: 'input-border-default-on-base',
    fg: 'input.fallbackBorder',
    bg: 'background',
    min: 3,
    category: 'non-text',
  },
  {
    id: 'input-border-focus-on-base',
    fg: 'input.fallbackBorderFocused',
    bg: 'background',
    min: 3,
    category: 'non-text',
  },
  {
    id: 'input-border-error-on-base',
    fg: 'input.fallbackBorderError',
    bg: 'background',
    min: 3,
    category: 'non-text',
  },
  {
    id: 'focus-ring-on-base',
    fg: 'interactive.focusRing',
    bg: 'background',
    min: 3,
    category: 'non-text',
  },
  {
    id: 'glass-focused-border-on-glass-focused-bg',
    fg: 'glassInput.borderFocused',
    bg: 'glassInput.bgFocused',
    min: 3,
    category: 'non-text',
  },
  {
    id: 'glass-error-border-on-glass-focused-bg',
    fg: 'glassInput.borderError',
    bg: 'glassInput.bgFocused',
    min: 3,
    category: 'non-text',
  },
];

function run() {
  const source = fs.readFileSync(THEME_FILE, 'utf8');
  const Colors = evaluateLiteral(extractObjectLiteral(source, 'Colors'), 'Colors');
  const roleMatrix = evaluateLiteral(
    extractObjectLiteral(source, 'THEME_TOKEN_ROLE_MATRIX'),
    'THEME_TOKEN_ROLE_MATRIX',
  );

  const themes = ['light', 'dark'];
  const roleEntries = Object.entries(roleMatrix);
  const roleTargetPaths = roleEntries.map(([, tokenPath]) => tokenPath);

  const flattenedByTheme = {
    light: flattenStringLeaves(Colors.light),
    dark: flattenStringLeaves(Colors.dark),
  };

  const lightStringLeafPaths = Object.keys(flattenedByTheme.light);
  const duplicateRolePaths = roleTargetPaths.filter(
    (tokenPath, index) => roleTargetPaths.indexOf(tokenPath) !== index,
  );
  const unknownMatrixPaths = roleTargetPaths.filter(
    (tokenPath) => !lightStringLeafPaths.includes(tokenPath),
  );
  const unmappedThemePaths = lightStringLeafPaths.filter(
    (tokenPath) => !roleTargetPaths.includes(tokenPath),
  );

  let hasFailures = false;

  console.log('== Mobile Theme Audit ==');
  console.log(`Theme file: ${path.relative(process.cwd(), THEME_FILE)}`);

  if (duplicateRolePaths.length > 0) {
    hasFailures = true;
    console.error('\n[FAIL] Role matrix has duplicate token targets:');
    duplicateRolePaths.forEach((tokenPath) => console.error(`  - ${tokenPath}`));
  }

  if (unknownMatrixPaths.length > 0) {
    hasFailures = true;
    console.error('\n[FAIL] Role matrix points to unknown token paths:');
    unknownMatrixPaths.forEach((tokenPath) => console.error(`  - ${tokenPath}`));
  }

  if (unmappedThemePaths.length > 0) {
    hasFailures = true;
    console.error('\n[FAIL] Theme string tokens missing role mapping:');
    unmappedThemePaths.forEach((tokenPath) => console.error(`  - ${tokenPath}`));
  }

  if (!hasFailures) {
    console.log(
      `\n[PASS] Role matrix coverage: ${roleEntries.length} roles / ${lightStringLeafPaths.length} mapped string tokens.`,
    );
  }

  const contrastFailures = [];

  for (const themeName of themes) {
    const theme = Colors[themeName];
    const opaqueBase = parseColor(theme.background);

    if (!opaqueBase || opaqueBase.a < 1) {
      fail(`Theme "${themeName}" background must be a parsable opaque color.`);
    }

    for (const check of contrastChecks) {
      const rawForeground = getByPath(theme, check.fg);
      const rawBackground = getByPath(theme, check.bg);
      const parsedForeground = parseColor(rawForeground);
      const parsedBackground = parseColor(rawBackground);

      if (!parsedForeground || !parsedBackground) {
        contrastFailures.push({
          theme: themeName,
          id: check.id,
          reason: `Unparsable color(s): fg=${String(rawForeground)} bg=${String(rawBackground)}`,
        });
        continue;
      }

      const resolvedBackground = toOpaque(parsedBackground, opaqueBase);
      const resolvedForeground = toOpaque(parsedForeground, resolvedBackground);
      const ratio = contrastRatio(resolvedForeground, resolvedBackground);

      if (ratio < check.min) {
        contrastFailures.push({
          theme: themeName,
          id: check.id,
          reason: `${ratio.toFixed(2)}:1 < ${check.min}:1 (${check.category})`,
        });
      }
    }
  }

  if (contrastFailures.length > 0) {
    hasFailures = true;
    console.error('\n[FAIL] Contrast checks:');
    contrastFailures.forEach((failure) => {
      console.error(`  - ${failure.theme}: ${failure.id} -> ${failure.reason}`);
    });
  } else {
    console.log(`\n[PASS] Contrast checks: ${themes.length * contrastChecks.length} checks.`);
  }

  if (hasFailures) {
    console.error('\nResult: FAIL');
    process.exit(1);
  }

  console.log('\nResult: PASS');
}

run();
