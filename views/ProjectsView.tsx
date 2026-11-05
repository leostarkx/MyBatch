import React, { useState, useRef } from "react";
import {
  Layers,
  Sparkles,
  Plus,
  Search,
  Filter,
  Calendar,
  Archive,
  Download,
  Upload,
  Users,
  Edit3,
  Trash2,
  FolderOpen,
  Info,
  CheckCircle2,
  Crown,
  FileText,
  Image as ImageIcon,
  Eye,
  X,
  Save,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import {
  User,
  UserRole,
  CourseProject,
  Course,
  ProjectGroupItem,
  ProjectFileItem,
} from "../types";
import { compareArabicNames } from "../services/firebase";

export interface ProjectsViewProps {
  currentUser: User | null;
  effectiveBatchCode: string;
  projects: CourseProject[];
  courses: Course[];
  appUsers: User[];
  canManageAssignments: boolean;
  onSaveProject: (data: {
    id?: string;
    title: string;
    courseId: string;
    courseName: string;
    deadline?: string;
    description?: string;
  }) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onSaveGroup: (
    projectId: string,
    groupData: {
      id?: string;
      name: string;
      description?: string;
      leaderId: string;
      members: string[];
    }
  ) => Promise<void>;
  onDeleteGroup: (projectId: string, groupId: string) => Promise<void>;
  onUploadProjectFile: (
    projectId: string,
    file: File,
    groupId?: string
  ) => Promise<void>;
  onDeleteProjectFile: (
    project: CourseProject,
    fileId: string,
    groupId?: string
  ) => Promise<void>;
  onDownloadProjectFile: (file: ProjectFileItem) => void;
  onDownloadAllProjectFiles: (project: CourseProject) => void;
  onPreviewImage: (title: string, url: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentUser,
  effectiveBatchCode,
  projects,
  courses,
  appUsers,
  canManageAssignments,
  onSaveProject,
  onDeleteProject,
  onSaveGroup,
  onDeleteGroup,
  onUploadProjectFile,
  onDeleteProjectFile,
  onDownloadProjectFile,
  onDownloadAllProjectFiles,
  onPreviewImage,
}) => {
  const isManager = canManageAssignments;

  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectCourseFilter, setProjectCourseFilter] = useState("all");

  // Modals state
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<CourseProject | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectCourseId, setNewProjectCourseId] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [targetProjectForGroup, setTargetProjectForGroup] = useState<CourseProject | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupLeaderId, setNewGroupLeaderId] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const [groupMemberFilter, setGroupMemberFilter] = useState<"all" | "unassigned">("all");

  const [viewUnassignedProject, setViewUnassignedProject] = useState<CourseProject | null>(null);

  // File upload state
  const [uploadTargetProjectId, setUploadTargetProjectId] = useState<string | null>(null);
  const [uploadTargetGroupId, setUploadTargetGroupId] = useState<string | undefined>(undefined);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  const batchStudents = appUsers.filter((u) => {
    if (u.role === UserRole.OWNER) return false;
    if (u.excludeFromStats) return false;
    if (u.batchCode === effectiveBatchCode) return true;
    if (u.isOfficial && (!u.batchCode || u.batchCode === effectiveBatchCode)) return true;
    return false;
  });

  const filteredProjects = projects.filter((p) => {
    const q = projectSearchQuery.toLowerCase();
    const matchesSearch =
      p.title.toLowerCase().includes(q) ||
      p.courseName.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q));
    const matchesCourse =
      projectCourseFilter === "all" || p.courseId === projectCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const totalGroups = projects.reduce((acc, p) => acc + (p.groups?.length || 0), 0);
  const myProjectsCount = projects.filter((p) =>
    p.groups?.some((g) => g.members.includes(currentUser?.uid || ""))
  ).length;

  const assignedGroupMap = new Map<string, string>();
  if (targetProjectForGroup) {
    targetProjectForGroup.groups?.forEach((g) => {
      if (g.id !== editingGroupId) {
        g.members.forEach((mUid) => {
          assignedGroupMap.set(mUid, g.name);
        });
      }
    });
  }

  const unassignedStudentsInTarget = batchStudents.filter(
    (s) => !assignedGroupMap.has(s.uid) && !newGroupMembers.includes(s.uid)
  );

  const displayedStudentsForGroup = batchStudents
    .filter((s) => {
      const q = groupMemberSearch.toLowerCase();
      const matchesQuery =
        s.name.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q));
      if (!matchesQuery) return false;
      if (groupMemberFilter === "unassigned") {
        return !assignedGroupMap.has(s.uid);
      }
      return true;
    })
    .sort((a, b) => compareArabicNames(a.name, b.name));

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setNewProjectTitle("");
    setNewProjectCourseId(courses[0]?.id || "");
    setNewProjectDeadline("");
    setNewProjectDesc("");
    setIsAddingProject(true);
  };

  const handleOpenEditProject = (proj: CourseProject) => {
    setEditingProject(proj);
    setNewProjectTitle(proj.title);
    setNewProjectCourseId(proj.courseId);
    setNewProjectDeadline(proj.deadline || "");
    setNewProjectDesc(proj.description || "");
    setIsAddingProject(true);
  };

  const handleSaveProjectSubmit = async () => {
    if (!newProjectTitle.trim() || !newProjectCourseId) return;
    const course = courses.find((c) => c.id === newProjectCourseId);
    await onSaveProject({
      id: editingProject?.id,
      title: newProjectTitle.trim(),
      courseId: newProjectCourseId,
      courseName: course?.name || "مادة دراسية",
      deadline: newProjectDeadline.trim() || undefined,
      description: newProjectDesc.trim() || undefined,
    });
    setIsAddingProject(false);
  };

  const handleOpenAddGroup = (proj: CourseProject) => {
    setTargetProjectForGroup(proj);
    setEditingGroupId(null);
    setNewGroupName(`مجموعة ${Number(proj.groups?.length || 0) + 1}`);
    setNewGroupDesc("");
    setNewGroupMembers([]);
    setNewGroupLeaderId("");
    setGroupMemberSearch("");
    setGroupMemberFilter("all");
    setIsAddingGroup(true);
  };

  const handleOpenEditGroup = (proj: CourseProject, grp: ProjectGroupItem) => {
    setTargetProjectForGroup(proj);
    setEditingGroupId(grp.id);
    setNewGroupName(grp.name);
    setNewGroupDesc(grp.description || "");
    setNewGroupMembers([...grp.members]);
    setNewGroupLeaderId(grp.leaderId || grp.members[0] || "");
    setGroupMemberSearch("");
    setGroupMemberFilter("all");
    setIsAddingGroup(true);
  };

  const handleToggleGroupMember = (uid: string) => {
    setNewGroupMembers((prev) => {
      const exists = prev.includes(uid);
      const next = exists ? prev.filter((id) => id !== uid) : [...prev, uid];
      if (exists && newGroupLeaderId === uid) {
        setNewGroupLeaderId(next[0] || "");
      } else if (!exists && !newGroupLeaderId) {
        setNewGroupLeaderId(uid);
      }
      return next;
    });
  };

  const handleSaveGroupSubmit = async () => {
    if (!targetProjectForGroup || !newGroupName.trim()) return;
    await onSaveGroup(targetProjectForGroup.id, {
      id: editingGroupId || undefined,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
      leaderId: newGroupLeaderId || newGroupMembers[0] || "",
      members: newGroupMembers,
    });
    setIsAddingGroup(false);
    setTargetProjectForGroup(null);
    setEditingGroupId(null);
  };

  const handleTriggerUpload = (projectId: string, groupId?: string) => {
    setUploadTargetProjectId(projectId);
    setUploadTargetGroupId(groupId);
    projectFileInputRef.current?.click();
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetProjectId) return;

    setIsUploadingFile(true);
    try {
      await onUploadProjectFile(uploadTargetProjectId, file, uploadTargetGroupId);
    } finally {
      setIsUploadingFile(false);
      setUploadTargetProjectId(null);
      setUploadTargetGroupId(undefined);
      if (projectFileInputRef.current) projectFileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 p-4 animate-in slide-in-from-bottom-4 duration-500">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Sparkles size={14} className="text-amber-300" />
                دفعة {currentUser?.batchCode || "ENG26"}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
                {projects.length} مشاريع مسجلة
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-1 flex items-center gap-2">
              <Layers size={28} />
              مشاريع المواد الدراسية 🚀
            </h2>
            <p className="opacity-80 text-sm max-w-xl">
              إدارة مشاريع المواد وتقسيم الطلاب إلى كروبات ومجموعات عمل لتفادي أي تداخل وتسهيل متابعة التسليم.
            </p>
          </div>
          {isManager && (
            <button
              onClick={handleOpenAddProject}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3.5 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
              إنشاء مشروع جديد
            </button>
          )}
        </div>
      </div>

      {/* Filters and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
              placeholder="ابحث عن مشروع أو مادة..."
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-10 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          <div className="relative min-w-[170px]">
            <Filter
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              value={projectCourseFilter}
              onChange={(e) => setProjectCourseFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-700 rounded-2xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none cursor-pointer"
            >
              <option value="all">جميع المواد ({projects.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold shadow-sm">
            المجموعات: <strong className="text-primary">{totalGroups}</strong>
          </span>
          <span className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold shadow-sm">
            مشاريعك: <strong className="text-green-600">{myProjectsCount}</strong>
          </span>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleFilePicked}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,image/*,video/*"
        hidden
      />

      {/* Projects List */}
      <div className="space-y-6">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 text-gray-400">
            <Layers size={52} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              لا توجد مشاريع مضافة حالياً
            </p>
            <p className="text-sm text-gray-400 mb-4 max-w-sm mx-auto">
              {isManager
                ? "قم بالضغط على زر 'إنشاء مشروع جديد' لتحديد اسم المشروع والمادة وتقسيم الطلاب إلى كروبات."
                : "سيقوم ممثل الدفعة بإضافة المشاريع وتوزيع المجموعات قريباً."}
            </p>
            {isManager && (
              <button
                onClick={handleOpenAddProject}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus size={18} />
                إنشاء أول مشروع
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const myGroup = project.groups?.find((g) =>
              g.members.includes(currentUser?.uid || "")
            );
            const assignedUidsInProj = new Set<string>();
            project.groups?.forEach((g) => {
              g.members.forEach((uid) => assignedUidsInProj.add(uid));
            });
            const unassignedCount = batchStudents.filter(
              (s) => !assignedUidsInProj.has(s.uid)
            ).length;
            const totalUploadedFilesInProject =
              (project.projectFiles?.length || 0) +
              (project.groups || []).reduce((acc, g) => acc + (g.files?.length || 0), 0);

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 transition duration-300 hover:shadow-md"
              >
                {/* Project Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-700/60">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-xl">
                        {project.courseName}
                      </span>
                      {project.deadline && (
                        <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 border border-amber-200/50 dark:border-amber-800/50">
                          <Calendar size={13} />
                          موعد التسليم: {project.deadline}
                        </span>
                      )}
                      <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-xl">
                        {project.groups?.length || 0} كروبات
                      </span>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <Archive size={12} />
                        {totalUploadedFilesInProject} ملفات محفوظة بالمشروع
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">
                      {project.title}
                    </h3>
                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm mt-1 max-w-2xl whitespace-pre-line leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Manager Controls */}
                  {isManager && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {totalUploadedFilesInProject > 0 && (
                        <button
                          onClick={() => onDownloadAllProjectFiles(project)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          title="تحميل جميع ملفات الكروبات والمشروع"
                        >
                          <Download size={15} />
                          <span>تحميل كل ملفات المشروع ({totalUploadedFilesInProject})</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleTriggerUpload(project.id)}
                        disabled={isUploadingFile}
                        className="bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 px-3.5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        title="رفع ملف عام للمشروع"
                      >
                        <Upload size={15} />
                        <span>رفع ملف للمشروع</span>
                      </button>
                      <button
                        onClick={() => handleOpenAddGroup(project)}
                        className="bg-primary text-white hover:bg-primary/90 px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={16} />
                        إضافة كروب
                      </button>
                      <button
                        onClick={() => setViewUnassignedProject(project)}
                        className="bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-3 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                        title="عرض الطلاب غير الموزعين"
                      >
                        <Users size={14} />
                        غير موزعين ({unassignedCount})
                      </button>
                      <button
                        onClick={() => handleOpenEditProject(project)}
                        className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition cursor-pointer"
                        title="تعديل المشروع"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteProject(project.id)}
                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition cursor-pointer"
                        title="حذف المشروع"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* General Project Files Section */}
                {project.projectFiles && project.projectFiles.length > 0 && (
                  <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <FolderOpen size={16} className="text-indigo-600" />
                        <span>ملفات ومرفقات المشروع العامة ({project.projectFiles.length})</span>
                      </h4>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {project.projectFiles.map((pf) => (
                        <div
                          key={pf.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                {pf.title || pf.fileName}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {pf.fileSize || "ملف"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onDownloadProjectFile(pf)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                              title="تحميل الملف"
                            >
                              <Download size={14} />
                            </button>
                            {isManager && (
                              <button
                                type="button"
                                onClick={() => onDeleteProjectFile(project, pf.id)}
                                className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition cursor-pointer"
                                title="حذف الملف"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Student's Group Callout */}
                <div className="mt-4">
                  {myGroup ? (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            مجموعتك في هذا المشروع
                          </span>
                          <h4 className="text-base font-black text-gray-900 dark:text-white">
                            {myGroup.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            قائد الكروب:{" "}
                            <strong>
                              {appUsers.find((u) => u.uid === myGroup.leaderId)?.name ||
                                "لم يحدد بعد"}
                            </strong>{" "}
                            • عدد أعضاء فريقك: {myGroup.members.length} طلاب
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTriggerUpload(project.id, myGroup.id)}
                        disabled={isUploadingFile}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        <Upload size={15} />
                        <span>رفع ملف مشروع كروبك</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-slate-700/40 border border-gray-200/60 dark:border-slate-700 p-3 rounded-2xl flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Info size={16} className="text-gray-400 shrink-0" />
                      <span>لم يتم تعيينك في أي كروب لهذا المشروع بعد. سيقوم الممثل بتوزيعك قريباً.</span>
                    </div>
                  )}
                </div>

                {/* Groups Cards Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <Users size={16} className="text-primary" />
                      كروبات المشروع وملفاتها المرفوعة ({project.groups?.length || 0})
                    </h4>
                    {isManager && project.groups && project.groups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddGroup(project)}
                        className="text-primary text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} />
                        إضافة كروب آخر
                      </button>
                    )}
                  </div>

                  {!project.groups || project.groups.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-gray-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold">لا توجد كروبات مضافة في هذا المشروع بعد</p>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddGroup(project)}
                          className="mt-3 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} />
                          إضافة أول كروب وتوزيع الطلاب
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {project.groups.map((group) => {
                        const isMyGroupItem = group.members.includes(currentUser?.uid || "");
                        const canUploadToGroup = isManager || isMyGroupItem;
                        const groupLeader = appUsers.find((u) => u.uid === group.leaderId);
                        const membersData = appUsers
                          .filter((u) => group.members.includes(u.uid))
                          .sort((a, b) => compareArabicNames(a.name, b.name));
                        const groupFiles = group.files || [];

                        return (
                          <div
                            key={group.id}
                            className={`p-4 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                              isMyGroupItem
                                ? "bg-primary/[0.03] dark:bg-primary/10 border-primary ring-1 ring-primary/20 shadow-sm"
                                : "bg-gray-50/70 dark:bg-slate-700/30 border-gray-200/70 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-gray-900 dark:text-white text-base">
                                      {group.name}
                                    </h5>
                                    {isMyGroupItem && (
                                      <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                        مجموعتك
                                      </span>
                                    )}
                                    {groupFiles.length > 0 && (
                                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckCircle2 size={10} />
                                        تم التسليم ({groupFiles.length})
                                      </span>
                                    )}
                                  </div>
                                  {group.description && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {group.description}
                                    </p>
                                  )}
                                </div>
                                {isManager && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditGroup(project, group)}
                                      className="p-1 text-gray-400 hover:text-primary transition cursor-pointer"
                                      title="تعديل الكروب والأعضاء"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteGroup(project.id, group.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                                      title="حذف الكروب"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Leader Display */}
                              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 border border-gray-100 dark:border-slate-700 mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                    <Crown size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-[10px] text-gray-400 block">قائد الكروب</span>
                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                      {groupLeader?.name || "غير محدد"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Members List */}
                              <div className="space-y-1 mb-3">
                                <span className="text-[10px] text-gray-400 font-bold block mb-1">
                                  الأعضاء ({membersData.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {membersData.map((m) => (
                                    <span
                                      key={m.uid}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-[11px] font-medium text-gray-700 dark:text-gray-300"
                                    >
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Group Uploaded Files */}
                              <div className="pt-2 border-t border-gray-100 dark:border-slate-700/80">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-gray-400">
                                    ملفات الكروب ({groupFiles.length})
                                  </span>
                                  {canUploadToGroup && (
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerUpload(project.id, group.id)}
                                      disabled={isUploadingFile}
                                      className="px-2.5 py-1 rounded-lg bg-primary text-white hover:bg-primary/90 text-[10px] font-bold flex items-center gap-1 transition shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                                    >
                                      <Upload size={11} />
                                      <span>رفع ملف للكروب</span>
                                    </button>
                                  )}
                                </div>

                                {groupFiles.length > 0 ? (
                                  <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar pt-1">
                                    {groupFiles.map((gf) => (
                                      <div
                                        key={gf.id}
                                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-slate-700/60 border border-gray-100 dark:border-slate-600/60"
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            {gf.type === "IMAGE" ? (
                                              <ImageIcon size={14} />
                                            ) : (
                                              <FileText size={14} />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <p
                                              className="text-[11px] font-bold text-gray-800 dark:text-white truncate"
                                              title={gf.fileName}
                                            >
                                              {gf.fileName || gf.title}
                                            </p>
                                            <p className="text-[9px] text-gray-400 truncate">
                                              رفعه: {gf.uploadedByName}
                                              {gf.fileSize ? ` • ${gf.fileSize}` : ""}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {gf.type === "IMAGE" && (
                                            <button
                                              type="button"
                                              onClick={() => onPreviewImage(gf.fileName || gf.title, gf.url)}
                                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-md transition cursor-pointer"
                                              title="معاينة الصورة"
                                            >
                                              <Eye size={13} />
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => onDownloadProjectFile(gf)}
                                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                                            title="تنزيل الملف"
                                          >
                                            <Download size={11} />
                                            <span>تحميل</span>
                                          </button>
                                          {(isManager || gf.uploadedByUid === currentUser?.uid) && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onDeleteProjectFile(project, gf.id, group.id)
                                              }
                                              className="p-1 text-gray-300 hover:text-red-500 rounded-md transition cursor-pointer"
                                              title="حذف الملف"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 text-center py-2">
                                    لا توجد ملفات مرفوعة لهذا الكروب بعد.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add/Edit Project */}
      {isAddingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                    {editingProject ? "تعديل بيانات المشروع" : "إنشاء مشروع جديد"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    حدد اسم المشروع والمادة، ثم أضف الكروبات وقسم الطلاب
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  اسم المشروع <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="مثال: مشروع نظام إدارة المكتبات الذكية"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    المادة الدراسية <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProjectCourseId}
                    onChange={(e) => setNewProjectCourseId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
                  >
                    <option value="">اختر المادة...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                    موعد التسليم (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                    placeholder="مثال: 2026-10-30 أو الأسبوع 12"
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  وصف أو متطلبات المشروع (اختياري)
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="اكتب تعليمات الدكتور، آلية التسليم، أو المتطلبات الفنية للمشروع..."
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm outline-none resize-none h-24 focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveProjectSubmit}
                  disabled={!newProjectTitle.trim() || !newProjectCourseId}
                  className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  <Save size={18} />
                  {editingProject ? "حفظ التعديلات" : "إنشاء المشروع"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Group */}
      {isAddingGroup && targetProjectForGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-slate-700">
              <div>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg inline-block mb-1">
                  {targetProjectForGroup.courseName} • {targetProjectForGroup.title}
                </span>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                  {editingGroupId ? "تعديل الكروب والأعضاء" : "إضافة كروب جديد للمشروع"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingGroup(false);
                  setTargetProjectForGroup(null);
                  setEditingGroupId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 py-4 overflow-y-auto no-scrollbar flex-1">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  اسم الكروب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="مثال: المجموعة 1 - Alpha"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 block">
                  ملاحظات أو وصف الكروب (اختياري)
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="مثال: مسؤولين عن الواجهة الأمامية أو التصميم"
                  className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {/* Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    اختيار أعضاء الكروب ({newGroupMembers.length} محددين)
                  </label>
                  <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-0.5 rounded-xl text-[10px]">
                    <button
                      type="button"
                      onClick={() => setGroupMemberFilter("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        groupMemberFilter === "all"
                          ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      الكل ({batchStudents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupMemberFilter("unassigned")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        groupMemberFilter === "unassigned"
                          ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      المتاحين فقط ({unassignedStudentsInTarget.length})
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={groupMemberSearch}
                    onChange={(e) => setGroupMemberSearch(e.target.value)}
                    placeholder="بحث عن اسم الطالب لإضافته..."
                    className="w-full bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-gray-50/80 dark:bg-slate-900/60 rounded-2xl border border-gray-200/70 dark:border-slate-700">
                  {displayedStudentsForGroup.map((user) => {
                    const isSelected = newGroupMembers.includes(user.uid);
                    const otherGroupName = assignedGroupMap.get(user.uid);
                    return (
                      <div
                        key={user.uid}
                        onClick={() => handleToggleGroupMember(user.uid)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                            : otherGroupName
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 opacity-75 hover:opacity-100"
                            : "bg-white dark:bg-slate-800 border-transparent hover:border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                            {user.name}
                          </p>
                          {otherGroupName && !isSelected ? (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 truncate">
                              ⚠️ في {otherGroupName}
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 truncate">
                              @{user.username || "طالب"}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square size={16} className="text-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leader Selector */}
              {newGroupMembers.length > 0 && (
                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
                  <label className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5 block">
                    <Crown size={16} className="text-amber-500" />
                    تحديد قائد الكروب (من الأعضاء المحددين)
                  </label>
                  <select
                    value={newGroupLeaderId}
                    onChange={(e) => setNewGroupLeaderId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-amber-200 dark:border-amber-800/50 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    {newGroupMembers.map((mUid) => {
                      const member = appUsers.find((u) => u.uid === mUid);
                      return (
                        <option key={mUid} value={mUid}>
                          👑 {member?.name || mUid}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setIsAddingGroup(false);
                  setTargetProjectForGroup(null);
                  setEditingGroupId(null);
                }}
                className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 py-3 rounded-2xl font-bold text-sm hover:bg-gray-200 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveGroupSubmit}
                disabled={!newGroupName.trim()}
                className="flex-1 bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 cursor-pointer"
              >
                <Save size={18} />
                {editingGroupId ? "تحديث الكروب" : "حفظ الكروب في المشروع"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Unassigned Students */}
      {viewUnassignedProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 border border-gray-100 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  الطلاب غير الموزعين في المشروع
                </h3>
                <p className="text-xs text-gray-400">
                  مشروع: {viewUnassignedProject.title} ({viewUnassignedProject.courseName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewUnassignedProject(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 overflow-y-auto no-scrollbar flex-1 space-y-2">
              {(() => {
                const assignedUids = new Set<string>();
                viewUnassignedProject.groups?.forEach((g) => {
                  g.members.forEach((uid) => assignedUids.add(uid));
                });
                const unassigned = batchStudents.filter((s) => !assignedUids.has(s.uid));
                if (unassigned.length === 0) {
                  return (
                    <div className="text-center py-8 text-emerald-600 font-bold text-sm">
                      🎉 رائع! تم توزيع جميع طلاب الدفعة في كروبات هذا المشروع بنجاح.
                    </div>
                  );
                }
                return (
                  <>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-2">
                      يوجد {unassigned.length} طالب لم ينضموا بعد إلى أي كروب في هذا المشروع:
                    </p>
                    {unassigned.map((st) => (
                      <div
                        key={st.uid}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={st.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-white">
                              {st.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              @{st.username || "طالب"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg">
                          غير منضم
                        </span>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const currentProj = viewUnassignedProject;
                  setViewUnassignedProject(null);
                  handleOpenAddGroup(currentProj);
                }}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                إنشاء كروب بهؤلاء الطلاب
              </button>
              <button
                type="button"
                onClick={() => setViewUnassignedProject(null)}
                className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
