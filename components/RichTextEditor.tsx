import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Palette,
  Highlighter,
  Eye,
  Edit3,
  AlignRight,
  AlignLeft,
  AlignCenter,
  Sparkles,
  RotateCcw,
  HelpCircle,
  Link as LinkIcon,
  ChevronDown,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FormattedTextRenderer } from './FormattedTextRenderer';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
  helpHint?: string;
}

const PRESET_COLORS = [
  { hex: '#dc2626', label: 'أحمر عاجل' },
  { hex: '#2563eb', label: 'أزرق رسمي' },
  { hex: '#16a34a', label: 'أخضر زمردي' },
  { hex: '#d97706', label: 'برتقالي تنبيه' },
  { hex: '#9333ea', label: 'بنفسجي ملاحظات' },
  { hex: '#e11d48', label: 'وردي تأكيد' },
  { hex: '#0891b2', label: 'سماوي بحري' },
  { hex: '#4b5563', label: 'رمادي جانبي' },
];

const PRESET_MARKERS = [
  { hex: '#fef08a', label: 'أصفر فسفوري' },
  { hex: '#bbf7d0', label: 'أخضر هادئ' },
  { hex: '#bae6fd', label: 'سماوي خفيف' },
  { hex: '#fbcfe8', label: 'وردي لطيف' },
  { hex: '#e9d5ff', label: 'بنفسجي فاتح' },
  { hex: '#fed7aa', label: 'كهرماني دافئ' },
];

