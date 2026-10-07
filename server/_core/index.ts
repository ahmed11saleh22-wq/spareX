import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/vin/lookup", (req, res) => {
    const vin = String(req.query.vin ?? "").toUpperCase().replace(/[\s-]/g, "");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      return res.status(400).json({ success: false, message: "رقم الهيكل يجب أن يتكون من 17 خانة صالحة." });
    }
    const vehicle = vin.startsWith("JTD")
      ? { make: "تويوتا", model: "كامري", years: "2018–2023", engine: "2.5L", note: "تم تحديد عائلة كامري. تظهر القطع المتوافقة مع هذا الطراز أولًا." }
      : vin.startsWith("WBA")
        ? { make: "BMW", model: "3 Series", years: "2016–2021", engine: "2.0L", note: "تم تحديد عائلة BMW 3 Series. راجع سنة الصنع قبل اعتماد الطلب." }
        : vin.startsWith("KMH")
          ? { make: "هيونداي", model: "سوناتا", years: "2020–2024", engine: "2.5L", note: "تم تحديد عائلة سوناتا. تم تفعيل ترشيحات القطع الكورية المناسبة." }
          : { make: "سيارة أوروبية/آسيوية", model: "مطابقة أولية", years: "حسب السجل", engine: "غير محدد", note: "تم قبول الرقم. سيحتاج فريق التوافق إلى مراجعة إضافية قبل الشحن." };
    return res.json({ success: true, vehicle });
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  app.get("/manus-routes.json", (_req, res) => {
    res.sendFile(path.resolve(process.cwd(), "public/manus-routes.json"));
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
