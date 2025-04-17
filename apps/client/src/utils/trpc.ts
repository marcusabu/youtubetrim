import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { AppRouter } from "server/src/routers/app.router";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10000,
      networkMode: "offlineFirst",
    },
  },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({
    url: `${window.location.origin}/trpc`,
    async headers() {
      const token = localStorage.getItem("token");
      return {
        token: token || "",
      };
    },
  }),],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});