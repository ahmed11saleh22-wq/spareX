import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as account from "./account";
import { clearSelfSession, createSelfSession, safeUser } from "./self-auth";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user ? safeUser(opts.ctx.user) : null),
    loginPassword: publicProcedure.input(z.object({ identifier: z.string().min(5).max(320), password: z.string().min(8).max(200) })).mutation(async ({ input, ctx }) => {
      try {
        const user = await account.loginWithPassword(input.identifier, input.password);
        await createSelfSession(user.id, ctx.req, ctx.res);
        return user;
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "بيانات الدخول غير صحيحة" });
      }
    }),
    startRegistration: publicProcedure.input(z.object({
      accountType: z.enum(["customer", "workshop"]), name: z.string().min(2).max(180), phone: z.string().min(8).max(40), email: z.string().email().max(320), password: z.string().min(8).max(200),
      workshopName: z.string().max(180).optional(), city: z.string().max(100).optional(), address: z.string().max(1000).optional(), businessType: z.string().max(100).optional(), monthlyVolume: z.string().max(80).optional(), specialties: z.array(z.string().max(100)).max(20).optional(), warehouseDetails: z.string().max(1000).optional(), warehouseCount: z.number().int().min(0).max(100).optional(), tradeLicense: z.string().max(500).optional(), logo: z.string().max(500).optional(),
    })).mutation(async ({ input }) => {
      try { return await account.startRegistration(input); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر بدء التسجيل" }); }
    }),
    resendRegistrationOtp: publicProcedure.input(z.object({ challengeId: z.string().min(20).max(80) })).mutation(async ({ input }) => {
      try { return await account.resendRegistrationOtp(input.challengeId); }
      catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر إعادة إرسال الرمز" }); }
    }),
    verifyRegistration: publicProcedure.input(z.object({ challengeId: z.string().min(20).max(80), code: z.string().regex(/^\d{6}$/) })).mutation(async ({ input, ctx }) => {
      try {
        const user = await account.verifyRegistration(input.challengeId, input.code);
        await createSelfSession(user.id, ctx.req, ctx.res);
        return user;
      } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر تأكيد التسجيل" }); }
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await clearSelfSession(ctx.req, ctx.res);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  account: router({
    vehicles: router({
      list: protectedProcedure.query(({ ctx }) => account.listVehicles(ctx.user.id)),
      save: protectedProcedure.input(z.object({ id: z.number().int().positive().optional(), make: z.string().min(2).max(100), model: z.string().min(1).max(120), year: z.number().int().min(1950).max(2100), trim: z.string().max(120).optional(), vin: z.string().max(17).optional(), isPrimary: z.boolean().optional() })).mutation(({ input, ctx }) => account.saveVehicle(ctx.user.id, input)),
      delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => account.deleteVehicle(ctx.user.id, input.id)),
      setPrimary: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input, ctx }) => account.setPrimaryVehicle(ctx.user.id, input.id)),
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
    listWorkshopApplications: adminProcedure.query(() => account.listWorkshopApplications()),
    updateWorkshopApproval: adminProcedure.input(z.object({ id: z.number().int().positive(), approvalStatus: z.enum(["approved", "rejected", "pending"]) })).mutation(({ input }) => account.updateWorkshopApproval(input.id, input.approvalStatus)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
