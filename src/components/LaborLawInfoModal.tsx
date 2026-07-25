import React from 'react';
import { X, Scale, CheckCircle2, Clock, CalendarCheck, ShieldAlert } from 'lucide-react';

interface LaborLawInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaborLawInfoModal: React.FC<LaborLawInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E9EDC9] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#F1F3E9] px-6 py-4 border-b border-[#E9EDC9] flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#718355] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#344E41]">대한민국 근로기준법 제60조 법정연차 기준</h3>
              <p className="text-xs text-[#718355] font-medium">코코베베 어린이집 자동 계산 및 준수 규칙</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A3B18A] hover:text-[#344E41] p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-[#344E41] text-sm">
          
          {/* Key Rule Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Rule 1: Under 1 year */}
            <div className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#344E41] font-bold">
                <Clock className="w-4 h-4 text-[#718355]" />
                <span>1년 미만 근로자 (신입 교사)</span>
              </div>
              <p className="text-xs text-[#344E41]/90 leading-relaxed">
                <strong className="font-semibold">근로기준법 제60조 제2항:</strong> 1개월 개근 시 1일의 유급휴가가 발생합니다. 1년 동안 최대 <strong className="font-bold underline decoration-[#718355]">11일</strong>까지 월별로 차곡차곡 연차가 발생합니다.
              </p>
              <div className="bg-white/80 rounded-lg p-2.5 text-[11px] text-[#344E41] border border-[#E9EDC9] font-mono">
                예) 입사 6개월차 교사 → 6일 연차 자동 생성
              </div>
            </div>

            {/* Rule 2: 1 year and above */}
            <div className="bg-[#FDFCF8] border border-[#E9EDC9] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#344E41] font-bold">
                <CalendarCheck className="w-4 h-4 text-[#718355]" />
                <span>1년 이상 근로자 (재직 교사)</span>
              </div>
              <p className="text-xs text-[#344E41]/90 leading-relaxed">
                <strong className="font-semibold">근로기준법 제60조 제1항 및 제4항:</strong> 1년 이상 출근율 80% 이상 시 <strong className="font-bold underline decoration-[#718355]">15일</strong> 부여. 3년차부터 매 2년마다 1일씩 가산되어 최대 <strong className="font-bold underline decoration-[#718355]">25일</strong>까지 늘어납니다.
              </p>
              <div className="bg-white/80 rounded-lg p-2.5 text-[11px] text-[#344E41] border border-[#E9EDC9] font-mono">
                예) 근속 3년차 → 15일 + 1일(가산) = 총 16일
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#344E41] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#718355]" />
              근속 연수별 법정연차 자동 부여표
            </h4>
            <div className="border border-[#E9EDC9] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F1F3E9] text-[#344E41] font-semibold border-b border-[#E9EDC9]">
                  <tr>
                    <th className="py-2.5 px-3">근속 기간</th>
                    <th className="py-2.5 px-3">법정 연차일수</th>
                    <th className="py-2.5 px-3">산정 공식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EDC9] font-medium text-[#344E41]">
                  <tr className="hover:bg-[#FDFCF8]">
                    <td className="py-2 px-3 text-[#718355] font-bold">1년 미만</td>
                    <td className="py-2 px-3">월 1일 (최대 11일)</td>
                    <td className="py-2 px-3 text-[#A3B18A]">1개월 개근 시 1일 생성</td>
                  </tr>
                  <tr className="hover:bg-[#FDFCF8]">
                    <td className="py-2 px-3 font-semibold">1 ~ 2년차</td>
                    <td className="py-2 px-3 text-[#718355] font-bold">15일</td>
                    <td className="py-2 px-3 text-[#A3B18A]">기본 15일</td>
                  </tr>
                  <tr className="hover:bg-[#FDFCF8]">
                    <td className="py-2 px-3 font-semibold">3 ~ 4년차</td>
                    <td className="py-2 px-3 text-[#718355] font-bold">16일</td>
                    <td className="py-2 px-3 text-[#A3B18A]">15일 + 1일 가산</td>
                  </tr>
                  <tr className="hover:bg-[#FDFCF8]">
                    <td className="py-2 px-3 font-semibold">5 ~ 6년차</td>
                    <td className="py-2 px-3 text-[#718355] font-bold">17일</td>
                    <td className="py-2 px-3 text-[#A3B18A]">15일 + 2일 가산</td>
                  </tr>
                  <tr className="hover:bg-[#FDFCF8]">
                    <td className="py-2 px-3 font-semibold">7년차 이상</td>
                    <td className="py-2 px-3 text-[#718355] font-bold">18일 ~ 최대 25일</td>
                    <td className="py-2 px-3 text-[#A3B18A]">매 2년당 1일 가산 (최대 25일 한도)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Important Rules: Red Days & Approvals */}
          <div className="bg-[#F1F3E9] border border-[#E9EDC9] rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-[#344E41] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#718355]" />
              코코베베 어린이집 특화 정책 & 승인/복원 규칙
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-[#344E41] leading-relaxed">
              <li><strong className="text-[#344E41]">달력의 빨간날 (공휴일):</strong> 네이버 캘린더 및 관공서 공휴일과 동기화되어 연차 신청 기간 중 빨간날과 주말은 연차 차감 일수에서 자동으로 제외됩니다.</li>
              <li><strong className="text-[#344E41]">연차 승인 및 차감:</strong> 교사의 연차 신청을 관리자나 원장이 승인하면 차감 일수만큼 남은 연차가 자동 소진됩니다.</li>
              <li><strong className="text-[#344E41]">승인 연차 취소 시 복원:</strong> 이미 승인되었던 연차를 관리자/원장이 취소하면 차감되었던 일수가 즉시 남은 연차로 완전 복원됩니다.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#F1F3E9] px-6 py-3 border-t border-[#E9EDC9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#344E41] text-white text-xs font-semibold rounded-xl hover:bg-[#283d33] transition-colors shadow-xs cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
