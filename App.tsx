import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultCard } from './components/ResultCard';
import { Button } from './components/Button';
import { analyzeOutfit, generatePartnerLook, processUserImageToWhiteBg } from './services/geminiService';
import { AppState, Gender, OutfitAnalysis } from './types';

function App() {
  const [state, setState] = useState<AppState>({
    userImage: null,
    processedUserImage: null,
    userGender: Gender.Female,
    partnerGender: Gender.Male,
    isAnalyzing: false,
    isProcessingUser: false,
    analysis: null,
    generatedPartnerImages: {},
    selectedStyleIndex: 0,
    error: null,
  });

  const [isEmbed, setIsEmbed] = useState(false);

  // Check for embed mode query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setIsEmbed(searchParams.get('embed') === 'true');
  }, []);

  // Send height updates to parent window (for iframe resizing in WP)
  useEffect(() => {
    if (!isEmbed) return;

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      // Send to parent window (Standard message format for many iframe resizers)
      window.parent.postMessage({ type: 'setHeight', height }, '*');
      window.parent.postMessage({ frameHeight: height }, '*'); // Alternative format
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    // Also send on interval to catch image loads
    const interval = setInterval(sendHeight, 1000);

    return () => {
        observer.disconnect();
        clearInterval(interval);
    };
  }, [isEmbed, state]);

  // Effect: When analysis is done, trigger user image processing (Beautify/White BG)
  useEffect(() => {
    const processUser = async () => {
      if (state.analysis && state.userImage && !state.processedUserImage && !state.isProcessingUser) {
        setState(prev => ({ ...prev, isProcessingUser: true }));
        try {
            const processed = await processUserImageToWhiteBg(state.userImage);
            setState(prev => ({ ...prev, processedUserImage: processed, isProcessingUser: false }));
        } catch (e) {
            console.error("Failed to process user image", e);
            // Fallback to original if failed
            setState(prev => ({ ...prev, processedUserImage: prev.userImage, isProcessingUser: false }));
        }
      }
    };
    processUser();
  }, [state.analysis, state.userImage, state.processedUserImage, state.isProcessingUser]);

  // Effect: Trigger partner image generation for the SELECTED tab if not exists
  useEffect(() => {
    const generateCurrentTabImage = async () => {
      const { analysis, selectedStyleIndex, generatedPartnerImages } = state;
      
      if (analysis && analysis.suggestions[selectedStyleIndex]) {
        // If image for this index already exists, skip
        if (generatedPartnerImages[selectedStyleIndex]) return;

        try {
          const prompt = analysis.suggestions[selectedStyleIndex].imageGenerationPrompt;
          const imageBase64 = await generatePartnerLook(prompt);
          
          setState(prev => ({
            ...prev,
            generatedPartnerImages: {
              ...prev.generatedPartnerImages,
              [selectedStyleIndex]: imageBase64
            }
          }));
        } catch (err) {
           console.error(`Image generation failed for tab ${selectedStyleIndex}`);
        }
      }
    };

    generateCurrentTabImage();
  }, [state.analysis, state.selectedStyleIndex, state.generatedPartnerImages]);

  const handleImageSelected = (base64: string) => {
    setState(prev => ({ 
      ...prev, 
      userImage: base64,
      processedUserImage: null,
      analysis: null, 
      generatedPartnerImages: {},
      error: null 
    }));
  };

  const handleStartAnalysis = async () => {
    if (!state.userImage) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null, selectedStyleIndex: 0 }));

    try {
      const analysis: OutfitAnalysis = await analyzeOutfit(
        state.userImage,
        state.userGender,
        state.partnerGender
      );
      setState(prev => ({ 
        ...prev, 
        analysis, 
        isAnalyzing: false 
      }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: err instanceof Error ? err.message : "發生未知錯誤" 
      }));
    }
  };

  const handleReset = () => {
    setState({
      userImage: null,
      processedUserImage: null,
      userGender: state.userGender,
      partnerGender: state.partnerGender,
      isAnalyzing: false,
      isProcessingUser: false,
      analysis: null,
      generatedPartnerImages: {},
      selectedStyleIndex: 0,
      error: null,
    });
  };

  const toggleUserGender = () => {
     setState(prev => ({
         ...prev,
         userGender: prev.userGender === Gender.Female ? Gender.Male : Gender.Female
     }));
  }

  const togglePartnerGender = () => {
    setState(prev => ({
        ...prev,
        partnerGender: prev.partnerGender === Gender.Male ? Gender.Female : Gender.Male
    }));
 }

  return (
    <div className={`min-h-screen bg-white selection:bg-stone-200 selection:text-stone-900 font-sans text-stone-800 ${isEmbed ? 'pb-0' : 'pb-20'}`}>
      {/* Header - Hidden in Embed Mode */}
      {!isEmbed && (
        <header className="bg-white border-b border-stone-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📷</span>
              <h1 className="font-serif text-lg font-bold text-stone-900 tracking-wide uppercase">Studio Guide · 情侶寫真顧問</h1>
            </div>
            {/* Show Reset button if user has uploaded an image and is not currently analyzing */}
            {state.userImage && !state.isAnalyzing && (
                <button 
                  onClick={handleReset}
                  className="text-xs font-medium text-stone-400 hover:text-stone-900 uppercase tracking-widest transition-colors"
                >
                  重新諮詢
                </button>
            )}
          </div>
        </header>
      )}

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 ${isEmbed ? 'pt-6' : 'pt-12'}`}>
        {/* Intro */}
        {!state.userImage && (
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase bg-stone-100 text-stone-600 rounded-full">
                Pre-shoot Styling Consultation
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-medium text-stone-900 mb-6 leading-tight">
              準備好你們的 <br/> <span className="text-stone-500 italic">簡約風情侶寫真</span> 嗎？
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto font-light leading-relaxed">
              上傳你準備穿著的服裝，AI 造型師會為另一半設計三款不同風格的搭配：
              <span className="font-normal text-stone-800">同色系、對比色、情侶裝</span>。
              <br/>
              <span className="text-sm mt-2 block text-stone-400">
                * 溫馨提示：為配合簡約影樓風格，建議穿著無 Logo 及純色衣物。
              </span>
            </p>
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-none text-red-800 flex items-center gap-3 text-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             {state.error}
          </div>
        )}

        <div className="space-y-8">
          {/* Main Interaction Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* Left Col: Image Upload - Hide on mobile if result exists to focus on result */}
            <div className={`md:col-span-4 ${state.analysis ? 'hidden md:block' : ''}`}>
              <div className="sticky top-6">
                {state.userImage ? (
                  <div className="relative group rounded-none shadow-xl shadow-stone-200/50 bg-white">
                    <img 
                      src={`data:image/jpeg;base64,${state.userImage}`} 
                      alt="Your Outfit" 
                      className="w-full object-cover aspect-[3/4]"
                    />
                    {!state.isAnalyzing && !state.analysis && (
                       <button 
                        onClick={handleReset}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-stone-700 hover:text-stone-900 transition-colors"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                       </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t border-stone-100">
                        <p className="text-xs font-bold uppercase tracking-widest text-center text-stone-500">
                            Client Outfit
                        </p>
                    </div>
                  </div>
                ) : (
                  <ImageUploader onImageSelected={handleImageSelected} />
                )}
                
                {/* Settings Panel - Input Phase */}
                {state.userImage && !state.isAnalyzing && !state.analysis && (
                  <div className="mt-8 bg-stone-50 p-8 rounded-none border border-stone-200 animate-fade-in">
                    <h3 className="text-xs font-bold text-stone-400 mb-6 uppercase tracking-widest">Consultation Settings</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-stone-600 font-serif">您的性別</span>
                            <button 
                                onClick={toggleUserGender}
                                className="px-5 py-2 bg-white border border-stone-200 text-stone-900 text-sm hover:border-stone-400 transition-colors min-w-[100px]"
                            >
                                {state.userGender}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-stone-600 font-serif">伴侶性別</span>
                            <button 
                                onClick={togglePartnerGender}
                                className="px-5 py-2 bg-white border border-stone-200 text-stone-900 text-sm hover:border-stone-400 transition-colors min-w-[100px]"
                            >
                                {state.partnerGender}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-white border border-stone-100 text-xs text-stone-500 leading-relaxed italic">
                        "我們建議影樓拍攝盡量選擇純色、無大Logo的服裝，以突出人物情感。"
                    </div>

                    <div className="mt-8">
                         <Button 
                            onClick={handleStartAnalysis} 
                            isLoading={state.isAnalyzing}
                            className="w-full bg-stone-900 text-white hover:bg-stone-700 rounded-none uppercase tracking-widest text-sm py-4"
                         >
                            生成搭配建議
                         </Button>
                    </div>
                  </div>
                )}

                {/* Settings Panel - Result Phase (Desktop/Tablet) */}
                {state.analysis && (
                  <div className="mt-8 bg-stone-50 p-6 rounded-none border border-stone-200 animate-fade-in hidden md:block">
                    <h3 className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-widest">Next Step</h3>
                    <p className="text-sm text-stone-500 mb-6 font-light">
                      想嘗試其他照片或風格？
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={handleReset} 
                        className="w-full rounded-none border-stone-300 text-stone-600 hover:bg-white hover:text-stone-900 uppercase tracking-widest text-xs"
                    >
                        重新諮詢
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Results */}
            <div className="md:col-span-8">
               {state.analysis ? (
                 <ResultCard 
                   suggestions={state.analysis.suggestions}
                   selectedIndex={state.selectedStyleIndex}
                   onSelectIndex={(idx) => setState(prev => ({ ...prev, selectedStyleIndex: idx }))}
                   partnerImage={state.generatedPartnerImages[state.selectedStyleIndex] || null}
                   userImage={state.processedUserImage || state.userImage} // Show processed if avail, else original
                   isProcessingUser={state.isProcessingUser}
                 />
               ) : state.isAnalyzing ? (
                 <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 bg-stone-50 rounded-none border border-stone-100">
                    <div className="relative w-20 h-20 mb-8">
                        <div className="absolute inset-0 border border-stone-200"></div>
                        <div className="absolute inset-0 border border-stone-800 border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-2xl font-serif text-stone-900 mb-3">Styling in progress...</h3>
                    <p className="text-stone-500 max-w-xs font-light">正在根據簡約影樓風格，為您構思三款完美的搭配方案。</p>
                 </div>
               ) : !state.userImage ? (
                 <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30 hidden md:flex border-2 border-dashed border-stone-200 rounded-lg">
                    <div className="w-16 h-16 bg-stone-100 rounded-full mb-4 flex items-center justify-center text-2xl">🧥</div>
                    <p className="font-serif italic">等待上傳照片...</p>
                 </div>
               ) : null}
               
               {/* Mobile Start Over */}
               {state.analysis && (
                 <div className="block md:hidden mt-12 mb-12">
                    <Button variant="outline" onClick={handleReset} className="w-full rounded-none border-stone-300 text-stone-600">
                        重新諮詢
                    </Button>
                 </div>
               )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;