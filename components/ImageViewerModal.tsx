import React, { useState } from "react";
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Loader2,
} from "lucide-react";
import { downloadFile } from "../services/storageService";

export interface ImageViewerModalProps {
  previewItem: { title: string; url: string; type: string } | null;
  resolvedPreviewUrl?: string;
  isLoadingPreview?: boolean;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  previewItem,
  resolvedPreviewUrl,
  isLoadingPreview = false,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!previewItem || previewItem.type !== "IMAGE") return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col p-2 sm:p-6 animate-in fade-in duration-200 cursor-zoom-out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col flex-1 overflow-hidden cursor-default"
      >
        {/* Viewer Header */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ImageIcon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                {previewItem.title}
              </h3>
              <p className="text-[11px] text-gray-400">
                معاينة ومراجعة الصورة (تكبير، تدوير، تحميل)
              </p>
            </div>
          </div>

          {/* Controls Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              title="تصغير (-)"
            >
              <ZoomOut size={16} />
            </button>
            {/* Zoom Reset */}
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 text-xs font-mono font-bold transition"
              title="إعادة ضبط الحجم والتدوير"
            >
              {Math.round(zoom * 100)}%
            </button>
            {/* Zoom In */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              title="تكبير (+)"
            >
              <ZoomIn size={16} />
            </button>
            {/* Rotate */}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
              title="تدوير الصورة 90 درجة"
            >
              <RotateCw size={16} />
            </button>
            {/* Download */}
            <button
              type="button"
              onClick={() => {
                downloadFile(previewItem.url, `${previewItem.title || "image"}.jpg`);
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
              title="تحميل الصورة إلى جهازك"
            >
              <Download size={14} />
              <span className="hidden sm:inline">تحميل</span>
            </button>
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 bg-gray-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-300 transition"
              title="إغلاق المعاينة"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-950/90 relative overflow-hidden flex items-center justify-center p-4 select-none">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-primary" />
              <span className="text-xs font-bold">جاري فتح الصورة بأعلى دقة...</span>
            </div>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center overflow-auto"
              onDoubleClick={() => setZoom((z) => (z === 1 ? 1.75 : 1))}
              title="انقر نقراً مزدوجاً للتبديل بين التكبير وإعادة الضبط"
            >
              <img
                src={resolvedPreviewUrl || previewItem.url}
                alt={previewItem.title}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-grab"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
