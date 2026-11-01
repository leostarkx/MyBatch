import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
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
  AlignJustify,
  Sparkles,
  Undo2,
  Redo2,
  HelpCircle,
  Link as LinkIcon,
  ChevronDown,
  Type,
  Image as ImageIcon,
  Minus,
  RemoveFormatting,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Quote,
  Pilcrow,
} from 'lucide-react';
import { FormattedTextRenderer } from './FormattedTextRenderer';

export interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  required?: boolean;
  helpHint?: string;
}

// Controlled academic text colors
const PRESET_COLORS = [
  { hex: '#1e293b', label: 'أسود داكن' },
  { hex: '#2563eb', label: 'أزرق دراسي' },
  { hex: '#dc2626', label: 'أحمر عاجل' },
  { hex: '#16a34a', label: 'أخضر قانون' },
  { hex: '#d97706', label: 'برتقالي تنبيه' },
  { hex: '#9333ea', label: 'بنفسجي ملاحظات' },
  { hex: '#e11d48', label: 'وردي تأكيد' },
  { hex: '#0891b2', label: 'سماوي بحري' },
];

// Controlled highlight marker colors
const PRESET_MARKERS = [
  { hex: '#fef08a', label: 'أصفر فسفوري' },
  { hex: '#bbf7d0', label: 'أخضر هادئ' },
  { hex: '#bae6fd', label: 'سماوي خفيف' },
  { hex: '#fbcfe8', label: 'وردي لطيف' },
  { hex: '#e9d5ff', label: 'بنفسجي فاتح' },
  { hex: '#fed7aa', label: 'كهرماني دافئ' },
];

// Visual callout templates for study notes
const CALLOUT_TEMPLATES = [
  {
    label: '⚠️ تنبيه عاجل أو امتحان',
    html: '<div class="alert-box" style="border-right: 4px solid #ef4444; background: rgba(239, 68, 68, 0.08); padding: 12px 16px; border-radius: 14px; margin: 12px 0;"><strong>⚠️ تنبيه عاجل للدفعة:</strong> اكتب تفاصيل التنبيه أو موعد الامتحان هنا...</div><p><br></p>',
  },
  {
    label: '💡 فكرة وقانون ذهبي',
    html: '<div class="tip-box" style="border-right: 4px solid #10b981; background: rgba(16, 185, 129, 0.08); padding: 12px 16px; border-radius: 14px; margin: 12px 0;"><strong>💡 فكرة وقانون مهم:</strong> اكتب القانون أو الملاحظة الذهبية هنا...</div><p><br></p>',
  },
  {
    label: '📌 تأشيرة الأستاذ في المحاضرة',
    html: '<div class="note-box" style="border-right: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.08); padding: 12px 16px; border-radius: 14px; margin: 12px 0;"><strong>📌 تأشيرة الدكتور:</strong> ركّز الأستاذ على هذه النقطة وقال ستأتي بالفاينل...</div><p><br></p>',
  },
];

