import { readFileSync } from "node:fs";
import * as path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

const PRODUCT_NAME = "Release Radar";
const PRODUCT_SLUG = "release-radar";
const mobilePackagePath = path.join(__dirname, "package.json");
const mobilePackage = JSON.parse(readFileSync(mobilePackagePath, "utf8")) as {
  version: string;
};

const APP_ENVIRONMENTS = ["development", "staging", "production"] as const;

type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

type EnvironmentConfig = {
  name: string;
  scheme: string;
  bundleIdentifier: string;
  packageName: string;
};

function resolveAppEnvironment(value: string | undefined): AppEnvironment {
  if (
    value === "development" ||
    value === "staging" ||
    value === "production"
  ) {
    return value;
  }

  return "production";
}

function getEnvironmentConfig(appEnv: AppEnvironment): EnvironmentConfig {
  switch (appEnv) {
    case "development":
      return {
        name: `${PRODUCT_NAME} Dev`,
        scheme: "releaseradar-dev",
        bundleIdentifier: "com.ashtar23.releaseradar.dev",
        packageName: "com.ashtar23.releaseradar.dev",
      };
    case "staging":
      return {
        name: `${PRODUCT_NAME} Staging`,
        scheme: "releaseradar-staging",
        bundleIdentifier: "com.ashtar23.releaseradar.staging",
        packageName: "com.ashtar23.releaseradar.staging",
      };
    case "production":
      return {
        name: PRODUCT_NAME,
        scheme: "releaseradar",
        bundleIdentifier: "com.ashtar23.releaseradar",
        packageName: "com.ashtar23.releaseradar",
      };
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = resolveAppEnvironment(process.env.APP_ENV);
  const environmentConfig = getEnvironmentConfig(appEnv);

  return {
    ...config,
    name: environmentConfig.name,
    slug: PRODUCT_SLUG,
    version: mobilePackage.version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: environmentConfig.scheme,
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
      bundleIdentifier: environmentConfig.bundleIdentifier,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: environmentConfig.packageName,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          android: {
            image: "./assets/images/splash-icon.png",
            imageWidth: 76,
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      appEnv,
      eas: {
        projectId: "c0d49c20-e669-470c-93cc-a451f367edce",
      },
    },
  };
};
