import {
  SymbolView,
  type AndroidSymbol,
  type SymbolViewProps,
} from "expo-symbols";
import type { ComponentProps } from "react";

export type IOSSymbolName = Extract<SymbolViewProps["name"], string>;
export type AndroidSymbolName = AndroidSymbol;

type SymbolProps = Omit<ComponentProps<typeof SymbolView>, "name"> & {
  ios: IOSSymbolName;
  android?: AndroidSymbolName;
  web?: AndroidSymbolName;
};

export function AppSymbol({ ios, android, web, ...props }: SymbolProps) {
  return <SymbolView name={{ ios, android, web }} {...props} />;
}
