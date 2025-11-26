import React, { useEffect, useRef } from 'react';

interface PreviewProps {
  htmlContent: string;
}

export const Preview: React.FC<PreviewProps> = ({ htmlContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply WeChat-specific styles via inline style tag inside the container to ensure isolation
  // But since we asked Gemini for inline styles, we just provide the container
  
  return (
    <div className="h-full bg-slate-100 flex items-center justify-center p-4">
        {/* Phone Frame */}
        <div className="w-[375px] h-[750px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-900 relative overflow-hidden shrink-0">
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-32 bg-slate-900 rounded-b-2xl z-20"></div>
            
            {/* Status Bar Mock */}
            <div className="h-12 bg-white flex items-end justify-between px-6 pb-2 text-xs font-medium text-slate-900 z-10 sticky top-0 border-b border-slate-50">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <div className="w-4 h-2.5 bg-slate-900 rounded-[1px]"></div>
                    <div className="w-0.5 h-2.5 bg-slate-900/30 rounded-[1px]"></div>
                </div>
            </div>

            {/* Content Area */}
            <div className="h-[calc(100%-3rem)] overflow-y-auto phone-scroll bg-white">
                <div 
                    ref={containerRef}
                    className="p-5 text-base leading-relaxed text-slate-800 break-words"
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<div class="text-slate-300 text-center mt-20">Preview area...</div>' }}
                />
                 {/* Footer Space */}
                <div className="h-20"></div>
            </div>
        </div>
    </div>
  );
};