// Helper to compress and downscale high-resolution images via canvas
async function compressImageFile(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG for photographic lecture photos to keep size under 100KB
        const outputMime = file.type === 'image/png' && file.size < 500000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(outputMime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('فشل تحميل بيانات الصورة'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.readAsDataURL(file);
  });
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'ابدأ بكتابة ملخصك الدراسي هنا... حدد أي كلمة لتنسيقها فوراً، إدراج صور توضيحية، فواصل صفحات، وتلوين القوانين ✍️',
  minHeight = 'min-h-[160px]',
  label,
  required = false,
  helpHint,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [textDirection, setTextDirection] = useState<'auto' | 'rtl' | 'ltr'>('rtl');

  // Controlled Pickers state
  const [customTextColor, setCustomTextColor] = useState<string>('#2563eb');
  const [customMarkerColor, setCustomMarkerColor] = useState<string>('#fef08a');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMarkerPicker, setShowMarkerPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showAlignPicker, setShowAlignPicker] = useState(false);
  const [showCalloutPicker, setShowCalloutPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Selection states
  const [hasSelection, setHasSelection] = useState(false);
  const [selectedTextSnippet, setSelectedTextSnippet] = useState('');

  // Active formatting state for reflection in toolbar buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyRight: false,
    justifyCenter: false,
    justifyLeft: false,
    block: null as 'h1' | 'h2' | 'h3' | 'p' | 'blockquote' | null,
  });

  // History system state (Undo / Redo)
  const historyStackRef = useRef<string[]>([value || '']);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastTypingSnapshotTimeRef = useRef<number>(Date.now());

  // References
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const markerInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);
  const lastReportedValueRef = useRef<string>(value || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update canUndo / canRedo indicators
  const updateHistoryState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Save current selection range so toolbar clicks don't lose it
  const saveCurrentSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore selection if lost
  const restoreSavedSelection = useCallback(() => {
    if (!savedSelectionRangeRef.current || !editorRef.current) return;
    try {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRangeRef.current);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Synchronize incoming value changes safely (only if externally changed)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const targetVal = value || '';
    // If incoming value differs from what we already tracked as reported, update editor DOM
    if (targetVal !== lastReportedValueRef.current && editor.innerHTML !== targetVal) {
      editor.innerHTML = targetVal;
      lastReportedValueRef.current = targetVal;

      // Reset history with this new external baseline
      historyStackRef.current = [targetVal];
      historyIndexRef.current = 0;
      updateHistoryState();
    }
  }, [value, updateHistoryState]);

  // Debounced parent notification: avoids freeze by batching parent re-renders
  const notifyChange = useCallback(
    (newHtml: string, immediate = false) => {
      lastReportedValueRef.current = newHtml;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (immediate) {
        setSaveStatus('saved');
        onChange(newHtml);
        return;
      }

      setSaveStatus('saving');
      debounceTimerRef.current = setTimeout(() => {
        setSaveStatus('saved');
        onChange(newHtml);
      }, 350);
    },
    [onChange]
  );

  // Flush pending changes on unmount or blur
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current && editorRef.current) {
        clearTimeout(debounceTimerRef.current);
        onChange(editorRef.current.innerHTML);
      }
    };
  }, [onChange]);

  // Record a history snapshot
  const pushHistorySnapshot = useCallback(
    (newHtml: string, isDebouncedTyping = false) => {
      const stack = historyStackRef.current;
      const currentIndex = historyIndexRef.current;
      const now = Date.now();

      if (isDebouncedTyping) {
        // Group rapid keystrokes within 700ms into a single undo step
        if (now - lastTypingSnapshotTimeRef.current < 700 && currentIndex > 0) {
          stack[currentIndex] = newHtml;
          updateHistoryState();
          return;
        }
      }

      // Truncate any redo entries ahead of current index
      const newStack = stack.slice(0, currentIndex + 1);
      newStack.push(newHtml);

      // Keep up to 50 snapshots to prevent memory bloat
      if (newStack.length > 50) {
        newStack.shift();
      }

      historyStackRef.current = newStack;
      historyIndexRef.current = newStack.length - 1;
      lastTypingSnapshotTimeRef.current = now;
      updateHistoryState();
    },
    [updateHistoryState]
  );

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0 || !editorRef.current) return;

    historyIndexRef.current -= 1;
    const restoredHtml = historyStackRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = restoredHtml;
    notifyChange(restoredHtml, true);
    updateHistoryState();
  }, [notifyChange, updateHistoryState]);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1 || !editorRef.current) return;

    historyIndexRef.current += 1;
    const restoredHtml = historyStackRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = restoredHtml;
    notifyChange(restoredHtml, true);
    updateHistoryState();
  }, [notifyChange, updateHistoryState]);

  // Helper to find enclosing blockquote
  const findEnclosingBlockquote = useCallback((node: Node | null): HTMLElement | null => {
    let curr = node;
    while (curr && curr !== editorRef.current) {
      if (curr instanceof HTMLElement && curr.tagName.toLowerCase() === 'blockquote') {
        return curr;
      }
      curr = curr.parentNode;
    }
    return null;
  }, []);

  // Helper to find outermost blockquote in case of nested blockquotes
  const findOutermostBlockquote = useCallback((node: Node | null): HTMLElement | null => {
    let bq = findEnclosingBlockquote(node);
    if (!bq) return null;
    while (bq.parentElement && bq.parentElement !== editorRef.current) {
      if (bq.parentElement.tagName.toLowerCase() === 'blockquote') {
        bq = bq.parentElement;
      } else {
        break;
      }
    }
    return bq;
  }, [findEnclosingBlockquote]);

  // Accurately detect the current enclosing block (H1, H2, H3, P, BLOCKQUOTE)
  const detectActiveBlock = useCallback((): 'h1' | 'h2' | 'h3' | 'p' | 'blockquote' | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return null;
    const range = sel.getRangeAt(0);
    let curr: Node | null = range.startContainer;
    let foundBlockquote = false;
    let foundHeading: 'h1' | 'h2' | 'h3' | null = null;
    let foundP = false;

    while (curr && curr !== editorRef.current) {
      if (curr instanceof HTMLElement) {
        const tag = curr.tagName.toLowerCase();
        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          if (!foundHeading) foundHeading = tag;
        } else if (tag === 'blockquote') {
          foundBlockquote = true;
        } else if (tag === 'p') {
          foundP = true;
        }
      }
      curr = curr.parentNode;
    }

    if (foundHeading) return foundHeading;
    if (foundBlockquote) return 'blockquote';
    if (foundP) return 'p';
    return null;
  }, []);

  // Accurately determine if bold is active, distinguishing heading default font-weight from actual bold formatting
  const checkBoldState = useCallback((): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return false;
    const range = sel.getRangeAt(0);
    let curr: Node | null = range.startContainer;
    while (curr && curr !== editorRef.current) {
      if (curr instanceof HTMLElement) {
        const tag = curr.tagName.toLowerCase();
        if (tag === 'b' || tag === 'strong') return true;
        if (curr.style.fontWeight === 'bold' || parseInt(curr.style.fontWeight || '400', 10) >= 700) {
          if (!['h1', 'h2', 'h3'].includes(tag)) return true;
        }
      }
      curr = curr.parentNode;
    }

    const currentBlock = detectActiveBlock();
    // In headings, do not use queryCommandState('bold') because browsers falsely report true due to CSS font-weight: 800
    if (['h1', 'h2', 'h3'].includes(currentBlock || '')) {
      return false;
    }

    try {
      return document.queryCommandState('bold');
    } catch {
      return false;
    }
  }, [detectActiveBlock]);

  // Check active formatting and selection
  const handleSelectionCheck = useCallback(() => {
    saveCurrentSelection();

    const currentBlock = detectActiveBlock();
    const isBold = checkBoldState();

    // Query active formats
    try {
      setActiveFormats({
        bold: isBold,
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        block: currentBlock,
      });
    } catch {
      // Ignored if not supported
    }

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
  }, [saveCurrentSelection, detectActiveBlock, checkBoldState]);

  // Listen to native selectionchange so selection and active formats are always in sync
  useEffect(() => {
    const handleDocSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
      try {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          savedSelectionRangeRef.current = range.cloneRange();
          handleSelectionCheck();
        }
      } catch {
        // Out of bounds selection
      }
    };

    document.addEventListener('selectionchange', handleDocSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleDocSelectionChange);
    };
  }, [handleSelectionCheck]);

  // Handle user typing and changes
  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      pushHistorySnapshot(html, true);
      notifyChange(html, false);
      handleSelectionCheck();
    }
  };

  // Keyboard shortcut listener for Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z, Ctrl+B, etc.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Handle Enter inside blockquotes to prevent endless nested blockquotes
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        const bq = findEnclosingBlockquote(range.startContainer);
        if (bq) {
          // Check if user is on an empty line or at an empty block inside the quote
          const node = range.startContainer;
          let innerBlock: HTMLElement | null = null;
          let currNode: Node | null = node;
          while (currNode && currNode !== bq) {
            if (currNode instanceof HTMLElement && ['p', 'div'].includes(currNode.tagName.toLowerCase())) {
              innerBlock = currNode;
              break;
            }
            currNode = currNode.parentNode;
          }

          const isBqCompletelyEmpty = (bq.textContent || '').trim() === '';
          const isInnerBlockEmpty = innerBlock && (innerBlock.textContent || '').trim() === '';

          if (isBqCompletelyEmpty || isInnerBlockEmpty) {
            e.preventDefault();
            pushHistorySnapshot(editorRef.current.innerHTML, false);

            if (isBqCompletelyEmpty) {
              // Convert the empty blockquote directly into a standard <p>
              const p = document.createElement('p');
              p.setAttribute('dir', textDirection || 'rtl');
              p.innerHTML = '<br>';
              bq.parentNode?.replaceChild(p, bq);

              const newRange = document.createRange();
              newRange.selectNodeContents(p);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
              savedSelectionRangeRef.current = newRange.cloneRange();
            } else if (innerBlock) {
              // Remove the empty trailing line and insert a standard paragraph outside/after the blockquote
              innerBlock.remove();
              const p = document.createElement('p');
              p.setAttribute('dir', textDirection || 'rtl');
              p.innerHTML = '<br>';

              if (bq.nextSibling) {
                bq.parentNode?.insertBefore(p, bq.nextSibling);
              } else {
                bq.parentNode?.appendChild(p);
              }

              const newRange = document.createRange();
              newRange.selectNodeContents(p);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
              savedSelectionRangeRef.current = newRange.cloneRange();
            }

            const updatedHtml = editorRef.current.innerHTML;
            pushHistorySnapshot(updatedHtml, false);
            notifyChange(updatedHtml, false);
            handleSelectionCheck();
            return;
          }
        }
      }
    }

    // Handle Backspace inside an empty blockquote to revert to standard paragraph
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        const bq = findEnclosingBlockquote(range.startContainer);
        if (bq && (bq.textContent || '').trim() === '') {
          e.preventDefault();
          pushHistorySnapshot(editorRef.current.innerHTML, false);

          const p = document.createElement('p');
          p.setAttribute('dir', textDirection || 'rtl');
          p.innerHTML = '<br>';
          bq.parentNode?.replaceChild(p, bq);

          const newRange = document.createRange();
          newRange.selectNodeContents(p);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedSelectionRangeRef.current = newRange.cloneRange();

          const updatedHtml = editorRef.current.innerHTML;
          pushHistorySnapshot(updatedHtml, false);
          notifyChange(updatedHtml, false);
          handleSelectionCheck();
          return;
        }
      }
    }

    if (modKey && !e.altKey) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if (!isMac && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        execCmd('bold');
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        execCmd('italic');
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        execCmd('underline');
        return;
      }
    }
  };

  // Safe formatting command execution with selection protection
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (!editorRef.current) return;

    restoreSavedSelection();
    editorRef.current.focus();

    // Take immediate snapshot before command
    pushHistorySnapshot(editorRef.current.innerHTML, false);

    document.execCommand(command, false, arg);

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
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
    restoreSavedSelection();
    if (editorRef.current) {
      editorRef.current.focus();
    }
    pushHistorySnapshot(editorRef.current?.innerHTML || '', false);

    if (!document.execCommand('hiliteColor', false, hex)) {
      document.execCommand('backColor', false, hex);
    }

    const updatedHtml = editorRef.current?.innerHTML || '';
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
    setShowMarkerPicker(false);
  };

  // Dedicated toggle function for Blockquote (Quote / اقتباس)
  // If cursor/selection is inside a blockquote (single or nested), clicking cancels the quote and reverts to clean <p>
  // If not inside a quote, converts the current block or selection into a clean <blockquote>
  const toggleBlockquote = () => {
    if (!editorRef.current) return;

    restoreSavedSelection();
    editorRef.current.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    // Snapshot before change for reliable Undo
    pushHistorySnapshot(editorRef.current.innerHTML, false);

    const bq = findOutermostBlockquote(range.startContainer) || findOutermostBlockquote(range.commonAncestorContainer);

    if (bq) {
      // TOGGLE OFF: Cancel the quote! Convert back to standard paragraph(s) <p>
      const parent = bq.parentNode;
      if (!parent) return;

      // 1. Flatten all nested blockquotes inside bq to prevent any nested quotes
      const nestedQuotes = bq.querySelectorAll('blockquote');
      nestedQuotes.forEach((n) => {
        const fragInner = document.createDocumentFragment();
        while (n.firstChild) fragInner.appendChild(n.firstChild);
        n.parentNode?.replaceChild(fragInner, n);
      });

      // 2. Unpack children into standard paragraph(s)
      const frag = document.createDocumentFragment();
      const childNodes: Node[] = Array.from(bq.childNodes);

      if (childNodes.length === 0 || bq.textContent?.trim() === '') {
        const p = document.createElement('p');
        p.setAttribute('dir', textDirection || 'rtl');
        p.innerHTML = '<br>';
        frag.appendChild(p);
      } else {
        let currentP: HTMLElement | null = null;
        childNodes.forEach((child) => {
          if (child instanceof HTMLElement && ['p', 'div', 'h1', 'h2', 'h3'].includes(child.tagName.toLowerCase())) {
            const p = document.createElement('p');
            p.setAttribute('dir', child.getAttribute('dir') || bq.getAttribute('dir') || textDirection || 'rtl');
            if (child.style.textAlign) p.style.textAlign = child.style.textAlign;
            while (child.firstChild) p.appendChild(child.firstChild);
            if (!p.hasChildNodes() || p.innerHTML.trim() === '') p.innerHTML = '<br>';
            frag.appendChild(p);
            currentP = null;
          } else {
            if (!currentP) {
              currentP = document.createElement('p');
              currentP.setAttribute('dir', bq.getAttribute('dir') || textDirection || 'rtl');
              if (bq.style.textAlign) currentP.style.textAlign = bq.style.textAlign;
              frag.appendChild(currentP);
            }
            currentP.appendChild(child);
          }
        });
      }

      const firstP = frag.firstChild as HTMLElement | null;
      parent.replaceChild(frag, bq);

      if (firstP) {
        try {
          const newRange = document.createRange();
          newRange.selectNodeContents(firstP);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedSelectionRangeRef.current = newRange.cloneRange();
        } catch {
          // Fallback
        }
      }
    } else {
      // TOGGLE ON: Turn current block into <blockquote>
      const isBlockTag = (el: Node | null): el is HTMLElement => {
        if (!el || !(el instanceof HTMLElement)) return false;
        const tag = el.tagName.toLowerCase();
        return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'blockquote'].includes(tag);
      };

      let curr: Node | null = range.startContainer;
      let startBlock: HTMLElement | null = null;
      while (curr && curr !== editorRef.current) {
        if (isBlockTag(curr)) {
          startBlock = curr;
          break;
        }
        curr = curr.parentNode;
      }

      if (startBlock && startBlock !== editorRef.current) {
        const bqElem = document.createElement('blockquote');
        bqElem.setAttribute('dir', startBlock.getAttribute('dir') || textDirection || 'rtl');
        if (startBlock.style.textAlign) bqElem.style.textAlign = startBlock.style.textAlign;

        while (startBlock.firstChild) {
          bqElem.appendChild(startBlock.firstChild);
        }
        if (!bqElem.hasChildNodes() || bqElem.innerHTML.trim() === '') {
          bqElem.innerHTML = '<br>';
        }

        startBlock.parentNode?.replaceChild(bqElem, startBlock);

        try {
          const newRange = document.createRange();
          newRange.selectNodeContents(bqElem);
          newRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedSelectionRangeRef.current = newRange.cloneRange();
        } catch {}
      } else {
        try {
          document.execCommand('formatBlock', false, '<blockquote>');
        } catch {}
      }
    }

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
    handleSelectionCheck();
    setShowSizePicker(false);
  };

  // Convert current selection or enclosing block element (H1, H2, H3, P, BLOCKQUOTE)
  const convertBlockTo = (targetTag: 'h1' | 'h2' | 'h3' | 'p' | 'blockquote') => {
    if (targetTag === 'blockquote') {
      toggleBlockquote();
      return;
    }

    if (!editorRef.current) return;

    restoreSavedSelection();
    editorRef.current.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    // If converting to normal paragraph 'p' and inside a blockquote, unwrap the blockquote
    if (targetTag === 'p') {
      const bq = findOutermostBlockquote(range.startContainer) || findOutermostBlockquote(range.commonAncestorContainer);
      if (bq) {
        toggleBlockquote();
        return;
      }
    }

    // Snapshot before change for reliable Undo
    pushHistorySnapshot(editorRef.current.innerHTML, false);

    const isBlockTag = (el: Node | null): el is HTMLElement => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'blockquote'].includes(tag);
    };

    const findBlock = (node: Node | null): HTMLElement | null => {
      let curr = node;
      while (curr && curr !== editorRef.current) {
        if (isBlockTag(curr)) {
          return curr;
        }
        curr = curr.parentNode;
      }
      return null;
    };

    const startBlock = findBlock(range.startContainer);
    const endBlock = findBlock(range.endContainer);

    // If already the requested heading, toggle back to paragraph 'p'
    let effectiveTarget = targetTag;
    if (startBlock && startBlock.tagName.toLowerCase() === targetTag.toLowerCase() && targetTag !== 'p') {
      effectiveTarget = 'p';
    }

    // Helper to transform an individual block DOM element
    const transformSingleBlock = (oldBlock: HTMLElement, newTag: string): HTMLElement => {
      const newElem = document.createElement(newTag);

      // Clean deprecated <font> wrappers inside oldBlock
      const fonts = oldBlock.querySelectorAll('font');
      fonts.forEach((f) => {
        const parent = f.parentNode;
        while (f.firstChild) {
          parent?.insertBefore(f.firstChild, f);
        }
        parent?.removeChild(f);
      });

      // Preserve alignment or dir if set on old block
      if (oldBlock.style.textAlign) {
        newElem.style.textAlign = oldBlock.style.textAlign;
      }
      if (oldBlock.getAttribute('dir')) {
        newElem.setAttribute('dir', oldBlock.getAttribute('dir') || 'rtl');
      }

      // Transfer all children to the new element
      while (oldBlock.firstChild) {
        newElem.appendChild(oldBlock.firstChild);
      }

      // If block is empty, place <br> so cursor can focus inside
      if (!newElem.hasChildNodes() || newElem.innerHTML.trim() === '') {
        newElem.innerHTML = '<br>';
      }

      oldBlock.parentNode?.replaceChild(newElem, oldBlock);
      return newElem;
    };

    let lastConverted: HTMLElement | null = null;

    if (startBlock && endBlock && startBlock === endBlock) {
      lastConverted = transformSingleBlock(startBlock, effectiveTarget);
    } else if (startBlock && endBlock) {
      // Range spans multiple blocks
      const blocks: HTMLElement[] = [];
      let currNode: Node | null = startBlock;
      while (currNode && currNode !== editorRef.current) {
        if (isBlockTag(currNode)) {
          blocks.push(currNode);
        }
        if (currNode === endBlock) break;
        currNode = currNode.nextSibling;
      }

      if (blocks.length === 0) {
        blocks.push(startBlock, endBlock);
      }

      blocks.forEach((b) => {
        lastConverted = transformSingleBlock(b, effectiveTarget);
      });
    } else {
      // Direct raw text without enclosing block element: fallback to browser formatBlock or wrap
      try {
        document.execCommand('formatBlock', false, `<${effectiveTarget}>`);
      } catch {
        const newElem = document.createElement(effectiveTarget);
        if (range.collapsed) {
          newElem.innerHTML = '<br>';
          range.insertNode(newElem);
        } else {
          newElem.appendChild(range.extractContents());
          range.insertNode(newElem);
        }
        lastConverted = newElem;
      }
    }

    // Set cursor nicely inside the converted element
    if (lastConverted) {
      try {
        const newRange = document.createRange();
        newRange.selectNodeContents(lastConverted);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedSelectionRangeRef.current = newRange.cloneRange();
      } catch {
        // Selection fallback
      }
    }

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
    handleSelectionCheck();
    setShowSizePicker(false);
  };

  // Clear formatting: strips inline tags, removes highlights, converts headings to paragraph
  const handleClearFormat = () => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    editorRef.current.focus();

    pushHistorySnapshot(editorRef.current.innerHTML, false);

    // 1. Remove native inline formatting (bold, italic, font, forecolor)
    document.execCommand('removeFormat', false);

    // 2. Remove background highlight colors
    try {
      document.execCommand('backColor', false, 'transparent');
      document.execCommand('hiliteColor', false, 'transparent');
    } catch {}

    // 3. If within a heading or quote, convert back to a standard paragraph <p>
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      let curr: Node | null = range.startContainer;
      while (curr && curr !== editorRef.current) {
        if (curr instanceof HTMLElement) {
          const tag = curr.tagName.toLowerCase();
          if (['h1', 'h2', 'h3', 'blockquote'].includes(tag)) {
            const p = document.createElement('p');
            // Clean font tags
            curr.querySelectorAll('font').forEach((f) => {
              const parent = f.parentNode;
              while (f.firstChild) parent?.insertBefore(f.firstChild, f);
              parent?.removeChild(f);
            });
            while (curr.firstChild) p.appendChild(curr.firstChild);
            if (!p.hasChildNodes()) p.innerHTML = '<br>';
            curr.parentNode?.replaceChild(p, curr);
            break;
          }
        }
        curr = curr.parentNode;
      }
    }

    // 4. Strip any deprecated <font> tags across editor
    const fonts = editorRef.current.querySelectorAll('font');
    fonts.forEach((f) => {
      const parent = f.parentNode;
      while (f.firstChild) parent?.insertBefore(f.firstChild, f);
      parent?.removeChild(f);
    });

    // 5. Unwrap any selected spoiler
    const spoilers = editorRef.current.querySelectorAll('.telegram-spoiler');
    spoilers.forEach((sp) => {
      if (sel && sel.containsNode(sp, true)) {
        const parent = sp.parentNode;
        while (sp.firstChild) parent?.insertBefore(sp.firstChild, sp);
        parent?.removeChild(sp);
      }
    });

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
    handleSelectionCheck();
  };

  // Apply Telegram-style Spoiler (Visual blur in editor that can be clicked to toggle)
  const applyTelegramSpoiler = () => {
    restoreSavedSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

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

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, false);
    handleSelectionCheck();
  };

  // Apply font sizes or headings
  const applyFontSize = (type: 'h1' | 'h2' | 'h3' | 'large' | 'normal' | 'small' | 'blockquote') => {
    if (type === 'h1' || type === 'h2' || type === 'h3' || type === 'blockquote') {
      convertBlockTo(type);
    } else if (type === 'normal') {
      convertBlockTo('p');
    } else if (type === 'large') {
      execCmd('fontSize', '5');
    } else if (type === 'small') {
      execCmd('fontSize', '2');
    }
    setShowSizePicker(false);
  };

  // Insert rich callout box
  const insertCallout = (templateHtml: string) => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    editorRef.current.focus();

    pushHistorySnapshot(editorRef.current.innerHTML, false);
    document.execCommand('insertHTML', false, templateHtml);

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, true);
    setShowCalloutPicker(false);
  };

  // Insert page / topic divider
  const insertPageDivider = () => {
    if (!editorRef.current) return;
    restoreSavedSelection();
    editorRef.current.focus();

    pushHistorySnapshot(editorRef.current.innerHTML, false);
    const dividerHtml = '<hr class="doc-page-divider" /><p><br></p>';
    document.execCommand('insertHTML', false, dividerHtml);

    const updatedHtml = editorRef.current.innerHTML;
    pushHistorySnapshot(updatedHtml, false);
    notifyChange(updatedHtml, true);
  };

  // Insert visual link
  const insertLink = () => {
    restoreSavedSelection();
    const url = window.prompt('أدخل رابط الموقع (URL):', 'https://');
    if (!url) return;
    execCmd('createLink', url);
  };

  // Image Upload & Insertion with validation and Canvas downscaling
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // 1. Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('صيغة الصورة غير مدعومة. يرجى اختيار ملف صورة (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('حجم الصورة كبير جداً (أكبر من 5 ميغابايت). يرجى اختيار صورة أصغر لتجنب بطء المستند.');
      return;
    }

    setErrorMessage(null);
    setIsProcessingImage(true);

    try {
      // 2. Downscale and optimize
      const compressedDataUrl = await compressImageFile(file);

      // 3. Insert into editor
      restoreSavedSelection();
      if (editorRef.current) {
        editorRef.current.focus();
        pushHistorySnapshot(editorRef.current.innerHTML, false);

        const imgBlockHtml = `
          <div class="note-image-block" contenteditable="false" style="margin: 14px 0; text-align: center; position: relative;">
            <div style="position: relative; display: inline-block; max-width: 100%;">
              <img src="${compressedDataUrl}" alt="صورة توضيحية للملخص" style="max-width: 100%; height: auto; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
              <button type="button" class="image-delete-btn" onclick="this.closest('.note-image-block').remove();" title="حذف الصورة">✕ حذف</button>
            </div>
            <div class="note-image-caption" contenteditable="true" style="margin-top: 6px; font-size: 12px; color: #64748b; font-style: italic; outline: none; text-align: center;">اكتب توضيحاً أو ملاحظة للصورة هنا...</div>
          </div>
          <p><br></p>
        `;

        document.execCommand('insertHTML', false, imgBlockHtml);
        const updatedHtml = editorRef.current.innerHTML;
        pushHistorySnapshot(updatedHtml, false);
        notifyChange(updatedHtml, true);
      }
    } catch {
      setErrorMessage('تعذر معالجة الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Clipboard Paste handler: intercepts screenshots and cleans pasted HTML
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Check if pasted item is an image
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          setIsProcessingImage(true);
          compressImageFile(file)
            .then((dataUrl) => {
              if (editorRef.current) {
                pushHistorySnapshot(editorRef.current.innerHTML, false);
                const imgBlock = `
                  <div class="note-image-block" contenteditable="false" style="margin: 14px 0; text-align: center; position: relative;">
                    <div style="position: relative; display: inline-block; max-width: 100%;">
                      <img src="${dataUrl}" alt="لقطة شاشة توضيحية" style="max-width: 100%; height: auto; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
                      <button type="button" class="image-delete-btn" onclick="this.closest('.note-image-block').remove();" title="حذف الصورة">✕ حذف</button>
                    </div>
                    <div class="note-image-caption" contenteditable="true" style="margin-top: 6px; font-size: 12px; color: #64748b; font-style: italic; outline: none; text-align: center;">اكتب توضيحاً أو ملاحظة للصورة هنا...</div>
                  </div>
                  <p><br></p>
                `;
                document.execCommand('insertHTML', false, imgBlock);
                const updated = editorRef.current.innerHTML;
                pushHistorySnapshot(updated, false);
                notifyChange(updated, true);
              }
            })
            .catch(() => {
              setErrorMessage('تعذر إدراج لقطة الشاشة الملصوقة.');
            })
            .finally(() => setIsProcessingImage(false));
        }
        return;
      }
    }
  };

  // Tab switcher with reliable state preservation
  const handleSwitchTab = (tab: 'write' | 'preview') => {
    if (tab === 'preview') {
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        notifyChange(currentHtml, true);
      }
    } else if (tab === 'write') {
      if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setActiveTab(tab);
  };

  // Clear all content
  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح كافة النص والتنسيقات؟')) {
      if (editorRef.current) {
        pushHistorySnapshot(editorRef.current.innerHTML, false);
        editorRef.current.innerHTML = '';
        pushHistorySnapshot('', false);
      }
      notifyChange('', true);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setShowColorPicker(false);
      setShowMarkerPicker(false);
      setShowSizePicker(false);
      setShowAlignPicker(false);
      setShowCalloutPicker(false);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Word & character stats
  const plainText = useMemo(() => {
    if (!value) return '';
    return value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  }, [value]);

  const wordCount = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = plainText.length;

  return (
    <div className="space-y-2 select-none">
      {/* Hidden file input for images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Label & Tabs Header */}
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

        {/* Clean, Non-intrusive Tab Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/60 p-1 rounded-xl text-xs font-bold mr-auto">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSwitchTab('write')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'write'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Edit3 size={13} />
            <span>تحرير</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleSwitchTab('preview')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Eye size={13} />
            <span>معاينة</span>
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 font-bold hover:underline text-[11px]"
          >
            ✕ إغلاق
          </button>
        </div>
      )}

      {/* Editor Main Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/20 transition">
        {/* Full Interactive Toolbar */}
        {activeTab === 'write' && (
          <div className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-200 dark:border-slate-700 p-1.5 flex items-center gap-1 flex-wrap text-gray-700 dark:text-gray-300">
            {/* Undo */}
            <button
              type="button"
              disabled={!canUndo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUndo}
              className={`p-1.5 rounded-lg transition ${
                canUndo
                  ? 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
                  : 'opacity-35 cursor-not-allowed text-gray-400'
              }`}
              title="تراجع (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>

            {/* Redo */}
            <button
              type="button"
              disabled={!canRedo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRedo}
              className={`p-1.5 rounded-lg transition ${
                canRedo
                  ? 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200'
                  : 'opacity-35 cursor-not-allowed text-gray-400'
              }`}
              title="إعادة (Ctrl+Y أو Ctrl+Shift+Z)"
            >
              <Redo2 size={15} />
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Bold */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('bold')}
              className={`p-1.5 rounded-lg transition font-black ${
                activeFormats.bold
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="عريض (Ctrl+B)"
            >
              <Bold size={15} />
            </button>

            {/* Italic */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('italic')}
              className={`p-1.5 rounded-lg transition italic ${
                activeFormats.italic
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="مائل (Ctrl+I)"
            >
              <Italic size={15} />
            </button>

            {/* Underline */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('underline')}
              className={`p-1.5 rounded-lg transition underline ${
                activeFormats.underline
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="تسطير (Ctrl+U)"
            >
              <Underline size={15} />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('strikeThrough')}
              className={`p-1.5 rounded-lg transition ${
                activeFormats.strikeThrough
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="شطب"
            >
              <Strikethrough size={15} />
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Quick Headings & Paragraph controls */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => convertBlockTo('h1')}
              className={`px-2 py-1 rounded-lg transition text-xs font-black flex items-center gap-1 ${
                activeFormats.block === 'h1'
                  ? 'bg-primary text-white shadow-xs'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              title="عنوان رئيسي كبير (H1) - انقر مجدداً للتحويل إلى نص عادي"
            >
              <Heading1 size={14} />
              <span className="hidden sm:inline text-[11px]">H1</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => convertBlockTo('h2')}
              className={`px-2 py-1 rounded-lg transition text-xs font-bold flex items-center gap-1 ${
                activeFormats.block === 'h2'
                  ? 'bg-primary text-white shadow-xs'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              title="عنوان فرعي بارز (H2) - انقر مجدداً للتحويل إلى نص عادي"
            >
              <Heading2 size={14} />
              <span className="hidden sm:inline text-[11px]">H2</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => convertBlockTo('p')}
              className={`px-2 py-1 rounded-lg transition text-xs font-bold flex items-center gap-1 ${
                activeFormats.block === 'p' || !activeFormats.block
                  ? 'bg-primary/15 text-primary border border-primary/20 font-black'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
              title="نص عادي (فقرة P) - تحويل العنوان أو النص إلى فقرة عادية"
            >
              <Pilcrow size={13} />
              <span className="hidden sm:inline text-[11px]">عادي</span>
            </button>

            {/* Font Size & Headings Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowSizePicker(!showSizePicker);
                  setShowColorPicker(false);
                  setShowMarkerPicker(false);
                  setShowAlignPicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showSizePicker
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200'
                }`}
                title="المزيد من خيارات العناوين وحجم الخط"
              >
                <Type size={15} />
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showSizePicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 w-56 space-y-1 animate-in zoom-in-95">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('h1')}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl transition text-sm font-black flex items-center justify-between ${
                      activeFormats.block === 'h1'
                        ? 'bg-primary/15 text-primary font-black'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heading1 size={15} className="text-primary" />
                      <span>عنوان رئيسي كبير (H1)</span>
                    </div>
                    {activeFormats.block === 'h1' && <span className="text-[10px] text-primary font-bold">نشط</span>}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('h2')}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl transition text-xs font-bold flex items-center justify-between ${
                      activeFormats.block === 'h2'
                        ? 'bg-primary/15 text-primary font-black'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heading2 size={14} className="text-primary" />
                      <span>عنوان فرعي بارز (H2)</span>
                    </div>
                    {activeFormats.block === 'h2' && <span className="text-[10px] text-primary font-bold">نشط</span>}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('h3')}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl transition text-xs font-semibold flex items-center justify-between ${
                      activeFormats.block === 'h3'
                        ? 'bg-primary/15 text-primary font-black'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heading3 size={13} className="text-primary" />
                      <span>عنوان قسم (H3)</span>
                    </div>
                    {activeFormats.block === 'h3' && <span className="text-[10px] text-primary font-bold">نشط</span>}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('normal')}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl transition text-xs flex items-center justify-between ${
                      activeFormats.block === 'p' || !activeFormats.block
                        ? 'bg-primary/15 text-primary font-black'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pilcrow size={13} className="text-primary" />
                      <span>نص عادي قياسي (فقرة P)</span>
                    </div>
                    {(activeFormats.block === 'p' || !activeFormats.block) && (
                      <span className="text-[10px] text-primary font-bold">نشط</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('blockquote')}
                    className={`w-full text-right px-2.5 py-1.5 rounded-xl transition text-xs flex items-center justify-between ${
                      activeFormats.block === 'blockquote'
                        ? 'bg-primary/15 text-primary font-black'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Quote size={13} className="text-primary" />
                      <span>اقتباس أو نص بارز (Quote)</span>
                    </div>
                    {activeFormats.block === 'blockquote' && (
                      <span className="text-[10px] text-primary font-bold">نشط</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('large')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold transition text-gray-800 dark:text-white"
                  >
                    نص كبير واضح
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFontSize('small')}
                    className="w-full text-right px-2.5 py-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 text-[10px] text-gray-500 transition"
                  >
                    ملاحظة هامشية صغيرة
                  </button>
                </div>
              )}
            </div>

            {/* Text Color Picker */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowMarkerPicker(false);
                  setShowSizePicker(false);
                  setShowAlignPicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showColorPicker
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-rose-500'
                }`}
                title="تلوين النص"
              >
                <Palette size={15} />
                <span className="hidden sm:inline text-[11px]">لون الخط</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showColorPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-3 w-56 space-y-2.5 animate-in zoom-in-95">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                      ألوان خط دراسية جاهزة:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyTextColor(col.hex)}
                          className="w-7 h-7 rounded-full shadow-xs border border-black/10 dark:border-white/10 hover:scale-110 transition flex items-center justify-center"
                          style={{ backgroundColor: col.hex }}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700 pt-2">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      درجة لون مخصصة:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={customTextColor}
                        onChange={(e) => applyTextColor(e.target.value)}
                        className="w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-600 cursor-pointer p-0.5 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-200">
                        {customTextColor}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Highlighter Marker Picker */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowMarkerPicker(!showMarkerPicker);
                  setShowColorPicker(false);
                  setShowSizePicker(false);
                  setShowAlignPicker(false);
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
                  <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                    تظليل ماركر للتأشيرات:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_MARKERS.map((m) => (
                      <button
                        key={m.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyMarkerColor(m.hex)}
                        className="h-6 rounded-lg border border-black/10 hover:scale-105 transition shadow-xs text-[10px] font-bold text-gray-800"
                        style={{ backgroundColor: m.hex }}
                      >
                        {m.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700 pt-2">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      ماركر مخصص:
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
                </div>
              )}
            </div>

            {/* Telegram Spoiler Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyTelegramSpoiler}
              className="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition flex items-center gap-1 text-xs font-bold shadow-xs"
              title="سبويلر (كتم الجواب أو النص المخفي)"
            >
              <Eye size={13} className="text-yellow-300" />
              <span className="text-[11px]">سبويلر</span>
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Alignments Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowAlignPicker(!showAlignPicker);
                  setShowColorPicker(false);
                  setShowMarkerPicker(false);
                  setShowSizePicker(false);
                  setShowCalloutPicker(false);
                }}
                className={`p-1.5 rounded-lg transition ${
                  showAlignPicker
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
                title="محاذاة النص والاتجاه"
              >
                {activeFormats.justifyCenter ? (
                  <AlignCenter size={15} />
                ) : activeFormats.justifyLeft ? (
                  <AlignLeft size={15} />
                ) : activeFormats.justifyRight ? (
                  <AlignRight size={15} />
                ) : (
                  <AlignJustify size={15} />
                )}
              </button>

              {showAlignPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-1 flex items-center gap-1 animate-in zoom-in-95">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTextDirection('rtl');
                      execCmd('justifyRight');
                      setShowAlignPicker(false);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      activeFormats.justifyRight ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title="محاذاة لليمين (عربي)"
                  >
                    <AlignRight size={15} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('justifyCenter');
                      setShowAlignPicker(false);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      activeFormats.justifyCenter ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title="توسيط"
                  >
                    <AlignCenter size={15} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTextDirection('ltr');
                      execCmd('justifyLeft');
                      setShowAlignPicker(false);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      activeFormats.justifyLeft ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title="محاذاة لليسار (إنجليزي)"
                  >
                    <AlignLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('justifyFull');
                      setShowAlignPicker(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                    title="ضبط ومحاذاة كاملة"
                  >
                    <AlignJustify size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Bullet List */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertUnorderedList')}
              className={`p-1.5 rounded-lg transition ${
                activeFormats.insertUnorderedList
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="قائمة نقطية"
            >
              <List size={15} />
            </button>

            {/* Numbered List */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertOrderedList')}
              className={`p-1.5 rounded-lg transition ${
                activeFormats.insertOrderedList
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
              title="قائمة مرقمة"
            >
              <ListOrdered size={15} />
            </button>

            {/* Quote Block */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleBlockquote}
              className={`p-1.5 rounded-lg transition ${
                activeFormats.block === 'blockquote'
                  ? 'bg-primary text-white shadow-xs'
                  : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-primary'
              }`}
              title="اقتباس أو نص بارز - انقر مجدداً لإلغاء الاقتباس والعودة لنص عادي"
            >
              <Quote size={15} />
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5" />

            {/* Image Insertion */}
            <button
              type="button"
              disabled={isProcessingImage}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-xs font-bold"
              title="إدراج صورة توضيحية أو مخطط"
            >
              {isProcessingImage ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
              <span className="hidden sm:inline text-[11px]">صورة</span>
            </button>

            {/* Link Insertion */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertLink}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-blue-500"
              title="إدراج رابط انترنت"
            >
              <LinkIcon size={15} />
            </button>

            {/* Page / Topic Divider */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertPageDivider}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-indigo-500"
              title="إدراج فاصل مواضيع / صفحة جديدة"
            >
              <Minus size={15} />
            </button>

            {/* Callouts Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowCalloutPicker(!showCalloutPicker);
                  setShowColorPicker(false);
                  setShowMarkerPicker(false);
                  setShowSizePicker(false);
                  setShowAlignPicker(false);
                }}
                className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                  showCalloutPicker
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400'
                }`}
                title="إدراج صندوق ملون بارز"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline text-[11px]">صندوق</span>
                <ChevronDown size={11} className="opacity-60" />
              </button>

              {showCalloutPicker && (
                <div className="absolute top-full mt-1.5 z-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-2 w-60 space-y-1 animate-in zoom-in-95">
                  <span className="text-[10px] font-bold text-gray-400 px-2 block">
                    إدراج صندوق دراسي:
                  </span>
                  {CALLOUT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertCallout(tmpl.html)}
                      className="w-full text-right px-2.5 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/60 text-xs font-bold text-gray-800 dark:text-white transition"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Formatting */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearFormat}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition text-gray-400 hover:text-gray-600"
              title="إزالة التنسيق"
            >
              <RemoveFormatting size={15} />
            </button>

            <span className="w-px h-4 bg-gray-300 dark:bg-slate-700 mx-0.5 mr-auto" />

            {/* Guide Help Toggle */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 text-gray-400 hover:text-primary transition rounded-lg"
              title="دليل التنسيق السريع"
            >
              <HelpCircle size={15} />
            </button>
          </div>
        )}

        {/* Permanently Fixed Quick Formatting & Selection Sub-Toolbar (Zero Layout Shift) */}
        {activeTab === 'write' && (
          <div
            className={`border-b px-3 py-1.5 flex items-center justify-between gap-2 flex-wrap text-xs transition-colors duration-200 min-h-[40px] ${
              hasSelection
                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50'
                : 'bg-gray-50/90 dark:bg-slate-800/60 border-gray-100 dark:border-slate-700/60'
            }`}
          >
            {/* Status / Snippet / Gentle Guidance Indicator */}
            <div className="flex items-center gap-1.5 min-w-0">
              {hasSelection ? (
                <span className="text-[11px] font-bold text-primary flex items-center gap-1.5 truncate">
                  <span className="shrink-0">✍️ تنسيق المحدد:</span>
                  <span className="font-mono text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-primary/20 text-[10px] max-w-[140px] sm:max-w-[200px] truncate">
                    «{selectedTextSnippet || 'نص محدد'}»
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span className="text-amber-500 shrink-0">💡</span>
                  <span className="font-medium">حدد أي كلمة أو نص لتطبيق تنسيق فوري وسريع عليه</span>
                </span>
              )}
            </div>

            {/* Quick Format Action Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Quick convert to normal text (P) */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => convertBlockTo('p')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition shadow-xs flex items-center gap-1 ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : (activeFormats.block === 'p' || !activeFormats.block)
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary/20'
                }`}
                title="تحويل المحدد إلى نص عادي (فقرة P)"
              >
                <Pilcrow size={11} />
                <span>عادي</span>
              </button>

              {/* Quick H1 */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => convertBlockTo('h1')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-[11px] font-black transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.block === 'h1'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary/20'
                }`}
                title="عنوان رئيسي كبير (H1)"
              >
                H1
              </button>

              {/* Quick H2 */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => convertBlockTo('h2')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.block === 'h2'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary/20'
                }`}
                title="عنوان فرعي بارز (H2)"
              >
                H2
              </button>

              {/* Quick Quote */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleBlockquote}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition shadow-xs flex items-center gap-1 ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.block === 'blockquote'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary/20'
                }`}
                title="اقتباس / إلغاء الاقتباس"
              >
                <Quote size={11} />
                <span>اقتباس</span>
              </button>

              <span className="w-px h-3.5 bg-gray-300 dark:bg-slate-600 mx-0.5" />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('bold')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-xs font-black transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.bold
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary hover:text-white'
                }`}
                title="عريض"
              >
                B
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('italic')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-xs italic transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.italic
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary hover:text-white'
                }`}
                title="مائل"
              >
                I
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('underline')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-xs underline transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.underline
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary hover:text-white'
                }`}
                title="تسطير"
              >
                U
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execCmd('strikeThrough')}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md text-xs line-through transition shadow-xs ${
                  !hasSelection
                    ? 'opacity-60 cursor-not-allowed bg-white/60 dark:bg-slate-800/40 text-gray-400'
                    : activeFormats.strikeThrough
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-primary hover:text-white'
                }`}
                title="شطب"
              >
                S
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={applyTelegramSpoiler}
                disabled={!hasSelection}
                className={`px-2 py-0.5 rounded-md bg-slate-700 text-white hover:bg-slate-900 transition shadow-xs text-[10px] font-bold flex items-center gap-0.5 ${
                  !hasSelection ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="سبويلر"
              >
                <Eye size={11} className="text-yellow-300" />
                <span>سبويلر</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyTextColor('#dc2626')}
                disabled={!hasSelection}
                className={`w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-[10px] transition ${
                  !hasSelection ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}
                title="أحمر"
              >
                A
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyTextColor('#2563eb')}
                disabled={!hasSelection}
                className={`w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] transition ${
                  !hasSelection ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}
                title="أزرق"
              >
                A
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMarkerColor('#fef08a')}
                disabled={!hasSelection}
                className={`w-5 h-5 rounded-md bg-yellow-300 text-yellow-950 flex items-center justify-center font-bold text-[10px] transition ${
                  !hasSelection ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                }`}
                title="ماركر أصفر"
              >
                H
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClearFormat}
                disabled={!hasSelection}
                className={`p-1 rounded-md bg-white dark:bg-slate-800 text-gray-500 hover:text-red-500 transition shadow-xs ${
                  !hasSelection ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                title="إزالة كافة التنسيقات والعودة لنص عادي"
              >
                <RemoveFormatting size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Quick Help Guide Strip */}
        {showHelp && activeTab === 'write' && (
          <div className="bg-primary/5 dark:bg-primary/10 border-b border-primary/20 p-3 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
            <div className="flex justify-between items-center font-bold text-primary">
              <span>💡 دليلك للكتابة والتنسيق السريع:</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-red-500 font-bold"
              >
                ✕ إغلاق
              </button>
            </div>
            <p>
              • يمكنك التراجع والتقدم عبر اختصارات لوحة المفاتيح المألوفة (<strong>Ctrl+Z</strong> و <strong>Ctrl+Y</strong>) أو أزرار التراجع بالأعلى.
            </p>
            <p>
              • يمكنك لصق الصور ولقطات الشاشة مباشرة داخل المستند عبر <strong>Ctrl+V</strong> وسيتم ضبط حجمها تلقائياً.
            </p>
            <p>
              • أضف <strong>«فاصل مواضيع / صفحة جديدة»</strong> لتنظيم الملاحظات الطويلة والمحاضرات المتعددة.
            </p>
          </div>
        )}

        {/* ContentEditable Canvas - Always kept mounted in DOM to prevent any content loss */}
        <div className={activeTab === 'write' ? 'relative p-4' : 'hidden'}>
          <div
            ref={editorRef}
            contentEditable
            dir={textDirection}
            onInput={handleEditorInput}
            onBlur={handleEditorInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
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

        {/* Formatted Text Preview */}
        <div
          className={
            activeTab === 'preview'
              ? `p-5 bg-gray-50/50 dark:bg-slate-900/40 ${minHeight} overflow-y-auto`
              : 'hidden'
          }
        >
          {value && value.trim() ? (
            <FormattedTextRenderer content={value} />
          ) : (
            <div className="text-center py-10 text-gray-400 text-xs">
              لا يوجد نص لعرضه حالياً، ارجع للتحرير لبدء الكتابة والتنسيق.
            </div>
          )}
        </div>

        {/* Editor Footer: Stats & Autosave Indicator */}
        <div className="bg-gray-50/80 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-700/80 px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold text-gray-700 dark:text-gray-300">{wordCount} كلمة</span>
            <span>•</span>
            <span>{charCount} حرف</span>

            {/* Autosave Status */}
            <span>•</span>
            {saveStatus === 'saving' ? (
              <span className="text-amber-500 font-bold flex items-center gap-1">
                <Loader2 size={11} className="animate-spin" />
                <span>جاري الحفظ...</span>
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>تم الحفظ تلقائياً ✓</span>
              </span>
            )}
          </div>

          {plainText.length > 0 && activeTab === 'write' && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearAll}
              className="text-red-500 hover:text-red-600 hover:underline flex items-center gap-1 font-bold text-[10px]"
              title="مسح كافة المحتوى والتنسيقات"
            >
              <Trash2 size={12} />
              <span>مسح الكل</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
