import React from 'react';
import { OutfitSuggestion } from '../types';

interface ResultCardProps {
  suggestions: OutfitSuggestion[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  partnerImage: string | null;
  userImage: string | null;
  isProcessingUser: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  suggestions, 
  selectedIndex, 
  onSelectIndex,
  partnerImage, 
  userImage,
  isProcessingUser
}) => {
  const currentSuggestion = suggestions[selectedIndex];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelectIndex(idx)}
            className={`
              px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all border
              ${selectedIndex === idx 
                ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'}
            `}
          >
            {idx + 1}. {s.styleName}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2 mb-4">
            {currentSuggestion.styleKeywords.map((keyword, idx) => (
                <span key={idx} className="px-3 py-1 bg-brand-50 text-brand-900 text-xs font-bold uppercase tracking-wider rounded-full">
                {keyword}
                </span>
            ))}
            </div>

            <h2 className="text-3xl font-serif text-slate-900 mb-6">
                {currentSuggestion.styleName}
            </h2>

            {/* Couple Visualizer */}
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 mb-8 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Couple Look Studio</span>
                    {isProcessingUser && <span className="text-xs text-brand-500 animate-pulse">正在美化你的照片...</span>}
                </div>
                
                {/* Image Container - Side by Side */}
                <div className="relative aspect-[4/3] md:aspect-[16/9] w-full bg-white rounded-xl overflow-hidden flex items-end justify-center">
                    
                    {/* Background decoration to simulate studio floor */}
                    <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-slate-50 to-transparent"></div>

                    {/* User Image (Left) */}
                    <div className="relative w-[45%] h-[90%] z-10 -mr-8 transition-all duration-500 transform origin-bottom hover:scale-105 hover:z-30">
                         {userImage ? (
                             <img 
                                src={`data:image/jpeg;base64,${userImage}`} 
                                alt="You" 
                                className={`w-full h-full object-contain object-bottom drop-shadow-xl ${isProcessingUser ? 'blur-sm opacity-80' : ''}`}
                             />
                         ) : null}
                    </div>

                    {/* Partner Image (Right) */}
                    <div className="relative w-[45%] h-[95%] z-20 transition-all duration-500 transform origin-bottom hover:scale-105 hover:z-30">
                        {partnerImage ? (
                            <img 
                                src={`data:image/jpeg;base64,${partnerImage}`} 
                                alt="Partner" 
                                className="w-full h-full object-contain object-bottom drop-shadow-2xl"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-brand-400 rounded-full mb-2"></div>
                                <span className="text-xs font-medium">生成中...</span>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">
                    AI 已將背景統一為白色 Studio 風格，讓你預覽合照效果。
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">搭配建議</h3>
                    <p className="text-slate-700 leading-relaxed text-lg mb-4">
                        {currentSuggestion.partnerOutfitDescription}
                    </p>
                    <div className="flex items-start gap-3 text-slate-600 bg-white p-4 rounded-xl border border-slate-100/50">
                        <span className="text-2xl">💡</span>
                        <p className="text-sm italic pt-1">
                            "{currentSuggestion.fashionAdvice}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
