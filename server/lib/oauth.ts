import { google, Auth } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';
import CryptoJS from 'crypto-js';
import { db } from '../db';
import { oauthTokens, type InsertOauthToken } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Encryption key for refresh tokens - in production, this should be loaded from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'adFusionAIPlatformEncryptionKey123!';

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Gets Google OAuth2 client
 */
export function getGoogleOAuth2Client(): OAuth2Client {
  const redirectUrl = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(): string {
  const oauth2Client = getGoogleOAuth2Client();
  
  // Set the appropriate scopes for Google Ads API
  const scopes = [
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  // Generate a URL to request access from the user
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // This ensures that we'll always get a refresh token
  });
}

/**
 * Exchange Google authorization code for tokens
 */
export async function exchangeGoogleCode(code: string): Promise<Auth.Credentials> {
  const oauth2Client = getGoogleOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

/**
 * Generate Facebook OAuth authorization URL
 */
export function getFacebookAuthUrl(): string {
  const redirectUrl = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback';
  const appId = process.env.FACEBOOK_APP_ID;
  
  // Set the appropriate scopes for Facebook Marketing API
  const scopes = [
    'public_profile',
    'email',
    'ads_management',
    'ads_read',
  ].join(',');

  return `https://www.facebook.com/v14.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=${scopes}&response_type=code`;
}

/**
 * Exchange Facebook authorization code for tokens
 */
export async function exchangeFacebookCode(code: string): Promise<any> {
  const redirectUrl = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback';
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  
  // Exchange the authorization code for an access token
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v14.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUrl)}&client_secret=${appSecret}&code=${code}`,
    { method: 'GET' }
  );
  
  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange Facebook code: ${await tokenResponse.text()}`);
  }
  
  const tokenData = await tokenResponse.json() as any;
  
  // Get long-lived access token
  const longLivedTokenResponse = await fetch(
    `https://graph.facebook.com/v14.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`,
    { method: 'GET' }
  );
  
  if (!longLivedTokenResponse.ok) {
    throw new Error(`Failed to get long-lived token: ${await longLivedTokenResponse.text()}`);
  }
  
  const longLivedTokenData = await longLivedTokenResponse.json() as any;
  
  return {
    access_token: longLivedTokenData.access_token,
    token_type: 'bearer',
    expires_in: longLivedTokenData.expires_in,
  };
}

/**
 * Save OAuth token to database
 */
export async function saveOAuthToken(userId: number, platform: string, tokens: any): Promise<void> {
  // Check if there's an existing token for this user and platform
  const existingTokens = await db
    .select()
    .from(oauthTokens)
    .where(and(
      eq(oauthTokens.userId, userId),
      eq(oauthTokens.platform, platform)
    ));
  
  const expiresAt = tokens.expiry_date || 
    (tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null);

  // Encrypt refresh token if it exists
  let encryptedRefreshToken = null;
  if (tokens.refresh_token) {
    encryptedRefreshToken = encrypt(tokens.refresh_token);
  }

  const tokenData: Partial<InsertOauthToken> = {
    userId,
    platform,
    accessToken: tokens.access_token,
    refreshToken: encryptedRefreshToken,
    tokenType: tokens.token_type || 'bearer',
    expiresAt: expiresAt as Date,
    scope: Array.isArray(tokens.scope) ? tokens.scope.join(' ') : tokens.scope,
  };

  if (existingTokens.length > 0) {
    // Update existing token
    await db
      .update(oauthTokens)
      .set({ 
        ...tokenData,
        updatedAt: new Date() 
      })
      .where(eq(oauthTokens.id, existingTokens[0].id));
  } else {
    // Insert new token
    await db
      .insert(oauthTokens)
      .values(tokenData as InsertOauthToken);
  }
}

/**
 * Get valid OAuth token for user and platform
 */
export async function getValidOAuthToken(userId: number, platform: string): Promise<any> {
  const [token] = await db
    .select()
    .from(oauthTokens)
    .where(and(
      eq(oauthTokens.userId, userId),
      eq(oauthTokens.platform, platform)
    ));

  if (!token) {
    throw new Error(`No ${platform} OAuth token found for user ${userId}`);
  }

  // Check if token needs refreshing
  const now = new Date();
  if (token.expiresAt && now > token.expiresAt) {
    // Token is expired, refresh it
    if (platform === 'google' && token.refreshToken) {
      const oauth2Client = getGoogleOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: decrypt(token.refreshToken)
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveOAuthToken(userId, platform, credentials);

      return {
        accessToken: credentials.access_token,
        tokenType: credentials.token_type,
      };
    } else if (platform === 'facebook') {
      // Facebook tokens need to be reauthorized by the user when they expire
      throw new Error(`Facebook token has expired. User must reauthorize.`);
    }
  }

  return {
    accessToken: token.accessToken,
    tokenType: token.tokenType,
  };
}