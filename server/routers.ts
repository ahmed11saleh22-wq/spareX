import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
    track: publicProcedure.input(z.object({ orderNumber: z.string().min(3).max(40), phone: z.string().min(4).max(40) })).mutation(async ({ input }) => { try { return await db.trackOrder(input.orderNumber, input.phone); } catch { throw new TRPCError({ code: "NOT_FOUND", message: "تعذر العثور على الطلب. تحقق من رقم الطلب وآخر 4 أرقام من الجوال." }); } }),
  }),

  payments: router({
    verifyMoyasar: publicProcedure.input(z.object({ orderNumber: z.string().min(3).max(40), paymentId: z.string().min(10).max(100) })).mutation(({ input }) => db.verifyMoyasarPayment(input)),
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
    updateProduct: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(255), brand: z.string().min(1).max(120), category: z.string().min(1).max(120), price: z.number().int().nonnegative(), stockQuantity: z.number().int().nonnegative() })).mutation(({ input }) => db.updateProduct(input.id, input)),
    archiveProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.archiveProduct(input.id)),
    listOrders: adminProcedure.query(() => db.listAdminOrders()),
    updateOrderStatus: adminProcedure.input(z.object({ orderNumber: z.string().min(1), status: z.enum(["new", "processing", "shipped", "completed", "cancelled"]) })).mutation(({ input }) => db.updateOrderStatus(input.orderNumber, input.status)),
    updateShipment: adminProcedure.input(z.object({ orderNumber: z.string().min(1), shippingStatus: z.enum(["pending", "preparing", "shipped", "in_transit", "out_for_delivery", "delivered", "exception"]), carrier: z.string().max(80).optional(), trackingNumber: z.string().max(120).optional(), estimatedDelivery: z.string().max(120).optional(), title: z.string().min(2).max(180), description: z.string().max(500).optional(), location: z.string().max(180).optional() })).mutation(({ input }) => db.updateShipment(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
