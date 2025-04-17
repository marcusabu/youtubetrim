import { z } from "zod";
import { LOGIN_PASSWORD, SECRET_KEY } from "../main";
import { publicProcedure, router } from "../trpc";

export const authRouter = router({
  login: publicProcedure.input(z.object({ password: z.string() })).mutation(({ input }) => {
    if (input.password === LOGIN_PASSWORD) {
      return { secretKey: SECRET_KEY, success: true };
    }
    return { success: false };
  }),
});
