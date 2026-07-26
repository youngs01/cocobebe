import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, LogIn, Building2, KeyRound, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  dbConnected: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, dbConnected }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패하였습니다.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        
        {/* Logo & Header Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[#718355] text-white flex items-center justify-center mx-auto shadow-md shadow-[#718355]/20">
            <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#344E41] tracking-tight">코코베베 어린이집</h1>
          <p className="text-[10px] sm:text-xs text-[#718355] font-semibold">근로기준법 준수 법정연차 관리 시스템</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E9EDC9] shadow-md p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-[#E9EDC9] pb-3 sm:pb-4">
            <h2 className="text-sm sm:text-base font-bold text-[#344E41] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#718355]" />
              시스템 로그인
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              dbConnected ? 'bg-[#F1F3E9] text-[#718355] border border-[#E9EDC9]' : 'bg-amber-50 text-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-[#718355]' : 'bg-amber-500'}`} />
              {dbConnected ? 'Neon DB 서버 연동됨' : '로컬 연결 중'}
            </span>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#344E41] block">
                아이디 (ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A3B18A]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full pl-10 pr-4 py-3 bg-[#FDFCF8] border border-[#E9EDC9] rounded-2xl text-xs text-[#344E41] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#718355] transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#344E41] block">
                비밀번호 (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A3B18A]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-4 py-3 bg-[#FDFCF8] border border-[#E9EDC9] rounded-2xl text-xs text-[#344E41] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#718355] transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#718355] hover:bg-[#5f6f45] text-white font-bold text-sm rounded-2xl shadow-md shadow-[#718355]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>로그인 확인 중...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인하기</span>
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-[#718355] text-center leading-relaxed">
            * DB 서버에 등록된 원장, 관리자 및 교사 계정 정보로 안전하게 로그인할 수 있습니다.
          </p>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#A3B18A]">
          대한민국 근로기준법 제60조 법정연차 규정 준수 • 코코베베 어린이집
        </p>

      </div>
    </div>
  );
};
