import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

async function generateAndSaveIcon() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A high-quality, professional, flat-design square app icon. A friendly white robot head with two circular eyes, centered on a vibrant blue rounded-square background. Clean lines, modern aesthetic, no text, high resolution, 1024x1024.',
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = path.join(process.cwd(), 'extension', 'icon.png');
        
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
          fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }
        
        fs.writeFileSync(outputPath, buffer);
        console.log(`Successfully saved icon to ${outputPath}`);
        return;
      }
    }
    console.error("No image data found in response.");
  } catch (error) {
    console.error("Error generating icon:", error);
  }
}

generateAndSaveIcon();
