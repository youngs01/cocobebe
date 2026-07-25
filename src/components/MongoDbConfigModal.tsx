import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Key, RefreshCw, X } from 'lucide-react';
import { DbStatus } from '../types';

interface MongoDbConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatus;
  onRefreshDbStatus: () => void;
}

export const MongoDbConfigModal: React.FC<MongoDbConfigModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  onRefreshDbStatus,
}) => {
  const [dbPassword, setDbPassword] = useState('Cocobebekinder1980');
  const [customUri, setCustomUri] = useState(
    'mongodb+srv://sinhan2023_db_user:Cocobebekinder1980@cluster0.auyca0i.mongodb.net/?appName=Cluster0'
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let finalUri = customUri;
    if (dbPassword) {
      finalUri = customUri.replace('<db_password>', encodeURIComponent(dbPassword));
    }

    try {
      const res = await fetch('/api/db/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: finalUri }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        onRefreshDbStatus();
      } else {
        setMessage({ type: 'error', text: data.message || '데이터베이스 연결 실패' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: '서버 통신 실패: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">MongoDB 서버 데이터베이스 연동</h3>
              <p className="text-xs text-slate-400">코코베베 어린이집 클라우드 DB 연결 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              dbStatus.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {dbStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">
                {dbStatus.connected
                  ? 'MongoDB 데이터베이스 정상 연결 중'
                  : '로컬 데이터베이스 가동 중 (MongoDB 연결 필요)'}
              </p>
              <p className="text-slate-600">
                연결 정보: <code className="bg-white/80 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[11px]">{dbStatus.connectionString}</code>
              </p>
              {dbStatus.error && (
                <p className="text-amber-700 font-medium">오류 메시지: {dbStatus.error}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MongoDB Cluster 연결 URI
              </label>
              <input
                type="text"
                value={customUri}
                onChange={(e) => setCustomUri(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                placeholder="mongodb+srv://..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                DB 사용자 비밀번호 (&lt;db_password&gt;에 치환)
              </label>
              <input
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                placeholder="Database User Password 입력"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                비밀번호 입력 시 URI의 <code>&lt;db_password&gt;</code> 부분이 자동으로 치환되어 안전하게 접속을 시도합니다.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    연결 검증 중...
                  </>
                ) : (
                  'DB 연결 시도'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
