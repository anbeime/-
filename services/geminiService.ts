import { GoogleGenAI } from "@google/genai";
import { ArticleImage, GenerationConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateArticleFormat = async (
  text: string,
  images: ArticleImage[],
  config: GenerationConfig,
  pdfBase64?: string
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Add PDF if available (Gemini 2.5 Flash handles PDF natively)
    if (pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64
        }
      });
      parts.push({
        text: "Extract and incorporate the content from the attached PDF document into the article."
      });
    }

    // Add Images
    // We map images to placeholders in the prompt
    images.forEach((img, index) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64
        }
      });
    });

    // Construct the Prompt
    let prompt = `
      You are a professional editor for WeChat Official Accounts (微信公众号). 
      
      Task:
      1. Analyze the input text (and PDF content if provided).
      2. Reformat it into a highly engaging, visually appealing article HTML suitable for WeChat.
      3. Use inline CSS styles extensively to make it look professional.
      4. Structure: Title, Introduction, clearly divided Sections with styled Headers, and Conclusion.
      5. Tone: ${config.tone}.
      6. ${config.includeEmoji ? "Use relevant emojis to make the text lively." : "Do not use emojis, keep it strictly professional."}
      
      Images:
      I have attached ${images.length} images. You MUST insert them into the HTML flow where they best fit contextually. 
      Use the placeholder format <img src="[IMAGE_INDEX_ID]" class="auto-scale" /> where ID matches the order (0, 1, 2...). 
      For example, the first image is index 0.
      Apply styles to images: style="display: block; margin: 20px auto; max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"

      Output Requirement:
      Return ONLY the raw HTML code (body content). Do not include \`\`\`html markdown blocks.
      Ensure all styles are inline (e.g., <h2 style="border-left: 4px solid #07c160; padding-left: 10px; color: #333;">).
      Use a nice color palette. Primary accent color: #07c160 (WeChat Green).
    `;

    if (text) {
      prompt += `\n\nInput Text Content:\n${text}`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
    });

    let html = response.text || "";
    
    // Clean up markdown code blocks if Gemini ignores the instruction
    html = html.replace(/```html/g, '').replace(/```/g, '');

    // Replace our custom ID placeholders with actual image sources (Base64 for preview)
    // In a real app, you'd upload these to a CDN. Here we use Base64 for the single-page demo.
    images.forEach((img, index) => {
       // We try to match variations Gemini might produce like [IMAGE_0], IMAGE_0, etc.
       const placeholderRegex = new RegExp(`\\[IMAGE_${index}\\]|\\[IMAGE_INDEX_${index}\\]|src="\\s*\\[?IMAGE_?${index}\\]?\\s*"`, 'gi');
       // We replace the whole src attribute or the placeholder text
       // Simpler approach: Gemini was asked to output <img src="[IMAGE_INDEX_ID]" ... />
       // Let's replace the src content.
       html = html.replace(new RegExp(`\\[IMAGE_INDEX_${index}\\]`, 'g'), img.previewUrl);
       html = html.replace(new RegExp(`\\[IMAGE_${index}\\]`, 'g'), img.previewUrl);
    });

    return html;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to format article. Please check your API key or connection.");
  }
};
