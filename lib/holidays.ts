export interface HolidaySeed {
  date: string;
  title: string;
  is_public: boolean;
  source: string;
}

export function getDefaultHolidayList(year: number = new Date().getFullYear()): HolidaySeed[] {
  return [
    { date: `${year}-01-01`, title: '신정', is_public: true, source: 'seed' },
    { date: `${year}-02-01`, title: '설날', is_public: true, source: 'seed' },
    { date: `${year}-02-02`, title: '설날 연휴', is_public: true, source: 'seed' },
    { date: `${year}-03-01`, title: '삼일절', is_public: true, source: 'seed' },
    { date: `${year}-05-05`, title: '어린이날', is_public: true, source: 'seed' },
    { date: `${year}-05-06`, title: '어린이날 대체공휴일', is_public: true, source: 'seed' },
    { date: `${year}-06-06`, title: '현충일', is_public: true, source: 'seed' },
    { date: `${year}-08-15`, title: '광복절', is_public: true, source: 'seed' },
    { date: `${year}-08-16`, title: '광복절 대체공휴일', is_public: true, source: 'seed' },
    { date: `${year}-09-24`, title: '추석', is_public: true, source: 'seed' },
    { date: `${year}-09-25`, title: '추석 연휴', is_public: true, source: 'seed' },
    { date: `${year}-09-26`, title: '추석 대체공휴일', is_public: true, source: 'seed' },
    { date: `${year}-10-03`, title: '개천절', is_public: true, source: 'seed' },
    { date: `${year}-10-06`, title: '개천절 대체공휴일', is_public: true, source: 'seed' },
    { date: `${year}-10-09`, title: '한글날', is_public: true, source: 'seed' },
    { date: `${year}-12-25`, title: '성탄절', is_public: true, source: 'seed' },
  ];
}
