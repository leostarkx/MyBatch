import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Heart,
  Share2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  BookOpen,
  Calendar,
  User as UserIcon,
  Pin,
  ExternalLink,
  Image as ImageIcon,
  File,
  Eye,
  Type,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { StudentSummary, SummaryAttachment, User } from '../types';
import { FormattedTextRenderer } from './FormattedTextRenderer';
import { downloadFile } from '../services/storageService';

interface SummaryReaderModalProps {
  summary: StudentSummary;
  currentUser: User | null;
  isManager: boolean;
  onClose: () => void;
  onToggleLike?: (summary: StudentSummary) => void;
  onPreviewImage?: (title: string, url: string) => void;
}

const FONT_SIZES = [
  { label: 'A-', sizeClass: 'text-xs sm:text-sm', zoomPct: '85%' },
  { label: '100%', sizeClass: 'text-sm sm:text-base', zoomPct: '100%' },
  { label: 'A+', sizeClass: 'text-base sm:text-lg', zoomPct: '120%' },
  { label: 'A++', sizeClass: 'text-lg sm:text-xl', zoomPct: '140%' },
];

export const SummaryReaderModal: React.FC<SummaryReaderModalProps> = ({
  summary,
  currentUser,
  isManager,
  onClose,
  onToggleLike,
  onPreviewImage,
}) => {
  const [fontSizeIndex, setFontSizeIndex] = useState<number>(1); // Default: 100% (text-sm / text-base)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const likesCount = summary.likes?.length || 0;
  const isLikedByMe = !!currentUser && (summary.likes || []).includes(currentUser.uid);

  const formattedDate = new Date(summary.createdAt).toLocaleDateString('ar-IQ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopyText = async () => {
    if (!summary.content) return;
    try {
      // Strip HTML tags for clean text clipboard or copy raw text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = summary.content;
      const text = tempDiv.textContent || tempDiv.innerText || summary.content;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const isImageFile = (att: SummaryAttachment) => {
    if (att.mimeType?.startsWith('image/')) return true;
    const lower = att.fileName.toLowerCase();
    return (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif')
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isFullscreen
            ? 'w-full h-full max-w-none rounded-none'
            : 'w-full max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white p-5 sm:p-6 relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-200" />
                  {summary.courseName}
                </span>
                {summary.isPinned && (
                  <span className="bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full font-black text-[11px] flex items-center gap-1">
                    <Pin size={11} className="rotate-45 fill-current" />
                    ملخص مثبت 📌
                  </span>
                )}
                <span className="text-white/80 text-[11px] flex items-center gap-1">
                  <Calendar size={12} />
                  {formattedDate}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black leading-snug">
                {summary.title}
              </h2>

              {/* Publisher info */}
              <div className="flex items-center gap-2 pt-1 text-xs text-indigo-100">
                {summary.authorAvatar ? (
                  <img
                    src={summary.authorAvatar}
                    alt={summary.authorName}
                    className="w-7 h-7 rounded-full object-cover border border-white/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {summary.authorName.slice(0, 1)}
                  </div>
                )}
                <span className="font-bold">مشاركة من الطالب: {summary.authorName}</span>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title={isFullscreen ? 'تصغير النافذة' : 'ملء الشاشة للقراءة الكاملة'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                title="إغلاق النافذة (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Reading Tools Sub-Bar */}
        <div className="bg-gray-50/90 dark:bg-slate-800/90 border-b border-gray-100 dark:border-slate-800 px-5 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Font Size Adjusters */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2 flex items-center gap-1">
              <Type size={13} />
              حجم الخط:
            </span>
            {FONT_SIZES.map((f, idx) => (
              <button
                key={f.label}
                type="button"
                onClick={() => setFontSizeIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  fontSizeIndex === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                title={`تكبير الخط إلى ${f.zoomPct}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Action buttons: Copy & Like */}
          <div className="flex items-center gap-2">
            {summary.content && (
              <button
                type="button"
                onClick={handleCopyText}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                }`}
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'تم نسخ النص 📋' : 'نسخ النص'}</span>
              </button>
            )}

            {onToggleLike && (
              <button
                type="button"
                onClick={() => onToggleLike(summary)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  isLikedByMe
                    ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-rose-600'
                }`}
                title={isLikedByMe ? 'إلغاء الإعجاب' : 'ملخص مفيد جداً ❤️'}
              >
                <Heart size={14} className={isLikedByMe ? 'fill-current text-rose-500' : ''} />
                <span>{likesCount} إعجاب</span>
              </button>
            )}
          </div>
        </div>

        {/* Reader Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Written Text Body */}
          {summary.content ? (
            <div
              className={`leading-loose transition-all duration-200 select-text font-normal text-gray-800 dark:text-gray-100 ${
                FONT_SIZES[fontSizeIndex].sizeClass
              }`}
            >
              <FormattedTextRenderer content={summary.content} />
            </div>
          ) : (
            <div className="py-6 text-center text-gray-400 text-xs">
              هذا الملخص لا يحتوي على شرح مكتوب، يمكنك الاطلاع على المرفقات أدناه.
            </div>
          )}

          {/* Attached Files & Images Hub */}
          {summary.attachments && summary.attachments.length > 0 && (
            <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>المرفقات والملفات الدراسية ({summary.attachments.length})</span>
                </h4>
                <span className="text-[11px] text-gray-400">
                  انقر على أي ملف لمعاينته أو تحميله مباشرة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.attachments.map((att) => {
                  const isImg = isImageFile(att);

                  return (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          {isImg ? <ImageIcon size={18} /> : <File size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                            {att.fileName}
                          </h5>
                          {att.fileSize && (
                            <span className="text-[10px] text-gray-400 block">
                              الحجم: {att.fileSize}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isImg && onPreviewImage && (
                          <button
                            type="button"
                            onClick={() => onPreviewImage(att.fileName, att.url)}
                            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="معاينة الصورة"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadFile(att.url, att.fileName)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="تحميل الملف"
                        >
                          <Download size={13} />
                          <span>تحميل</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Bar */}
        <div className="p-4 bg-gray-50/80 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            وضع القراءة والمذاكرة الأكاديمية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-gray-800 dark:text-white rounded-xl font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
