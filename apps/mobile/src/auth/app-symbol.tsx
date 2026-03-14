import { SymbolView, type AndroidSymbol } from "expo-symbols";
import type { ComponentProps } from "react";
import type { SFSymbol } from "sf-symbols-typescript";

export type IOSSymbolName = SFSymbol;
export type AndroidSymbolName = AndroidSymbol;

type SymbolProps = Omit<ComponentProps<typeof SymbolView>, "name"> & {
  ios: IOSSymbolName;
  android?: AndroidSymbolName;
  web?: AndroidSymbolName;
};

export function AppSymbol({ ios, android, web, ...props }: SymbolProps) {
  return <SymbolView name={{ ios, android, web }} {...props} />;
}
