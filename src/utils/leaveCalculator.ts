import { Staff, LeaveRequest, AnnualLeavePolicy } from '../types';

export interface LeaveCalculationResult {
  tenureYears: number;
  tenureMonths: number;
  statutoryDays: number;     // 법정 발생 연차
  manualAdjustment: number;  // 수동 조정 연차
  totalGrantedDays: number;  // 총 부여 연차
  usedDays: number;          // 사용 연차
  remainingDays: number;      // 잔여 연차
  isNegative: boolean;       // 음수 연차 여부
  nextYearDeduction: number; // 다음 년도 자동 차감 예정 일수
  leaveDetails: {
    tenureDescription: string;
    lawArticleNotice: string;
  };
}

/**
 * 근로기준법 제60조 기준 법정 연차 계산기
 * - 1년 미만 근로자: 1개월 개근 시 1일 유급휴가 (최대 11일)
 * - 1년 이상 근로자: 15일 기본 발생 + 2년마다 1일 추가 (최대 25일)
 */
export function calculateAnnualLeave(
  staff: Staff,
  approvedLeaveRequests: LeaveRequest[],
  policy: AnnualLeavePolicy,
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): LeaveCalculationResult {
  const joinDate = new Date(staff.joinDate);
  const refDate = new Date(referenceDateStr);

  if (isNaN(joinDate.getTime())) {
    return {
      tenureYears: 0,
      tenureMonths: 0,
      statutoryDays: 15,
      manualAdjustment: staff.manualAdjustment || 0,
      totalGrantedDays: 15 + (staff.manualAdjustment || 0),
      usedDays: 0,
      remainingDays: 15,
      isNegative: false,
      nextYearDeduction: 0,
      leaveDetails: {
        tenureDescription: '입사일 미지정',
        lawArticleNotice: '근로기준법 제60조 기본 산정',
      },
    };
  }

  // 근속 기간 계산 (개월 및 년)
  let diffMonths = (refDate.getFullYear() - joinDate.getFullYear()) * 12 + (refDate.getMonth() - joinDate.getMonth());
  if (refDate.getDate() < joinDate.getDate()) {
    diffMonths--;
  }
  if (diffMonths < 0) diffMonths = 0;

  const tenureYears = Math.floor(diffMonths / 12);
  const tenureMonths = diffMonths % 12;

  let statutoryDays = 0;
  let tenureDescription = '';
  let lawArticleNotice = '';

  if (tenureYears < 1) {
    // 1년 미만: 최대 11일 (근무 개월수당 1일)
    statutoryDays = Math.min(diffMonths, 11);
    tenureDescription = `${diffMonths}개월 근무 (1년 미만)`;
    lawArticleNotice = '근로기준법 제60조 제2항 (1개월 개근 시 1일 유급휴가, 최대 11일)';
  } else {
    // 1년 이상: 15일 + 2년마다 1일 (최대 25일)
    const additionalDays = Math.floor((tenureYears - 1) / 2);
    statutoryDays = Math.min(policy.statutoryBaseDays + additionalDays, policy.maxStatutoryDays);
    tenureDescription = `${tenureYears}년 ${tenureMonths}개월 근무 (${tenureYears + 1}년차)`;
    lawArticleNotice = `근로기준법 제60조 제1항·제4항 (기본 15일 + 2년당 1일 가산, 현재 ${statutoryDays}일)`;
  }

  // 해당 교사의 승인된 연차 사용 합계 계산
  const staffApprovedRequests = approvedLeaveRequests.filter(
    (req) => req.staffId === staff.id && req.status === 'approved'
  );

  const usedDays = staffApprovedRequests.reduce((acc, req) => acc + req.daysCount, 0);

  const manualAdjustment = staff.manualAdjustment || 0;
  const totalGrantedDays = statutoryDays + manualAdjustment;
  const remainingDays = Math.round((totalGrantedDays - usedDays) * 10) / 10;

  const isNegative = remainingDays < 0;
  let nextYearDeduction = 0;

  if (isNegative && policy.negativeDeductionEnabled) {
    nextYearDeduction = Math.abs(remainingDays);
  }

  return {
    tenureYears,
    tenureMonths,
    statutoryDays,
    manualAdjustment,
    totalGrantedDays,
    usedDays: Math.round(usedDays * 10) / 10,
    remainingDays,
    isNegative,
    nextYearDeduction,
    leaveDetails: {
      tenureDescription,
      lawArticleNotice,
    },
  };
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: '전일연차 (1.0일)',
  half_am: '오전반차 (0.5일)',
  half_pm: '오후반차 (0.5일)',
  sick: '병가',
  event: '경조사 휴가',
  special: '특별휴가',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: '원장/관리자',
  head_teacher: '주임교사',
  teacher: '담임교사',
  assistant: '보육보조교사',
  cook: '조리사',
};
