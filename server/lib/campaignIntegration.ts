import { createGoogleAdsCampaign, updateGoogleAdsCampaign, fetchGoogleAdsCampaignPerformance } from './googleAds';
import { createFacebookAdsCampaign, updateFacebookAdsCampaign, fetchFacebookAdsCampaignPerformance } from './facebookAds';
import { db } from '../db';
import { 
  campaigns, 
  platformCampaigns, 
  performanceData 
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Interface for platform-specific campaign IDs
interface PlatformCampaignIds {
  [platform: string]: string;
}

/**
 * Publish campaign to selected platforms
 */
export async function publishCampaign(userId: number, campaignId: number): Promise<PlatformCampaignIds> {
  try {
    // Fetch campaign data
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Check campaign ownership
    if (campaign.userId !== userId) {
      throw new Error('Unauthorized access to campaign');
    }
    
    // Generate platform IDs object to store results
    const platformIds: PlatformCampaignIds = {};
    
    // Get publishing platforms array
    const platforms = campaign.platforms || [];
    
    // Common campaign settings that can be adapted for each platform
    const campaignSettings = {
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      budget: 5000, // Example budget of $50.00 (in cents)
      targetAudience: {
        age: [25, 45],
        gender: ['male', 'female'],
        interests: ['digital marketing', 'advertising'],
        locations: ['United States']
      },
      creativeAssets: {
        // This would be populated with real assets from the ads table
        // For this implementation, we're using placeholders
        headline: 'Experience the Future of Advertising',
        description: 'AI-powered ad creatives that drive engagement and conversions.',
        imageUrl: 'https://example.com/ad-image.jpg',
      },
      startDate: new Date(), // Start today
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // End in 30 days
    };
    
    // Publish to each selected platform
    for (const platform of platforms) {
      let platformId: string;
      
      // Create campaign on the appropriate platform
      if (platform === 'google') {
        platformId = await createGoogleAdsCampaign(userId, campaignId, campaignSettings);
      } else if (platform === 'facebook') {
        platformId = await createFacebookAdsCampaign(userId, campaignId, campaignSettings);
      } else {
        console.warn(`Unsupported platform: ${platform}`);
        continue;
      }
      
      // Store the platform ID
      platformIds[platform] = platformId;
    }
    
    // Update campaign status if needed
    if (campaign.status !== 'active' && Object.keys(platformIds).length > 0) {
      await db
        .update(campaigns)
        .set({ 
          status: 'active',
        })
        .where(eq(campaigns.id, campaignId));
    }
    
    return platformIds;
  } catch (error) {
    console.error('Error publishing campaign:', error);
    throw error;
  }
}

/**
 * Update campaign on all published platforms
 */
export async function updateCampaign(userId: number, campaignId: number, updatedSettings: any): Promise<void> {
  try {
    // Fetch campaign data
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Check campaign ownership
    if (campaign.userId !== userId) {
      throw new Error('Unauthorized access to campaign');
    }
    
    // Fetch platform campaigns
    const platformCampaignList = await db
      .select()
      .from(platformCampaigns)
      .where(eq(platformCampaigns.campaignId, campaignId));
    
    // Update campaign on each platform
    for (const platformCampaign of platformCampaignList) {
      if (platformCampaign.platform === 'google') {
        await updateGoogleAdsCampaign(userId, platformCampaign.platformCampaignId, updatedSettings);
      } else if (platformCampaign.platform === 'facebook') {
        await updateFacebookAdsCampaign(userId, platformCampaign.platformCampaignId, updatedSettings);
      } else {
        console.warn(`Unsupported platform: ${platformCampaign.platform}`);
      }
    }
    
    // Update local campaign data
    await db
      .update(campaigns)
      .set(updatedSettings)
      .where(eq(campaigns.id, campaignId));
    
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

/**
 * Fetch performance data for all platforms of a campaign
 */
export async function fetchCampaignPerformance(userId: number, campaignId: number): Promise<any> {
  try {
    // Fetch campaign data
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Check campaign ownership
    if (campaign.userId !== userId) {
      throw new Error('Unauthorized access to campaign');
    }
    
    // Fetch platform campaigns
    const platformCampaignList = await db
      .select()
      .from(platformCampaigns)
      .where(eq(platformCampaigns.campaignId, campaignId));
    
    // Initialize results object
    const results: any = {
      aggregated: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
      },
      platforms: {},
    };
    
    // Fetch performance data for each platform
    for (const platformCampaign of platformCampaignList) {
      let platformData: any;
      
      if (platformCampaign.platform === 'google') {
        platformData = await fetchGoogleAdsCampaignPerformance(userId, platformCampaign.platformCampaignId);
      } else if (platformCampaign.platform === 'facebook') {
        platformData = await fetchFacebookAdsCampaignPerformance(userId, platformCampaign.platformCampaignId);
      } else {
        console.warn(`Unsupported platform: ${platformCampaign.platform}`);
        continue;
      }
      
      // Add to platform-specific results
      results.platforms[platformCampaign.platform] = platformData;
      
      // Aggregate metrics
      results.aggregated.impressions += platformData.impressions || 0;
      results.aggregated.clicks += platformData.clicks || 0;
      results.aggregated.conversions += platformData.conversions || 0;
      results.aggregated.spend += platformData.spend || 0;
    }
    
    // Calculate overall CTR and CPC
    if (results.aggregated.impressions > 0) {
      results.aggregated.ctr = ((results.aggregated.clicks / results.aggregated.impressions) * 100).toFixed(2) + '%';
    } else {
      results.aggregated.ctr = '0.00%';
    }
    
    if (results.aggregated.clicks > 0) {
      results.aggregated.cpc = '$' + ((results.aggregated.spend / 100) / results.aggregated.clicks).toFixed(2);
    } else {
      results.aggregated.cpc = '$0.00';
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    throw error;
  }
}

/**
 * Get historical performance data for campaign analytics
 */
export async function getHistoricalPerformance(userId: number, campaignId: number, days: number = 30): Promise<any[]> {
  try {
    // Fetch campaign data
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId));
    
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Check campaign ownership
    if (campaign.userId !== userId) {
      throw new Error('Unauthorized access to campaign');
    }
    
    // Fetch platform campaigns
    const platformCampaignList = await db
      .select()
      .from(platformCampaigns)
      .where(eq(platformCampaigns.campaignId, campaignId));
    
    const platformCampaignIds = platformCampaignList.map(pc => pc.id);
    
    if (platformCampaignIds.length === 0) {
      return [];
    }
    
    // Fetch performance data for all platform campaigns
    const performanceDataList = await db
      .select()
      .from(performanceData)
      .where(
        and(
          platformCampaignIds.length === 1 
            ? eq(performanceData.platformCampaignId, platformCampaignIds[0])
            : inArray(performanceData.platformCampaignId, platformCampaignIds),
          gte(performanceData.date, new Date(Date.now() - days * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(performanceData.date);
    
    // Process data for charting (group by date)
    const dateMap: { [date: string]: any } = {};
    
    for (const data of performanceDataList) {
      if (!data.date) continue;
      
      const dateStr = data.date.toISOString().split('T')[0];
      
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = {
          date: dateStr,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
        };
      }
      
      dateMap[dateStr].impressions += data.impressions || 0;
      dateMap[dateStr].clicks += data.clicks || 0;
      dateMap[dateStr].conversions += data.conversions || 0;
      dateMap[dateStr].spend += data.spend || 0;
    }
    
    // Calculate daily CTR and CPC
    Object.values(dateMap).forEach((day: any) => {
      if (day.impressions > 0) {
        day.ctr = (day.clicks / day.impressions) * 100;
      } else {
        day.ctr = 0;
      }
      
      if (day.clicks > 0) {
        day.cpc = (day.spend / 100) / day.clicks;
      } else {
        day.cpc = 0;
      }
    });
    
    return Object.values(dateMap);
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    throw error;
  }
}

/**
 * Helper function for "in array" queries because drizzle-orm doesn't export it directly
 */
function inArray(column: any, values: any[]) {
  if (values.length === 0) return eq(column, null);
  return values.map(value => eq(column, value)).reduce((a, b) => or(a, b));
}

function or(a: any, b: any) {
  return { type: 'or', conditions: [a, b] } as any;
}

function gte(column: any, value: any) {
  return { type: 'gte', column, value } as any;
}