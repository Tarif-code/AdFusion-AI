import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCampaignSchema, 
  insertAdSchema, 
  insertAnalyticsSchema, 
  insertPlatformConnectionSchema 
} from "@shared/schema";
import { z } from "zod";
import { generateAudioAd, generateTextAd, generateVisualAd } from "./lib/openai";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

// Import integration routes
import integrationsRoutes from "./routes/integrations";

const SessionStore = MemoryStore(session);

// Function to seed demo data
async function seedDemoData(): Promise<void> {
  try {
    // Check if demo user exists
    const existingUser = await storage.getUserByUsername('demo');
    
    if (!existingUser) {
      // Create demo user
      await storage.createUser({
        username: 'demo',
        password: 'demo123',
        email: 'demo@example.com',
        fullName: 'Alex Johnson'
      });
      
      console.log("Demo user created successfully");
    }
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed demo data
  await seedDemoData();
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "adFusionSecretKey",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json({ user });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.user) {
      return res.json({ user: req.user });
    }
    return res.status(401).json({ message: "Not authenticated" });
  });

  // Campaign routes
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const campaigns = await storage.getCampaignsByUserId(userId);
      res.json({ campaigns });
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaigns" });
    }
  });

  app.get("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Make sure user owns this campaign
      if (campaign.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json({ campaign });
    } catch (error) {
      res.status(500).json({ message: "Error fetching campaign" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        userId
      });
      
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json({ campaign });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating campaign" });
    }
  });

  app.put("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Make sure user owns this campaign
      if (campaign.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
      res.json({ campaign: updatedCampaign });
    } catch (error) {
      res.status(500).json({ message: "Error updating campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Make sure user owns this campaign
      if (campaign.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCampaign(campaignId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting campaign" });
    }
  });

  // Ad routes
  app.get("/api/ads", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const ads = await storage.getAdsByUserId(userId);
      res.json({ ads });
    } catch (error) {
      res.status(500).json({ message: "Error fetching ads" });
    }
  });

  app.get("/api/campaigns/:campaignId/ads", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Make sure user owns this campaign
      if (campaign.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const ads = await storage.getAdsByCampaignId(campaignId);
      res.json({ ads });
    } catch (error) {
      res.status(500).json({ message: "Error fetching ads" });
    }
  });

  app.post("/api/ads", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const adData = insertAdSchema.parse({
        ...req.body,
        userId
      });
      
      // Verify campaign exists and belongs to user
      const campaign = await storage.getCampaign(adData.campaignId);
      if (!campaign || campaign.userId !== userId) {
        return res.status(403).json({ message: "Invalid campaign" });
      }
      
      const ad = await storage.createAd(adData);
      res.status(201).json({ ad });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating ad" });
    }
  });

  // AI Content Generation
  app.post("/api/generate/audio", isAuthenticated, async (req, res) => {
    try {
      const { product, target, tone, sellingPoints } = req.body;
      if (!product) {
        return res.status(400).json({ message: "Product information is required" });
      }
      
      const script = await generateAudioAd(product, target, tone, sellingPoints);
      res.json({ script });
    } catch (error) {
      console.error("Error generating audio ad:", error);
      res.status(500).json({ message: "Error generating audio ad" });
    }
  });

  app.post("/api/generate/text", isAuthenticated, async (req, res) => {
    try {
      const { product, target, tone, sellingPoints } = req.body;
      if (!product) {
        return res.status(400).json({ message: "Product information is required" });
      }
      
      const adCopy = await generateTextAd(product, target, tone, sellingPoints);
      res.json({ adCopy });
    } catch (error) {
      console.error("Error generating text ad:", error);
      res.status(500).json({ message: "Error generating text ad" });
    }
  });

  app.post("/api/generate/visual", isAuthenticated, async (req, res) => {
    try {
      const { product, target, tone, sellingPoints } = req.body;
      if (!product) {
        return res.status(400).json({ message: "Product information is required" });
      }
      
      const imageUrl = await generateVisualAd(product, target, tone, sellingPoints);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating visual ad:", error);
      res.status(500).json({ message: "Error generating visual ad" });
    }
  });

  // Analytics routes
  app.get("/api/campaigns/:campaignId/analytics", isAuthenticated, async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Make sure user owns this campaign
      if (campaign.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const analytics = await storage.getAnalyticsByCampaignId(campaignId);
      res.json({ analytics });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics" });
    }
  });

  // Register integrations routes
  app.use("/api/integrations", integrationsRoutes);
  
  // Platform connection routes
  app.get("/api/platform-connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connections = await storage.getPlatformConnectionsByUserId(userId);
      res.json({ connections });
    } catch (error) {
      res.status(500).json({ message: "Error fetching platform connections" });
    }
  });

  app.post("/api/platform-connections", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const connectionData = insertPlatformConnectionSchema.parse({
        ...req.body,
        userId
      });
      
      const connection = await storage.createPlatformConnection(connectionData);
      res.status(201).json({ connection });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating platform connection" });
    }
  });

  app.put("/api/platform-connections/:id", isAuthenticated, async (req, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      // Find existing platform connection
      const connections = await storage.getPlatformConnectionsByUserId((req.user as any).id);
      const connection = connections.find(conn => conn.id === connectionId);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      const updatedConnection = await storage.updatePlatformConnection(connectionId, req.body);
      res.json({ connection: updatedConnection });
    } catch (error) {
      res.status(500).json({ message: "Error updating platform connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
