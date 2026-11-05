import React, { useState, useEffect, useRef } from "react";
import { CheckSquare, X, Upload, Loader2, Save, Bell } from "lucide-react";
import { Assignment, Course, AssignmentAttachment } from "../types";
import { RichTextEditor } from "./RichTextEditor";
import { compressImage } from "../services/imageCompressor";

export interface AddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAssignment: Assignment | null;
  courses: Course[];
  onSave: (data: {
    title: string;
    courseId: string;
    dueDate: string;
    description: string;
    attachment?: AssignmentAttachment;
    notify: boolean;
  }) => Promise<void>;
}

export const AddAssignmentModal: React.FC<AddAssignmentModalProps> = ({
  isOpen,
  onClose,
  editingAssignment,
  courses,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<"file" | "image" | "link">("file");
  const [attachmentName, setAttachmentName] = useState("");
  const [notify, setNotify] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingAssignment) {
      setTitle(editingAssignment.title || "");
      setCourseId(editingAssignment.courseId || "");
      setDueDate(editingAssignment.dueDate || "");
      setDescription(editingAssignment.description || "");
      if (editingAssignment.attachment) {
        setAttachmentUrl(editingAssignment.attachment.url || "");
        setAttachmentType(editingAssignment.attachment.type || "file");
        setAttachmentName(editingAssignment.attachment.name || "");
      } else {
        setAttachmentUrl("");
        setAttachmentType("file");
        setAttachmentName("");
      }
      setNotify(false);
    } else {
      setTitle("");
      setCourseId(courses[0]?.id || "");
      setDueDate("");
      setDescription("");
      setAttachmentUrl("");
      setAttachmentType("file");
      setAttachmentName("");
      setNotify(true);
    }
  }, [editingAssignment, isOpen, courses]);

  if (!isOpen) return null;

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (isImg) {
        const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
        setAttachmentUrl(compressed);
        setAttachmentType("image");
        setAttachmentName(file.name);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachmentUrl(reader.result as string);
          setAttachmentType(isPdf ? "file" : "file");
          setAttachmentName(file.name);
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !courseId || !dueDate || isSaving) return;
    setIsSaving(true);
    try {
      let attachment: AssignmentAttachment | undefined = undefined;
      if (attachmentUrl.trim()) {
        attachment = {
          title: attachmentName.trim() || title.trim(),
          url: attachmentUrl.trim(),
          type: attachmentType,
        };
      }

      await onSave({
        title: title.trim(),
        courseId,
        dueDate,
        description,
        attachment,
        notify,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-slate-700 max-h-[92vh] flex flex-col my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <CheckSquare size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-800 dark:text-white">
                {editingAssignment ? "تعديل بيانات الواجب الدراسي" : "إضافة تكليف / واجب دراسي جديد"}
              </h3>
              <p className="text-xs text-gray-400">
                حدد المادة وتاريخ ووقت التسليم لحساب الوقت المتبقي تلقائياً وتنبيه الدفعة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 pt-4 overflow-y-auto flex-1 no-scrollbar text-xs">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
              عنوان الواجب <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حل الشيت الثاني - تصميم قواعد البيانات"
              className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                المادة الدراسية <span className="text-red-500">*</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
              >
                <option value="">-- اختر المادة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="general">واجب عام / تكليف مشترك</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                موعد التسليم الدقيق <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="اكتب تعليمات الأستاذ، طريقة التسليم، النقاط المهمة، وروابط المساعدة ✍️"
            label="تفاصيل ومتطلبات الواجب بالتنسيق الغني (اختياري)"
            minHeight="min-h-[130px]"
          />

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
              مرفق الواجب (ملف أو صورة من الجهاز أو رابط)
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFilePick}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                  hidden
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  اختر ملف من جهازك
                </button>
                <input
                  type="text"
                  value={attachmentUrl.startsWith("data:") ? "(تم اختيار ملف من جهازك ✅)" : attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  disabled={attachmentUrl.startsWith("data:")}
                  placeholder="أو اكتب رابط خارجي..."
                  className="flex-1 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
                <select
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value as any)}
                  disabled={attachmentUrl.startsWith("data:")}
                  className="bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-2.5 py-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="link">رابط</option>
                  <option value="file">ملف</option>
                  <option value="image">صورة</option>
                </select>
              </div>
              {attachmentUrl && attachmentUrl.startsWith("data:") && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
                  <span>تم تجهيز الملف المرفق من الجهاز للرفع مع الواجب ({attachmentType})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    إلغاء المرفق
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Announcement toggle */}
          {!editingAssignment && (
            <div
              className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between cursor-pointer select-none"
              onClick={() => setNotify(!notify)}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    نشر التكليف في التبليغات وإرسال إشعار للدفعة 📢
                  </p>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    سيتم إنشاء تبليغ فوري يحتوي على المادة وموعد التسليم
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700 shrink-0 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || !courseId || !dueDate || isSaving}
            className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الحفظ والنشر...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{editingAssignment ? "حفظ التعديلات" : "حفظ ونشر الواجب للدفعة 🚀"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
