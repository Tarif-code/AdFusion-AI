import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Campaigns Schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "audio", "visual", "text", "multi-format"
  status: text("status").notNull(), // "active", "paused", "scheduled", "completed"
  platforms: text("platforms").array().notNull(), // ["google", "facebook", "spotify"]
  performance: integer("performance"), // Percentage (0-100)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  userId: true,
  name: true,
  type: true,
  status: true,
  platforms: true,
  performance: true,
});

// Ads Schema
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "audio", "visual", "text"
  content: json("content").notNull(), // Stores ad content (script, text, image URLs)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdSchema = createInsertSchema(ads).pick({
  campaignId: true,
  userId: true,
  type: true,
  content: true,
});

// Analytics Schema
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  date: timestamp("date").defaultNow(),
});

export const insertAnalyticsSchema = createInsertSchema(analytics).pick({
  campaignId: true,
  impressions: true,
  clicks: true,
  conversions: true,
  date: true,
});

// Platform Connections Schema
export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(), // "google", "facebook", "spotify"
  connected: boolean("connected").default(false),
  credentials: json("credentials"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).pick({
  userId: true,
  platform: true,
  connected: true,
  credentials: true,
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  ads: many(ads),
  platformConnections: many(platformConnections),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  ads: many(ads),
  analytics: many(analytics),
}));

export const adsRelations = relations(ads, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [ads.campaignId],
    references: [campaigns.id],
  }),
  user: one(users, {
    fields: [ads.userId],
    references: [users.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [analytics.campaignId],
    references: [campaigns.id],
  }),
}));

export const platformConnectionsRelations = relations(platformConnections, ({ one }) => ({
  user: one(users, {
    fields: [platformConnections.userId],
    references: [users.id],
  }),
}));

// Type Definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// OAuth Tokens Schema
export const oauthTokens = pgTable("oauth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  platform: text("platform").notNull(), // "google", "facebook"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenType: text("token_type"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOauthTokenSchema = createInsertSchema(oauthTokens).pick({
  userId: true,
  platform: true,
  accessToken: true,
  refreshToken: true,
  tokenType: true,
  expiresAt: true,
  scope: true,
});

// Platform Campaign Data Schema
export const platformCampaigns = pgTable("platform_campaigns", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  platform: text("platform").notNull(), // "google", "facebook"
  platformCampaignId: text("platform_campaign_id").notNull(), // ID on the external platform
  status: text("status").notNull(), // "active", "paused", "completed"
  publishedAt: timestamp("published_at"),
  budget: integer("budget"),
  platformData: jsonb("platform_data"), // Platform-specific campaign data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformCampaignSchema = createInsertSchema(platformCampaigns).pick({
  campaignId: true,
  platform: true,
  platformCampaignId: true,
  status: true,
  publishedAt: true,
  budget: true,
  platformData: true,
});

// Performance Data Schema
export const performanceData = pgTable("performance_data", {
  id: serial("id").primaryKey(),
  platformCampaignId: integer("platform_campaign_id").notNull(),
  date: timestamp("date").defaultNow(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  ctr: text("ctr"), // Click-through rate
  cpc: text("cpc"), // Cost per click
  spend: integer("spend").default(0), // Amount spent in cents
  otherMetrics: jsonb("other_metrics"), // Platform-specific metrics
});

export const insertPerformanceDataSchema = createInsertSchema(performanceData).pick({
  platformCampaignId: true,
  date: true,
  impressions: true,
  clicks: true,
  conversions: true,
  ctr: true,
  cpc: true,
  spend: true,
  otherMetrics: true,
});

// Add additional relations
export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

export const platformCampaignsRelations = relations(platformCampaigns, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [platformCampaigns.campaignId],
    references: [campaigns.id],
  }),
  performanceData: many(performanceData),
}));

export const performanceDataRelations = relations(performanceData, ({ one }) => ({
  platformCampaign: one(platformCampaigns, {
    fields: [performanceData.platformCampaignId],
    references: [platformCampaigns.id],
  }),
}));

// Type Definitions
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;
export type PlatformConnection = typeof platformConnections.$inferSelect;

export type InsertOauthToken = z.infer<typeof insertOauthTokenSchema>;
export type OauthToken = typeof oauthTokens.$inferSelect;

export type InsertPlatformCampaign = z.infer<typeof insertPlatformCampaignSchema>;
export type PlatformCampaign = typeof platformCampaigns.$inferSelect;

export type InsertPerformanceData = z.infer<typeof insertPerformanceDataSchema>;
export type PerformanceData = typeof performanceData.$inferSelect;
