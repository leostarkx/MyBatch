import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  courseName?: string;
  fileSize?: string;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  courseName,
  fileSize,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [viewerEngine, setViewerEngine] = useState<'direct' | 'googleDocs'>('direct');

  // Reset states on URL change or open
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setZoomLevel(100);

      // If URL is an external web link that might block CORS iframe, default to appropriate viewer
      if (url.includes('drive.google.com')) {
        setViewerEngine('direct');
      } else {
        setViewerEngine('direct');
      }
    }
  }, [isOpen, url]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !url) return null;

  // Normalize Drive URLs to preview mode
  const getEmbeddableUrl = (rawUrl: string, engine: 'direct' | 'googleDocs'): string => {
    if (!rawUrl) return '';

    // If Google Drive link: convert /view to /preview for iframe
    if (rawUrl.includes('drive.google.com')) {
      return rawUrl.replace(/\/view(\?.*)?$/, '/preview');
    }

    if (engine === 'googleDocs') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    }

    return rawUrl;
  };

  const embedUrl = getEmbeddableUrl(url, viewerEngine);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 20, 60));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = () => {
    // For direct PDF links or drive downloads
    let downloadUrl = url;
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      if (match && match[1]) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = title.endsWith('.pdf') ? title : `${title}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none fixed inset-0 z-50'
            : 'w-full max-w-5xl h-[88vh] max-h-[900px]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          {/* File Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {courseName && <span>{courseName}</span>}
                {courseName && fileSize && <span>·</span>}
                {fileSize && <span>{fileSize}</span>}
                <span>·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  معاينة مدمجة
                </span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Zoom Controls (hidden on small screens) */}
            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 60}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 transition cursor-pointer"
                title="تصغير"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-xs font-mono font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                title="إعادة التعيين"
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-40 transition cursor-pointer"
                title="تكبير"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Switch Viewer Engine (If direct iframe is blocked) */}
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setViewerEngine(viewerEngine === 'direct' ? 'googleDocs' : 'direct');
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title="تبديل محرك المعاينة في حال لم يفتح الملف"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>{viewerEngine === 'direct' ? 'مشغّل Google Docs' : 'المشغّل الافتراضي'}</span>
            </button>

            {/* Fast Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
              title="تحميل الملف للجهاز"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تحميل سريع</span>
            </button>

            {/* Open Original Link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="فتح الرابط في علامة تبويب جديدة"
            >
              <ExternalLink size={16} />
            </a>

            {/* Toggle Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
              title="إغلاق المعاينة (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 z-10">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                جارٍ تجهيز ومعاينة المحاضرة...
              </p>
            </div>
          )}

          {/* Error Banner */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-white dark:bg-slate-900">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl mb-3">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                تعذر تضمين المعاينة المباشرة
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                قد يمنع خادم الملف العرض داخل الإطارات بسبب سياسات الحماية (CORS). يمكنك تنزيل
                المحاضرة مباشرة أو استخدام مشغل Google Docs البديل.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                    setViewerEngine(viewerEngine === 'direct' ? 'googleDocs' : 'direct');
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                >
                  تجربة محرك Google Docs
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition cursor-pointer"
                >
                  تحميل المحاضرة فوراً
                </button>
              </div>
            </div>
          )}

          {/* Iframe Viewport Container */}
          <div
            className="w-full h-full flex items-center justify-center overflow-auto"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
};
