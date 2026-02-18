import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { 
  User, UserRole, Tab, Announcement, 
  Course, Grade, AttendanceSession, AttendanceRecord, Material, ChatMessage, ThemeColor, AssessmentStructure, MaterialSection, Notification
} from './types';
import { 
  Send, Plus, Download, Trash2, LogOut, CheckCircle, 
  AlertCircle, FileText, Image as ImageIcon, Search,
  Bell, Palette, ChevronLeft, Award,
  User as UserIcon, BookOpen, MessageSquare, X, Save, Lock, ShieldCheck, UserPlus, Edit3, Calendar, Users, List, UserMinus,
  Folder, FolderPlus, Link as LinkIcon, ArrowRight, GraduationCap, BarChart3, TrendingUp, PieChart, CalendarCheck, CheckSquare, Square, MoreVertical, Reply, AtSign, Camera, Moon, Sun, Upload, Loader2, UserCheck
} from 'lucide-react';

// --- Firebase Imports ---
import { auth, db, storage } from './services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc, 
  where 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// --- Theme Selector ---
const ThemeSelector: React.FC<{ currentTheme: ThemeColor, onChange: (t: ThemeColor) => void }> = ({ currentTheme, onChange }) => {
  const themes: { id: ThemeColor, color: string, label: string }[] = [
    { id: 'blue', color: '37 99 235', label: 'أزرق' },
    { id: 'emerald', color: '16 185 129', label: 'أخضر' },
    { id: 'violet', color: '139 92 246', label: 'بنفسجي' },
    { id: 'rose', color: '244 63 94', label: 'وردي' },
    { id: 'amber', color: '245 158 11', label: 'ذهبي' },
  ];

  return (
    <div className="flex gap-3 justify-center md:justify-start">
      {themes.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${currentTheme === t.id ? 'border-gray-600 scale-110' : 'border-transparent'}`}
          style={{ backgroundColor: `rgb(${t.color})` }}
          aria-label={t.label}
        >
          {currentTheme === t.id && <CheckCircle size={14} className="text-white" />}
        </button>
      ))}
    </div>
  );
};

// --- Auth Component (Login / Signup) ---
interface AuthScreenProps {
  onLogin: (user: User) => void; // Unused in Firebase flow but kept for prop structure if needed
  onSignup: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanUsername = username.trim();
    
    if (!cleanUsername || !password) {
        setError('يرجى تعبئة جميع الحقول');
        setIsLoading(false);
        return;
    }

    try {
      // Append a fake domain to allow simple usernames
      const email = `${cleanUsername}@batch.app`; 

      if (isLoginMode) {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged in App component will handle the rest
      } else {
        // Signup Logic (Student Only - Self Signup)
        if (!name) {
          setError('يرجى كتابة الاسم الكامل');
          setIsLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
          setIsLoading(false);
          return;
        }

        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 2. Create User Document in Firestore
        const newUser: User = {
          uid,
          username: cleanUsername,
          name,
          role: UserRole.STUDENT,
          isOfficial: false, 
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
          bio: 'طالب جديد في الدفعة',
          signatureColor: '#64748b'
        };

        await setDoc(doc(db, 'users', uid), newUser);
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code;
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-email') {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('اسم المستخدم مستخدم بالفعل');
      } else if (errorCode === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل)');
      } else {
        setError('حدث خطأ، يرجى المحاولة لاحقاً');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary rounded-b-[3rem] z-0 shadow-2xl" />
      
      <div className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-sm z-10 border border-white/50 dark:border-slate-700 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
             <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
             <img 
               src="https://image2url.com/r2/default/images/1771267640581-35bff80f-1346-49cc-bf93-a392d06b2588.png" 
               alt="App Logo" 
               className="w-full h-full object-contain relative z-10 drop-shadow-xl hover:scale-105 transition-transform duration-300"
             />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">دفعتي</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
            {isLoginMode ? 'سجل دخولك للمتابعة' : 'إنشاء حساب طالب جديد'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">الاسم الكامل</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2">
                   <FileText size={16} className="text-gray-400" />
                   <input 
                      type="text" 
                      className="flex-1 bg-transparent text-sm outline-none dark:text-white" 
                      placeholder="أحمد محمد علي" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                   />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">اسم المستخدم</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                <UserIcon size={16} className="text-gray-400" />
                <input 
                  type="text" 
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white" 
                  placeholder="username" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">كلمة المرور</label>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Lock size={16} className="text-gray-400" />
                <input 
                  type="password" 
                  className="flex-1 bg-transparent text-sm outline-none dark:text-white" 
                  placeholder="******" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/30 mt-4 flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : (
              <>
                {isLoginMode ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                <ChevronLeft size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
            className="text-xs text-primary font-bold hover:underline"
          >
            {isLoginMode ? 'طالب جديد؟ أنشئ حسابك الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- App Component ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingApp, setLoadingApp] = useState(true);
  
  // Real Data State (from Firebase)
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [materialSections, setMaterialSections] = useState<MaterialSection[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  // --- UI States ---
  // Material Navigation State
  const [activeMatCourse, setActiveMatCourse] = useState<Course | null>(null);
  const [activeMatSection, setActiveMatSection] = useState<MaterialSection | null>(null);
  
  // Materials Editing State (Admin)
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  
  // New Material Form
  const [newMatTitle, setNewMatTitle] = useState('');
  const [newMatType, setNewMatType] = useState<'PDF' | 'IMAGE' | 'LINK'>('PDF');
  const [newMatUrl, setNewMatUrl] = useState('');

  // Chat State
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRefAvatar = useRef<HTMLInputElement>(null);
  const fileInputRefBanner = useRef<HTMLInputElement>(null);

  // Course Creation/Editing State
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null); 
  const [newCourseName, setNewCourseName] = useState('');
  const [courseProfessors, setCourseProfessors] = useState<string[]>([]);
  const [tempProfName, setTempProfName] = useState('');
  const [newAssessments, setNewAssessments] = useState<AssessmentStructure[]>([]);
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [newAssessmentScore, setNewAssessmentScore] = useState('');
  const [newAssessmentDate, setNewAssessmentDate] = useState('');

  // Grade Editing State (Admin)
  const [isEditingGrades, setIsEditingGrades] = useState(false);
  const [selectedCourseForGrading, setSelectedCourseForGrading] = useState<Course | null>(null);
  const [selectedAssessmentForGrading, setSelectedAssessmentForGrading] = useState<AssessmentStructure | null>(null);
  const [tempGrades, setTempGrades] = useState<{[studentId: string]: number}>({});

  // Attendance Management State (Admin)
  const [selectedCourseForAttendance, setSelectedCourseForAttendance] = useState<Course | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [isAddingSession, setIsAddingSession] = useState(false);

  // Student Management State (Admin)
  const [newStudentName, setNewStudentName] = useState('');
  
  // Admin Management State (Owner Only)
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [promoteUsername, setPromoteUsername] = useState('');

  // Announcements State
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementPriority, setNewAnnouncementPriority] = useState<'normal' | 'high'>('normal');

  // --- 1. Auth Listener ---
  useEffect(() => {
    let isMounted = true;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Use a retry mechanism to handle race conditions during signup
        const fetchUserWithRetry = async (attempts = 5) => {
           if (!isMounted) return;
           try {
             const userSnap = await getDoc(userDocRef);
             if (userSnap.exists()) {
               if (isMounted) {
                 setCurrentUser(userSnap.data() as User);
                 setLoadingApp(false);
               }
             } else {
               // Doc might be creating (race condition)
               if (attempts > 0) {
                 console.log(`User doc not found, retrying... (${attempts} left)`);
                 setTimeout(() => fetchUserWithRetry(attempts - 1), 500);
               } else {
                 console.warn("User document not found after retries.");
                 if (isMounted) setLoadingApp(false);
               }
             }
           } catch (err: any) {
             // If permission denied, it likely means the doc doesn't exist yet and rules prevent reading null resource
             if ((err.code === 'permission-denied' || err.code === 'unavailable') && attempts > 0) {
                console.log(`Permission denied (likely creation race), retrying... (${attempts} left)`);
                setTimeout(() => fetchUserWithRetry(attempts - 1), 500);
             } else {
                console.error("Error fetching user doc:", err);
                if (isMounted) setLoadingApp(false);
             }
           }
        };

        fetchUserWithRetry();

      } else {
        if (isMounted) {
            setCurrentUser(null);
            setLoadingApp(false);
        }
      }
    });
    
    return () => {
        isMounted = false;
        unsubscribeAuth();
    };
  }, []);

  // --- 2. Data Listeners (Dependent on Auth) ---
  useEffect(() => {
    // Only set up listeners if we have a logged-in user
    if (!currentUser) return;

    // Error handler helper to silence permission errors in console or handle them gracefully
    const handleSnapshotError = (err: any) => {
       if (err.code === 'permission-denied') {
          console.warn("Permission denied for a listener. This is expected if user is logged out or roles changed.");
       } else {
          console.error("Snapshot error:", err);
       }
    };

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setAppUsers(snap.docs.map(d => d.data() as User));
    }, handleSnapshotError);

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    }, handleSnapshotError);

    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    }, handleSnapshotError);

    const unsubChat = onSnapshot(query(collection(db, 'chat'), orderBy('timestamp', 'asc')), (snap) => {
      setChatMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    }, handleSnapshotError);

    const unsubGrades = onSnapshot(collection(db, 'grades'), (snap) => {
      setGrades(snap.docs.map(d => ({id:d.id, ...d.data()} as Grade)))
    }, handleSnapshotError);
    
    const unsubSessions = onSnapshot(collection(db, 'attendance_sessions'), (snap) => {
      setAttendanceSessions(snap.docs.map(d => ({id:d.id, ...d.data()} as AttendanceSession)))
    }, handleSnapshotError);
    
    const unsubRecords = onSnapshot(collection(db, 'attendance_records'), (snap) => {
      setAttendanceRecords(snap.docs.map(d => ({id:d.id, ...d.data()} as AttendanceRecord)))
    }, handleSnapshotError);
    
    const unsubSections = onSnapshot(collection(db, 'material_sections'), (snap) => {
      setMaterialSections(snap.docs.map(d => ({id:d.id, ...d.data()} as MaterialSection)))
    }, handleSnapshotError);
    
    const unsubMaterials = onSnapshot(collection(db, 'materials'), (snap) => {
      setMaterials(snap.docs.map(d => ({id:d.id, ...d.data()} as Material)))
    }, handleSnapshotError);

    return () => {
      unsubUsers();
      unsubAnnouncements();
      unsubCourses();
      unsubChat();
      unsubGrades();
      unsubSessions();
      unsubRecords();
      unsubSections();
      unsubMaterials();
    };
  }, [currentUser]); // Re-run when currentUser changes (e.g. login)

  // Update CSS Variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors: Record<ThemeColor, string> = {
      blue: '37 99 235',
      emerald: '16 185 129',
      violet: '139 92 246',
      rose: '244 63 94',
      amber: '245 158 11'
    };
    root.style.setProperty('--color-primary', colors[theme]);
  }, [theme]);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Scroll to bottom of chat
  useEffect(() => {
     if (activeTab === Tab.CHAT) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }
  }, [chatMessages, activeTab]);

  // --- Handlers (Converted to Firebase) ---

  const handleLogout = async () => {
    await signOut(auth);
    setViewingUserProfile(null);
  };

  const handleViewProfile = (uid: string) => {
    const userToView = appUsers.find(u => u.uid === uid);
    if (userToView) {
      setViewingUserProfile(userToView);
      setActiveTab(Tab.PROFILE);
    }
  };

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/20', 'transition-colors', 'duration-1000');
      setTimeout(() => element.classList.remove('bg-primary/20'), 1500);
    }
  };

  // Add Official Student (No Auth, just DB Record for Grades)
  const handleAddStudent = async () => {
    if (!newStudentName) return;
    const uid = `u_${Date.now()}`;
    const newStudent: User = {
      uid,
      name: newStudentName,
      role: UserRole.STUDENT,
      isOfficial: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudentName)}&background=random`,
      bio: 'طالب جامعي',
      signatureColor: '#94a3b8'
    };
    await setDoc(doc(db, 'users', uid), newStudent);
    setNewStudentName('');
  };

  const handleDeleteUser = async (uid: string) => {
    // Delete from Firestore only. 
    // Note: Deleting Auth user requires Cloud Functions or Admin SDK, 
    // so here we just remove their data access effectively.
    if(window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
        await deleteDoc(doc(db, 'users', uid));
    }
  };

  // Add Admin (Creates a full account)
  const handleAddAdmin = async () => {
     if (!newAdminName || !newAdminUsername || !newAdminPass) return;
     
     try {
        const email = `${newAdminUsername}@batch.app`;
        const res = await createUserWithEmailAndPassword(auth, email, newAdminPass);
        
        const newAdmin: User = {
            uid: res.user.uid,
            name: newAdminName,
            username: newAdminUsername,
            role: UserRole.ADMIN,
            isOfficial: true,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newAdminName)}&background=0D8ABC&color=fff`,
            bio: 'مشرف النظام',
            signatureColor: '#0ea5e9'
        };
        
        await setDoc(doc(db, 'users', res.user.uid), newAdmin);
        
        setIsAddingAdmin(false);
        setNewAdminName('');
        setNewAdminUsername('');
        setNewAdminPass('');
        alert("تم إضافة المشرف بنجاح");
        
        // Note: createUserWithEmailAndPassword automatically signs in the new user.
        // If you are logged in as owner, this will log you out. 
        // In a real app, you'd use a secondary app instance or Cloud Function to create users without logging out.
        // For this demo, we'll accept the re-login or warn user.
        alert("سيتم تسجيل خروجك لأنك أنشأت حساباً جديداً. يرجى تسجيل الدخول مرة أخرى بحساب المالك.");
     } catch (e: any) {
         alert("خطأ في إضافة المشرف: " + e.message);
     }
  };

  const handlePromoteUser = async () => {
    if (!promoteUsername) return;
    const targetUser = appUsers.find(u => u.username === promoteUsername);
    if (targetUser) {
       if (targetUser.role === UserRole.ADMIN) {
          alert('هذا المستخدم مشرف بالفعل');
          return;
       }
       
       await updateDoc(doc(db, 'users', targetUser.uid), {
           role: UserRole.ADMIN,
           isOfficial: true,
           bio: targetUser.bio || 'تمت ترقيته إلى مشرف'
       });

       setPromoteUsername('');
       alert(`تم منح صلاحيات الإشراف للطالب ${targetUser.name} بنجاح!`);
    } else {
       alert('اسم المستخدم غير موجود');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    // Handle Mentions (Notifications)
    const mentionRegex = /@(\w+)/g;
    const mentions = newMessage.match(mentionRegex);
    if (mentions) {
        // Logic to send notifications would go here (adding to 'notifications' collection)
    }

    const msgData = {
      senderId: currentUser.uid,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar || '',
      senderColor: currentUser.signatureColor || '#000',
      content: newMessage,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo ? {
         id: replyingTo.id,
         senderName: replyingTo.senderName,
         content: replyingTo.content
      } : null
    };
    
    await addDoc(collection(db, 'chat'), msgData);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleDeleteMessage = async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    await deleteDoc(doc(db, 'chat', id));
  };

  // Firebase Storage Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const fileRef = ref(storage, `users/${currentUser.uid}/${type}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      if (type === 'avatar') setEditAvatar(url);
      else setEditBanner(url);
      
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            bio: editBio,
            banner: editBanner,
            avatar: editAvatar,
            signatureColor: editColor
        });
        setIsEditingProfile(false);
    } catch(e) {
        alert("حدث خطأ أثناء حفظ الملف الشخصي");
    }
  };

  // --- Course Logic ---
  const handleAddAssessmentToNewCourse = () => {
    if (!newAssessmentName || !newAssessmentScore) return;
    const newItem: AssessmentStructure = {
      id: `asm_${Date.now()}`,
      name: newAssessmentName,
      maxScore: parseInt(newAssessmentScore),
      date: newAssessmentDate || undefined
    };
    setNewAssessments([...newAssessments, newItem]);
    setNewAssessmentName('');
    setNewAssessmentScore('');
    setNewAssessmentDate('');
  };

  const handleRemoveAssessmentFromNewCourse = (id: string) => {
    setNewAssessments(newAssessments.filter(a => a.id !== id));
  };

  const handleAddProf = () => {
    if (tempProfName.trim()) {
      setCourseProfessors([...courseProfessors, tempProfName.trim()]);
      setTempProfName('');
    }
  };

  const handleRemoveProf = (idx: number) => {
    setCourseProfessors(courseProfessors.filter((_, i) => i !== idx));
  };

  const handleSaveCourse = async () => {
    if (!newCourseName || courseProfessors.length === 0 || newAssessments.length === 0) return;

    const courseData = {
        name: newCourseName,
        professors: courseProfessors,
        assessments: newAssessments,
        code: `CODE${Date.now().toString().slice(-4)}` // Simple ID generation
    };

    if (editingCourseId) {
      await updateDoc(doc(db, 'courses', editingCourseId), courseData);
    } else {
      await addDoc(collection(db, 'courses'), courseData);
    }
    
    setIsAddingCourse(false);
    setEditingCourseId(null);
    setNewCourseName('');
    setCourseProfessors([]);
    setTempProfName('');
    setNewAssessments([]);
  };

  const handleStartEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseName(course.name);
    setCourseProfessors(course.professors);
    setNewAssessments(course.assessments);
    setIsAddingCourse(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if(window.confirm("حذف المادة سيحذف جميع بياناتها. استمرار؟")) {
        await deleteDoc(doc(db, 'courses', courseId));
    }
  };

  // --- Grades Logic ---
  const handleOpenGradeEditor = (course: Course, assessment: AssessmentStructure) => {
    setSelectedCourseForGrading(course);
    setSelectedAssessmentForGrading(assessment);
    
    // Build temp map from existing real grades
    const currentGradesMap: {[id: string]: number} = {};
    grades
      .filter(g => g.assessmentId === assessment.id)
      .forEach(g => {
        currentGradesMap[g.studentId] = g.score;
      });
    setTempGrades(currentGradesMap);
    setIsEditingGrades(true);
  };

  const handleSaveGrades = async () => {
    if (!selectedCourseForGrading || !selectedAssessmentForGrading) return;
    
    // For every student in tempGrades, insert/update a grade doc
    // Note: This is simplified. In prod, use batch writes.
    const promises = Object.entries(tempGrades).map(async ([studentId, score]) => {
        // Check if grade exists
        const existingGrade = grades.find(g => g.studentId === studentId && g.assessmentId === selectedAssessmentForGrading?.id);
        
        if (existingGrade) {
            await updateDoc(doc(db, 'grades', existingGrade.id), { score });
        } else {
            await addDoc(collection(db, 'grades'), {
                studentId,
                courseId: selectedCourseForGrading?.id,
                assessmentId: selectedAssessmentForGrading?.id,
                score
            });
        }
    });

    await Promise.all(promises);
    setIsEditingGrades(false);
    setSelectedCourseForGrading(null);
    setSelectedAssessmentForGrading(null);
  };

  // --- Attendance Logic ---
  const handleCreateSession = async () => {
    if (!selectedCourseForAttendance || !newSessionDate) return;
    await addDoc(collection(db, 'attendance_sessions'), {
      courseId: selectedCourseForAttendance.id,
      date: newSessionDate,
      title: newSessionTitle || `محاضرة ${newSessionDate}`
    });
    setNewSessionDate('');
    setNewSessionTitle('');
    setIsAddingSession(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if(window.confirm("حذف الجلسة؟")) {
        await deleteDoc(doc(db, 'attendance_sessions', sessionId));
        if (selectedSessionId === sessionId) setSelectedSessionId(null);
    }
  };

  const handleMarkAttendance = async (studentId: string, isPresent: boolean) => {
    if (!selectedSessionId) return;

    // Check if record exists
    const existingRecord = attendanceRecords.find(r => r.sessionId === selectedSessionId && r.studentId === studentId);

    if (existingRecord) {
        await updateDoc(doc(db, 'attendance_records', existingRecord.id), {
            status: isPresent ? 'PRESENT' : 'ABSENT'
        });
    } else {
        await addDoc(collection(db, 'attendance_records'), {
            sessionId: selectedSessionId,
            studentId,
            status: isPresent ? 'PRESENT' : 'ABSENT'
        });
    }
  };

  // --- Materials Logic ---
  const handleAddMaterialSection = async () => {
    if (!newSectionName || !activeMatCourse) return;
    await addDoc(collection(db, 'material_sections'), {
      courseId: activeMatCourse.id,
      title: newSectionName,
      icon: 'FOLDER'
    });
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if(window.confirm("حذف المجلد؟")) {
        await deleteDoc(doc(db, 'material_sections', sectionId));
    }
  };

  const handleAddMaterialItem = async () => {
    if (!newMatTitle || !newMatUrl || !activeMatSection || !activeMatCourse) return;
    await addDoc(collection(db, 'materials'), {
      courseId: activeMatCourse.id,
      sectionId: activeMatSection.id,
      title: newMatTitle,
      type: newMatType,
      url: newMatUrl,
      uploadDate: new Date().toISOString()
    });
    setNewMatTitle('');
    setNewMatUrl('');
    setIsAddingMaterial(false);
  };

  const handleDeleteMaterialItem = async (matId: string) => {
    if(window.confirm("حذف الملف؟")) await deleteDoc(doc(db, 'materials', matId));
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncementTitle || !newAnnouncementContent || !currentUser) return;
    await addDoc(collection(db, 'announcements'), {
      title: newAnnouncementTitle,
      content: newAnnouncementContent,
      timestamp: new Date().toISOString(),
      authorId: currentUser.uid,
      authorName: currentUser.name,
      priority: newAnnouncementPriority
    });
    setIsAddingAnnouncement(false);
    setNewAnnouncementTitle('');
    setNewAnnouncementContent('');
    setNewAnnouncementPriority('normal');
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if(window.confirm("حذف الإعلان؟")) await deleteDoc(doc(db, 'announcements', id));
  };

  // --- Views Copy/Paste from previous with minor adjustments if needed ---
  // The Render functions remain almost identical as they use the state variables which are now populated by Firebase

  const renderHome = () => {
    return (
        <div className="space-y-6 p-4">
             {/* Welcome Section */}
             <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden">
                <div className="relative z-10">
                   <h1 className="text-3xl font-bold mb-2">مرحباً، {currentUser?.name} 👋</h1>
                   <p className="opacity-90 text-lg">أهلاً بك في منصة دفعتي، كل ما تحتاجه في مكان واحد.</p>
                </div>
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>
             </div>

             {/* Announcements */}
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <Bell className="text-primary" size={24} />
                   الإعلانات والتنبيهات
                </h2>
                {currentUser?.role === UserRole.ADMIN && (
                   <button 
                     onClick={() => setIsAddingAnnouncement(true)}
                     className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
                   >
                      <Plus size={18} />
                      إضافة إعلان
                   </button>
                )}
             </div>

             {/* Announcements List */}
             <div className="space-y-4">
                {announcements.map(ann => (
                   <div key={ann.id} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group ${ann.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${ann.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                               {ann.priority === 'high' ? 'هام جداً' : 'إعلان عام'}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(ann.timestamp).toLocaleDateString('ar-EG')}</span>
                         </div>
                         {currentUser?.role === UserRole.ADMIN && (
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                         )}
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-2">{ann.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{ann.content}</p>
                      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {ann.authorName.charAt(0)}
                         </div>
                         <span className="text-xs text-gray-500 dark:text-gray-400">نشر بواسطة <span className="font-bold">{ann.authorName}</span></span>
                      </div>
                   </div>
                ))}
                {announcements.length === 0 && (
                   <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                      لا توجد إعلانات حالياً
                   </div>
                )}
             </div>

             {/* Add Announcement Modal */}
             {isAddingAnnouncement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                   <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg text-gray-800 dark:text-white">إضافة إعلان جديد</h3>
                         <button onClick={() => setIsAddingAnnouncement(false)}><X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                      </div>
                      <div className="space-y-4">
                         <input 
                           type="text" 
                           placeholder="عنوان الإعلان" 
                           className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none"
                           value={newAnnouncementTitle}
                           onChange={e => setNewAnnouncementTitle(e.target.value)}
                         />
                         <textarea 
                           placeholder="محتوى الإعلان..." 
                           className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none h-32 resize-none"
                           value={newAnnouncementContent}
                           onChange={e => setNewAnnouncementContent(e.target.value)}
                         ></textarea>
                         <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                 type="radio" 
                                 name="priority" 
                                 checked={newAnnouncementPriority === 'normal'}
                                 onChange={() => setNewAnnouncementPriority('normal')}
                                 className="text-primary"
                               />
                               <span className="text-sm text-gray-600 dark:text-gray-300">عادي</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                               <input 
                                 type="radio" 
                                 name="priority" 
                                 checked={newAnnouncementPriority === 'high'}
                                 onChange={() => setNewAnnouncementPriority('high')}
                                 className="text-red-500"
                               />
                               <span className="text-sm text-gray-600 dark:text-gray-300">هام جداً</span>
                            </label>
                         </div>
                         <button 
                           onClick={handleAddAnnouncement}
                           className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary/90 transition"
                         >
                            نشر الإعلان
                         </button>
                      </div>
                   </div>
                </div>
             )}
        </div>
    );
};

  // ... (Other render methods: renderGrades, renderAttendance, etc. logic is identical but uses state populated by firebase) ...
  // To save space, I will include the critical ones updated for async behaviour where needed
  // Since we use state that is auto-updated, the render logic doesn't actually change much!
  // I will just put the whole return structure back.

  const renderGrades = () => {
    // ADMIN VIEW
    if (currentUser?.role === UserRole.ADMIN) {
      return (
        <div className="space-y-6 p-4">
           {/* Header & Add Course Button */}
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                 <GraduationCap className="text-primary" size={24} />
                 إدارة المواد والدرجات
              </h2>
              <button 
                 onClick={() => {
                    setIsAddingCourse(true);
                    setEditingCourseId(null);
                    setNewCourseName('');
                    setCourseProfessors([]);
                    setNewAssessments([]);
                 }}
                 className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
              >
                 <Plus size={18} />
                 إضافة مادة
              </button>
           </div>

           {/* Add/Edit Course Modal */}
           {isAddingCourse && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingCourseId ? 'تعديل المادة' : 'إضافة مادة جديدة'}</h3>
                       <button onClick={() => setIsAddingCourse(false)}><X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                    </div>

                    <div className="space-y-4">
                       {/* Course Name */}
                       <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">اسم المادة</label>
                          <input 
                            type="text" 
                            value={newCourseName}
                            onChange={e => setNewCourseName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                            placeholder="مثال: رياضيات حاسوبية"
                          />
                       </div>

                       {/* Professors */}
                       <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">دكاترة المادة</label>
                          <div className="flex gap-2 mb-2">
                             <input 
                               type="text" 
                               value={tempProfName}
                               onChange={e => setTempProfName(e.target.value)}
                               className="flex-1 bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                               placeholder="د. فلان"
                             />
                             <button onClick={handleAddProf} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600">إضافة</button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {courseProfessors.map((prof, idx) => (
                                <span key={idx} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                   {prof}
                                   <button onClick={() => handleRemoveProf(idx)} className="text-blue-400 hover:text-blue-600"><X size={12}/></button>
                                </span>
                             ))}
                          </div>
                       </div>

                       {/* Assessments Config */}
                       <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">توزيع الدرجات (الامتحانات والواجبات)</label>
                          <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-3 mb-2">
                             <div className="grid grid-cols-3 gap-2">
                                <input 
                                  type="text" 
                                  placeholder="عنوان (مثال: ميدتيرم)" 
                                  className="col-span-1 bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none"
                                  value={newAssessmentName}
                                  onChange={e => setNewAssessmentName(e.target.value)}
                                />
                                <input 
                                  type="number" 
                                  placeholder="الدرجة" 
                                  className="col-span-1 bg-white dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none"
                                  value={newAssessmentScore}
                                  onChange={e => setNewAssessmentScore(e.target.value)}
                                />
                                <button onClick={handleAddAssessmentToNewCourse} className="col-span-1 bg-primary text-white rounded-lg text-xs font-bold">إضافة بند</button>
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                             {newAssessments.map(asm => (
                                <div key={asm.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl shadow-sm">
                                   <div>
                                      <p className="font-bold text-sm text-gray-800 dark:text-white">{asm.name}</p>
                                      <p className="text-xs text-gray-400">{asm.maxScore} درجة</p>
                                   </div>
                                   <button onClick={() => handleRemoveAssessmentFromNewCourse(asm.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6 border-t border-gray-100 dark:border-slate-700 pt-4">
                       <button onClick={() => setIsAddingCourse(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">إلغاء</button>
                       <button onClick={handleSaveCourse} className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90">حفظ المادة</button>
                    </div>
                 </div>
              </div>
           )}

           {/* Grade Editing Modal */}
           {isEditingGrades && selectedCourseForGrading && selectedAssessmentForGrading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                 <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-4">
                       <div>
                          <h3 className="font-bold text-lg text-gray-800 dark:text-white">رصد الدرجات: {selectedCourseForGrading.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAssessmentForGrading.name} (من {selectedAssessmentForGrading.maxScore})</p>
                       </div>
                       <button onClick={() => setIsEditingGrades(false)}><X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                       <table className="w-full text-right">
                          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-xs font-bold sticky top-0">
                             <tr>
                                <th className="p-3 rounded-r-xl">الطالب</th>
                                <th className="p-3">الدرجة</th>
                                <th className="p-3 rounded-l-xl">الحالة</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                             {appUsers.filter(u => u.role === UserRole.STUDENT && u.isOfficial).map(student => (
                                <tr key={student.uid}>
                                   <td className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition" onClick={() => handleViewProfile(student.uid)}>
                                      <img src={student.avatar} className="w-8 h-8 rounded-full" alt="" />
                                      <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{student.name}</span>
                                   </td>
                                   <td className="p-3">
                                      <input 
                                        type="number" 
                                        min="0" 
                                        max={selectedAssessmentForGrading.maxScore}
                                        value={tempGrades[student.uid] !== undefined ? tempGrades[student.uid] : ''}
                                        onChange={(e) => {
                                           const val = e.target.value === '' ? undefined : Math.min(parseInt(e.target.value) || 0, selectedAssessmentForGrading.maxScore);
                                           if (val !== undefined)
                                            setTempGrades({...tempGrades, [student.uid]: val});
                                           else {
                                              const newGrades = {...tempGrades};
                                              delete newGrades[student.uid];
                                              setTempGrades(newGrades);
                                           }
                                        }}
                                        className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg px-3 py-1 text-sm outline-none w-20 text-center font-bold"
                                      />
                                   </td>
                                   <td className="p-3">
                                      {tempGrades[student.uid] !== undefined ? (
                                         <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">تم الرصد</span>
                                      ) : (
                                         <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-md">--</span>
                                      )}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                       <button onClick={() => setIsEditingGrades(false)} className="px-4 py-2 text-gray-500 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl">إلغاء</button>
                       <button onClick={handleSaveGrades} className="px-6 py-2 bg-primary text-white font-bold text-sm rounded-xl shadow-lg hover:bg-primary/90 flex items-center gap-2">
                          <Save size={16} />
                          حفظ الدرجات
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {/* Course List */}
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => (
                 <div key={course.id} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden group">
                    <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex justify-between items-start">
                       <div>
                          <h3 className="font-bold text-gray-800 dark:text-white text-lg">{course.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.professors.join('، ')}</p>
                       </div>
                       <div className="flex gap-1">
                          <button onClick={() => handleStartEditCourse(course)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"><Edit3 size={16}/></button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                       </div>
                    </div>
                    
                    <div className="p-4 space-y-2">
                       <p className="text-xs font-bold text-gray-400 mb-2">بنود التقييم</p>
                       {course.assessments.map(asm => (
                          <div key={asm.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
                             <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{asm.name} <span className="text-gray-400 text-xs">({asm.maxScore})</span></span>
                             <button 
                                onClick={() => handleOpenGradeEditor(course, asm)}
                                className="text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:text-gray-300 px-3 py-1 rounded-lg transition font-bold shadow-sm"
                             >
                                رصد
                             </button>
                          </div>
                       ))}
                       {course.assessments.length === 0 && <p className="text-center text-xs text-gray-400 py-2">لا توجد بنود تقييم</p>}
                    </div>
                 </div>
              ))}
              {courses.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                    لم تقم بإضافة مواد دراسية بعد.
                 </div>
              )}
           </div>
        </div>
      );
    } 
    
    // STUDENT VIEW
    else {
      return (
        <div className="space-y-6 p-4">
           <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden mb-6">
              <div className="relative z-10">
                 <h2 className="text-2xl font-bold mb-2">سجل الدرجات 🎓</h2>
                 <p className="opacity-90 text-sm">تابع تحصيلك الدراسي ودرجاتك أولاً بأول.</p>
              </div>
           </div>

           <div className="grid gap-6 md:grid-cols-2">
              {courses.map(course => {
                 // Calculate Student Score
                 const studentGrades = grades.filter(g => g.courseId === course.id && g.studentId === currentUser?.uid);
                 const totalScore = studentGrades.reduce((acc, g) => acc + g.score, 0);
                 const maxPossible = course.assessments.reduce((acc, a) => acc + a.maxScore, 0);
                 const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

                 return (
                    <div key={course.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition duration-300">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <h3 className="font-bold text-gray-800 dark:text-white text-lg">{course.name}</h3>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.professors.join('، ')}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                             {percentage}%
                          </div>
                       </div>

                       <div className="space-y-3">
                          {course.assessments.map(asm => {
                             const grade = studentGrades.find(g => g.assessmentId === asm.id);
                             return (
                                <div key={asm.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                                   <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{asm.name}</span>
                                   <div className="flex items-center gap-1">
                                      <span className={`font-bold ${grade ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                                         {grade ? grade.score : '-'}
                                      </span>
                                      <span className="text-xs text-gray-400">/ {asm.maxScore}</span>
                                   </div>
                                </div>
                             );
                          })}
                          {course.assessments.length === 0 && <p className="text-center text-xs text-gray-400">لا توجد تفاصيل متاحة</p>}
                       </div>

                       <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">المجموع الكلي</span>
                          <span className="text-lg font-bold text-primary">{totalScore} <span className="text-xs text-gray-400">/ {maxPossible}</span></span>
                       </div>
                    </div>
                 );
              })}
              {courses.length === 0 && (
                 <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                    لا توجد مواد مسجلة لعرض الدرجات.
                 </div>
              )}
           </div>
        </div>
      );
    }
  };

  const renderAttendance = () => {
    // Admin View
    if (currentUser?.role === UserRole.ADMIN) {
        if (selectedSessionId) {
            // View specific session attendance
            const session = attendanceSessions.find(s => s.id === selectedSessionId);
            const course = courses.find(c => c.id === session?.courseId);
            const records = attendanceRecords.filter(r => r.sessionId === selectedSessionId);
            const presentCount = records.filter(r => r.status === 'PRESENT').length;
            const students = appUsers.filter(u => u.role === UserRole.STUDENT && u.isOfficial);

            return (
                <div className="space-y-6 p-4">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setSelectedSessionId(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                             <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                             <h2 className="text-xl font-bold text-gray-800 dark:text-white">{session?.title}</h2>
                             <p className="text-sm text-gray-500 dark:text-gray-400">{course?.name} - {session?.date}</p>
                        </div>
                        <div className="mr-auto bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
                            حضور: {presentCount} / {students.length}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="divide-y divide-gray-50 dark:divide-slate-700">
                             {students.map(student => {
                                 const record = records.find(r => r.studentId === student.uid);
                                 const isPresent = record?.status === 'PRESENT';
                                 
                                 return (
                                     <div key={student.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                         <div className="flex items-center gap-3">
                                              <img src={student.avatar} className="w-10 h-10 rounded-full" alt="" />
                                              <span className="font-bold text-gray-700 dark:text-gray-200">{student.name}</span>
                                         </div>
                                         <div className="flex gap-2">
                                              <button 
                                                onClick={() => handleMarkAttendance(student.uid, true)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${isPresent ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}
                                              >
                                                 حاضر
                                              </button>
                                              <button 
                                                onClick={() => handleMarkAttendance(student.uid, false)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${record && !isPresent ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-400'}`}
                                              >
                                                 غائب
                                              </button>
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>
            );
        }

        if (selectedCourseForAttendance) {
            // View sessions for a course
            const sessions = attendanceSessions.filter(s => s.courseId === selectedCourseForAttendance.id);
            
            return (
                <div className="space-y-6 p-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                             <button onClick={() => setSelectedCourseForAttendance(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                                 <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
                             </button>
                             <h2 className="text-xl font-bold text-gray-800 dark:text-white">سجلات الحضور: {selectedCourseForAttendance.name}</h2>
                        </div>
                        <button 
                          onClick={() => setIsAddingSession(true)}
                          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
                        >
                           <Plus size={18} />
                           محاضرة جديدة
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sessions.map(session => {
                             const records = attendanceRecords.filter(r => r.sessionId === session.id);
                             const presentCount = records.filter(r => r.status === 'PRESENT').length;
                             const studentsCount = appUsers.filter(u => u.role === UserRole.STUDENT && u.isOfficial).length;

                             return (
                                 <div key={session.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group" onClick={() => setSelectedSessionId(session.id)}>
                                     <div className="flex justify-between items-start mb-3">
                                         <div className="p-3 bg-primary/10 text-primary rounded-xl">
                                             <CalendarCheck size={24} />
                                         </div>
                                         <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
                                     </div>
                                     <h3 className="font-bold text-gray-800 dark:text-white text-lg">{session.title}</h3>
                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{session.date}</p>
                                     <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${studentsCount > 0 ? (presentCount / studentsCount) * 100 : 0}%` }}></div>
                                     </div>
                                     <div className="flex justify-between text-xs font-bold">
                                         <span className="text-green-600">{presentCount} حاضر</span>
                                         <span className="text-gray-400">{studentsCount} طالب</span>
                                     </div>
                                 </div>
                             );
                        })}
                        {sessions.length === 0 && (
                             <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                                 لا توجد محاضرات مسجلة لهذا الكورس.
                             </div>
                        )}
                    </div>

                    {/* Add Session Modal */}
                    {isAddingSession && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                                 <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">تسجيل محاضرة جديدة</h3>
                                 <div className="space-y-4">
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">تاريخ المحاضرة</label>
                                         <input 
                                           type="date" 
                                           value={newSessionDate}
                                           onChange={e => setNewSessionDate(e.target.value)}
                                           className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                                         />
                                     </div>
                                     <div>
                                         <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">عنوان (اختياري)</label>
                                         <input 
                                           type="text" 
                                           value={newSessionTitle}
                                           onChange={e => setNewSessionTitle(e.target.value)}
                                           placeholder="مثال: مقدمة في البرمجة"
                                           className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                                         />
                                     </div>
                                     <div className="flex gap-2 pt-2">
                                          <button onClick={() => setIsAddingSession(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm">إلغاء</button>
                                          <button onClick={handleCreateSession} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30">إنشاء</button>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Select Course View
        return (
            <div className="space-y-6 p-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="text-primary" size={24} />
                    إدارة الحضور والغياب
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map(course => (
                        <div key={course.id} onClick={() => setSelectedCourseForAttendance(course)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group">
                             <div className="flex items-center gap-4 mb-4">
                                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition">
                                     <BookOpen size={24} />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-gray-800 dark:text-white text-lg">{course.name}</h3>
                                     <p className="text-xs text-gray-500 dark:text-gray-400">{course.code}</p>
                                 </div>
                             </div>
                             <div className="flex justify-between items-center text-sm font-bold text-gray-400 group-hover:text-primary transition">
                                 <span>عرض السجلات</span>
                                 <ArrowRight size={18} className="rtl:rotate-180" />
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    } 
    
    // Student View
    else {
        return (
            <div className="space-y-6 p-4">
                 <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200 relative overflow-hidden mb-6">
                    <div className="relative z-10">
                       <h2 className="text-2xl font-bold mb-2">سجل الحضور 📅</h2>
                       <p className="opacity-90 text-sm">احرص على حضور المحاضرات بانتظام لتجنب الحرمان.</p>
                    </div>
                 </div>

                 <div className="grid gap-6 md:grid-cols-2">
                     {courses.map(course => {
                         const courseSessions = attendanceSessions.filter(s => s.courseId === course.id);
                         const studentRecords = attendanceRecords.filter(r => courseSessions.some(s => s.id === r.sessionId) && r.studentId === currentUser?.uid);
                         
                         const totalSessions = courseSessions.length;
                         const presentCount = studentRecords.filter(r => r.status === 'PRESENT').length;
                         const absentCount = studentRecords.filter(r => r.status === 'ABSENT').length; // Or calculated differently depending on business logic (unrecorded = absent?) -> For now explicit records
                         
                         // Assuming only explicit records count. If session exists but no record, maybe consider absent or pending. Let's assume explicit for now.
                         const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

                         return (
                             <div key={course.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                                 <div className="flex justify-between items-start mb-6">
                                     <div>
                                         <h3 className="font-bold text-gray-800 dark:text-white text-lg">{course.name}</h3>
                                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{course.code}</p>
                                     </div>
                                     <div className={`px-3 py-1 rounded-full text-xs font-bold ${attendancePercentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                         {attendancePercentage}% حضور
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-3 gap-4 mb-4">
                                     <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                                         <span className="block text-2xl font-bold text-gray-800 dark:text-white">{totalSessions}</span>
                                         <span className="text-xs text-gray-400">محاضرة</span>
                                     </div>
                                     <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-2xl">
                                         <span className="block text-2xl font-bold text-green-600">{presentCount}</span>
                                         <span className="text-xs text-green-400">حاضر</span>
                                     </div>
                                     <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                                         <span className="block text-2xl font-bold text-red-600">{absentCount}</span>
                                         <span className="text-xs text-red-400">غائب</span>
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                     {courses.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                           لا توجد مواد مسجلة.
                        </div>
                     )}
                 </div>
            </div>
        );
    }
  };

  const renderMaterials = () => {
    // If inside a specific section of a course
    if (activeMatCourse && activeMatSection) {
       const sectionMaterials = materials.filter(m => m.sectionId === activeMatSection.id);

       return (
           <div className="space-y-6 p-4">
               <div className="flex items-center gap-4 mb-6">
                   <button onClick={() => setActiveMatSection(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                       <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
                   </button>
                   <div>
                       <h2 className="text-xl font-bold text-gray-800 dark:text-white">{activeMatSection.title}</h2>
                       <p className="text-sm text-gray-500 dark:text-gray-400">{activeMatCourse.name}</p>
                   </div>
                   {currentUser?.role === UserRole.ADMIN && (
                       <button 
                         onClick={() => setIsAddingMaterial(true)}
                         className="mr-auto bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
                       >
                           <Upload size={18} />
                           رفع ملف
                       </button>
                   )}
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {sectionMaterials.map(mat => (
                       <div key={mat.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition group relative">
                           <div className="flex items-start gap-4">
                               <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-300 flex-shrink-0">
                                   {mat.type === 'PDF' && <FileText size={24} className="text-red-500" />}
                                   {mat.type === 'IMAGE' && <ImageIcon size={24} className="text-blue-500" />}
                                   {mat.type === 'LINK' && <LinkIcon size={24} className="text-green-500" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <h4 className="font-bold text-gray-800 dark:text-white truncate mb-1" title={mat.title}>{mat.title}</h4>
                                   <p className="text-xs text-gray-400">{new Date(mat.uploadDate).toLocaleDateString('ar-EG')}</p>
                                   <a 
                                     href={mat.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                   >
                                       {mat.type === 'LINK' ? 'فتح الرابط' : 'تحميل الملف'}
                                       <ArrowRight size={12} className="rtl:rotate-180" />
                                   </a>
                               </div>
                               {currentUser?.role === UserRole.ADMIN && (
                                   <button onClick={() => handleDeleteMaterialItem(mat.id)} className="text-gray-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                               )}
                           </div>
                       </div>
                   ))}
                   {sectionMaterials.length === 0 && (
                       <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                           لا توجد ملفات في هذا القسم.
                       </div>
                   )}
               </div>

               {/* Add Material Modal */}
               {isAddingMaterial && (
                   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                       <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                           <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">إضافة ملف جديد</h3>
                           <div className="space-y-4">
                               <div>
                                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">عنوان الملف</label>
                                   <input 
                                     type="text" 
                                     value={newMatTitle}
                                     onChange={e => setNewMatTitle(e.target.value)}
                                     className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                                     placeholder="مثال: المحاضرة الأولى"
                                   />
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">نوع الملف</label>
                                   <div className="flex gap-2">
                                       {(['PDF', 'IMAGE', 'LINK'] as const).map(t => (
                                           <button 
                                             key={t}
                                             onClick={() => setNewMatType(t)}
                                             className={`flex-1 py-2 rounded-xl text-xs font-bold border ${newMatType === t ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-600'}`}
                                           >
                                               {t}
                                           </button>
                                       ))}
                                   </div>
                               </div>
                               <div>
                                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">الرابط (URL)</label>
                                   <input 
                                     type="text" 
                                     value={newMatUrl}
                                     onChange={e => setNewMatUrl(e.target.value)}
                                     className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                                     placeholder="https://..."
                                   />
                               </div>
                               <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddingMaterial(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm">إلغاء</button>
                                    <button onClick={handleAddMaterialItem} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30">إضافة</button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
           </div>
       );
    }

    // If inside a course (List Sections)
    if (activeMatCourse) {
        const sections = materialSections.filter(s => s.courseId === activeMatCourse.id);

        return (
            <div className="space-y-6 p-4">
               <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveMatCourse(null)} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                             <ChevronLeft size={20} className="rtl:rotate-180 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{activeMatCourse.name}</h2>
                    </div>
                    {currentUser?.role === UserRole.ADMIN && (
                        <button 
                          onClick={() => setIsAddingSection(true)}
                          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2"
                        >
                           <FolderPlus size={18} />
                           مجلد جديد
                        </button>
                    )}
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                   {sections.map(section => (
                       <div key={section.id} onClick={() => setActiveMatSection(section)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group text-center relative">
                           {currentUser?.role === UserRole.ADMIN && (
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                                 className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                               >
                                   <Trash2 size={16} />
                               </button>
                           )}
                           <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition">
                               <Folder size={32} fill="currentColor" className="text-amber-400" />
                           </div>
                           <h3 className="font-bold text-gray-800 dark:text-white text-lg">{section.title}</h3>
                           <p className="text-xs text-gray-400 mt-1">{materials.filter(m => m.sectionId === section.id).length} ملفات</p>
                       </div>
                   ))}
                   {sections.length === 0 && (
                       <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 border-dashed">
                           لا توجد مجلدات في هذه المادة.
                       </div>
                   )}
               </div>

               {/* Add Section Modal */}
               {isAddingSection && (
                   <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                       <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                           <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">إنشاء مجلد جديد</h3>
                           <div className="space-y-4">
                               <div>
                                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">اسم المجلد</label>
                                   <input 
                                     type="text" 
                                     value={newSectionName}
                                     onChange={e => setNewSectionName(e.target.value)}
                                     className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none"
                                     placeholder="مثال: المحاضرة، الكتب، المراجع"
                                   />
                               </div>
                               <div className="flex gap-2 pt-2">
                                    <button onClick={() => setIsAddingSection(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-xl font-bold text-sm">إلغاء</button>
                                    <button onClick={handleAddMaterialSection} className="flex-1 bg-primary text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30">إنشاء</button>
                               </div>
                           </div>
                       </div>
                   </div>
               )}
            </div>
        );
    }

    // Default: List Courses
    return (
        <div className="space-y-6 p-4">
             <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-200 relative overflow-hidden mb-6">
                <div className="relative z-10">
                   <h2 className="text-2xl font-bold mb-2">المحاضرات والمراجع 📚</h2>
                   <p className="opacity-90 text-sm">تصفح وحمل جميع المواد الدراسية بسهولة.</p>
                </div>
             </div>

             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {courses.map(course => (
                     <div key={course.id} onClick={() => setActiveMatCourse(course)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition cursor-pointer group">
                          <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center group-hover:scale-110 transition">
                                  <BookOpen size={24} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{course.name}</h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.code}</p>
                              </div>
                          </div>
                          <div className="flex justify-between items-center text-sm font-bold text-gray-400 group-hover:text-primary transition">
                              <span>تصفح الملفات</span>
                              <ArrowRight size={18} className="rtl:rotate-180" />
                          </div>
                     </div>
                 ))}
                 {courses.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500">
                       لا توجد مواد دراسية.
                    </div>
                 )}
             </div>
        </div>
    );
  };

  const renderChat = () => (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mx-4 my-4">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
               <Users size={20} />
            </div>
            <div>
               <h3 className="font-bold text-gray-800 dark:text-white">محادثة الدفعة</h3>
               <p className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {appUsers.length} عضو نشط
               </p>
            </div>
         </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900">
         {chatMessages.length > 0 ? chatMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            const isAdmin = msg.senderRole === UserRole.ADMIN;
            
            return (
               <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group/msg`}>
                  <div 
                     onClick={() => handleViewProfile(msg.senderId)}
                     className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 relative cursor-pointer hover:opacity-80 transition
                     ${isAdmin ? 'bg-primary' : 'bg-gray-400'}
                  `} style={msg.senderColor ? { backgroundColor: msg.senderColor } : {}}>
                     {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} className="w-full h-full rounded-full object-cover" alt="" />
                     ) : (
                        msg.senderName.charAt(0)
                     )}
                     {isAdmin && <span className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full border border-white"><CheckCircle size={8} /></span>}
                  </div>

                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                     <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 cursor-pointer hover:underline" onClick={() => handleViewProfile(msg.senderId)}>{msg.senderName}</span>
                        {isAdmin && <span className="bg-primary/10 text-primary text-[8px] px-1.5 py-0.5 rounded-full font-bold">مشرف</span>}
                        <span className="text-[10px] text-gray-300">{new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>

                     {/* Reply Bubble */}
                     <div 
                        onClick={() => !isMe && setReplyingTo(msg)}
                        className={`
                           p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group cursor-pointer transition-all hover:brightness-95
                           ${isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-slate-700'}
                        `}
                        style={isMe && msg.senderColor ? { backgroundColor: msg.senderColor } : {}}
                     >
                        {/* Quoted Reply */}
                        {msg.replyTo && (
                           <div 
                              onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo!.id); }}
                              className={`text-xs mb-2 p-2 rounded-lg border-r-2 border-white/30 bg-black/10 flex flex-col cursor-pointer hover:bg-black/20 transition`}
                           >
                              <span className="font-bold opacity-80 mb-0.5">{msg.replyTo.senderName}</span>
                              <span className="opacity-70 truncate">{msg.replyTo.content}</span>
                           </div>
                        )}

                        {msg.content}

                        {currentUser?.role === UserRole.ADMIN && !isMe && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                             className="absolute -left-8 top-2 p-1.5 bg-white text-red-400 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition hover:text-red-600"
                           >
                              <Trash2 size={12} />
                           </button>
                        )}
                        {!isMe && (
                           <button
                             onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                             className="absolute -right-8 top-2 p-1.5 bg-white text-gray-400 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition hover:text-primary"
                             title="رد على الرسالة"
                           >
                              <Reply size={12} />
                           </button>
                        )}
                     </div>
                  </div>
               </div>
            );
         }) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <MessageSquare size={48} className="mb-4 opacity-20" />
               <p className="text-sm">لا توجد رسائل في المحادثة حتى الآن</p>
            </div>
         )}
         <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
         {/* Reply Preview */}
         {replyingTo && (
            <div className="mb-2 bg-gray-50 dark:bg-slate-700 border-r-4 border-primary p-2 rounded-r-lg flex justify-between items-center animate-in slide-in-from-bottom-2">
               <div className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-bold block mb-1">الرد على {replyingTo.senderName}</span>
                  <span className="truncate block opacity-70">{replyingTo.content}</span>
               </div>
               <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-red-500">
                  <X size={16} />
               </button>
            </div>
         )}
         
         <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-gray-50 dark:bg-slate-700 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-primary/20 transition">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`اكتب رسالتك هنا... (استخدم @ للمنشن)`} 
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none dark:text-white"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition"
            >
               <Send size={18} className="rtl:rotate-180" />
            </button>
         </form>
      </div>
    </div>
  );

  const renderStudentManagement = () => {
    // Only show Official Students (added by admin) in the management list
    const students = appUsers.filter(u => u.role === UserRole.STUDENT && u.isOfficial);

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
           <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
               <Users className="text-primary" size={24} />
               إدارة الطلاب
           </h2>
        </div>

        {/* Add Student Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
           <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <UserPlus size={18} />
              إضافة طالب جديد
           </h3>
           <div className="flex items-end gap-3">
              <div className="flex-1">
                 <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">الاسم الثلاثي</label>
                 <input 
                   type="text" 
                   value={newStudentName}
                   onChange={e => setNewStudentName(e.target.value)}
                   className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none"
                   placeholder="أحمد علي..."
                 />
              </div>
              <button 
                onClick={handleAddStudent}
                className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-primary/20 h-10"
              >
                 إضافة
              </button>
           </div>
           <p className="text-[10px] text-gray-400 mt-2">* الطلاب المضافين هنا يظهرون في قوائم الدرجات فقط ولا يملكون حسابات دخول.</p>
        </div>

        {/* Student List */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
           <div className="p-5 border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
             <h3 className="font-bold text-gray-800 dark:text-white">قائمة الطلاب ({students.length})</h3>
           </div>
           <div>
             {students.length > 0 ? (
               <div className="divide-y divide-gray-50 dark:divide-slate-700">
                  {students.map(student => (
                     <div key={student.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleViewProfile(student.uid)}>
                           <img src={student.avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-slate-600" alt="" />
                           <div>
                              <p className="font-bold text-sm text-gray-800 dark:text-white group-hover:text-primary transition">{student.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                 <span className="bg-green-100 text-green-600 px-2 rounded font-medium">طالب نظامي</span>
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(student.uid)}
                          className="text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-xl transition"
                          title="حذف الطالب"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  ))}
               </div>
             ) : (
               <div className="text-center py-10 text-gray-400 text-sm">
                 لا يوجد طلاب مضافين حتى الآن
               </div>
             )}
           </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const userToDisplay = viewingUserProfile || currentUser;
    if (!userToDisplay) return null;

    const isOwnProfile = currentUser?.uid === userToDisplay.uid;

    if (isEditingProfile && isOwnProfile) {
      return (
        <div className="space-y-6 p-4">
           {/* Edit Mode UI */}
           <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="relative h-48 bg-gray-200 dark:bg-slate-700">
                 {editBanner ? (
                    <img src={editBanner} className="w-full h-full object-cover" alt="Banner" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                       <ImageIcon size={48} />
                    </div>
                 )}
                 <button 
                   onClick={() => fileInputRefBanner.current?.click()}
                   className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                 >
                    <Camera size={20} />
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRefBanner} 
                   hidden 
                   accept="image/*"
                   onChange={(e) => handleFileUpload(e, 'banner')}
                 />
              </div>

              <div className="px-6 pb-6">
                 <div className="relative -mt-16 mb-4 flex justify-between items-end">
                    <div className="relative">
                       <img 
                         src={editAvatar} 
                         className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 object-cover bg-white" 
                         alt="Avatar" 
                       />
                       <button 
                         onClick={() => fileInputRefAvatar.current?.click()}
                         className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition shadow-lg"
                       >
                          <Camera size={16} />
                       </button>
                       <input 
                         type="file" 
                         ref={fileInputRefAvatar} 
                         hidden 
                         accept="image/*"
                         onChange={(e) => handleFileUpload(e, 'avatar')}
                       />
                    </div>
                 </div>

                 <div className="space-y-4 max-w-lg">
                    <div>
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">النبذة التعريفية (Bio)</label>
                       <textarea 
                         value={editBio}
                         onChange={(e) => setEditBio(e.target.value)}
                         className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm outline-none resize-none h-24"
                         placeholder="اكتب شيئاً عن نفسك..."
                       />
                    </div>

                    <div>
                       <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">لون التوقيع</label>
                       <div className="flex gap-2 flex-wrap">
                          {['#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'].map(color => (
                             <button
                               key={color}
                               onClick={() => setEditColor(color)}
                               className={`w-8 h-8 rounded-full border-2 transition ${editColor === color ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                               style={{ backgroundColor: color }}
                             />
                          ))}
                       </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                       <button 
                         onClick={() => setIsEditingProfile(false)}
                         className="px-6 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                       >
                          إلغاء
                       </button>
                       <button 
                         onClick={handleSaveProfile}
                         disabled={isUploading}
                         className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-50"
                       >
                          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                          حفظ التغييرات
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-4">
         {/* Profile Header */}
         <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative group">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
               {userToDisplay.banner && (
                  <img src={userToDisplay.banner} className="w-full h-full object-cover absolute inset-0" alt="Banner" />
               )}
               {isOwnProfile && (
                  <button 
                    onClick={() => {
                       setEditBio(currentUser?.bio || '');
                       setEditBanner(currentUser?.banner || '');
                       setEditAvatar(currentUser?.avatar || '');
                       setEditColor(currentUser?.signatureColor || '#64748b');
                       setIsEditingProfile(true);
                    }}
                    className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/30 transition shadow-sm border border-white/30"
                  >
                     <Edit3 size={20} />
                  </button>
               )}
            </div>
            
            <div className="px-6 pb-6">
               <div className="relative -mt-16 mb-4 flex justify-between items-end">
                  <img 
                    src={userToDisplay.avatar} 
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 object-cover bg-white shadow-md" 
                    alt="Avatar" 
                  />
                  {userToDisplay.signatureColor && (
                     <div className="mb-2 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: userToDisplay.signatureColor }}>
                        {userToDisplay.role === UserRole.ADMIN ? 'مشرف النظام' : 'طالب'}
                     </div>
                  )}
               </div>
               
               <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                     {userToDisplay.name}
                     {userToDisplay.role === UserRole.ADMIN && <CheckCircle className="text-primary" size={20} />}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">@{userToDisplay.username || 'user'}</p>
                  
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                     <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed italic">
                        "{userToDisplay.bio || 'لا توجد نبذة تعريفية.'}"
                     </p>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Theme Selector (Only for own profile) */}
         {isOwnProfile && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
               <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Palette className="text-primary" size={20} />
                  تخصيص المظهر
               </h3>
               <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-500 dark:text-gray-400">لون التطبيق الأساسي</label>
                     <ThemeSelector currentTheme={theme} onChange={setTheme} />
                  </div>
                  
                  <div className="h-8 w-px bg-gray-100 dark:bg-slate-700 hidden md:block"></div>

                  <div className="space-y-2">
                     <label className="text-sm font-bold text-gray-500 dark:text-gray-400">الوضع الليلي</label>
                     <button 
                       onClick={() => setIsDarkMode(!isDarkMode)}
                       className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                     >
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        <span className="text-sm font-bold">{isDarkMode ? 'مفعل' : 'معطل'}</span>
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         {/* Admin Controls (Only if current user is admin and looking at own profile) */}
         {isOwnProfile && currentUser.role === UserRole.ADMIN && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
               <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={20} />
                  لوحة تحكم المشرف
               </h3>
               
               <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                     <h4 className="font-bold text-yellow-700 dark:text-yellow-500 mb-2 text-sm">ترقية مستخدم إلى مشرف</h4>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="اسم المستخدم (username)" 
                          value={promoteUsername} 
                          onChange={e => setPromoteUsername(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-700 border border-yellow-200 dark:border-yellow-900/50 rounded-lg px-3 py-2 text-sm outline-none dark:text-white"
                        />
                        <button onClick={handlePromoteUser} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-600 transition">ترقية</button>
                     </div>
                  </div>

                  <button 
                    onClick={() => setIsAddingAdmin(true)}
                    className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition flex items-center justify-center gap-2"
                  >
                     <UserPlus size={18} />
                     إضافة حساب مشرف جديد
                  </button>
               </div>
            </div>
         )}
      </div>
    );
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 text-primary">
         <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={() => {}} onSignup={() => {}} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      user={currentUser}
      onLogout={handleLogout}
    >
      {activeTab === Tab.HOME && renderHome()}
      {activeTab === Tab.GRADES && renderGrades()}
      {activeTab === Tab.ATTENDANCE && renderAttendance()}
      {activeTab === Tab.MATERIALS && renderMaterials()}
      {activeTab === Tab.CHAT && renderChat()}
      {activeTab === Tab.STUDENTS && renderStudentManagement()}
      {activeTab === Tab.PROFILE && renderProfile()}

      {/* Add Admin Modal */}
      {isAddingAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">إضافة مشرف جديد</h3>
                    <button onClick={() => setIsAddingAdmin(false)}><X size={20} className="text-gray-400 dark:text-gray-500" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">الاسم</label>
                        <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">اسم المستخدم</label>
                        <input type="text" value={newAdminUsername} onChange={e => setNewAdminUsername(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">كلمة المرور</label>
                        <input type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-2 text-sm outline-none" />
                    </div>
                    <button onClick={handleAddAdmin} className="w-full bg-primary text-white font-bold py-3 rounded-xl mt-2 hover:bg-primary/90">إنشاء الحساب</button>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}