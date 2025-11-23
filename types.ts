export enum Gender {
  Female = '女',
  Male = '男',
  NonBinary = '非二元性別'
}

export interface OutfitSuggestion {
  styleName: string; // e.g. "休閒約會", "隆重晚宴"
  partnerOutfitDescription: string;
  fashionAdvice: string;
  imageGenerationPrompt: string;
  styleKeywords: string[];
}

export interface OutfitAnalysis {
  suggestions: OutfitSuggestion[];
}

export interface AppState {
  userImage: string | null; // Original Base64
  processedUserImage: string | null; // White background Base64
  userGender: Gender;
  partnerGender: Gender;
  isAnalyzing: boolean;
  isProcessingUser: boolean; // Loading state for user image background removal
  analysis: OutfitAnalysis | null;
  generatedPartnerImages: { [key: number]: string }; // Cache generated images by index
  selectedStyleIndex: number;
  error: string | null;
}
