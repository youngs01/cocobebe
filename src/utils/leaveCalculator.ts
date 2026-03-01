import { 
  differenceInMonths, 
  differenceInYears, 
  addYears, 
  isBefore, 
  parseISO, 
  startOfDay,
  addMonths
} from 'date-fns';

/**
 * 근로기준법에 따른 연차 계산 로직 (입사일 기준)
 * 매년 입사 기념일을 기준으로 새로운 연차가 부여되고, 미사용분은 초기화됩니다.
 * 
 * 연차 발생:
 * - 1년 미만: 1개월 개근 시 1일 (최대 11일)
 * - 1년 이상: 15일 (기본)
 * - 3년 이상: 15학 + (근속년수÷2년) 일 추가 (최대 25일)
 */
export function calculateAnnualLeave(joinDateStr: string, targetDate: Date = new Date()) {
  const joinDate = startOfDay(parseISO(joinDateStr));
  const today = startOfDay(targetDate);

  if (isBefore(today, joinDate)) return 0;

  const totalYears = differenceInYears(today, joinDate);
  
  // 현재 입사 기념일 계산 (올해의 입사 기념일)
  const currentAnniversary = addYears(joinDate, totalYears);
  
  // 올해 입사 기념일이 아직 도래하지 않았으면 작년 기준
  const relevantAnniversary = isBefore(today, currentAnniversary) 
    ? addYears(joinDate, totalYears - 1) 
    : currentAnniversary;
  
  // 관련 기념일 기준의 근속 년수
  const yearsSinceLastAnniversary = differenceInYears(today, relevantAnniversary);
  
  let annualLeave = 0;

  // 현재 주기(입사 기념일 ~ 다음 입사 기념일)에 부여되는 연차 계산
  if (yearsSinceLastAnniversary < 1) {
    // 1년 미만: 월 1일, 최대 11일
    const months = differenceInMonths(today, relevantAnniversary);
    annualLeave = Math.min(months, 11);
  } else if (yearsSinceLastAnniversary < 3) {
    // 1년 이상 3년 미만: 15일
    annualLeave = 15;
  } else {
    // 3년 이상: 15일 + 추가 (2년마다 1일)
    const totalYearsFromStart = differenceInYears(today, joinDate);
    const extraDays = Math.floor(totalYearsFromStart / 2);
    annualLeave = Math.min(15 + extraDays, 25);
  }

  return annualLeave;
}

export function getLeaveUsage(requests: any[]) {
  return requests.reduce((acc, req) => {
    if (req.status !== 'approved') return acc;
    
    if (req.type === 'full') {
      // 간단하게 시작-종료일 차이로 계산 (실제로는 주말 제외 로직 필요할 수 있음)
      const start = parseISO(req.start_date);
      const end = parseISO(req.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return acc + days;
    } else {
      return acc + 0.5;
    }
  }, 0);
}
