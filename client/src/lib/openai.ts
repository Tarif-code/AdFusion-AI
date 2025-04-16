// Frontend interface for OpenAI-related operations
import { apiRequest } from "./queryClient";

// Generate audio ad script
export async function generateAudioAd(
  product: string,
  target: string,
  tone: string,
  sellingPoints: string
): Promise<string> {
  const res = await apiRequest("POST", "/api/generate/audio", {
    product,
    target,
    tone,
    sellingPoints
  });
  
  const data = await res.json();
  return data.script;
}

// Generate text ad copy
export async function generateTextAd(
  product: string,
  target: string,
  tone: string,
  sellingPoints: string
): Promise<{
  headline: string;
  url: string;
  body: string;
}> {
  const res = await apiRequest("POST", "/api/generate/text", {
    product,
    target,
    tone,
    sellingPoints
  });
  
  const data = await res.json();
  return data.adCopy;
}

// Generate visual ad prompt
export async function generateVisualAd(
  product: string,
  target: string,
  tone: string,
  sellingPoints: string
): Promise<string> {
  const res = await apiRequest("POST", "/api/generate/visual", {
    product,
    target,
    tone,
    sellingPoints
  });
  
  const data = await res.json();
  return data.imageUrl;
}
