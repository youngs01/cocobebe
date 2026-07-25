import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, adminPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setErrorMsg('');
          onLoginSuccess();
          onClose();
          setAdminId('');
          setAdminPassword('');
        } else {
          setErrorMsg(data.message || '아이디 또는 비밀번호가 올바르지 않습니다.');
        }
      } else {
        // Fallback validation if server route not available
        if (adminId === 'cocobebe' && adminPassword === 'Dbsgofks03!') {
          setErrorMsg('');
          onLoginSuccess();
          onClose();
          setAdminId('');
          setAdminPassword('');
        } else {
          setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
      }
    } catch {
      // Offline fallback
      if (adminId === 'cocobebe' && adminPassword === 'Dbsgofks03!') {
        setErrorMsg('');
        onLoginSuccess();
        onClose();
        setAdminId('');
        setAdminPassword('');
      } else {
        setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 mx-auto flex items-center justify-center mb-3 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">원장 / 관리자 로그인</h3>
          <p className="text-xs text-slate-500 mt-1">
            코코베베 어린이집 교직원 및 연차 통합 관리자 인증
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">관리자 아이디</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="관리자 아이디 입력"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">비밀번호</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium text-slate-800"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            {isSubmitting ? '인증 확인 중...' : '관리자 인증 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};
