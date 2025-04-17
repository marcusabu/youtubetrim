import * as trpcExpress from "@trpc/server/adapters/express";
import { initTRPC, TRPCError } from "@trpc/server";
import { DEBUG, SECRET_KEY } from "./main";

export const createContext = ({ req, res }: trpcExpress.CreateExpressContextOptions) => ({
  req,
  res,
});

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const token = opts.ctx.req.headers.token;

  if (token !== `${SECRET_KEY}` && !DEBUG) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Access forbidden",
    });
  }

  return opts.next();
});
