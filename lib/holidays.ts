export interface HolidaySeed {
  date: string;
  title: string;
  is_public: boolean;
  source: string;
}

// 음력 공휴일 (설날, 추석) - 양력 변환 데이터
const lunarHolidays: Record<number, { seolnal: string; chuseok: string }> = {
  2024: { seolnal: '2024-02-10', chuseok: '2024-09-18' },
  2025: { seolnal: '2025-01-29', chuseok: '2025-10-06' },
  2026: { seolnal: '2026-02-17', chuseok: '2026-09-25' },
  2027: { seolnal: '2027-02-06', chuseok: '2027-09-15' },
  2028: { seolnal: '2028-01-26', chuseok: '2028-10-02' },
  2029: { seolnal: '2029-02-13', chuseok: '2029-09-22' },
  2030: { seolnal: '2030-02-03', chuseok: '2030-09-12' },
};

// 음력 기반 공휴일 날짜 가져오기
function getLunarHolidayDates(year: number) {
  return lunarHolidays[year] || { seolnal: `${year}-02-01`, chuseok: `${year}-09-24` };
}

// 날짜가 주말인지 확인
function isWeekend(dateStr: string): boolean {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 = 일요일, 6 = 토요일
}

// 주어진 날짜 이후 첫 번째 비공휴일 찾기
function getNextNonHolidayDate(startDate: string, existingHolidays: Set<string>): string {
  let current = new Date(`${startDate}T00:00:00Z`);
  while (true) {
    current.setUTCDate(current.getUTCDate() + 1);
    const dateStr = current.toISOString().split('T')[0];
    if (!isWeekend(dateStr) && !existingHolidays.has(dateStr)) {
      return dateStr;
    }
  }
}

