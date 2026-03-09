# Mobile Navigation Structure (Recommended)

This document confirms the currently recommended navigation structure for the mobile app and why we use it.

## Current structure in this repo

```text
apps/mobile/src/app/
  _layout.tsx                    # root stack
  titles/[titleId].tsx           # shared details screen (root-level push)
  (tabs)/
    _layout.tsx                  # NativeTabs shell
    index.tsx                    # redirects "/" -> "/home"
    home/
      _layout.tsx                # stack for Home tab branch
      index.tsx                  # home screen
    watchlist/
      _layout.tsx                # stack for Watchlist tab branch
      index.tsx                  # watchlist screen
    settings/
      _layout.tsx                # stack for Settings tab branch
      index.tsx                  # settings screen
```

## Why this is recommended

1. **Native tabs + stack per tab branch**
- Expo docs for Native Tabs explicitly recommend nesting a native `Stack` inside tabs when you need headers and push navigation.
- This is exactly what `home/_layout.tsx` and `explore/_layout.tsx` do.

2. **Do not create one layout per page**
- The target pattern is one navigator per branch/flow (for example, one stack for Home, one stack for Explore), not a separate layout for every single screen file.
- This keeps tab flows predictable and avoids navigator fragmentation.

3. **Shared detail screens can stay at root stack**
- React Navigation documents that nested navigators keep separate history/options.
- Keeping shared routes such as `titles/[titleId]` in the parent stack avoids duplicating the same details screen under multiple tabs.
- In this repo, `titles/[titleId]` is intentionally a root stack screen (outside `(tabs)`), so it can be pushed from any tab and still get native back behavior.

4. **Header ownership rule (important)**
- Configure static/native header behavior at the layout stack level (for example `headerLargeTitle`, `headerTransparent`, back button mode).
- Use screen-level `<Stack.Screen options={...} />` only for dynamic values (for example title from fetched game data).
- Avoid splitting full header config across multiple nested layouts/screens for the same route, which can cause overlap or double-header behavior.

5. **iOS large-title behavior**
- Native stack large-title collapse requires a scrollable screen (`ScrollView`/`FlatList`) and `contentInsetAdjustmentBehavior="automatic"`.
- This is why tab screens that use large titles are implemented with a top-level scroll view pattern.

6. **`(tabs)/index.tsx` redirect is valid**
- Expo Router officially supports using `<Redirect />` from an index route.
- Redirecting `/` to `/home` is a clean way to preserve a default app entry route while keeping Home in its own branch stack.

## Official references

- Expo Router: Native tabs (`Use Stacks inside tabs`)  
  https://docs.expo.dev/router/advanced/native-tabs/

- Expo Router: Common navigation patterns (`Stacks inside tabs`)  
  https://docs.expo.dev/router/basics/common-navigation-patterns/

- Expo Router: Navigation layouts (`_layout.tsx` defines navigator per directory)  
  https://docs.expo.dev/router/advanced/root-layout/

- Expo Router: Redirect component  
  https://docs.expo.dev/router/advanced/redirects/

- React Navigation: Nesting navigators (separate history/options per navigator)  
  https://reactnavigation.org/docs/nesting-navigators/

- React Navigation: Native Stack (`headerLargeTitleEnabled` + inset requirements)  
  https://reactnavigation.org/docs/native-stack-navigator
