import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from './components/Toolbar';
import { HistorySidebar } from './components/HistorySidebar';
import { Preview } from './components/Preview';
import { ArticleImage, HistoryItem, GenerationConfig } from './types';
import { generateArticleFormat } from './services/geminiService';
import { X, Image as ImageIcon, Upload } from 'lucide-react';

declare global {
  interface Window {
    mammoth: any;
  }
}

function App() {
  // State
  const [inputText, setInputText] = useState<string>('');
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [formattedHtml, setFormattedHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({
    tone: 'professional',
    includeEmoji: true
  });
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load History
  useEffect(() => {
    const saved = localStorage.getItem('wechat_editor_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save History
  const saveToHistory = (raw: string, html: string, imgs: ArticleImage[]) => {
    const newItem: HistoryItem = {
      id: uuidv4(),
      title: raw.slice(0, 30) + (raw.length > 30 ? '...' : '') || 'Untitled Draft',
      timestamp: Date.now(),
      rawContent: raw,
      formattedContent: html,
      images: imgs // In real app, persist images to storage/db, here we rely on memory/base64 for demo session or small payloads
    };
    
    // Check if we just formatted the same thing (debouncing saves roughly)
    const last = history[0];
    if (last && last.rawContent === raw && last.formattedContent === html) return;

    const newHistory = [newItem, ...history].slice(0, 20); // Keep last 20
    setHistory(newHistory);
    localStorage.setItem('wechat_editor_history', JSON.stringify(newHistory));
  };

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages: ArticleImage[] = [];
      const files = Array.from(e.target.files) as File[];
      for (const file of files) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (evt) => {
             const result = evt.target?.result as string;
             // Extract base64 clean string
             const base64 = result.split(',')[1];
             newImages.push({
               id: uuidv4(),
               file,
               previewUrl: result,
               base64,
               mimeType: file.type
             });
             resolve();
          };
          reader.readAsDataURL(file);
        });
      }
      setImages(prev => [...prev, ...newImages]);
    }
    // clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDocumentImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.docx')) {
        // Use Mammoth
        if (window.mammoth) {
            const arrayBuffer = await file.arrayBuffer();
            try {
                const result = await window.mammoth.extractRawText({ arrayBuffer });
                setInputText(prev => prev + "\n\n" + result.value);
            } catch (err) {
                console.error(err);
                alert("Failed to parse Word document.");
            }
        } else {
            alert("Mammoth library not loaded yet.");
        }
    } else if (file.name.endsWith('.pdf')) {
        // For PDF, we will store the file as a base64 string to send to Gemini
        // We will notify the user that it will be processed during the "Format" step.
        const reader = new FileReader();
        reader.onload = (evt) => {
            const base64 = (evt.target?.result as string).split(',')[1];
            // We'll append a special tag to the input text or handle it in state
            // Ideally, we treat PDF as a special "Image" or "Context source"
            // For this UI, let's just trigger the format immediately or ask confirmation.
            // Let's automate: Set a hidden state or just trigger formatting.
            // To keep it simple: We will ask Gemini to process it immediately.
            handleFormat(base64); 
        };
        reader.readAsDataURL(file);
    }
  };

  const handleFormat = async (pdfContent?: string) => {
    if (!inputText && images.length === 0 && !pdfContent) return;
    
    setIsGenerating(true);
    try {
      const html = await generateArticleFormat(inputText, images, generationConfig, pdfContent);
      setFormattedHtml(html);
      saveToHistory(inputText, html, images);
    } catch (err) {
      alert("Error generating content. Please check console.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!formattedHtml) return;
    try {
        const type = "text/html";
        const blob = new Blob([formattedHtml], { type });
        const data = [new ClipboardItem({ [type]: blob })];
        await navigator.clipboard.write(data);
        alert("Copied to clipboard! Ready to paste into WeChat.");
    } catch (e) {
        // Fallback for text
        await navigator.clipboard.writeText(formattedHtml);
        alert("Copied HTML code.");
    }
  };

  const selectHistory = (item: HistoryItem) => {
    setInputText(item.rawContent);
    setFormattedHtml(item.formattedContent);
    setImages(item.images || []);
    setIsHistoryOpen(false);
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('wechat_editor_history', JSON.stringify(newHistory));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <Toolbar 
        onFormat={() => handleFormat()} 
        onCopy={handleCopy} 
        isGenerating={isGenerating}
        onImportDoc={handleDocumentImport}
        config={generationConfig}
        setConfig={setGenerationConfig}
        toggleHistory={() => setIsHistoryOpen(true)}
      />
      
      <HistorySidebar 
        history={history}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={selectHistory}
        onDelete={deleteHistory}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor & Assets */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* Image Drop Zone / List */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Images ({images.length})</h3>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs flex items-center gap-1 text-green-600 font-medium hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                    >
                        <Upload className="w-3 h-3" />
                        Add Images
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                </div>
                
                {images.length === 0 ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all group"
                    >
                        <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
                        <p className="text-sm text-slate-500">Drag & Drop images or click to upload</p>
                        <p className="text-xs text-slate-400 mt-1">AI will auto-place them in the article</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {images.map((img, idx) => (
                            <div key={img.id} className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-0.5 truncate text-center">
                                    Idx: {idx}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Text Editor */}
            <div className="h-full flex flex-col">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Content</h3>
                <textarea
                    className="flex-1 w-full p-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 shadow-inner"
                    placeholder="Paste your raw text here, or import a Word/PDF document..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                ></textarea>
                <div className="text-xs text-slate-400 mt-2 text-right">
                    {inputText.length} chars
                </div>
            </div>

          </div>
        </div>

        {/* Right: Preview */}
        <div className="w-[450px] bg-slate-100 border-l border-slate-200 relative hidden lg:block">
            <div className="absolute top-4 left-0 right-0 text-center z-10">
                 <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-medium">Mobile Preview</span>
            </div>
            <Preview htmlContent={formattedHtml} />
        </div>
      </div>
    </div>
  );
}

export default App;