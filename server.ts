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

  // 1. CORS (Must be before other middleware to handle preflights and errors)
  app.use(cors());

  // 2. Security Headers (Helmet)
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
  app.use("/api", apiLimiter);
  
  // Request logging for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // 3. Payload Size Limits (Prevent Memory Exhaustion DoS)
  // Increased to 1MB to accommodate large job descriptions and profiles
  app.use(express.json({ limit: '1mb' }));

  // Error handler for JSON parsing / limit errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: "Invalid JSON payload" });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: "Payload too large. Please reduce the size of your profile or job description." });
    }
    next(err);
  });

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

  // API Route to fetch job description from a URL
  app.post("/api/fetch-job", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Simple HTML to text conversion
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      res.json({ text });
    } catch (error: any) {
      console.error("Fetch job error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for the Chrome Extension (SaaS Backend)
  // This hides the Gemini API key from the user and processes the AI request securely on your server.
  app.post("/api/evaluate-job", async (req, res) => {
    console.log(`${new Date().toISOString()} - Processing evaluation request: ${req.method} ${req.url}`);
    try {
      let { jobDescription, profile } = req.body;

      if (!jobDescription || !profile) {
        console.warn("Missing jobDescription or profile in request body");
        return res.status(400).json({ error: "Missing jobDescription or profile" });
      }

      // Truncate job description to avoid token limits (approx 4000 chars is plenty for evaluation)
      if (jobDescription.length > 4000) {
        jobDescription = jobDescription.slice(0, 4000) + "... [truncated]";
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY or API_KEY is missing from environment variables.");
        return res.status(500).json({ 
          error: "Server configuration error", 
          message: "GEMINI_API_KEY is missing. Please ensure you have added your Gemini API Key to the 'Secrets' or 'Settings' menu in AI Studio." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an expert technical recruiter. Evaluate the match between this profile and job.
        
        Profile: ${JSON.stringify(profile)}
        
        Job Description: ${jobDescription}
        
        Respond ONLY with a valid JSON object:
        {
          "matchScore": number (0-100),
          "analysis": "short explanation (max 2 sentences)",
          "tailoredCoverLetter": "professional cover letter (max 250 words)",
          "tailoredBullets": ["bullet 1", "bullet 2"]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      console.log("Evaluation successful");
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Extension API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for API routes to prevent falling through to SPA
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
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
