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
    <div className="space-y-3 sm:space-y-4">
      
      {/* Header Info Banner */}
      <div className="bg-[#718355] rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#E9EDC9] shrink-0" />
            <h2 className="text-sm sm:text-lg font-bold truncate">연차 결재 스판위</h2>
          </div>
          <p className="text-[10px] sm:text-xs text-[#E9EDC9] mt-0.5 sm:mt-1">
            중로딩스({currentUser.role === 'director' ? currentUser.name : '박윤희'}) & 관리자 전용
          </p>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <div className="bg-white/10 backdrop-blur-xs rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 border border-white/20 text-center">
            <span className="text-[9px] sm:text-xs text-[#E9EDC9] block font-medium">대기</span>
            <span className="text-lg sm:text-xl font-black text-amber-200">{pendingCount}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-lg sm:rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 border border-white/20 text-center">
            <span className="text-[9px] sm:text-xs text-[#E9EDC9] block font-medium">승인</span>
            <span className="text-lg sm:text-xl font-black text-emerald-200">{approvedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-[#E9EDC9] pb-1.5 sm:pb-2 text-[10px] sm:text-xs overflow-x-auto">
        {[
          { id: 'all', label: `전체 (${leaveRequests.length})` },
          { id: 'pending', label: `대기 (${pendingCount})` },
          { id: 'approved', label: `승인 (${approvedCount})` },
          { id: 'processed', label: '기타' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
      <div className="space-y-2 sm:space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E9EDC9] p-6 sm:p-8 text-center text-[#A3B18A] text-[11px] sm:text-xs">
            해당 요청이 없습니다.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-lg sm:rounded-2xl border transition-all p-3 sm:p-4 space-y-2 sm:space-y-3 shadow-xs ${
                req.status === 'pending'
                  ? 'border-[#718355] ring-2 ring-[#718355]/20 bg-[#F1F3E9]/30'
                  : 'border-[#E9EDC9]'
              }`}
            >
              {/* Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#F1F3E9] border border-[#E9EDC9] flex items-center justify-center text-[#718355] font-bold text-xs shrink-0">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="font-bold text-[#344E41] text-xs sm:text-sm truncate">{req.user_name} 교사</span>
                      <span className="text-[10px] sm:text-xs text-[#718355] bg-[#F1F3E9] px-1.5 py-0.5 rounded shrink-0">{req.department}</span>
                      {getLeaveTypeBadge(req.leave_type)}
                    </div>
                    <span className="text-[9px] sm:text-[11px] text-[#A3B18A]">신청일: {new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 self-start sm:self-auto">
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Leave Details Box */}
              <div className="bg-[#FDFCF8] rounded-lg sm:rounded-xl p-2 sm:p-3 border border-[#E9EDC9] text-[10px] sm:text-xs grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                <div>
                  <span className="text-[#A3B18A] text-[9px] sm:text-[10px] block">신청 기간</span>
                  <span className="font-bold text-[#344E41] text-[10px] sm:text-xs break-all">{formatDate(req.start_date)} ~ {formatDate(req.end_date)}</span>
                </div>
                <div>
                  <span className="text-[#A3B18A] text-[9px] sm:text-[10px] block">차감 일수</span>
                  <span className="font-black text-[#718355] text-[10px] sm:text-xs">{req.requested_days}일</span>
                </div>
                <div>
                  <span className="text-[#A3B18A] text-[9px] sm:text-[10px] block">사유</span>
                  <span className="text-[#344E41] text-[9px] sm:text-xs truncate">{req.reason || '미기재'}</span>
                </div>
              </div>

              {/* Processing log if approved/rejected/cancelled */}
              {req.processed_by && (
                <div className="text-[9px] sm:text-[11px] text-[#718355] bg-[#F1F3E9] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                  <span className="truncate">처리: <strong>{req.processed_by}</strong> ({new Date(req.processed_at || '').toLocaleDateString('ko-KR')})</span>
                  {req.rejection_reason && (
                    <span className="text-rose-600 font-semibold truncate text-[8px] sm:text-[9px]">사유: {req.rejection_reason}</span>
                  )}
                </div>
              )}

              {/* Action Buttons for Manager / Director */}
              <div className="pt-1.5 sm:pt-2 border-t border-[#E9EDC9] flex flex-col sm:flex-row sm:items-center sm:justify-end gap-1.5 sm:gap-2">
                
                {/* Pending State Actions */}
                {req.status === 'pending' && (
                  <>
                    {rejectingId === req.id ? (
                      <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 w-full">
                        <input
                          type="text"
                          placeholder="사유 입력"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-[10px] sm:text-xs border border-rose-300 rounded-lg px-2 sm:px-2.5 py-1.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 grow"
                        />
                        <button
                          onClick={() => handleConfirmReject(req.id)}
                          disabled={isProcessing}
                          className="px-2.5 sm:px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg text-[10px] sm:text-xs hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
                        >
                          반려
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason('');
                          }}
                          className="px-2.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-[10px] sm:text-xs hover:bg-slate-100 shrink-0"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          disabled={isProcessing}
                          className="px-2.5 sm:px-3.5 py-1.5 border border-rose-200 bg-rose-50 text-rose-700 font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">반려</span>
                        </button>
                        <button
                          onClick={() => onApprove(req.id)}
                          disabled={isProcessing}
                          className="px-2.5 sm:px-4 py-1.5 bg-[#718355] hover:bg-[#5f6f45] text-white font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer grow sm:grow-0"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>승인</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Approved State Action: CANCEL APPROVAL -> RESTORE LEAVE */}
                {req.status === 'approved' && (
                  <button
                    onClick={() => {
                      if (confirm(`'${req.user_name}' 교사의 승인(${req.requested_days}일)을 취소하시겠습니까?`)) {
                        onCancelApproved(req.id);
                      }
                    }}
                    disabled={isProcessing}
                    className="px-2.5 sm:px-3.5 py-1.5 border border-[#E9EDC9] bg-[#F1F3E9] text-[#344E41] font-bold rounded-lg sm:rounded-xl text-[10px] sm:text-xs hover:bg-[#E9EDC9] transition-colors flex items-center gap-1 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#718355]" />
                    <span className="hidden sm:inline">승인 취소 (복원)</span>
                    <span className="sm:hidden">취소</span>
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
