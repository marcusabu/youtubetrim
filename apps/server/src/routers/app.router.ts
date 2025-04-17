import { authRouter } from "./auth.router";
import { router } from "../trpc";
import { videoRouter } from "./video.router";

export const appRouter = router({
  auth: authRouter,
  video: videoRouter
});

export type AppRouter = typeof appRouter;
