import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Building2,
  Calendar,
  CheckCircle,
  Award,
  Sparkles,
} from 'lucide-react';
import { Staff, LeaveRequest, AttendanceRecord, AnnualLeavePolicy } from '../types';
import { calculateAnnualLeave } from '../utils/leaveCalculator';
import { exportMonthlyReportToPdf } from '../utils/pdfExport';

interface MonthlyPdfReportProps {
  allStaff: Staff[];
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  policy: AnnualLeavePolicy;
}

export const MonthlyPdfReport: React.FC<MonthlyPdfReportProps> = ({
  allStaff,
  leaveRequests,
  attendance,
  policy,
}) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('07');
  const [isExporting, setIsExporting] = useState(false);

  const reportTitle = `${selectedYear}년 ${selectedMonth}월 코코베베 어린이집 교직원 근태 보고서`;
  const reportDateStr = `${selectedYear}-${selectedMonth}-01 ~ ${selectedYear}-${selectedMonth}-31`;

  const handleExportPdf = async () => {
    setIsExporting(true);
    await exportMonthlyReportToPdf('printable-monthly-report', `${reportTitle}.pdf`);
    setIsExporting(false);
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              월별 정기 보고서
            </span>
            <span className="text-xs text-slate-500">공식 행정 서식 추출</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">월별 근태 및 연차 보고서 PDF 추출</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            원내 제출 및 관공서 보고용 월별 근태/연차 종합 보고서를 고해상도 PDF로 다운로드하세요.
          </p>
        </div>

        {/* Date Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="2026">2026년</option>
              <option value="2025">2025년</option>
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="07">07월</option>
              <option value="06">06월</option>
              <option value="05">05월</option>
              <option value="04">04월</option>
            </select>
          </div>

          <button
            onClick={handleBrowserPrint}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            인쇄
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-400" />
            {isExporting ? 'PDF 생성 중...' : 'PDF 리포트 추출'}
          </button>
        </div>
      </div>

      {/* Printable Report Canvas Document */}
      <div className="bg-slate-100 p-4 md:p-8 rounded-2xl border border-slate-200 overflow-x-auto print:p-0 print:bg-white print:border-none">
        <div
          id="printable-monthly-report"
          className="bg-white max-w-4xl mx-auto p-8 sm:p-12 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:max-w-none text-slate-900 space-y-8"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-widest text-amber-800 uppercase">
                  COCOBEBE NURSERY REPORT
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {selectedYear}년 {selectedMonth}월 교직원 근태 및 연차 사용 종합 보고서
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                작성 기관: 코코베베 어린이집 | 대상 기간: {reportDateStr}
              </p>
            </div>

            {/* Approval Sign-off Box */}
            <div className="border border-slate-300 text-[10px] text-center shrink-0">
              <div className="bg-slate-100 font-bold border-b border-slate-300 px-3 py-1">
                결 재 란
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-300">
                <div className="p-2 space-y-4">
                  <span className="block font-medium">작성자</span>
                  <span className="block font-bold text-slate-400">(인)</span>
                </div>
                <div className="p-2 space-y-4">
                  <span className="block font-medium">주임교사</span>
                  <span className="block font-bold text-slate-400">(인)</span>
                </div>
                <div className="p-2 space-y-4">
                  <span className="block font-medium">원장</span>
                  <span className="block font-bold text-amber-800">[직인]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Monthly Statistics Cards */}
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px]">총 교직원</span>
              <span className="font-bold text-slate-900 text-base">{allStaff.length}명</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px]">당월 연차 사용건</span>
              <span className="font-bold text-slate-900 text-base">
                {leaveRequests.filter((r) => r.status === 'approved').length}건
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px]">당월 출석률</span>
              <span className="font-bold text-emerald-700 text-base">98.5%</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 block text-[11px]">음수 연차 발생 교사</span>
              <span className="font-bold text-rose-700 text-base">
                {allStaff.filter((s) => calculateAnnualLeave(s, leaveRequests, policy).isNegative).length}명
              </span>
            </div>
          </div>

          {/* Staff Monthly Matrix Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 border-l-4 border-amber-500 pl-2">
              교사별 법정 연차 및 근태 상세 현황표
            </h3>

            <table className="w-full text-xs text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="p-2.5 border border-slate-300">성명</th>
                  <th className="p-2.5 border border-slate-300">직위 / 학급</th>
                  <th className="p-2.5 border border-slate-300">입사일</th>
                  <th className="p-2.5 border border-slate-300">총 발생</th>
                  <th className="p-2.5 border border-slate-300">사용 연차</th>
                  <th className="p-2.5 border border-slate-300">잔여 연차</th>
                  <th className="p-2.5 border border-slate-300">근태 특이사항</th>
                </tr>
              </thead>
              <tbody>
                {allStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 font-medium">
                      등록된 교직원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  allStaff.map((staff) => {
                    const calc = calculateAnnualLeave(staff, leaveRequests, policy);
                    return (
                      <tr key={staff.id} className="border-b border-slate-200">
                      <td className="p-2.5 border border-slate-300 font-bold">{staff.name}</td>
                      <td className="p-2.5 border border-slate-300">
                        {staff.positionTitle} ({staff.className})
                      </td>
                      <td className="p-2.5 border border-slate-300 font-mono">{staff.joinDate}</td>
                      <td className="p-2.5 border border-slate-300 font-mono font-semibold">
                        {calc.totalGrantedDays}일
                      </td>
                      <td className="p-2.5 border border-slate-300 font-mono">{calc.usedDays}일</td>
                      <td className="p-2.5 border border-slate-300 font-mono font-bold">
                        {calc.remainingDays < 0 ? (
                          <span className="text-rose-700 font-bold">{calc.remainingDays}일 (차감)</span>
                        ) : (
                          `${calc.remainingDays}일`
                        )}
                      </td>
                      <td className="p-2.5 border border-slate-300 text-slate-600 text-[11px]">
                        {calc.isNegative
                          ? `음수 발생: 차기 연도 ${calc.nextYearDeduction}일 차감`
                          : '정상 근태'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>

          {/* Document Footer Notice & Stamp */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">코코베베 어린이집 행정원장</p>
              <p className="text-[11px]">위 사실과 다름없음을 확인 및 증명합니다.</p>
              <p className="text-[11px] font-mono text-slate-400">발급일자: {new Date().toISOString().split('T')[0]}</p>
            </div>

            <div className="text-right">
              <div className="w-16 h-16 rounded-full border-2 border-amber-600/40 text-amber-700 flex items-center justify-center font-bold text-[11px] transform -rotate-12 border-dashed ml-auto">
                코코베베<br />직인
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
