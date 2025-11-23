import { GoogleGenAI, Type } from "@google/genai";
import { Gender, OutfitAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the user's outfit and suggests 3 partner outfits in Traditional Chinese.
 * Specialized for Minimalist Studio Photography.
 */
export const analyzeOutfit = async (
  imageBase64: string,
  userGender: Gender,
  partnerGender: Gender
): Promise<OutfitAnalysis> => {
  const prompt = `
    你是一位專業的影樓造型師，專門負責「簡約風格 (Minimalist Style)」的情侶寫真拍攝。
    客戶準備來影樓拍攝便服情侶相，你的任務是分析用戶上傳的照片，並為其${partnerGender}性伴侶提供搭配建議。

    **影樓拍攝守則 (必須嚴格遵守):**
    1. **極簡約 (Minimalist)**: 服裝必須乾淨俐落。
    2. **拒絕 Logo**: 絕對不要建議有大 Logo、文字或圖案的衣服。
    3. **拒絕花巧**: 避免複雜的格紋或波點，以純色 (Solid colors) 為主。
    4. **質感優先**: 強調布料質感 (如亞麻、棉質、牛仔、針織)。

    請根據用戶的照片，生成以下 **3種特定類型的搭配方案** (請嚴格按照此順序):

    **方案 1: 同色系和諧感 (Tone-on-Tone)**
    - 使用與用戶相近的色調（如大地色配米白、深藍配淺藍）。
    - 營造溫柔、統一、高級的感覺。

    **方案 2: 對比色/層次感 (Contrast & Depth)**
    - 使用對比鮮明但協調的顏色（如黑配白、牛仔藍配卡其）。
    - 突出兩人的獨立性，但畫面依然平衡。

    **方案 3: 低調情侶裝 (Matching Vibe)**
    - 兩人都穿著類似的單品或材質（例如大家都穿白T恤+牛仔褲，或大家都穿卡其色風衣）。
    - 強調 "We belong together" 的視覺連結。

    請以 JSON 格式回傳，包含一個 "suggestions" 陣列，每個建議包含：
    - styleName: 必須是上述三個類別之一 ("同色系和諧風", "時尚對比風", "簡約情侶裝").
    - partnerOutfitDescription: 詳細描述伴侶應該穿什麼 (緊記無Logo、純色)。
    - fashionAdvice: 解釋為什麼這個搭配適合影樓拍攝。
    - imageGenerationPrompt: 一個用來生成圖片的英文 Prompt。**必須強調全身照，純白色背景 (Pure white background studio shot)，無Logo (plain clothing, no logos)，簡約風格 (minimalist style)**。
    - styleKeywords: 3-5個關鍵字 (e.g. Clean, Timeless, Soft).
    
    所有文字描述請使用**繁體中文 (廣東話口語風格)**。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  styleName: { type: Type.STRING },
                  partnerOutfitDescription: { type: Type.STRING },
                  fashionAdvice: { type: Type.STRING },
                  imageGenerationPrompt: { type: Type.STRING },
                  styleKeywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["styleName", "partnerOutfitDescription", "fashionAdvice", "imageGenerationPrompt", "styleKeywords"],
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned from Gemini.");
    return JSON.parse(text) as OutfitAnalysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("分析失敗，請重試。");
  }
};

/**
 * Generates an image of the partner's outfit based on the prompt.
 */
export const generatePartnerLook = async (
  prompt: string
): Promise<string> => {
  try {
    // Enforce studio minimalism constraints in the image generation
    const enhancedPrompt = `${prompt}, wearing plain minimalist clothing without logos or text, standing on a seamless pure white background, studio photography, high key lighting, full body shot, photorealistic, 8k.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: enhancedPrompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: "3:4"
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("無法生成圖片。");
  }
};

/**
 * Processes the user's uploaded image to remove the background/beautify it
 * so it matches the generated partner's "Studio" look.
 */
export const processUserImageToWhiteBg = async (
    imageBase64: string
  ): Promise<string> => {
    try {
      const prompt = "Keep the person exactly as they are, maintaining their face, body shape, and outfit details perfectly. Only change the background to a seamless pure white studio background. High quality, photorealistic.";
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64,
                },
            },
            { text: prompt }
          ],
        },
        config: {
            imageConfig: {
                aspectRatio: "3:4"
            }
        }
      });
  
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      
      // Fallback: if generation fails, return original
      return imageBase64;
    } catch (error) {
      console.error("Background removal failed:", error);
      // Fallback to original image if processing fails
      return imageBase64;
    }
  };