import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import AuthProvider from "./providers/AuthProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { queryClient } from "./utils/trpc";
import { Toaster } from "@/components/ui/sonner";

const container = document.getElementById("root");

ReactDOM.createRoot(container as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
      <Toaster />
      {/*<ReactQueryDevtools initialIsOpen={false} />*/}
    </QueryClientProvider>
  </React.StrictMode>,
);
