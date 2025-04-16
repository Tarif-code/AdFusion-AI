import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Audio Ad Generation
export async function generateAudioAd(
  product: string,
  target: string = "general audience",
  tone: string = "friendly",
  sellingPoints: string = ""
): Promise<string> {
  try {
    const prompt = `Create a compelling radio/audio ad script for the following product/service:
    
    Product/Service: ${product}
    Target Audience: ${target}
    Tone: ${tone}
    Key Selling Points: ${sellingPoints || "Not specified"}
    
    The script should be around 15-30 seconds when read aloud (approximately 40-75 words). Include instructions for voice acting in [brackets] if needed. Respond with only the script text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return response.choices[0].message.content || "Unable to generate audio ad script";
  } catch (error) {
    console.error("Error generating audio ad:", error);
    throw new Error("Failed to generate audio ad content");
  }
}

// Text Ad Generation
export async function generateTextAd(
  product: string,
  target: string = "general audience",
  tone: string = "friendly",
  sellingPoints: string = ""
): Promise<{
  headline: string;
  url: string;
  body: string;
}> {
  try {
    const prompt = `Create a text ad in Google/Facebook ad format for the following:
    
    Product/Service: ${product}
    Target Audience: ${target}
    Tone: ${tone}
    Key Selling Points: ${sellingPoints || "Not specified"}
    
    Respond in JSON format with the following structure: 
    {
      "headline": "The headline of the ad - compelling and under 30 characters",
      "url": "A relevant, short display URL",
      "body": "The main text of the ad - under 90 characters"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    // Ensure we have a string to parse even if API returns null
    const content = response.choices[0].message.content || '{"headline":"","url":"","body":""}';
    const result = JSON.parse(content as string);

    return {
      headline: result.headline || "Your Product Name",
      url: result.url || "www.example.com",
      body: result.body || "Compelling product description goes here."
    };
  } catch (error) {
    console.error("Error generating text ad:", error);
    throw new Error("Failed to generate text ad content");
  }
}

// Visual Ad Generation (prompt only)
export async function generateVisualAd(
  product: string,
  target: string = "general audience",
  tone: string = "friendly",
  sellingPoints: string = ""
): Promise<string> {
  try {
    const prompt = `Create a detailed image generation prompt for an advertisement with the following details:
    
    Product/Service: ${product}
    Target Audience: ${target}
    Tone: ${tone}
    Key Selling Points: ${sellingPoints || "Not specified"}
    
    The prompt should describe an eye-catching advertisement that would work well on social media or banner ads. Focus on visual elements, style, colors, and composition.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    // In a full implementation, this would be passed to DALL-E or similar
    // For the MVP, we'll just return the prompt
    return response.choices[0].message.content || "Unable to generate visual ad prompt";
  } catch (error) {
    console.error("Error generating visual ad prompt:", error);
    throw new Error("Failed to generate visual ad content");
  }
}
