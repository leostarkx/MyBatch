import React from 'react';
import { Database, Shield, Smartphone, Server, Layers } from 'lucide-react';

const ArchitectureDocs: React.FC = () => {
  return (
    <div className="p-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-l from-blue-50 to-white border-r-4 border-blue-500 p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-blue-900 mb-2">خطة هيكلة النظام</h2>
        <p className="text-sm text-blue-800 leading-relaxed">
          المواصفات التقنية المقترحة لنظام "دفعتي" لإدارة الدفعة الجامعية بكفاءة عالية.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Smartphone size={20} /></div>
             التقنيات المقترحة
          </h3>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-sm space-y-3 hover:shadow-md transition">
            <p><strong>الواجهة الأمامية (Frontend):</strong> نقترح استخدام <span className="text-primary font-bold">Flutter</span> لبناء تطبيق موبايل يعمل على Android و iOS بكود واحد وأداء عالي.</p>
            <p><strong>الواجهة الخلفية (Backend):</strong> <span className="text-orange-600 font-bold">Firebase</span> هو الخيار الأمثل لتطبيقات الدفعات بسبب قواعد البيانات الحية (Realtime DB) للدردشة والمصادقة السهلة.</p>
            <p><strong>لوحة تحكم الأدمن:</strong> يفضل استخدام React.js لسهولة إدارة البيانات من الكمبيوتر.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
             <div className="p-2 bg-primary/10 rounded-lg text-primary"><Shield size={20} /></div>
             الأمان والصلاحيات
          </h3>
          <ul className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-sm space-y-3 hover:shadow-md transition">
            <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✔</span>
                <span><strong>المصادقة:</strong> استخدام Firebase Auth (بريد إلكتروني + كلمة مرور).</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✔</span>
                <span><strong>إدارة الأدوار:</strong> استخدام Custom Claims لتعيين المشرفين (`admin: true`).</span>
            </li>
            <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✔</span>
                <span><strong>خصوصية البيانات:</strong> الطالب يرى درجاته فقط من خلال قواعد أمان Firestore (Rules).</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Database size={20} /></div>
            هيكلة قاعدة البيانات (Firestore)
        </h3>
        <div className="bg-slate-900 text-blue-100 p-6 rounded-2xl text-xs font-mono overflow-x-auto shadow-xl" dir="ltr">
          <pre>{`
users/
  {uid}: { role: 'student', name: 'Student Name', email: '...' }

grades/
  {gradeId}: { 
    studentId: 'ref_user', 
    courseId: 'ref_course', 
    score: 85, 
    type: 'Midterm' 
  }
  // Security Rule: request.auth.uid == resource.data.studentId

materials/
  {matId}: { courseId: '...', url: '...', type: 'pdf' }

chat/
  {msgId}: { sender: '...', content: '...', ts: 12345 }
          `}</pre>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-800">
             <div className="p-2 bg-primary/10 rounded-lg text-primary"><Layers size={20} /></div>
             استراتيجية النشر
        </h3>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 text-sm space-y-3">
          <p><strong>مرحلة الاختبار:</strong> توزيع التطبيق عبر Firebase App Distribution لمجموعة من الطلبة لتجربته.</p>
          <p><strong>الإطلاق الرسمي:</strong> رفع التطبيق على متجر Google Play (Private Organization App) وتوزيع نسخة iOS عبر TestFlight أو رابط مباشر (Enterprise).</p>
        </div>
      </section>

      <div className="text-center pt-8 pb-4 text-slate-400 text-xs">
        تم تصميم هذا النظام ليتناسب مع المتطلبات الجامعية الحديثة
      </div>
    </div>
  );
};

export default ArchitectureDocs;