// 국경일 대체공휴일 계산 (토·일요일과 겹치면 그 다음 월요일)
function getNationalHolidaySubstitute(dateStr: string, existingHolidays: Set<string>): string | null {
  if (!isWeekend(dateStr)) {
    return null; // 주말이 아니면 대체공휴일 없음
  }
  
  let current = new Date(`${dateStr}T00:00:00Z`);
  while (current.getUTCDay() !== 1) { // 월요일 찾기
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  const substituteDate = current.toISOString().split('T')[0];
  if (existingHolidays.has(substituteDate)) {
    return getNationalHolidaySubstitute(substituteDate, existingHolidays);
  }
  return substituteDate;
}

export function getDefaultHolidayList(year: number = new Date().getFullYear()): HolidaySeed[] {
  const lunar = getLunarHolidayDates(year);
  const holidays: HolidaySeed[] = [];
  const holidaySet = new Set<string>();

  // 주요 공휴일 추가 (양력)
  const baseHolidays = [
    { date: `${year}-01-01`, title: '신정' },
    { date: lunar.seolnal, title: '설날' },
    { date: `${year}-03-01`, title: '삼일절' },
    { date: `${year}-05-05`, title: '어린이날' },
    { date: `${year}-06-06`, title: '현충일' },
    { date: `${year}-07-17`, title: '제헌절' },
    { date: `${year}-08-15`, title: '광복절' },
    { date: `${year}-10-03`, title: '개천절' },
    { date: `${year}-10-09`, title: '한글날' },
    { date: `${year}-12-25`, title: '성탄절' },
  ];

  // 설날 전후 연휴 (음력 기반)
  const seolnalBefore = new Date(`${lunar.seolnal}T00:00:00Z`);
  seolnalBefore.setUTCDate(seolnalBefore.getUTCDate() - 1);
  const seolnalBeforeStr = seolnalBefore.toISOString().split('T')[0];

  const seolnalAfter = new Date(`${lunar.seolnal}T00:00:00Z`);
  seolnalAfter.setUTCDate(seolnalAfter.getUTCDate() + 1);
  const seolnalAfterStr = seolnalAfter.toISOString().split('T')[0];

  // 추석 전후 연휴 (음력 기반)
  const chuseokBefore = new Date(`${lunar.chuseok}T00:00:00Z`);
  chuseokBefore.setUTCDate(chuseokBefore.getUTCDate() - 1);
  const chuseokBeforeStr = chuseokBefore.toISOString().split('T')[0];

  const chuseokAfter = new Date(`${lunar.chuseok}T00:00:00Z`);
  chuseokAfter.setUTCDate(chuseokAfter.getUTCDate() + 1);
  const chuseokAfterStr = chuseokAfter.toISOString().split('T')[0];

  // 기본 공휴일 추가
  baseHolidays.forEach(h => {
    holidays.push({ date: h.date, title: h.title, is_public: true, source: 'seed' });
    holidaySet.add(h.date);
  });

  // 설날 연휴 추가
  holidays.push({ date: seolnalBeforeStr, title: '설날 전날', is_public: true, source: 'seed' });
  holidays.push({ date: seolnalAfterStr, title: '설날 다음날', is_public: true, source: 'seed' });
  holidaySet.add(seolnalBeforeStr);
  holidaySet.add(seolnalAfterStr);

  // 추석 연휴 추가
  holidays.push({ date: chuseokBeforeStr, title: '추석 전날', is_public: true, source: 'seed' });
  holidays.push({ date: chuseokAfterStr, title: '추석 다음날', is_public: true, source: 'seed' });
  holidaySet.add(chuseokBeforeStr);
  holidaySet.add(chuseokAfterStr);

  // 대체휴무일 계산
  const substitutes: { date: string; title: string }[] = [];

  // 어린이날 대체공휴일 (토요일 또는 다른 공휴일과 겹치면)
  if (isWeekend(`${year}-05-05`) || holidaySet.has(`${year}-05-05`)) {
    const childrensDaySubstitute = getNextNonHolidayDate(`${year}-05-05`, holidaySet);
    if (!holidaySet.has(childrensDaySubstitute)) {
      substitutes.push({ date: childrensDaySubstitute, title: '어린이날 대체공휴일' });
      holidaySet.add(childrensDaySubstitute);
    }
  }

  // 국경일 대체공휴일 (토·일요일과 겹치면 그 다음 월요일)
  const nationalHolidaysForSubstitute = [
    { date: `${year}-03-01`, title: '삼일절' },
    { date: `${year}-08-15`, title: '광복절' },
    { date: `${year}-10-03`, title: '개천절' },
    { date: `${year}-10-09`, title: '한글날' },
  ];

  nationalHolidaysForSubstitute.forEach(h => {
    const substitute = getNationalHolidaySubstitute(h.date, holidaySet);
    if (substitute && !holidaySet.has(substitute)) {
      substitutes.push({ date: substitute, title: `${h.title} 대체공휴일` });
      holidaySet.add(substitute);
    }
  });

  // 설날/추석 연휴 대체공휴일 (다른 공휴일과 겹치면 그 다음 첫 번째 비공휴일)
  const lunarConnectedDates = [
    { dates: [seolnalBeforeStr, lunar.seolnal, seolnalAfterStr], prefix: '설날' },
    { dates: [chuseokBeforeStr, lunar.chuseok, chuseokAfterStr], prefix: '추석' },
  ];

  lunarConnectedDates.forEach(({ dates, prefix }) => {
    dates.forEach(date => {
      if (holidaySet.has(date) && (isWeekend(date) || dates.some(d => d !== date && holidaySet.has(d)))) {
        const substitute = getNextNonHolidayDate(date, holidaySet);
        if (!holidaySet.has(substitute)) {
          substitutes.push({ date: substitute, title: `${prefix} 대체공휴일` });
          holidaySet.add(substitute);
        }
      }
    });
  });

  // 대체휴무일 추가
  substitutes.forEach(s => {
    holidays.push({ date: s.date, title: s.title, is_public: true, source: 'seed' });
  });

  return holidays.sort((a, b) => a.date.localeCompare(b.date));
}
