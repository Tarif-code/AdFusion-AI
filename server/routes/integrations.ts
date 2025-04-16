import { Router, Request, Response } from 'express';
import { 
  getGoogleAuthUrl, 
  exchangeGoogleCode, 
  getFacebookAuthUrl, 
  exchangeFacebookCode, 
  saveOAuthToken, 
  getValidOAuthToken 
} from '../lib/oauth';
import { 
  publishCampaign, 
  updateCampaign, 
  fetchCampaignPerformance, 
  getHistoricalPerformance 
} from '../lib/campaignIntegration';
import { db } from '../db';
import { 
  platformConnections,
  oauthTokens,
  platformCampaigns
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Get integration platforms status (connected/disconnected)
router.get('/status', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get all platform connections for the user
    const connections = await db
      .select()
      .from(platformConnections)
      .where(eq(platformConnections.userId, userId));
    
    // Get all OAuth tokens for the user
    const tokens = await db
      .select({
        id: oauthTokens.id,
        platform: oauthTokens.platform,
        expiresAt: oauthTokens.expiresAt
      })
      .from(oauthTokens)
      .where(eq(oauthTokens.userId, userId));
    
    // Create a platforms status object
    const platformsStatus = {
      google: {
        connected: false,
        tokenExpired: false
      },
      facebook: {
        connected: false,
        tokenExpired: false
      }
    };
    
    // Update status based on tokens
    tokens.forEach(token => {
      if (token.platform === 'google' || token.platform === 'facebook') {
        platformsStatus[token.platform].connected = true;
        
        // Check if token is expired
        if (token.expiresAt && new Date() > token.expiresAt) {
          platformsStatus[token.platform].tokenExpired = true;
        }
      }
    });
    
    res.json({ platforms: platformsStatus });
  } catch (error) {
    console.error('Error getting integration status:', error);
    res.status(500).json({ message: 'Error getting integration status' });
  }
});

// Get OAuth authorization URL for Google
router.get('/auth/google', isAuthenticated, (req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ message: 'Error generating Google auth URL' });
  }
});

// Handle OAuth callback for Google
router.get('/auth/google/callback', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }
    
    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code as string);
    
    // Save tokens to database
    await saveOAuthToken(req.user.id, 'google', tokens);
    
    // Create or update platform connection
    const existingConnections = await db
      .select()
      .from(platformConnections)
      .where(and(
        eq(platformConnections.userId, req.user.id),
        eq(platformConnections.platform, 'google')
      ));
    
    if (existingConnections.length === 0) {
      // Create new connection
      await db
        .insert(platformConnections)
        .values({
          userId: req.user.id,
          platform: 'google',
          connected: true,
          credentials: { tokenId: tokens.id_token }
        });
    } else {
      // Update existing connection
      await db
        .update(platformConnections)
        .set({
          connected: true,
          credentials: { tokenId: tokens.id_token }
        })
        .where(eq(platformConnections.id, existingConnections[0].id));
    }
    
    // Redirect to frontend
    res.redirect('/integrations/success?platform=google');
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    res.redirect('/integrations/error?platform=google');
  }
});

// Get OAuth authorization URL for Facebook
router.get('/auth/facebook', isAuthenticated, (req: Request, res: Response) => {
  try {
    const authUrl = getFacebookAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Facebook auth URL:', error);
    res.status(500).json({ message: 'Error generating Facebook auth URL' });
  }
});

// Handle OAuth callback for Facebook
router.get('/auth/facebook/callback', isAuthenticated, async (req: any, res: Response) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }
    
    // Exchange code for tokens
    const tokens = await exchangeFacebookCode(code as string);
    
    // Save tokens to database
    await saveOAuthToken(req.user.id, 'facebook', tokens);
    
    // Create or update platform connection
    const existingConnections = await db
      .select()
      .from(platformConnections)
      .where(and(
        eq(platformConnections.userId, req.user.id),
        eq(platformConnections.platform, 'facebook')
      ));
    
    if (existingConnections.length === 0) {
      // Create new connection
      await db
        .insert(platformConnections)
        .values({
          userId: req.user.id,
          platform: 'facebook',
          connected: true,
          credentials: {}
        });
    } else {
      // Update existing connection
      await db
        .update(platformConnections)
        .set({
          connected: true,
          credentials: {}
        })
        .where(eq(platformConnections.id, existingConnections[0].id));
    }
    
    // Redirect to frontend
    res.redirect('/integrations/success?platform=facebook');
  } catch (error) {
    console.error('Error in Facebook OAuth callback:', error);
    res.redirect('/integrations/error?platform=facebook');
  }
});

// Publish campaign to platforms
router.post('/campaigns/:campaignId/publish', isAuthenticated, async (req: any, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user.id;
    
    // Publish campaign to all selected platforms
    const platformIds = await publishCampaign(userId, campaignId);
    
    res.json({ success: true, platformIds });
  } catch (error) {
    console.error('Error publishing campaign:', error);
    res.status(500).json({ message: 'Error publishing campaign', error: error.message });
  }
});

// Update campaign on platforms
router.put('/campaigns/:campaignId', isAuthenticated, async (req: any, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user.id;
    const updatedSettings = req.body;
    
    // Update campaign on all platforms
    await updateCampaign(userId, campaignId, updatedSettings);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Error updating campaign', error: error.message });
  }
});

// Get campaign performance data
router.get('/campaigns/:campaignId/performance', isAuthenticated, async (req: any, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user.id;
    
    // Fetch performance data for the campaign
    const performanceData = await fetchCampaignPerformance(userId, campaignId);
    
    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({ message: 'Error fetching campaign performance', error: error.message });
  }
});

// Get historical performance data for analytics
router.get('/campaigns/:campaignId/analytics', isAuthenticated, async (req: any, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const userId = req.user.id;
    const days = parseInt(req.query.days as string) || 30;
    
    // Get historical performance data
    const historicalData = await getHistoricalPerformance(userId, campaignId, days);
    
    res.json({ data: historicalData });
  } catch (error) {
    console.error('Error fetching historical performance:', error);
    res.status(500).json({ message: 'Error fetching historical performance', error: error.message });
  }
});

// Get platform-specific campaign details
router.get('/campaigns/:campaignId/platform/:platform', isAuthenticated, async (req: any, res: Response) => {
  try {
    const campaignId = parseInt(req.params.campaignId);
    const platform = req.params.platform;
    const userId = req.user.id;
    
    // Get platform campaign details
    const [platformCampaign] = await db
      .select()
      .from(platformCampaigns)
      .where(and(
        eq(platformCampaigns.campaignId, campaignId),
        eq(platformCampaigns.platform, platform)
      ));
    
    if (!platformCampaign) {
      return res.status(404).json({ message: 'Platform campaign not found' });
    }
    
    res.json(platformCampaign);
  } catch (error) {
    console.error('Error fetching platform campaign details:', error);
    res.status(500).json({ message: 'Error fetching platform campaign details', error: error.message });
  }
});

export default router;