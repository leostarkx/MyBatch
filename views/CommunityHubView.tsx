import React, { useState } from 'react';
import {
  MessageSquare,
  Inbox,
  Trophy,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { User, Course, Grade, AttendanceSession, AttendanceRecord, Assignment, Material, BatchSuggestion, CourseProject } from '../types';
import { BatchLeaderboard } from '../components/BatchLeaderboard';
import { BatchSuggestionsBox } from '../components/BatchSuggestionsBox';

interface CommunityHubViewProps {
  initialSubTab?: 'chat' | 'suggestions' | 'leaderboard' | 'projects';
  currentUser: User | null;
  appUsers: User[];
  courses: Course[];
  grades: Grade[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  materials: Material[];
  batchSuggestions: BatchSuggestion[];
  effectiveBatchCode: string;
  isManager: boolean;
  onViewProfile: (uid: string) => void;
  renderChatContent: () => React.ReactNode;
  renderProjectsContent: () => React.ReactNode;
}

export const CommunityHubView: React.FC<CommunityHubViewProps> = ({
  initialSubTab = 'chat',
  currentUser,
  appUsers,
  courses,
  grades,
  attendanceSessions,
  attendanceRecords,
  assignments,
  materials,
  batchSuggestions,
  effectiveBatchCode,
  isManager,
  onViewProfile,
  renderChatContent,
  renderProjectsContent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'suggestions' | 'leaderboard' | 'projects'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6 p-2 sm:p-4 animate-in slide-in-from-bottom-3 duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <MessageSquare size={14} className="text-orange-200" />
              مجتمع وساحة الدفعة
            </span>
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs">
              دفعة {currentUser?.batchCode || effectiveBatchCode}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1.5 flex items-center gap-2.5">
            <span>💬 مجتمع الدفعة، الشات، والمتصدرين</span>
          </h1>
          <p className="opacity-90 text-xs sm:text-sm max-w-2xl leading-relaxed">
            المنصة التفاعلية لطلاب الدفعة؛ تواصل مباشر في الشات الجماعي، تقديم المقترحات والتصويت عليها، المنافسة في لوحة الشرف، وتنظيم مشاريع التخرج.
          </p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'chat'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare size={16} />
          <span>غرفة الدفعة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('suggestions')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'suggestions'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Inbox size={16} />
          <span>صندوق المقترحات</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSubTab === 'suggestions' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
            {batchSuggestions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('leaderboard')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'leaderboard'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Trophy size={16} />
          <span>المتصدرين 🏆</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('projects')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'projects'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
          }`}
        >
          <Layers size={16} />
          <span>المشاريع</span>
        </button>
      </div>

      {/* Sub-Views Content */}
      {activeSubTab === 'chat' && (
        <div className="animate-in fade-in duration-200">
          {renderChatContent()}
        </div>
      )}

      {activeSubTab === 'suggestions' && (
        <div className="animate-in fade-in duration-200">
          <BatchSuggestionsBox
            currentUser={currentUser}
            allUsers={appUsers}
            courses={courses}
            suggestions={batchSuggestions}
            effectiveBatchCode={effectiveBatchCode || ''}
            isManager={isManager}
            onViewProfile={onViewProfile}
          />
        </div>
      )}

      {activeSubTab === 'leaderboard' && (
        <div className="animate-in fade-in duration-200">
          <BatchLeaderboard
            currentUser={currentUser}
            users={appUsers}
            courses={courses}
            grades={grades}
            sessions={attendanceSessions}
            records={attendanceRecords}
            assignments={assignments}
            materials={materials}
            effectiveBatchCode={effectiveBatchCode || ''}
            onViewProfile={onViewProfile}
          />
        </div>
      )}

      {activeSubTab === 'projects' && (
        <div className="animate-in fade-in duration-200">
          {renderProjectsContent()}
        </div>
      )}
    </div>
  );
};
