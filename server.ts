import express from "express";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

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

  // LinkedIn OAuth Endpoints
  app.get("/api/auth/linkedin/url", (req, res) => {
    const domain = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${domain}/api/auth/linkedin/callback`;
    const clientId = process.env.LINKEDIN_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({ error: "LINKEDIN_CLIENT_ID is not configured." });
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      state: "random_state_string",
      scope: "openid profile email",
    });

    res.json({ url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` });
  });

  app.get("/api/auth/linkedin/callback", async (req, res) => {
    const { code, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(`Error: ${error_description}`);
    }

    if (!code) {
      return res.status(400).send("No code provided.");
    }

    const domain = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${domain}/api/auth/linkedin/callback`;
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).send("LinkedIn credentials are not configured.");
    }

    try {
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error_description || "Failed to get access token");
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'LINKEDIN_AUTH_SUCCESS', token: '${tokenData.access_token}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("LinkedIn OAuth error:", err);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  // Sidecar Microservice Endpoint: Trigger Search
  // This endpoint simulates scraping jobs and uses Gemini to score them against the user's resume/preferences.
  app.post("/api/trigger-search", async (req, res) => {
    try {
      const { userId, preferences, resumeText } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Mocking Apify Scraped Jobs (In a real app, you would call Apify here)
      const scrapedJobs = [
        {
          id: "job_1",
          title: "Senior Frontend Engineer",
          company: "TechNova",
          location: "Remote",
          description: "We are looking for a Senior Frontend Engineer with 5+ years of experience in React, TypeScript, and modern CSS frameworks like Tailwind. Experience with Next.js is a plus. You will lead the development of our core web application.",
          url: "https://www.linkedin.com/jobs/view/mock-job-1"
        },
        {
          id: "job_2",
          title: "React Developer",
          company: "WebSolutions Inc",
          location: "New York, NY",
          description: "Seeking a React Developer to join our fast-paced agency. Must have strong skills in JavaScript, React, and Redux. 2 years of experience required. Backend experience with Node.js is a bonus.",
          url: "https://www.linkedin.com/jobs/view/mock-job-2"
        },
        {
          id: "job_3",
          title: "Full Stack Developer",
          company: "DataCorp",
          location: "San Francisco, CA",
          description: "Looking for a Full Stack Developer heavy on Python and Django, with some React knowledge. You will be building data pipelines and internal dashboards.",
          url: "https://www.linkedin.com/jobs/view/mock-job-3"
        }
      ];

      const matchedJobs = [];

      // Pass 2: Deep Semantic Analysis using Gemini
      for (const job of scrapedJobs) {
        const prompt = `
          You are an expert technical recruiter. Compare the candidate's profile/resume to the job description.
          Calculate a strict skill-for-skill match percentage.
          
          Candidate Profile/Resume:
          ${resumeText || JSON.stringify(preferences)}
          
          Job Description:
          Title: ${job.title}
          Company: ${job.company}
          Description: ${job.description}
          
          You must return a JSON object with the following schema:
          {
            "match_score": number (0-100),
            "reasoning": "string explaining the score",
            "is_approved": boolean (true if match_score >= 90),
            "generated_cover_letter": "string containing a tailored cover letter",
            "inferred_answers": {
              "years_of_experience": "string",
              "sponsorship_required": "string (Yes/No)"
            }
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const result = JSON.parse(response?.text || "{}");
        
        if (result.is_approved) {
          matchedJobs.push({
            ...job,
            match_score: result.match_score,
            reasoning: result.reasoning,
            cover_letter: result.generated_cover_letter,
            inferred_answers: result.inferred_answers,
            status: "new",
            timestamp: new Date().toISOString()
          });
        }
      }

      res.json({ success: true, matches: matchedJobs });
    } catch (error: any) {
      console.error("Trigger search error:", error);
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
