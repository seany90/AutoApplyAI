import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers (Helmet)
  // Configured to allow iframe embedding and inline scripts for AI Studio environment
  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  // 2. Rate Limiting (Prevent Brute Force / DoS)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", apiLimiter);

  app.use(cors());
  
  // 3. Payload Size Limits (Prevent Memory Exhaustion DoS)
  app.use(express.json({ limit: '10kb' }));

  // Lazy initialize Stripe to avoid crashing if key is missing on startup
  let stripeClient: Stripe | null = null;
  const getStripe = () => {
    if (!stripeClient) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required.");
      }
      stripeClient = new Stripe(key);
    }
    return stripeClient;
  };

  // API Route to create Stripe Checkout Session
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripe = getStripe();
      const { planId } = req.body;

      let priceAmount = 0;
      let planName = "";

      if (planId === "basic") {
        priceAmount = 2900; // $29.00 in cents
        planName = "Review Queue (Basic)";
      } else if (planId === "pro") {
        priceAmount = 7900; // $79.00 in cents
        planName = "Full Auto (Pro)";
      } else {
        return res.status(400).json({ error: "Invalid plan selected" });
      }

      // Use APP_URL from env or fallback to localhost
      const domain = process.env.APP_URL || `http://localhost:${PORT}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: planName,
              },
              unit_amount: priceAmount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${domain}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/onboarding`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
