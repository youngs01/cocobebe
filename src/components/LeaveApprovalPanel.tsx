import React, { useState } from 'react';
import { LeaveRequest, User } from '../types';
import { CheckCircle2, XCircle, RotateCcw, Clock, AlertTriangle, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';

interface LeaveApprovalPanelProps {
  leaveRequests: LeaveRequest[];
  currentUser: User;
  onApprove: (requestId: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onCancelApproved: (requestId: string) => Promise<void>;
  isProcessing: boolean;
}

export const LeaveApprovalPanel: React.FC<LeaveApprovalPanelProps> = ({
  leaveRequests,
  currentUser,
  onApprove,
  onReject,
  onCancelApproved,
  isProcessing
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'processed'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const filteredRequests = leaveRequests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    if (filter === 'processed') return r.status === 'rejected' || r.status === 'cancelled';
    return true;
  });

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;

  const formatDate = (d?: string | null) => {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    try { return new Date(d as any).toISOString().split('T')[0]; } catch { return '' }
  };

  const handleConfirmReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해 주세요.');
      return;
    }
    await onReject(id, rejectionReason);
    setRejectingId(null);
    setRejectionReason('');
  };

  const getLeaveTypeBadge = (type: string) => {
    switch (type) {
      case 'annual': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">연차</span>;
      case 'half_am': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">오전반차 (0.5일)</span>;
      case 'half_pm': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-200">오후반차 (0.5일)</span>;
      case 'sick': return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">병가</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300"><Clock className="w-3 h-3" /> 승인 대기</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> 승인 완료 (연차 차감)</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300"><XCircle className="w-3 h-3 text-rose-600" /> 반려됨</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300"><RotateCcw className="w-3 h-3 text-slate-500" /> 승인 취소 (연차 복원완료)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Info Banner */}
      <div className="bg-[#718355] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#E9EDC9]" />
            <h2 className="text-lg font-bold">어린이집 교사 연차 결재 & 승인 관리</h2>
          </div>
          <p className="text-xs text-[#E9EDC9] mt-1">
            원장({currentUser.role === 'director' ? currentUser.name : '박윤희'}) 및 관리자 전용 • 승인 취소 시 남은 연차가 자동 복원됩니다.
          </p>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2 border border-white/20 text-center">
            <span className="text-xs text-[#E9EDC9] block font-medium">승인 대기</span>
            <span className="text-xl font-black text-amber-200">{pendingCount}건</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2 border border-white/20 text-center">
            <span className="text-xs text-[#E9EDC9] block font-medium">승인 완료</span>
            <span className="text-xl font-black text-emerald-200">{approvedCount}건</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E9EDC9] pb-2 text-xs">
        {[
          { id: 'all', label: `전체 (${leaveRequests.length})` },
          { id: 'pending', label: `승인 대기중 (${pendingCount})` },
          { id: 'approved', label: `승인 완료 (${approvedCount})` },
          { id: 'processed', label: '취소/반려 이력' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? 'bg-[#718355] text-white shadow-xs'
                : 'bg-[#F1F3E9] text-[#344E41] hover:bg-[#E9EDC9]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E9EDC9] p-8 text-center text-[#A3B18A] text-xs">
            해당하는 연차 결재 요청이 없습니다.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl border transition-all p-4 space-y-3 shadow-xs ${
                req.status === 'pending'
                  ? 'border-[#718355] ring-2 ring-[#718355]/20 bg-[#F1F3E9]/30'
                  : 'border-[#E9EDC9]'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#F1F3E9] border border-[#E9EDC9] flex items-center justify-center text-[#718355] font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4 text-[#718355]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#344E41] text-sm">{req.user_name} 교사</span>
                      <span className="text-xs text-[#718355] bg-[#F1F3E9] px-2 py-0.5 rounded">{req.department}</span>
                      {getLeaveTypeBadge(req.leave_type)}
                    </div>
                    <span className="text-[11px] text-[#A3B18A]">신청일: {new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Leave Details Box */}
              <div className="bg-[#FDFCF8] rounded-xl p-3 border border-[#E9EDC9] text-xs grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-[#A3B18A] text-[11px] block">신청 기간</span>
                  <span className="font-bold text-[#344E41]">{formatDate(req.start_date)} ~ {formatDate(req.end_date)}</span>
                </div>
                <div>
                  <span className="text-[#A3B18A] text-[11px] block">차감 예정 일수</span>
                  <span className="font-black text-[#718355]">{req.requested_days}일</span>
                </div>
                <div>
                  <span className="text-[#A3B18A] text-[11px] block">사유</span>
                  <span className="text-[#344E41]">{req.reason || '사유 미기재'}</span>
                </div>
              </div>

              {/* Processing log if approved/rejected/cancelled */}
              {req.processed_by && (
                <div className="text-[11px] text-[#718355] bg-[#F1F3E9] rounded-lg px-3 py-1.5 flex items-center justify-between">
                  <span>처리자: <strong>{req.processed_by}</strong> ({new Date(req.processed_at || '').toLocaleString('ko-KR')})</span>
                  {req.rejection_reason && (
                    <span className="text-rose-600 font-semibold">사유: {req.rejection_reason}</span>
                  )}
                </div>
              )}

              {/* Action Buttons for Manager / Director */}
              <div className="pt-2 border-t border-[#E9EDC9] flex flex-wrap items-center justify-end gap-2">
                
                {/* Pending State Actions */}
                {req.status === 'pending' && (
                  <>
                    {rejectingId === req.id ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="반려 사유 입력"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-xs border border-rose-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 grow"
                        />
                        <button
                          onClick={() => handleConfirmReject(req.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          반려 확정
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason('');
                          }}
                          className="px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          반려
                        </button>
                        <button
                          onClick={() => onApprove(req.id)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 bg-[#718355] hover:bg-[#5f6f45] text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          연차 승인 및 차감
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Approved State Action: CANCEL APPROVAL -> RESTORE LEAVE */}
                {req.status === 'approved' && (
                  <button
                    onClick={() => {
                      if (confirm(`'${req.user_name}' 교사의 승인되었던 연차(${req.requested_days}일)를 취소하시겠습니까?\n취소 시 남은 연차에 차감되었던 일수가 자동으로 복원됩니다.`)) {
                        onCancelApproved(req.id);
                      }
                    }}
                    disabled={isProcessing}
                    className="px-3.5 py-1.5 border border-[#E9EDC9] bg-[#F1F3E9] text-[#344E41] font-bold rounded-xl text-xs hover:bg-[#E9EDC9] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#718355]" />
                    승인 취소 (남은 연차 복원)
                  </button>
                )}

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
