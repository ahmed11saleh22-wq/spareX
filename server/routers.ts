import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  catalog: router({
    list: publicProcedure.query(() => db.listCatalogProducts()),
    categories: publicProcedure.query(() => db.listCatalogCategories()),
  }),

  orders: router({
    create: publicProcedure.input(z.object({
      customerName: z.string().min(2).max(180),
      phone: z.string().min(7).max(40),
      shippingAddress: z.string().min(8).max(1000),
      items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive().max(20) })).min(1),
    })).mutation(({ input, ctx }) => db.createCustomerOrder({ ...input, userId: ctx.user?.id ?? null })),
  }),

  admin: router({
    overview: adminProcedure.query(() => db.getAdminOverview()),
    listProducts: adminProcedure.query(() => db.listAdminProducts()),
    createProduct: adminProcedure.input(z.object({
      sku: z.string().min(2).max(80),
      name: z.string().min(2).max(255),
      brand: z.string().min(1).max(120),
      category: z.string().min(1).max(120),
      car: z.string().min(1).max(255),
      price: z.number().int().nonnegative(),
      stockQuantity: z.number().int().nonnegative(),
      imageUrl: z.string().url(),
      oldPrice: z.number().int().nonnegative().optional(),
      badge: z.string().max(80).optional(),
      rating: z.number().int().min(0).max(50).default(0),
    })).mutation(({ input }) => db.createProduct({ ...input, status: "active", description: null })),
    archiveProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.archiveProduct(input.id)),
    listOrders: adminProcedure.query(() => db.listAdminOrders()),
    updateOrderStatus: adminProcedure.input(z.object({ orderNumber: z.string().min(1), status: z.enum(["new", "processing", "shipped", "completed", "cancelled"]) })).mutation(({ input }) => db.updateOrderStatus(input.orderNumber, input.status)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
