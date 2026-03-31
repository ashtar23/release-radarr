import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, {
  ComponentType,
  type ReactNode,
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SheetComponentProps = {
  close: () => void;
};

export interface SheetOpenConfig {
  component: ComponentType<SheetComponentProps>;
  snapPoints?: (string | number)[];
  initialIndex?: number;
  enableDynamicSizing?: boolean;
  maxDynamicContentSize?: number;
  enablePanDownToClose?: boolean;
  backdropOpacity?: number;
  backdropPressBehavior?: "none" | "close" | "collapse";
}

const DEFAULT_SNAP_POINTS: (string | number)[] = ["80%"];

export interface SheetControllerValue {
  openSheet: (config: SheetOpenConfig) => void;
  closeSheet: () => void;
}

const SheetControllerContext = createContext<SheetControllerValue | null>(null);

export function useSheetController() {
  const value = useContext(SheetControllerContext);

  if (!value) {
    throw new Error("useSheetController must be used within AppSheetProvider.");
  }

  return value;
}

function normalizeConfig(config: SheetOpenConfig): Required<SheetOpenConfig> {
  return {
    component: config.component,
    snapPoints:
      config.snapPoints && config.snapPoints.length > 0
        ? config.snapPoints
        : DEFAULT_SNAP_POINTS,
    initialIndex: config.initialIndex ?? 0,
    enableDynamicSizing: config.enableDynamicSizing ?? false,
    maxDynamicContentSize:
      config.maxDynamicContentSize ?? Number.MAX_SAFE_INTEGER,
    enablePanDownToClose: config.enablePanDownToClose ?? true,
    backdropOpacity: config.backdropOpacity ?? 0.32,
    backdropPressBehavior: config.backdropPressBehavior ?? "close",
  };
}

export function AppSheetProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const activeConfigRef = useRef<Required<SheetOpenConfig> | null>(null);
  const pendingConfigRef = useRef<Required<SheetOpenConfig> | null>(null);
  const [sheetConfig, setSheetConfig] =
    useState<Required<SheetOpenConfig> | null>(null);

  const controllerValue = useMemo(
    () => ({
      openSheet: (config: SheetOpenConfig) => {
        const nextConfig = normalizeConfig(config);

        if (activeConfigRef.current) {
          pendingConfigRef.current = nextConfig;
          modalRef.current?.dismiss();
          return;
        }

        pendingConfigRef.current = null;
        setSheetConfig(nextConfig);
      },
      closeSheet: () => {
        pendingConfigRef.current = null;
        modalRef.current?.dismiss();
      },
    }),
    [],
  );

  const handleDismiss = useCallback(() => {
    activeConfigRef.current = null;
    setSheetConfig(null);

    const pending = pendingConfigRef.current;
    if (!pending) return;

    pendingConfigRef.current = null;
    setSheetConfig(pending);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={sheetConfig?.backdropOpacity ?? 0.32}
        pressBehavior={sheetConfig?.backdropPressBehavior ?? "close"}
      />
    ),
    [sheetConfig],
  );

  useEffect(() => {
    if (!sheetConfig) return;

    const frameId = requestAnimationFrame(() => {
      activeConfigRef.current = sheetConfig;
      modalRef.current?.present();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [sheetConfig]);

  return (
    <SheetControllerContext.Provider value={controllerValue}>
      <BottomSheetModalProvider>
        {children}
        {sheetConfig ? (
          <BottomSheetModal
            ref={modalRef}
            key={sheetConfig.component.displayName ?? "sheet-component"}
            snapPoints={sheetConfig.snapPoints}
            index={sheetConfig.initialIndex}
            enableDynamicSizing={sheetConfig.enableDynamicSizing}
            maxDynamicContentSize={sheetConfig.maxDynamicContentSize}
            enablePanDownToClose={sheetConfig.enablePanDownToClose}
            backdropComponent={renderBackdrop}
            backgroundStyle={{
              backgroundColor: theme.backgroundElement,
            }}
            handleIndicatorStyle={{
              backgroundColor: theme.separator,
            }}
            onDismiss={handleDismiss}
          >
            <BottomSheetView
              style={[
                styles.contentContainer,
                {
                  paddingBottom: insets.bottom,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              <sheetConfig.component close={controllerValue.closeSheet} />
            </BottomSheetView>
          </BottomSheetModal>
        ) : null}
      </BottomSheetModalProvider>
    </SheetControllerContext.Provider>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
});
