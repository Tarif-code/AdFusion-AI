import { 
  users, type User, type InsertUser,
  campaigns, type Campaign, type InsertCampaign,
  ads, type Ad, type InsertAd,
  analytics, type Analytics, type InsertAnalytics,
  platformConnections, type PlatformConnection, type InsertPlatformConnection 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface with CRUD methods
export interface IStorage {
  // User CRUD
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Campaign CRUD
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByUserId(userId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  
  // Ad CRUD
  getAd(id: number): Promise<Ad | undefined>;
  getAdsByCampaignId(campaignId: number): Promise<Ad[]>;
  getAdsByUserId(userId: number): Promise<Ad[]>;
  createAd(ad: InsertAd): Promise<Ad>;
  updateAd(id: number, ad: Partial<Ad>): Promise<Ad | undefined>;
  deleteAd(id: number): Promise<boolean>;
  
  // Analytics CRUD
  getAnalyticsByCampaignId(campaignId: number): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(id: number, analytics: Partial<Analytics>): Promise<Analytics | undefined>;
  
  // Platform Connection CRUD
  getPlatformConnectionsByUserId(userId: number): Promise<PlatformConnection[]>;
  createPlatformConnection(connection: InsertPlatformConnection): Promise<PlatformConnection>;
  updatePlatformConnection(id: number, connection: Partial<PlatformConnection>): Promise<PlatformConnection | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User CRUD methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Campaign CRUD methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignsByUserId(userId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: number, updatedCampaign: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set(updatedCampaign)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      const result = await db.delete(campaigns).where(eq(campaigns.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }
  }

  // Ad CRUD methods
  async getAd(id: number): Promise<Ad | undefined> {
    const [ad] = await db.select().from(ads).where(eq(ads.id, id));
    return ad;
  }

  async getAdsByCampaignId(campaignId: number): Promise<Ad[]> {
    return await db.select().from(ads).where(eq(ads.campaignId, campaignId));
  }

  async getAdsByUserId(userId: number): Promise<Ad[]> {
    return await db.select().from(ads).where(eq(ads.userId, userId));
  }

  async createAd(insertAd: InsertAd): Promise<Ad> {
    const [ad] = await db.insert(ads).values(insertAd).returning();
    return ad;
  }

  async updateAd(id: number, updatedAd: Partial<Ad>): Promise<Ad | undefined> {
    const [ad] = await db
      .update(ads)
      .set(updatedAd)
      .where(eq(ads.id, id))
      .returning();
    return ad;
  }

  async deleteAd(id: number): Promise<boolean> {
    try {
      const result = await db.delete(ads).where(eq(ads.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting ad:", error);
      return false;
    }
  }

  // Analytics CRUD methods
  async getAnalyticsByCampaignId(campaignId: number): Promise<Analytics[]> {
    return await db.select().from(analytics).where(eq(analytics.campaignId, campaignId));
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const [analytic] = await db.insert(analytics).values(insertAnalytics).returning();
    return analytic;
  }

  async updateAnalytics(id: number, updatedAnalytics: Partial<Analytics>): Promise<Analytics | undefined> {
    const [analytic] = await db
      .update(analytics)
      .set(updatedAnalytics)
      .where(eq(analytics.id, id))
      .returning();
    return analytic;
  }

  // Platform Connection CRUD methods
  async getPlatformConnectionsByUserId(userId: number): Promise<PlatformConnection[]> {
    return await db.select().from(platformConnections).where(eq(platformConnections.userId, userId));
  }

  async createPlatformConnection(insertConnection: InsertPlatformConnection): Promise<PlatformConnection> {
    const [connection] = await db.insert(platformConnections).values(insertConnection).returning();
    return connection;
  }

  async updatePlatformConnection(id: number, updatedConnection: Partial<PlatformConnection>): Promise<PlatformConnection | undefined> {
    const [connection] = await db
      .update(platformConnections)
      .set(updatedConnection)
      .where(eq(platformConnections.id, id))
      .returning();
    return connection;
  }
}

// For a clean transition, we'll keep the MemStorage class for reference
export class MemStorage implements IStorage {
  // Implementation removed for brevity as it's being replaced by DatabaseStorage
  async getUser(id: number): Promise<User | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async createUser(insertUser: InsertUser): Promise<User> { throw new Error("Not implemented"); }
  async getCampaign(id: number): Promise<Campaign | undefined> { return undefined; }
  async getCampaignsByUserId(userId: number): Promise<Campaign[]> { return []; }
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> { throw new Error("Not implemented"); }
  async updateCampaign(id: number, updatedCampaign: Partial<Campaign>): Promise<Campaign | undefined> { return undefined; }
  async deleteCampaign(id: number): Promise<boolean> { return false; }
  async getAd(id: number): Promise<Ad | undefined> { return undefined; }
  async getAdsByCampaignId(campaignId: number): Promise<Ad[]> { return []; }
  async getAdsByUserId(userId: number): Promise<Ad[]> { return []; }
  async createAd(insertAd: InsertAd): Promise<Ad> { throw new Error("Not implemented"); }
  async updateAd(id: number, updatedAd: Partial<Ad>): Promise<Ad | undefined> { return undefined; }
  async deleteAd(id: number): Promise<boolean> { return false; }
  async getAnalyticsByCampaignId(campaignId: number): Promise<Analytics[]> { return []; }
  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> { throw new Error("Not implemented"); }
  async updateAnalytics(id: number, updatedAnalytics: Partial<Analytics>): Promise<Analytics | undefined> { return undefined; }
  async getPlatformConnectionsByUserId(userId: number): Promise<PlatformConnection[]> { return []; }
  async createPlatformConnection(insertConnection: InsertPlatformConnection): Promise<PlatformConnection> { throw new Error("Not implemented"); }
  async updatePlatformConnection(id: number, updatedConnection: Partial<PlatformConnection>): Promise<PlatformConnection | undefined> { return undefined; }
}

export const storage = new DatabaseStorage();
