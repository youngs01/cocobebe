import React, { useState } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  Send,
  Calendar,
} from 'lucide-react';
import { LeaveRequest } from '../types';
import { LEAVE_TYPE_LABELS } from '../utils/leaveCalculator';

interface LeaveApprovalCenterProps {
  leaveRequests: LeaveRequest[];
  onApprove: (id: string, approvedBy: string) => void;
  onReject: (id: string, approvedBy: string, reason: string) => void;
  currentStaffName: string;
}

export const LeaveApprovalCenter: React.FC<LeaveApprovalCenterProps> = ({
  leaveRequests,
  onApprove,
  onReject,
  currentStaffName,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectingReq, setRejectingReq] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRequests = leaveRequests.filter((req) => req.status === activeTab);

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'rejected').length;

  const handleConfirmReject = () => {
    if (rejectingReq) {
      onReject(rejectingReq.id, `${currentStaffName} (원장)`, rejectReason || '행정 및 교사 인력 운영 사유로 인한 반려');
      setRejectingReq(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              관리자 결재 시스템
            </span>
            <span className="text-xs text-slate-500">원장/관리자 전용</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">교직원 휴가 신청 승인 및 결재 센터</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            교사들이 신청한 연차, 반차, 병가 항목을 검토하고 승인 또는 사유를 입력하여 반려 처리합니다.
          </p>
        </div>

        {/* Tab Badges */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            결재 대기
            <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            승인 내역
            <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            반려 내역
            <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
              {rejectedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Requests List Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">해당하는 결재 건이 없습니다.</h3>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'pending'
              ? '현재 새로 들어온 연차 결재 대기건이 없습니다.'
              : '해당 내역이 존재하지 않습니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-amber-300 transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm">
                    {req.staffName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{req.staffName} 교사</h4>
                    <p className="text-xs text-slate-500">
                      {req.staffRole} | {req.className}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    req.type === 'annual'
                      ? 'bg-amber-100 text-amber-900'
                      : req.type.startsWith('half')
                      ? 'bg-indigo-100 text-indigo-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {LEAVE_TYPE_LABELS[req.type] || req.type}
                </span>
              </div>

              {/* Leave Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> 신청 기간
                  </span>
                  <span className="font-bold text-slate-900">
                    {req.startDate} ~ {req.endDate} ({req.daysCount}일 사용)
                  </span>
                </div>

                {req.substituteTeacherName && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-slate-500">인수인계 교사</span>
                    <span className="font-semibold text-emerald-700">
                      {req.substituteTeacherName} 교사
                    </span>
                  </div>
                )}

                <div className="pt-1 text-slate-600">
                  <span className="font-semibold text-slate-700 block mb-0.5">신청 사유:</span>
                  <p className="bg-white p-2 rounded border border-slate-200 text-slate-800">
                    {req.reason}
                  </p>
                </div>
              </div>

              {/* Status or Actions */}
              {req.status === 'pending' ? (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setRejectingReq(req)}
                    className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    반려 처리
                  </button>
                  <button
                    onClick={() => onApprove(req.id, `${currentStaffName} (원장)`)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    최종 승인
                  </button>
                </div>
              ) : (
                <div className="text-xs pt-2 border-t border-slate-100 flex justify-between items-center text-slate-500">
                  <span>결재자: {req.approvedBy || '원장'}</span>
                  <span className="font-mono text-[11px]">{req.approvedAt}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              {rejectingReq.staffName} 교사 휴가 반려 사유 입력
            </h3>
            <p className="text-xs text-slate-500">
              교사에게 전송될 반려 사유를 작성하세요. 입력된 내용은 알림함으로 즉시 발송됩니다.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                반려 사유 (필수)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="예: 해당 날짜 원내 행사 준비로 인해 일정 조정 필요"
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                반려 확정 및 알림 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