const CALLOUT_TEMPLATES = [
  {
    label: '⚠️ صندوق تنبيه عاجل',
    html: '<div class="alert-box" style="border-right: 4px solid #ef4444; background: rgba(239, 68, 68, 0.08); padding: 12px 16px; border-radius: 16px; margin: 10px 0;"><strong>⚠️ تنبيه عاجل للدفعة:</strong> اكتب تفاصيل التنبيه هنا...</div><p><br></p>',
  },
  {
    label: '💡 صندوق فكرة وقانون',
    html: '<div class="tip-box" style="border-right: 4px solid #10b981; background: rgba(16, 185, 129, 0.08); padding: 12px 16px; border-radius: 16px; margin: 10px 0;"><strong>💡 فكرة وقانون مهم:</strong> اكتب القانون أو الملاحظة الذهبية هنا...</div><p><br></p>',
  },
  {
    label: '📌 ملاحظة وتأشير الدكتور',
    html: '<div class="note-box" style="border-right: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.08); padding: 12px 16px; border-radius: 16px; margin: 10px 0;"><strong>📌 ملاحظة الأستاذ في المحاضرة:</strong> اكتب تأشيرة الدكتور هنا...</div><p><br></p>',
  },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'ابدأ بكتابة المحتوى هنا... حدد أي كلمة لتنسيقها فوراً، تلوينها بأي لون، وتكبيرها بصرياً دون أي أكواد ✍️',
  minHeight = 'min-h-[160px]',
  label,
  required = false,
  helpHint,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [textDirection, setTextDirection] = useState<'auto' | 'rtl' | 'ltr'>('auto');
  const [customTextColor, setCustomTextColor] = useState<string>('#2563eb');
  const [customMarkerColor, setCustomMarkerColor] = useState<string>('#fef08a');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMarkerPicker, setShowMarkerPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showCalloutPicker, setShowCalloutPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedTextSnippet, setSelectedTextSnippet] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const markerInputRef = useRef<HTMLInputElement>(null);

  // Initialize and synchronize content safely
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Only update innerHTML if it doesn't match to avoid losing cursor while typing
    if (editor.innerHTML !== value) {
      // If value is empty or null, set empty
      if (!value) {
        editor.innerHTML = '';
      } else {
        editor.innerHTML = value;
      }
    }
  }, [value]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowColorPicker(false);
      setShowMarkerPicker(false);
      setShowSizePicker(false);
      setShowCalloutPicker(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Handle user typing and changes
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
    }
  };

  // Detect selection for floating action bar
  const handleSelectionCheck = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setHasSelection(false);
      setSelectedTextSnippet('');
      return;
    }

    const text = selection.toString().trim();
    if (text.length > 0) {
      setHasSelection(true);
      setSelectedTextSnippet(text);
    } else {
      setHasSelection(false);
      setSelectedTextSnippet('');
    }
  }, []);

  // Visual document formatting commands
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleEditorInput();
    handleSelectionCheck();
  };

  // Apply custom text color
  const applyTextColor = (hex: string) => {
    setCustomTextColor(hex);
    execCmd('foreColor', hex);
    setShowColorPicker(false);
  };

  // Apply custom highlight marker
  const applyMarkerColor = (hex: string) => {
    setCustomMarkerColor(hex);
    // Use hiliteColor or backColor for cross-browser
    if (!document.execCommand('hiliteColor', false, hex)) {
      document.execCommand('backColor', false, hex);
    }
    handleEditorInput();
    setShowMarkerPicker(false);
  };

  // Apply Telegram-style Spoiler (Visual blur in editor that can be clicked to toggle)
  const applyTelegramSpoiler = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedContent = range.extractContents();

    const spoilerSpan = document.createElement('span');
    spoilerSpan.className = 'telegram-spoiler inline-block';
    spoilerSpan.setAttribute('data-spoiler', 'true');
    spoilerSpan.title = 'سبويلر تليغرام (نص مخفي ينكشف بالنقر)';
    spoilerSpan.style.backgroundColor = '#334155';
    spoilerSpan.style.color = '#ffffff';
    spoilerSpan.style.padding = '2px 8px';
    spoilerSpan.style.borderRadius = '8px';
    spoilerSpan.style.cursor = 'pointer';
    spoilerSpan.style.userSelect = 'none';
    spoilerSpan.style.margin = '0 2px';

    spoilerSpan.appendChild(selectedContent);
    range.insertNode(spoilerSpan);

    handleEditorInput();
    handleSelectionCheck();
  };

  // Apply font sizes or headings
  const applyFontSize = (type: 'h1' | 'h2' | 'h3' | 'large' | 'normal' | 'small') => {
    if (type === 'h1') {
      execCmd('formatBlock', '<h1>');
    } else if (type === 'h2') {
      execCmd('formatBlock', '<h2>');
    } else if (type === 'h3') {
      execCmd('formatBlock', '<h3>');
    } else if (type === 'large') {
      execCmd('fontSize', '5'); // Larger text size
    } else if (type === 'normal') {
      execCmd('formatBlock', '<p>');
      execCmd('fontSize', '3'); // Standard size
    } else if (type === 'small') {
      execCmd('fontSize', '2'); // Smaller text size
    }
    setShowSizePicker(false);
  };

  // Insert rich callout box
  const insertCallout = (templateHtml: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertHTML', false, templateHtml);
    handleEditorInput();
    setShowCalloutPicker(false);
  };

  // Insert visual link
  const insertLink = () => {
    const url = window.prompt('أدخل رابط الموقع (URL):', 'https://');
    if (!url) return;
    execCmd('createLink', url);
  };

  // Clear all content
  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة النص والتنسيقات؟')) {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      onChange('');
    }
  };

  // Word & character stats
  const plainText = (editorRef.current?.innerText || '').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <div className="space-y-2 select-none">
      {/* Label & View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label && (
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span>{label}</span>
            {required && <span className="text-red-500 font-black">*</span>}
            {helpHint && (
              <span className="text-[10px] text-gray-400 font-normal">({helpHint})</span>
            )}
          </label>
        )}

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold mr-auto">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'write'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Edit3 size={13} />
            <span>محرر مرئي مباشر (WYSIWYG)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Eye size={13} />
            <span>معاينة العرض النهائي ✨</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/20 transition">
        {/* Full Visual Toolbar */}
        {activeTab === 'write' && (
          <div className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700 p-1.5 flex items-center gap-1 flex-wrap text-gray-700 dark:text-gray-300">
            {/* Bold */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition font-black"
              title="عريض (Bold)"
            >
              <Bold size={15} />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition italic"
              title="مائل (Italic)"
            >
              <Italic size={15} />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition underline"
              title="تسطير (Underline)"
            >
              <Underline size={15} />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              title="شطب (Strikethrough)"
            >
              <Strikethrough size={15} />
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Font Size & Headers Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setShowSizePicker(!showSizePicker);
                  setShowColorPicker(false);
                  setShowMarkerPicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showSizePicker ? 'bg-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200'
                }`}
                title="حجم الخط ونوع العنوان"
              >
                <Type size={15} />
                <span className="hidden sm:inline text-[11px]">حجم الخط</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showSizePicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 w-48 space-y-1 animate-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => applyFontSize('h1')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-sm font-black transition text-gray-900 dark:text-white"
                  >
                    عنوان رئيسي كبير (H1)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('h2')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition text-gray-800 dark:text-white"
                  >
                    عنوان فرعي بارز (H2)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('large')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition text-gray-800 dark:text-white"
                  >
                    نص كبير واضح
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('normal')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-normal transition text-gray-700 dark:text-gray-300"
                  >
                    نص عادي قياسي
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFontSize('small')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-[10px] text-gray-500 transition"
                  >
                    نص توضيحي صغير
                  </button>
                </div>
              )}
            </div>

            {/* Full Spectrum Text Color Picker */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowMarkerPicker(false);
                  setShowSizePicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showColorPicker
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-rose-500'
                }`}
                title="تلوين النص (مفتوح لكافة الألوان)"
              >
                <Palette size={15} />
                <span className="hidden sm:inline text-[11px]">لون الخط</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-3 w-56 space-y-2.5 animate-in zoom-in-95">
                  {/* Full Spectrum Custom Native Color Input */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      منتقي الألوان الكامل (أي لون تحبه):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={customTextColor}
                        onChange={(e) => applyTextColor(e.target.value)}
                        className="w-9 h-9 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer p-0.5 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">
                        {customTextColor}
                      </span>
                    </div>
                  </div>

                  {/* Curated Preset Dots */}
                  <div className="border-t border-gray-100 dark:border-slate-700 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                      درجات سريعة جاهزة:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => applyTextColor(col.hex)}
                          className="w-7 h-7 rounded-full shadow-xs border border-black/10 dark:border-white/10 hover:scale-110 transition flex items-center justify-center"
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Highlighter Marker Picker */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setShowMarkerPicker(!showMarkerPicker);
                  setShowColorPicker(false);
                  setShowSizePicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showMarkerPicker
                    ? 'bg-amber-500 text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-amber-500'
                }`}
                title="تظليل ماركر فسفوري"
              >
                <Highlighter size={15} />
                <span className="hidden sm:inline text-[11px]">ماركر</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showMarkerPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-3 w-52 space-y-2 animate-in zoom-in-95">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      اختر أي لون تظليل مخصص:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={markerInputRef}
                        type="color"
                        value={customMarkerColor}
                        onChange={(e) => applyMarkerColor(e.target.value)}
                        className="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer p-0.5 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">
                        {customMarkerColor}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                      ألوان ماركر كلاسيكية:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_MARKERS.map((m) => (
                        <button
                          key={m.hex}
                          type="button"
                          onClick={() => applyMarkerColor(m.hex)}
                          className="h-6 rounded-lg border border-black/10 hover:scale-105 transition shadow-xs text-[10px] font-bold text-gray-800"
                          style={{ backgroundColor: m.hex }}
                        >
                          {m.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Spoiler Button */}
            <button
              type="button"
              onClick={applyTelegramSpoiler}
              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
              title="سبويلر تليغرام (نص مخفي ينكشف بالنقر)"
            >
              <Eye size={13} className="text-yellow-300" />
              <span className="text-[11px]">سبويلر تلي</span>
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              title="قائمة نقطية"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              title="قائمة مرقمة"
            >
              <ListOrdered size={15} />
            </button>

            {/* Quote Block */}
            <button
              type="button"
              onClick={() => execCmd('formatBlock', '<blockquote>')}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-primary"
              title="اقتباس تليغرام أنيق"
            >
              <Quote size={15} />
            </button>

            {/* Link Insertion */}
            <button
              type="button"
              onClick={insertLink}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-blue-500"
              title="إدراج رابط انترنت"
            >
              <LinkIcon size={15} />
            </button>

            {/* Ready-made Visual Callouts */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setShowCalloutPicker(!showCalloutPicker);
                  setShowColorPicker(false);
                  setShowMarkerPicker(false);
                  setShowSizePicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showCalloutPicker ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                }`}
                title="إدراج صندوق ملون بارز"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline text-[11px]">صندوق مميز</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showCalloutPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 w-60 space-y-1 animate-in zoom-in-95">
                  <span className="text-[10px] font-bold text-gray-400 px-2 block">
                    إدراج صندوق مرئي جاهز:
                  </span>
                  {CALLOUT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertCallout(tmpl.html)}
                      className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/60 text-xs font-bold text-gray-800 dark:text-white transition"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5 mr-auto" />

            {/* Text Direction Controls */}
            <div className="flex items-center gap-0.5 bg-gray-200/70 dark:bg-slate-800 p-0.5 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setTextDirection('rtl');
                  execCmd('justifyRight');
                }}
                className={`px-1.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  textDirection === 'rtl' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="عربي (يمين لليسار RTL)"
              >
                <AlignRight size={12} />
                <span className="text-[9px]">عربي</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTextDirection('ltr');
                  execCmd('justifyLeft');
                }}
                className={`px-1.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  textDirection === 'ltr' ? 'bg-white dark:bg-slate-700 text-primary shadow-xs' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="English (Left to Right LTR)"
              >
                <AlignLeft size={12} />
                <span className="text-[9px]">EN</span>
              </button>
            </div>

            {/* Help Toggle */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 text-gray-400 hover:text-primary transition rounded-lg"
              title="دليل المحرر المرئي"
            >
              <HelpCircle size={15} />
            </button>
          </div>
        )}

        {/* Floating Quick Action Bar when user selects text */}
        {activeTab === 'write' && hasSelection && (
          <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/20 px-3 py-1.5 flex items-center gap-2 flex-wrap text-xs animate-in fade-in duration-150">
            <span className="text-[10px] font-black text-primary flex items-center gap-1">
              <span>✍️ تنسيق النص المحدد:</span>
              <span className="text-gray-500 font-normal">«{selectedTextSnippet.slice(0, 15)}...»</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => execCmd('bold')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white font-black hover:bg-primary hover:text-white transition shadow-xs text-xs"
                title="عريض"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => execCmd('italic')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white italic hover:bg-primary hover:text-white transition shadow-xs text-xs"
                title="مائل"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => execCmd('underline')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white underline hover:bg-primary hover:text-white transition shadow-xs text-xs"
                title="تسطير"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => execCmd('strikeThrough')}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-gray-800 dark:text-white line-through hover:bg-primary hover:text-white transition shadow-xs text-xs"
                title="شطب"
              >
                S
              </button>
              <button
                type="button"
                onClick={applyTelegramSpoiler}
                className="px-2 py-0.5 rounded-md bg-slate-700 text-white hover:bg-slate-900 transition shadow-xs text-[10px] font-bold flex items-center gap-0.5"
                title="سبويلر"
              >
                <Eye size={11} className="text-yellow-300" />
                <span>سبويلر</span>
              </button>
              <button
                type="button"
                onClick={() => applyTextColor('#dc2626')}
                className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-[10px]"
                title="أحمر"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => applyTextColor('#2563eb')}
                className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]"
                title="أزرق"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => applyMarkerColor('#fef08a')}
                className="w-5 h-5 rounded-md bg-yellow-300 text-yellow-950 flex items-center justify-center font-bold text-[10px]"
                title="ماركر أصفر"
              >
                H
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Help Strip */}
        {showHelp && activeTab === 'write' && (
          <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 p-3 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
            <div className="flex justify-between items-center font-bold text-primary">
              <span>💡 دليلك للكتابة المرئية النقية:</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-red-500 font-bold"
              >
                ✕ إغلاق
              </button>
            </div>
            <p>
              • لا داعي لكتابة أي وسوم أو أكواد؛ حدد الكلمة أو الجملة مباشرة ثم اضغط على <strong>B</strong> أو غيّر لونها بالكامل وحجمها فوراً.
            </p>
            <p>
              • يمكنك اختيار أي درجة لونية دون قيود عبر منتقي الألوان الكامل 🎨.
            </p>
            <p>
              • اضغط على «سبويلر تلي» لكتم أي جواب أو نص مفاجئ وجعله قابلاً للكشف عند النقر.
            </p>
          </div>
        )}

        {/* WYSIWYG Visual Canvas Body */}
        {activeTab === 'write' ? (
          <div className="relative p-4">
            <div
              ref={editorRef}
              contentEditable
              dir={textDirection}
              onInput={handleEditorInput}
              onSelect={handleSelectionCheck}
              onKeyUp={handleSelectionCheck}
              onMouseUp={handleSelectionCheck}
              data-placeholder={placeholder}
              className={`wysiwyg-editor outline-none text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-relaxed ${minHeight} select-text overflow-y-auto`}
              style={{
                fontFamily: "'Cairo', 'Tajawal', sans-serif",
              }}
            />
          </div>
        ) : (
          /* Live Output Preview Mode */
          <div className={`p-5 bg-gray-50/50 dark:bg-slate-900/40 ${minHeight} overflow-y-auto`}>
            {value.trim() ? (
              <FormattedTextRenderer content={value} />
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs">
                لا يوجد نص لعرضه حالياً، ارجع للمحرر لبدء الكتابة والتنسيق.
              </div>
            )}
          </div>
        )}

        {/* Footer Statistics */}
        <div className="bg-gray-50/80 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-700/80 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-gray-700 dark:text-gray-300">{wordCount} كلمة</span>
            <span>•</span>
            <span>{charCount} حرف</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              تنسيق مرئي مباشر نقي ✨
            </span>
          </div>

          {plainText.length > 0 && activeTab === 'write' && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-red-500 hover:underline flex items-center gap-1 font-bold text-[10px]"
            >
              <RotateCcw size={12} />
              <span>مسح الكل</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
