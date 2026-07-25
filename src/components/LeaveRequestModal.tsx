import React, { useState, useEffect } from 'react';
import { User, LeaveType, Holiday } from '../types';
import { X, Calendar, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  holidays: Holiday[];
  onSubmit: (request: {
    user_id: string;
    leave_type: LeaveType;
    start_date: string;
    end_date: string;
    requested_days: number;
    reason: string;
  }) => Promise<void>;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  holidays,
  onSubmit
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState<number>(1);
  const [excludedDates, setExcludedDates] = useState<{ date: string; title: string }[]>([]);

  // Calculate working days excluding weekends and red-day public holidays
  useEffect(() => {
    if (!startDate || !endDate) return;

    if (startDate > endDate) {
      setCalculatedDays(0);
      setExcludedDates([]);
      return;
    }

    if (leaveType === 'half_am' || leaveType === 'half_pm') {
      setCalculatedDays(0.5);
      setExcludedDates([]);
      return;
    }

    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = eachDayOfInterval({ start, end });

      let count = 0;
      const excludedList: { date: string; title: string }[] = [];

      days.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const holiday = holidays.find((h) => h.date === dateStr && h.is_public);
        const weekend = isWeekend(day);

        if (weekend) {
          excludedList.push({ date: dateStr, title: '주말' });
        } else if (holiday) {
          excludedList.push({ date: dateStr, title: `공휴일 (${holiday.title})` });
        } else {
          count += 1;
        }
      });

      setCalculatedDays(count);
      setExcludedDates(excludedList);
    } catch {
      setCalculatedDays(0);
    }
  }, [startDate, endDate, leaveType, holidays]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedDays <= 0) {
      alert('유효한 근무일수가 포함된 기간을 선택해 주세요.');
      return;
    }

    if (calculatedDays > currentUser.remaining_days && leaveType === 'annual') {
      alert(`잔여 연차가 부족합니다. (신청일수: ${calculatedDays}일 / 잔여연차: ${currentUser.remaining_days}일)`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        user_id: currentUser.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        requested_days: calculatedDays,
        reason
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || '연차 신청 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#F1F3E9] px-6 py-4 border-b border-[#E9EDC9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#718355] text-white flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#344E41]">어린이집 연차 / 휴가 신청서</h3>
              <p className="text-xs text-[#718355] font-medium">{currentUser.name} 교사 ({currentUser.department})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#A3B18A] hover:text-[#344E41] p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Remaining Leave Status Card */}
          <div className="bg-[#FDFCF8] border border-[#E9EDC9] rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[#344E41] font-medium">나의 2026년 법정 남은 연차:</span>
              <p className="text-[#718355] text-[11px]">근로기준법에 따라 자동 산정됨</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#718355]">{currentUser.remaining_days}일</span>
              <span className="text-[#A3B18A] text-[11px] block">/ 총 {currentUser.total_days}일</span>
            </div>
          </div>

          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#344E41] mb-1.5">
              휴가 종류 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'annual', label: '연차 (1일)', desc: '종일 휴가' },
                { id: 'half_am', label: '오전반차', desc: '0.5일 (오전)' },
                { id: 'half_pm', label: '오후반차', desc: '0.5일 (오후)' },
                { id: 'sick', label: '병가', desc: '의사 소견서' },
                { id: 'official', label: '공가', desc: '교육/검진' },
                { id: 'family', label: '경조사', desc: '취업규칙' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setLeaveType(type.id as LeaveType)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    leaveType === type.id
                      ? 'border-[#718355] bg-[#F1F3E9] text-[#344E41] ring-2 ring-[#718355]/30 font-bold'
                      : 'border-[#E9EDC9] hover:bg-[#FDFCF8] text-[#344E41]'
                  }`}
                >
                  <div className="font-semibold">{type.label}</div>
                  <div className="text-[10px] text-[#718355] mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#344E41] mb-1">
                시작일 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full text-xs border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344E41] mb-1">
                종료일 <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                disabled={leaveType === 'half_am' || leaveType === 'half_pm'}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs border border-[#E9EDC9] rounded-xl px-3 py-2 text-[#344E41] focus:ring-2 focus:ring-[#718355] focus:outline-hidden disabled:bg-[#FDFCF8]"
                required
              />
            </div>
          </div>

          {/* Automatic Red Day Excluded Preview */}
          <div className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#344E41] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#718355]" />
                실제 차감 예정 연차일수:
              </span>
              <span className="text-base font-black text-[#718355]">{calculatedDays}일</span>
            </div>

            {excludedDates.length > 0 && (
              <div className="pt-1.5 border-t border-[#E9EDC9] text-[11px] text-[#718355]">
                <span className="font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  빨간날/주말 차감 제외 ({excludedDates.length}일):
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {excludedDates.map((ex, idx) => (
                    <span key={idx} className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                      {ex.date} ({ex.title})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-[#344E41] mb-1">
              신청 사유 <span className="text-[#A3B18A] font-normal">(선택)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 개인 사유, 정기 검진, 휴식 및 자기개발 등"
              className="w-full text-xs border border-[#E9EDC9] rounded-xl p-2.5 text-[#344E41] focus:ring-2 focus:ring-[#718355] focus:outline-hidden"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9EDC9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9EDC9] rounded-xl text-xs font-semibold text-[#344E41] hover:bg-[#FDFCF8] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedDays <= 0}
              className="px-5 py-2 bg-[#718355] text-white rounded-xl text-xs font-bold hover:bg-[#5f6f45] transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              {isSubmitting ? '접수 중...' : '연차 신청서 제출'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
