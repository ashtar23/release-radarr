import { capabilities } from "@/constants/capabilities";

export const LIST_ROW_PADDING_HORIZONTAL = 16;
export const LIST_ROW_PADDING_VERTICAL = 14;

export const IOS_LIST_SECTION_RADIUS = capabilities.liquidGlass ? 22 : 10;
export const ANDROID_LIST_SECTION_RADIUS = capabilities.expressiveShape
  ? 16
  : 12;
