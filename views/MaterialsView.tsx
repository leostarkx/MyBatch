import React, { useState, useRef } from "react";
import {
  BookOpen,
  HelpCircle,
  Search,
  Star,
  CheckCircle2,
  X,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Archive,
  Clock,
  Check,
  Eye,
  Download,
  Trash2,
  ChevronLeft,
  Upload,
  Folder,
  FolderPlus,
  Loader2,
  Layers,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  User,
  Course,
  MaterialSection,
  Material,
  Batch,
  Tab,
} from "../types";
import { AcademicQAHub } from "../components/AcademicQAHub";
import { compressImage } from "../services/imageCompressor";

export interface MaterialsViewProps {
  currentUser: User | null;
  effectiveBatchCode: string;
  courses: Course[];
  materialSections: MaterialSection[];
  materials: Material[];
  appUsers: User[];
  currentBatchObj?: Batch;
  canManageMaterials: boolean;
  onToggleBookmarkMaterial: (id: string) => Promise<void>;
  onToggleStudiedMaterial: (id: string) => Promise<void>;
  onDeleteMaterialItem: (id: string) => Promise<void>;
  onDownloadMaterial: (mat: Material) => void;
  onOpenPdfViewer: (url: string, title: string, courseName?: string, fileSize?: string) => void;
  onPreviewImage: (title: string, url: string) => void;
  onAddMaterialSection: (
    courseId: string,
    title: string,
    category: "LECTURES" | "QUESTIONS_BANK"
  ) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onAddMaterialItem: (data: {
    courseId: string;
    sectionId: string;
    title: string;
    type: "PDF" | "IMAGE" | "LINK";
    url: string;
    fileName?: string;
    fileSize?: string;
  }) => Promise<void>;
  onStartEditCourse: (course: Course) => void;
  setActiveTab: (tab: Tab) => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  currentUser,
  effectiveBatchCode,
  courses,
  materialSections,
  materials,
  appUsers,
  currentBatchObj,
  canManageMaterials,
  onToggleBookmarkMaterial,
  onToggleStudiedMaterial,
  onDeleteMaterialItem,
  onDownloadMaterial,
  onOpenPdfViewer,
  onPreviewImage,
  onAddMaterialSection,
  onDeleteSection,
  onAddMaterialItem,
  onStartEditCourse,
  setActiveTab,
}) => {
  const [materialsActiveSubTab, setMaterialsActiveSubTab] = useState<"COURSES" | "QUESTIONS">("COURSES");
  const [activeMatCourse, setActiveMatCourse] = useState<Course | null>(null);
  const [activeMatSection, setActiveMatSection] = useState<MaterialSection | null>(null);

  const [materialSearchQuery, setMaterialSearchQuery] = useState("");
  const [materialFilterMode, setMaterialFilterMode] = useState<"ALL" | "BOOKMARKED" | "STUDIED" | "UNSTUDIED">("ALL");

  // Modals state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionCategory, setNewSectionCategory] = useState<"LECTURES" | "QUESTIONS_BANK">("LECTURES");

  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [newMatTitle, setNewMatTitle] = useState("");
  const [newMatType, setNewMatType] = useState<"PDF" | "IMAGE" | "LINK">("PDF");
  const [newMatUrl, setNewMatUrl] = useState("");
  const [newMatFileName, setNewMatFileName] = useState("");
  const [newMatFileSize, setNewMatFileSize] = useState("");
  const [isUploadingMatFile, setIsUploadingMatFile] = useState(false);

  const materialFileInputRef = useRef<HTMLInputElement>(null);

  const studiedIds = currentUser?.studiedMaterialIds || [];
  const bookmarkedIds = currentUser?.bookmarkedMaterialIds || [];

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMatFile(true);
    try {
      const isImg = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

      setNewMatFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setNewMatFileSize(`${sizeMB} MB`);

      if (!newMatTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setNewMatTitle(cleanName);
      }

      if (isImg) {
        setNewMatType("IMAGE");
        const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.8 });
        setNewMatUrl(compressed);
        setIsUploadingMatFile(false);
      } else {
        setNewMatType("PDF");
        const reader = new FileReader();
        reader.onload = () => {
          setNewMatUrl(reader.result as string);
          setIsUploadingMatFile(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      setIsUploadingMatFile(false);
    }
  };

  const handleAddSectionSubmit = async () => {
    if (!activeMatCourse || !newSectionTitle.trim()) return;
    await onAddMaterialSection(activeMatCourse.id, newSectionTitle.trim(), newSectionCategory);
    setIsAddingSection(false);
    setNewSectionTitle("");
    setNewSectionCategory("LECTURES");
  };

  const handleAddMaterialSubmit = async () => {
    if (!activeMatCourse || !activeMatSection || !newMatTitle.trim() || !newMatUrl.trim()) return;
    await onAddMaterialItem({
      courseId: activeMatCourse.id,
      sectionId: activeMatSection.id,
      title: newMatTitle.trim(),
      type: newMatType,
      url: newMatUrl.trim(),
      fileName: newMatFileName || undefined,
      fileSize: newMatFileSize || undefined,
    });
    setIsAddingMaterial(false);
    setNewMatTitle("");
    setNewMatUrl("");
    setNewMatFileName("");
    setNewMatFileSize("");
  };

  // Render individual material card
  const renderMaterialCard = (mat: Material, showCourseContext = false) => {
    const isStudied = studiedIds.includes(mat.id);
    const isBookmarked = bookmarkedIds.includes(mat.id);
    const matCourse = courses.find((c) => c.id === mat.courseId);
    const matSection = materialSections.find((s) => s.id === mat.sectionId);

    return (
      <div
        key={mat.id}
        className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border transition flex flex-col justify-between group relative overflow-hidden ${
          isStudied
            ? "border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/20 to-white dark:from-emerald-950/10 dark:to-slate-800"
            : "border-gray-100 dark:border-slate-700 hover:shadow-md"
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                {mat.type === "PDF" && <FileText size={24} className="text-red-500" />}
                {mat.type === "IMAGE" && <ImageIcon size={24} className="text-blue-500" />}
                {mat.type === "LINK" && <LinkIcon size={24} className="text-green-500" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mat.type === "PDF"
                        ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                        : mat.type === "IMAGE"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                        : "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400"
                    }`}
                  >
                    {mat.type === "PDF"
                      ? mat.fileName?.toLowerCase().endsWith(".doc") ||
                        mat.fileName?.toLowerCase().endsWith(".docx")
                        ? "ملف Word"
                        : mat.fileName?.toLowerCase().endsWith(".ppt") ||
                          mat.fileName?.toLowerCase().endsWith(".pptx")
                        ? "عرض تقديمي"
                        : "ملف محاضرة"
                      : mat.type === "IMAGE"
                      ? "صورة"
                      : "رابط خارجي"}
                  </span>
                  {matSection?.category === "QUESTIONS_BANK" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1">
                      <Archive size={10} />
                      بنك الأسئلة
                    </span>
                  )}
                </div>
                <h4
                  className="font-bold text-gray-800 dark:text-white truncate mt-1 text-sm md:text-base"
                  title={mat.title}
                >
                  {mat.title}
                </h4>
                {showCourseContext && (
                  <p className="text-[11px] text-primary font-bold truncate mt-0.5">
                    {matCourse?.name || "مادة"} • {matSection?.title || "مجلد"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleBookmarkMaterial(mat.id)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                    : "text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
                title={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة للمراجعة ⭐"}
              >
                <Star size={16} className={isBookmarked ? "fill-current" : ""} />
              </button>
              {canManageMaterials && (
                <button
                  type="button"
                  onClick={() => onDeleteMaterialItem(mat.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                  title="حذف المحاضرة"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Thumbnail preview ONLY if Image */}
          {mat.type === "IMAGE" && mat.url && (
            <div
              onClick={() => onPreviewImage(mat.title, mat.url)}
              className="mb-3 h-36 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-700/50 cursor-pointer relative group/img border border-gray-100 dark:border-slate-700"
            >
              <img
                src={mat.url}
                alt={mat.title}
                className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white gap-1.5 text-xs font-bold">
                <Eye size={18} /> معاينة الصورة
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <Clock size={12} />
              {new Date(mat.uploadDate).toLocaleDateString("ar-EG", {
                month: "short",
                day: "numeric",
              })}
              {mat.fileSize && <span>• {mat.fileSize}</span>}
            </p>

            {/* Study Progress Toggle */}
            <button
              type="button"
              onClick={() => onToggleStudiedMaterial(mat.id)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer ${
                isStudied
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
              title={isStudied ? "اضغط لإلغاء التحديد" : "تحديد كمحاضرة تمت دراستها وفهمها"}
            >
              {isStudied ? (
                <>
                  <Check size={12} />
                  <span>تمت دراستها ✅</span>
                </>
              ) : (
                <span>لم تُدرس بعد</span>
              )}
            </button>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
          {mat.type === "PDF" ? (
            <>
              <button
                type="button"
                onClick={() => onOpenPdfViewer(mat.url, mat.title, matCourse?.name, mat.fileSize)}
                className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Eye size={14} />
                <span>قراءة ومعاينة</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadMaterial(mat)}
                className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition cursor-pointer"
                title="تحميل الملف إلى جهازك"
              >
                <Download size={14} />
              </button>
            </>
          ) : mat.type === "IMAGE" ? (
            <>
              <button
                type="button"
                onClick={() => onPreviewImage(mat.title, mat.url)}
                className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Eye size={14} />
                <span>تكبير ومعاينة</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadMaterial(mat)}
                className="p-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition cursor-pointer"
                title="تحميل الصورة إلى جهازك"
              >
                <Download size={14} />
              </button>
            </>
          ) : (
            <a
              href={mat.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <LinkIcon size={14} />
              <span>فتح الرابط الخارجي</span>
            </a>
          )}
        </div>
      </div>
    );
  };

  // Section view (when a section is opened)
  if (activeMatSection && activeMatCourse) {
    const sectionMaterials = materials.filter((m) => m.sectionId === activeMatSection.id);
    const studiedInSection = sectionMaterials.filter((m) => studiedIds.includes(m.id)).length;
    const sectionPct =
      sectionMaterials.length > 0
        ? Math.round((studiedInSection / sectionMaterials.length) * 100)
        : 0;

    return (
      <div className="space-y-6 p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveMatSection(null)}
              className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-slate-600 transition cursor-pointer"
              title="الرجوع للمجلدات"
            >
              <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                {activeMatSection.category === "QUESTIONS_BANK" ? (
                  <Archive size={22} className="text-purple-500" />
                ) : (
                  <Folder size={22} className="text-amber-500" />
                )}
                {activeMatSection.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activeMatCourse.name} • 👨‍🏫 {activeMatCourse.professors?.join("، ") || "غير محدد"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mr-auto">
            {sectionMaterials.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  إنجازك: {studiedInSection}/{sectionMaterials.length} ({sectionPct}%)
                </span>
              </div>
            )}
            {canManageMaterials && (
              <button
                type="button"
                onClick={() => setIsAddingMaterial(true)}
                className="bg-primary text-white px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Upload size={18} />
                رفع محاضرة أو صورة
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sectionMaterials.map((mat) => renderMaterialCard(mat, false))}
          {sectionMaterials.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
              <BookOpen size={48} className="mx-auto mb-2 opacity-30 text-primary" />
              <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد ملفات في هذا القسم بعد.</p>
              <p className="text-xs text-gray-400 mt-1">
                يمكن للممثل إضافة محاضرات أو أسئلة سنين سابقة أو ملخصات مباشرة من جهازه.
              </p>
            </div>
          )}
        </div>

        {/* Add Material Modal */}
        {isAddingMaterial && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      إضافة محاضرة أو ملف
                    </h3>
                    <p className="text-xs text-gray-400">
                      {activeMatCourse.name} • {activeMatSection.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingMaterial(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* File picker */}
                <div className="p-4 bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 rounded-2xl text-center">
                  <input
                    type="file"
                    ref={materialFileInputRef}
                    onChange={handleFilePick}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                    hidden
                  />
                  <button
                    type="button"
                    onClick={() => materialFileInputRef.current?.click()}
                    disabled={isUploadingMatFile}
                    className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingMatFile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>اختر ملف أو صورة من جهازك</span>
                  </button>
                  {newMatFileName && (
                    <p className="text-xs text-emerald-600 font-bold mt-2 truncate">
                      ✅ تم اختيار: {newMatFileName} ({newMatFileSize})
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    عنوان الملف / المحاضرة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMatTitle}
                    onChange={(e) => setNewMatTitle(e.target.value)}
                    placeholder="مثال: المحاضرة 3 - مقدمة في الخوارزميات"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    أو رابط مباشر (Google Drive / OneDrive / موقع)
                  </label>
                  <input
                    type="text"
                    value={newMatUrl.startsWith("data:") ? "(تم اختيار ملف محلي ✅)" : newMatUrl}
                    onChange={(e) => setNewMatUrl(e.target.value)}
                    disabled={newMatUrl.startsWith("data:")}
                    placeholder="https://..."
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddingMaterial(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAddMaterialSubmit}
                    disabled={!newMatTitle.trim() || !newMatUrl.trim() || isUploadingMatFile}
                    className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                  >
                    <Upload size={16} />
                    <span>حفظ ورفع المحاضرة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Course view (when a course is opened)
  if (activeMatCourse) {
    const courseSections = materialSections.filter((s) => s.courseId === activeMatCourse.id);

    return (
      <div className="space-y-6 p-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveMatCourse(null)}
              className="p-2.5 bg-gray-50 dark:bg-slate-700 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-slate-600 transition cursor-pointer"
              title="الرجوع لكل المواد"
            >
              <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <BookOpen size={22} className="text-primary" />
                {activeMatCourse.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                👨‍🏫 {activeMatCourse.professors?.join("، ") || "لم يُحدد تدريسي"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageMaterials && (
              <button
                type="button"
                onClick={() => setIsAddingSection(true)}
                className="bg-primary text-white px-4 py-2.5 rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <FolderPlus size={18} />
                إضافة مجلد جديد
              </button>
            )}
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courseSections.map((sec) => {
            const secMaterials = materials.filter((m) => m.sectionId === sec.id);
            const isQuestions = sec.category === "QUESTIONS_BANK";

            return (
              <div
                key={sec.id}
                onClick={() => setActiveMatSection(sec)}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-primary/40 transition cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition">
                      {isQuestions ? (
                        <Archive size={28} className="text-purple-500" />
                      ) : (
                        <Folder size={28} className="text-amber-500" />
                      )}
                    </div>
                    {canManageMaterials && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(sec.id);
                        }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                        title="حذف هذا المجلد"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1 group-hover:text-primary transition">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {secMaterials.length} ملف ومحاضرة
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-primary font-bold">
                  <span>فتح المجلد</span>
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </div>
              </div>
            );
          })}

          {courseSections.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
              <Folder size={48} className="mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد مجلدات لهذه المادة بعد.</p>
              {canManageMaterials && (
                <button
                  type="button"
                  onClick={() => setIsAddingSection(true)}
                  className="mt-3 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> إضافة أول مجلد
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Section Modal */}
        {isAddingSection && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                      إضافة مجلد جديد
                    </h3>
                    <p className="text-xs text-gray-400">{activeMatCourse.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingSection(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    اسم المجلد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="مثال: محاضرات النظري، الشيتات، أو أسئلة سنين سابقة"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    نوع المجلد
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSectionCategory("LECTURES")}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        newSectionCategory === "LECTURES"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                      }`}
                    >
                      <Folder size={14} />
                      <span>محاضرات وملخصات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSectionCategory("QUESTIONS_BANK")}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        newSectionCategory === "QUESTIONS_BANK"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600"
                      }`}
                    >
                      <Archive size={14} />
                      <span>بنك الأسئلة والامتحانات</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(false)}
                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSectionSubmit}
                    disabled={!newSectionTitle.trim()}
                    className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-xs shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>إنشاء المجلد</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Global search / filter matching materials
  const globalMatchingMaterials = materials.filter((mat) => {
    const isStudied = studiedIds.includes(mat.id);
    const isBookmarked = bookmarkedIds.includes(mat.id);
    const matCourse = courses.find((c) => c.id === mat.courseId);

    const q = materialSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      mat.title.toLowerCase().includes(q) ||
      (mat.fileName && mat.fileName.toLowerCase().includes(q)) ||
      (matCourse && matCourse.name.toLowerCase().includes(q));

    let matchesFilter = true;
    if (materialFilterMode === "BOOKMARKED") matchesFilter = isBookmarked;
    if (materialFilterMode === "STUDIED") matchesFilter = isStudied;
    if (materialFilterMode === "UNSTUDIED") matchesFilter = !isStudied;

    return matchesSearch && matchesFilter;
  });

  const isSearchingOrFiltering = materialSearchQuery.trim() !== "" || materialFilterMode !== "ALL";

  return (
    <div className="space-y-6 p-4">
      {/* Sub tabs: COURSES vs QUESTIONS */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setMaterialsActiveSubTab("COURSES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            materialsActiveSubTab === "COURSES"
              ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
          }`}
        >
          <BookOpen size={16} />
          <span>المواد والمحاضرات 📚</span>
        </button>
        <button
          type="button"
          onClick={() => setMaterialsActiveSubTab("QUESTIONS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            materialsActiveSubTab === "QUESTIONS"
              ? "bg-white dark:bg-slate-700 text-primary shadow-xs"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-300"
          }`}
        >
          <HelpCircle size={16} />
          <span>بنك أسئلة واستفسارات المواد 💡</span>
        </button>
      </div>

      {materialsActiveSubTab === "QUESTIONS" ? (
        <AcademicQAHub
          batchCode={currentBatchObj?.code || effectiveBatchCode || "CS-2024"}
          courses={courses}
          currentUser={currentUser!}
          allUsers={appUsers}
        />
      ) : (
        <>
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-200 relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-1.5 flex items-center gap-2">
                <BookOpen size={28} />
                المحاضرات وبنك الأسئلة 📚
              </h2>
              <p className="opacity-90 text-sm">
                ابحث في جميع المحاضرات، تتبع تقدمك الدراسي، وراجع المفضلة وأسئلة السنين السابقة.
              </p>
            </div>
            {materials.length > 0 && (
              <div className="relative z-10 bg-white/15 backdrop-blur-md border border-white/25 px-4 py-3 rounded-2xl text-right shrink-0">
                <span className="text-[11px] font-bold block opacity-90">إجمالي إنجازك الدراسي</span>
                <span className="text-lg font-black">
                  {materials.filter((m) => studiedIds.includes(m.id)).length} / {materials.length} محاضرة (
                  {Math.round(
                    (materials.filter((m) => studiedIds.includes(m.id)).length / materials.length) * 100
                  )}
                  %)
                </span>
              </div>
            )}
          </div>

          {/* Global Search & Quick Filter Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                placeholder="بحث شامل وسريع عن أي ملزمة أو محاضرة أو ملف في كل المواد..."
                className="w-full bg-gray-50 dark:bg-slate-700/60 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl pr-10 pl-8 py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              {materialSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMaterialSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setMaterialFilterMode("ALL")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  materialFilterMode === "ALL"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                جميع المواد
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilterMode("BOOKMARKED")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition cursor-pointer ${
                  materialFilterMode === "BOOKMARKED"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Star size={13} className={materialFilterMode === "BOOKMARKED" ? "fill-current" : ""} />
                <span>المفضلة ({materials.filter((m) => bookmarkedIds.includes(m.id)).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilterMode("STUDIED")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition cursor-pointer ${
                  materialFilterMode === "STUDIED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <CheckCircle2 size={13} />
                <span>تمت دراستها ({materials.filter((m) => studiedIds.includes(m.id)).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMaterialFilterMode("UNSTUDIED")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  materialFilterMode === "UNSTUDIED"
                    ? "bg-slate-800 dark:bg-slate-600 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                غير مدروسة ({materials.filter((m) => !studiedIds.includes(m.id)).length})
              </button>
            </div>
          </div>

          {isSearchingOrFiltering ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                  <Search size={16} className="text-primary" />
                  <span>نتائج البحث والفلترة ({globalMatchingMaterials.length} ملف)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMaterialSearchQuery("");
                    setMaterialFilterMode("ALL");
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  إعادة ضبط البحث
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {globalMatchingMaterials.map((mat) => renderMaterialCard(mat, true))}
                {globalMatchingMaterials.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                    <Search size={40} className="mx-auto mb-2 opacity-30 text-gray-400" />
                    <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد محاضرات مطابقة لبحثك.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Courses List */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const courseMats = materials.filter((m) => m.courseId === course.id);
                const studiedCount = courseMats.filter((m) => studiedIds.includes(m.id)).length;
                const pct = courseMats.length > 0 ? Math.round((studiedCount / courseMats.length) * 100) : 0;

                return (
                  <div
                    key={course.id}
                    onClick={() => setActiveMatCourse(course)}
                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-primary/40 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary font-black text-xl group-hover:scale-105 transition">
                          {course.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-primary transition truncate">
                            {course.name}
                          </h3>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            👨‍🏫 {course.professors?.join("، ") || "لم يُحدد أستاذ"}
                          </p>
                        </div>
                      </div>

                      {courseMats.length > 0 && (
                        <div className="mb-4 space-y-1.5">
                          <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                            <span>نسبة دراسة المادة</span>
                            <span>{pct}% ({studiedCount}/{courseMats.length})</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-primary font-bold">
                      <span>عرض المجلدات والمحاضرات ({courseMats.length})</span>
                      <ArrowRight size={14} className="rtl:rotate-180" />
                    </div>
                  </div>
                );
              })}

              {courses.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                  <BookOpen size={48} className="mx-auto mb-2 opacity-30 text-primary" />
                  <p className="font-bold text-gray-700 dark:text-gray-300">لا توجد مواد دراسية مسجلة في الدفعة.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    يمكن للممثل إضافة المواد من تبويب "المواد" لتظهر المحاضرات والجدول.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
