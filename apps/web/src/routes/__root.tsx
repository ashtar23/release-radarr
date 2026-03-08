import { ThemeProvider } from "@/providers/theme-provider";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Outlet />
      </ThemeProvider>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </>
  );
}
