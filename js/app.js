const SEED = window.SEED_DATA;
// GA4 안전 래퍼 — GA4 스크립트가 없어도 앱이 정상 작동
function safeGtag(...args) { if (typeof gtag === 'function') gtag(...args); }
const airports = SEED.airports.filter(a => a.is_active !== false);
const airlines = SEED.airlines || [];
const allFlights = (SEED.flights || [...(SEED.outbound_flights || []), ...(SEED.inbound_flights || [])]).filter(f => f.is_active !== false);
const airportById = Object.fromEntries(airports.map(a => [a.airport_id, a]));
const airlineById = Object.fromEntries(airlines.map(a => [a.airline_id, a]));
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const round1000 = n => Math.round(n / 1000) * 1000;
const TYPE_ORDER = ['low_cost', 'standard', 'major'];
const TYPE_LABEL = { low_cost: '저가 항공사', standard: '기본 항공사', major: '대형 항공사' };
const TYPE_CHIP = { low_cost: 'green', standard: 'blue', major: 'purple' };
const REGIONS = ['대한민국','일본','동북아시아','동남아시아','미주','유럽','괌/오세아니아','러시아/몽골/중앙아시아','중동/아프리카'];
const SPECIAL_LABELS = {
  ICN: '서울/인천', GMP: '서울/김포', NRT: '도쿄/나리타', HND: '도쿄/하네다',
  KIX: '오사카/간사이', UKB: '오사카/고베', CTS: '삿포로', FUK: '후쿠오카', NGO: '나고야', OKA: '오키나와',
  PVG: '상하이/푸둥', SHA: '상하이/훙차오', TPE: '타이베이/타오위안', RMQ: '타이중',
  GUM: '괌', HNL: '호놀룰루', DXB: '두바이'
};
const fareRules = [
  { id: 'basic', name: 'Basic', add: 0, perks: ['기내 수하물', '좌석 랜덤', '기내식 불가', 'Flex 구역 제한'], meal: false, mealPolicy: '기내식 선택 불가' },
  { id: 'standard', name: 'Standard', add: 38000, perks: ['위탁 15kg', '좌석 선택', '기내식 추가결제', 'Flex 구역 제한'], meal: true, mealPolicy: '선택 메뉴 추가결제' },
  { id: 'flex', name: 'Flex', add: 89000, perks: ['위탁 23kg', 'Flex 구역 전용', '기내식 무료 선택', '우선 탑승'], meal: true, mealPolicy: '선택 메뉴 무료 포함' }
];
const mealOptions = (SEED.meal_table || []).filter(m => m.is_active !== false).map(m => ({
  id: m.meal_id,
  title: m.name,
  category: m.category,
  desc: m.description,
  price: m.price_krw || 0,
  image: m.image || '',
  childOnly: !!m.child_only
}));
const RANDOM_TEST = window.RANDOM_TRAVEL_TEST || { questions: [], recommendations: {} };
const DEFAULT_SHARE_MESSAGE = `오늘 진짜 여행 결제하고 싶었는데,\n대신 위시 보딩패스 하나 발권했다.`;
const SHARE_MESSAGES = [
  `오늘 진짜 여행 결제하고 싶었는데,\n대신 위시 보딩패스 하나 발권했다.`,
  `아직은 못 가지만,\n내 마음은 이미 출국장.`,
  `오늘의 무지출 발권 완료.\n충동 결제 대신 여행 목표를 저장했다.`,
  `실제 결제는 0원,\n대신 언젠가의 여행을 먼저 저장했다.`
];
const QR_IMAGE_SRC = 'data:image/png;base64,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';
const QR_IMAGE_OBJECT = new Image();
QR_IMAGE_OBJECT.src = QR_IMAGE_SRC;

function questionByIndex(index) { return RANDOM_TEST.questions?.[index] || null; }
function quizAnswerCode(stepIndex) { return state.quizAnswers?.[stepIndex] || ''; }
function quizCode() { return [0,1,2].map(i => quizAnswerCode(i)).join(''); }
function selectedQuizRecommendation() { return RANDOM_TEST.recommendations?.[quizCode()] || null; }
function selectedOptionLabel(stepIndex) {
  const q = questionByIndex(stepIndex);
  const code = quizAnswerCode(stepIndex);
  return q?.options?.find(o => o.code === code)?.answer || '';
}
const state = {
  screen: 'home',
  step: 0,
  tripType: 'roundtrip',
  origin: 'ICN',
  destination: 'NRT',
  departDate: '2026-07-01',
  returnDate: '2026-07-08',
  pax: { adult: 1, child: 0, infant: 0 },
  outboundId: null,
  inboundId: null,
  fareId: 'standard',
  mealId: 'none',
  passenger: { lastName: '', firstName: '', phone: '' },
  passengerProfiles: [],
  meals: { outbound: {}, inbound: {} },
  mealApplied: { outbound: false, inbound: false, roundtrip: false },
  mealAppliedBackup: { outbound: {}, inbound: {}, roundtrip: {} },
  seats: { outbound: {}, inbound: {} },
  seatTargetBySector: { outbound: 'adult-1', inbound: 'adult-1' },
  mealTarget: { sector: 'outbound', passengerId: 'adult-1' },
  reviewTab: 'route',
  seat: '',
  bookingCode: '',
  modal: null,
  airportField: 'origin',
  activeRegion: '대한민국',
  airportQuery: '',
  helpKey: null,
  passengerValidationAttempted: false,
  quizStep: 0,
  quizAnswers: {},
  recommendation: null,
  shareMessage: DEFAULT_SHARE_MESSAGE
};
const app = document.getElementById('app');
const progress = document.getElementById('progress');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalSheet = document.getElementById('modalSheet');

function h(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}
function regionOfAirport(a) {
  if (!a) return '동북아시아';
  const c = a.country_ko;
  if (c === '대한민국') return '대한민국';
  if (c === '일본') return '일본';
  if (['중국','홍콩','마카오','대만'].includes(c)) return '동북아시아';
  if (['캄보디아','인도','인도네시아','말레이시아','미얀마','네팔','필리핀','싱가포르','태국','베트남'].includes(c)) return '동남아시아';
  if (['미국','캐나다'].includes(c)) return '미주';
  if (['오스트리아','체코','프랑스','독일','헝가리','이탈리아','네덜란드','포르투갈','튀르키예','스페인','스위스','영국'].includes(c)) return '유럽';
  if (['괌','호주','뉴질랜드'].includes(c)) return '괌/오세아니아';
  if (['몽골','러시아','카자흐스탄','우즈베키스탄'].includes(c)) return '러시아/몽골/중앙아시아';
  if (['아랍에미리트','카타르','사우디아라비아','이집트','남아프리카공화국'].includes(c)) return '중동/아프리카';
  return '동북아시아';
}
function airportLabel(code) {
  const a = airportById[code];
  if (!a) return code;
  return SPECIAL_LABELS[code] || a.city_ko;
}
function airportOptionLabel(a) { return `${airportLabel(a.airport_id)}(${a.airport_id})`; }
function airportSub(a) { return `${a.airport_name_ko} · ${a.country_ko}`; }
function airportSortValue(a) { return airportLabel(a.airport_id); }
function sortedAirports(region, query='') {
  let list = airports.filter(a => regionOfAirport(a) === region);
  const q = query.trim().toLowerCase();
  if (q) {
    list = airports.filter(a => `${airportLabel(a.airport_id)} ${a.airport_id} ${a.city_ko} ${a.airport_name_ko} ${a.country_ko}`.toLowerCase().includes(q));
  }
  list.sort((a,b) => airportSortValue(a).localeCompare(airportSortValue(b), 'ko-KR'));
  if (!q && region === '대한민국') {
    const frontCodes = ['ICN','GMP'];
    const front = frontCodes.map(c => airportById[c]).filter(Boolean);
    const rest = list.filter(a => !frontCodes.includes(a.airport_id));
    return [...front, ...rest];
  }
  return list;
}
function fmtTime(iso) {
  if (!iso) return '--:--';
  const m = String(iso).match(/T(\d{2}:\d{2})/);
  return m ? m[1] : iso.slice(11,16);
}
function fmtDate(iso) { return String(iso || '').slice(0,10); }
function durationText(min) {
  const h2 = Math.floor((min || 0) / 60), m = (min || 0) % 60;
  return h2 ? `${h2}시간 ${m ? m + '분' : ''}` : `${m}분`;
}
function addMinutesToTime(hhmm, mins) {
  const [hh,mm] = hhmm.split(':').map(Number);
  const total = (hh*60 + mm + mins) % (24*60);
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function displayFare(f) { return round1000((f.base_fare_krw || 0) * 0.7); }
function airlineForType(type, seedIndex=0) {
  const arr = airlines.filter(a => a.airline_type === type);
  return arr[seedIndex % Math.max(arr.length, 1)] || airlines[seedIndex % airlines.length] || { airline_id:'DMO', airline_name:'Demo Air', logo_text:'DM', brand_color:'#2563eb', airline_type:type, airline_type_ko:TYPE_LABEL[type] };
}
function estimateFare(origin, dest, type) {
  const r = regionOfAirport(airportById[dest]);
  const base = { '대한민국': 95000, '일본': 310000, '동북아시아': 520000, '동남아시아': 900000, '괌/오세아니아': 1120000, '미주': 2200000, '유럽': 2100000, '러시아/몽골/중앙아시아': 790000, '중동/아프리카': 1250000 }[r] || 520000;
  const mul = { low_cost: .84, standard: 1, major: 1.14 }[type] || 1;
  return round1000(base * mul);
}
function estimateDuration(origin, dest) {
  const r = regionOfAirport(airportById[dest]);
  return { '대한민국': 70, '일본': 135, '동북아시아': 190, '동남아시아': 350, '괌/오세아니아': 520, '미주': 690, '유럽': 760, '러시아/몽골/중앙아시아': 230, '중동/아프리카': 600 }[r] || 210;
}
function synthFlight(type, origin, dest, date, base, idx) {
  const airline = airlineForType(type, idx + (type === 'standard' ? 3 : type === 'major' ? 6 : 0));
  const departTimes = { low_cost: '08:20', standard: '13:35', major: '19:05' };
  const duration = base?.duration_minutes || estimateDuration(origin, dest);
  const depart = departTimes[type] || '12:00';
  const arrive = addMinutesToTime(depart, duration);
  const baseFare = base?.base_fare_krw ? round1000(base.base_fare_krw * ({low_cost:.92, standard:1.02, major:1.15}[type] || 1)) : estimateFare(origin, dest, type);
  return {
    flight_id: `DEMO-${type}-${origin}-${dest}-${date}`,
    synthetic: true,
    airline_id: airline.airline_id,
    airline_name: airline.airline_name,
    airline_type: type,
    airline_type_ko: TYPE_LABEL[type],
    flight_number: `${airline.airline_id}${String(320 + idx * 7 + TYPE_ORDER.indexOf(type)).padStart(3,'0')}`,
    departure_airport_id: origin,
    departure_city_ko: airportById[origin]?.city_ko || origin,
    departure_airport_name_ko: airportById[origin]?.airport_name_ko || origin,
    departure_country_ko: airportById[origin]?.country_ko || '',
    arrival_airport_id: dest,
    arrival_city_ko: airportById[dest]?.city_ko || dest,
    arrival_airport_name_ko: airportById[dest]?.airport_name_ko || dest,
    arrival_country_ko: airportById[dest]?.country_ko || '',
    route_region: regionOfAirport(airportById[dest]),
    departure_at: `${date}T${depart}:00+09:00`,
    arrival_at: `${date}T${arrive}:00+09:00`,
    duration_minutes: duration,
    aircraft: type === 'major' ? 'Cloudliner 990' : type === 'standard' ? 'AeroLite 330' : 'SkyMango 300',
    base_fare_krw: baseFare,
    available_seats: type === 'low_cost' ? 18 : type === 'standard' ? 34 : 52,
    status: 'scheduled',
    is_active: true
  };
}
function getOptions(origin, dest, date) {
  const exact = allFlights.filter(f => f.departure_airport_id === origin && f.arrival_airport_id === dest);
  const options = TYPE_ORDER.map((type, idx) => {
    const exactForType = exact.find(f => f.airline_type === type && !f._used);
    if (exactForType) { exactForType._used = true; return {...exactForType}; }
    const base = exact[0] || allFlights.find(f => f.arrival_airport_id === dest) || allFlights.find(f => f.route_region === regionOfAirport(airportById[dest]));
    return synthFlight(type, origin, dest, date, base, idx);
  });
  exact.forEach(f => delete f._used);
  return options;
}
function currentOutboundOptions() { return getOptions(state.origin, state.destination, state.departDate); }
function currentInboundOptions() { return getOptions(state.destination, state.origin, state.returnDate); }
function selectedOutbound() { return currentOutboundOptions().find(f => f.flight_id === state.outboundId) || null; }
function selectedInbound() { return currentInboundOptions().find(f => f.flight_id === state.inboundId) || null; }
function selectedFare() { return fareRules.find(f => f.id === state.fareId) || fareRules[1]; }
function sectors() { return state.tripType === 'roundtrip' ? ['outbound', 'inbound'] : ['outbound']; }
function sectorLabel(sector) { return sector === 'outbound' ? '가는 편' : '오는 편'; }
function flightForSector(sector) { return sector === 'outbound' ? selectedOutbound() : selectedInbound(); }
function dateForSector(sector) { return sector === 'outbound' ? state.departDate : state.returnDate; }
function sectorRouteLabel(sector) {
  const f = flightForSector(sector);
  if (!f) return sectorLabel(sector);
  return `${f.departure_airport_id} → ${f.arrival_airport_id}`;
}
function buildPassengerSlots() {
  const slots = [];
  for (let i=1; i<=state.pax.adult; i++) slots.push({ id:`adult-${i}`, type:'adult', typeKo:'성인', index:i, label:`성인 ${i}` });
  for (let i=1; i<=state.pax.child; i++) slots.push({ id:`child-${i}`, type:'child', typeKo:'소아', index:i, label:`소아 ${i}` });
  for (let i=1; i<=state.pax.infant; i++) slots.push({ id:`infant-${i}`, type:'infant', typeKo:'유아', index:i, label:`유아 ${i}` });
  return slots;
}
function syncPassengers() {
  const prev = Object.fromEntries((state.passengerProfiles || []).map(p => [p.id, p]));
  state.passengerProfiles = buildPassengerSlots().map(slot => {
    const old = prev[slot.id] || {};
    const legacy = slot.id === 'adult-1' ? state.passenger : {};
    return {
      ...slot,
      lastName: old.lastName ?? legacy.lastName ?? '',
      firstName: old.firstName ?? legacy.firstName ?? '',
      phone: old.phone ?? legacy.phone ?? ''
    };
  });
  const validIds = new Set(state.passengerProfiles.map(p => p.id));
  ['outbound','inbound'].forEach(sector => {
    state.meals[sector] ||= {};
    state.seats[sector] ||= {};
    Object.keys(state.meals[sector]).forEach(id => { if (!validIds.has(id)) delete state.meals[sector][id]; });
    Object.keys(state.seats[sector]).forEach(id => { if (!validIds.has(id)) delete state.seats[sector][id]; });
    state.passengerProfiles.forEach(p => {
      if (p.type !== 'infant' && state.meals[sector][p.id] == null) state.meals[sector][p.id] = 'none';
    });
  });
  sanitizeMeals();
  if (!seatPassengers().find(p => p.id === state.seatTargetBySector.outbound)) state.seatTargetBySector.outbound = seatPassengers()[0]?.id || '';
  if (!seatPassengers().find(p => p.id === state.seatTargetBySector.inbound)) state.seatTargetBySector.inbound = seatPassengers()[0]?.id || '';
  if (!seatPassengers().find(p => p.id === state.mealTarget.passengerId)) state.mealTarget.passengerId = seatPassengers()[0]?.id || '';
}
function passengerList() { syncPassengers(); return state.passengerProfiles; }
function seatPassengers() { return state.passengerProfiles.filter(p => p.type !== 'infant'); }
function passengerById(id) { return passengerList().find(p => p.id === id); }
function passengerSummary() {
  const p = state.pax;
  const parts = [`성인 ${p.adult}`];
  if (p.child) parts.push(`소아 ${p.child}`);
  if (p.infant) parts.push(`유아 ${p.infant}`);
  return parts.join(', ');
}
function passengerUnits() { return state.pax.adult + state.pax.child * 0.75 + state.pax.infant * 0.10; }
function seatPassengerCount() { return state.pax.adult + state.pax.child; }
function sectorCount() { return sectors().length; }
function fareBaseTotal() {
  const out = selectedOutbound();
  const inbound = state.tripType === 'roundtrip' ? selectedInbound() : null;
  return ((out ? displayFare(out) : 0) + (inbound ? displayFare(inbound) : 0)) * passengerUnits();
}
function fareAddTotal() { return selectedFare().add * Math.max(1, seatPassengerCount()); }
function mealAvailable() { return selectedFare().meal; }
function mealFor(sector, passengerId) {
  const id = state.meals[sector]?.[passengerId] || 'none';
  return mealOptions.find(m => m.id === id) || mealOptions[0];
}
function mealIsSelectable(meal, passenger) {
  if (!meal) return false;
  if (meal.id === 'none') return true;
  if (!passenger || passenger.type === 'infant') return false;
  if (meal.childOnly) return passenger.type === 'child';
  return true;
}
function sanitizeMeals() {
  if (!mealAvailable()) {
    ['outbound','inbound'].forEach(sector => { state.meals[sector] = {}; });
    return;
  }
  ['outbound','inbound'].forEach(sector => {
    state.meals[sector] ||= {};
    state.passengerProfiles.filter(p => p.type !== 'infant').forEach(p => {
      const meal = mealOptions.find(m => m.id === state.meals[sector][p.id]) || mealOptions[0];
      if (!mealIsSelectable(meal, p)) state.meals[sector][p.id] = 'none';
    });
  });
}
function selectedMealEntries() {
  if (!mealAvailable()) return [];
  const entries = [];
  sectors().forEach(sector => {
    seatPassengers().forEach(p => {
      const meal = mealFor(sector, p.id);
      if (meal && meal.id !== 'none') entries.push({ sector, passenger: p, meal });
    });
  });
  return entries;
}
function mealQuantity() { return selectedMealEntries().length; }
function mealTotal() {
  if (!mealAvailable() || selectedFare().id === 'flex') return 0;
  return selectedMealEntries().reduce((sum, e) => sum + (e.meal.price || 0), 0);
}
function mealAggregates() {
  const map = new Map();
  selectedMealEntries().forEach(({meal}) => {
    const cur = map.get(meal.id) || { meal, count: 0, total: 0 };
    cur.count += 1;
    cur.total += meal.price || 0;
    map.set(meal.id, cur);
  });
  return Array.from(map.values());
}
function mealPriceLabel(meal, passenger) {
  if (!meal || meal.id === 'none') return '₩0';
  if (!mealIsSelectable(meal, passenger)) return '선택 불가';
  if (selectedFare().id === 'flex') return 'Flex 무료';
  return won(meal.price || 0);
}
function mealSummaryLabel() {
  if (!mealAvailable()) return '선택 불가';
  const qty = mealQuantity();
  if (!qty) return '선택 안 함';
  if (selectedFare().id === 'flex') return `${qty}개 선택 · Flex 무료 포함`;
  return `${qty}개 선택 · ${won(mealTotal())}`;
}
function fuelTaxTotal() { return 12000 * sectorCount() * Math.max(1, state.pax.adult + state.pax.child + state.pax.infant); }
function totalPrice() { return fareBaseTotal() + fareAddTotal() + mealTotal() + fuelTaxTotal(); }
function go(step) {
  state.screen = 'booking'; state.step = step; syncPassengers(); if (step === 3) ensureSeatDefaults();
  // ★ 단계별 이탈률: 각 단계 진입 시 집계
  const stepNames = { 0:'검색', 1:'항공편선택', 2:'탑승객입력', 3:'좌석선택', 4:'기내식선택', 5:'결제확인', 6:'발권완료' };
  safeGtag('event', 'funnel_step', { step_number: step, step_name: stepNames[step] || step });
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function renderProgress() {
  if (state.screen !== 'booking') { progress.classList.add('hidden'); progress.innerHTML = ''; return; }
  progress.classList.remove('hidden');
  progress.innerHTML = Array.from({length:7}).map((_,i)=>`<div class="dot ${i<=state.step?'active':''}"></div>`).join('');
}
function resetSearchSelection() {
  state.outboundId = null;
  state.inboundId = null;
  state.seat = '';
  state.seats = { outbound: {}, inbound: {} };
}
function swapRoute() { const o = state.origin; state.origin = state.destination; state.destination = o; resetSearchSelection(); render(); }
function modalSwapRoute() { const o = state.origin; state.origin = state.destination; state.destination = o; renderModal(); render(); }
function setTripType(type) { state.tripType = type; if (type === 'oneway') state.inboundId = null; syncPassengers(); render(); }
function updatePassenger(key, value) { state.passenger[key] = value; }
function formatPhoneNumber(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
function isNameValid(value) {
  return /^[가-힣a-zA-Z]+$/.test(String(value || '').trim());
}
function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}
function isPhoneValid(value) {
  return /^\d{11}$/.test(phoneDigits(value));
}
function isPassengerInfoValid() {
  return passengerList().every(p =>
    isNameValid(p.lastName) &&
    isNameValid(p.firstName) &&
    isPhoneValid(p.phone)
  );
}
function passengerFieldError(p, key) {
  if (!state.passengerValidationAttempted) return '';
  const value = String(p?.[key] || '').trim();
  if (!value) return '필수 입력';
  if ((key === 'lastName' || key === 'firstName') && !isNameValid(value)) return '한글 또는 영어만 입력';
  if (key === 'phone' && !isPhoneValid(value)) return '전화번호 숫자 11자리 입력';
  return '';
}
function passengerFieldClass(p, key) {
  return passengerFieldError(p, key) ? ' invalid' : '';
}
function updatePassengerFieldUi(inputEl, p, key) {
  if (!inputEl) return;
  const field = inputEl.closest('.field');
  if (!field) return;
  const error = passengerFieldError(p, key);
  field.classList.toggle('invalid', !!error);
  const msg = field.querySelector('.field-error');
  if (msg) msg.textContent = error;
}
function updatePassengerProfile(id, key, value, inputEl) {
  syncPassengers();
  const p = state.passengerProfiles.find(item => item.id === id);
  if (!p) return;
  p[key] = key === 'phone' ? formatPhoneNumber(value) : String(value || '');
  if (inputEl && key === 'phone') inputEl.value = p[key];
  if (id === 'adult-1') state.passenger[key] = p[key];
  updatePassengerFieldUi(inputEl, p, key);
}
function handlePassengerInfoNext() {
  state.passengerValidationAttempted = true;
  if (!isPassengerInfoValid()) { render(); return; }
  go(3);
}
function makeBookingCode() { state.bookingCode = 'AM' + Math.random().toString(36).slice(2,8).toUpperCase(); }
function canProceedFare() { return !!selectedOutbound() && (state.tripType === 'oneway' || !!selectedInbound()); }
function sectorSeatComplete(sector) {
  return seatPassengers().every(p => !!state.seats[sector]?.[p.id]);
}
function canProceedSeats() {
  ensureSeatDefaults();
  return sectors().every(sector => sectorSeatComplete(sector));
}
function nextStepAfterSeats() {
  if (mealAvailable()) go(4);
  else go(5);
}
function safeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|#%&{}$!`'@+= ]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';
}
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function boardingPassItems() {
  const items = [];
  sectors().forEach(sector => {
    const f = flightForSector(sector);
    passengerList().forEach(p => items.push({ index: items.length, sector, f, p }));
  });
  return items;
}
function boardingPassFileName(item) {
  const booking = safeFilePart(state.bookingCode || 'DEMO');
  const sector = item.sector === 'outbound' ? 'OUT' : 'IN';
  const route = item.f ? safeFilePart(`${item.f.departure_airport_id}-${item.f.arrival_airport_id}`) : 'ROUTE';
  const passenger = safeFilePart(item.p?.id || `PAX-${item.index + 1}`);
  return `WishBoardingPass_v16_${booking}_${String(item.index + 1).padStart(2, '0')}_${sector}_${route}_${passenger}.png`;
}
function testCanvasDownloadable(canvas) {
  try { canvas.toDataURL('image/png'); return true; }
  catch (e) { return false; }
}
function imageFromSrc(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function drawFallbackQr(ctx, x, y, size) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#111827';
  const cells = 25;
  const cell = size / cells;
  function finder(cx, cy) {
    ctx.fillRect(x + cx * cell, y + cy * cell, cell * 7, cell * 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + (cx + 1) * cell, y + (cy + 1) * cell, cell * 5, cell * 5);
    ctx.fillStyle = '#111827'; ctx.fillRect(x + (cx + 2) * cell, y + (cy + 2) * cell, cell * 3, cell * 3);
  }
  finder(1, 1); finder(17, 1); finder(1, 17);
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 16) || (r > 16 && c < 8)) continue;
      if (((r * 7 + c * 11 + r * c) % 5) < 2) ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}
function setCanvasFont(ctx, weight, size) {
  ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, Segoe UI, Pretendard, Apple SD Gothic Neo, sans-serif`;
}
function ellipsizeCanvasText(ctx, text, maxWidth) {
  const raw = String(text ?? '');
  if (ctx.measureText(raw).width <= maxWidth) return raw;
  let out = raw;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1);
  return out + '…';
}
function drawFitText(ctx, text, x, y, maxWidth, weight = 900, startSize = 24, minSize = 16, align = 'left') {
  const raw = String(text ?? '');
  let size = startSize;
  ctx.textAlign = align;
  setCanvasFont(ctx, weight, size);
  while (size > minSize && ctx.measureText(raw).width > maxWidth) {
    size -= 1;
    setCanvasFont(ctx, weight, size);
  }
  ctx.fillText(ellipsizeCanvasText(ctx, raw, maxWidth), x, y);
  return size;
}
function drawQrToCanvas(ctx, x, y, size, labelSize = 12) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, size, size);
  if (QR_IMAGE_OBJECT.complete && QR_IMAGE_OBJECT.naturalWidth > 0) ctx.drawImage(QR_IMAGE_OBJECT, x, y, size, size);
  else drawFallbackQr(ctx, x, y, size);
  ctx.restore();
  if (labelSize) {
    ctx.fillStyle = '#667085';
    setCanvasFont(ctx, 900, labelSize);
    ctx.textAlign = 'center';
    ctx.fillText('WISH DEMO QR', x + size / 2, y + size + Math.max(6, Math.round(labelSize * .55)));
    ctx.textAlign = 'left';
  }
}
function drawCanvasLabelValue(ctx, label, value, x, y, maxWidth = 300) {
  ctx.fillStyle = '#667085';
  setCanvasFont(ctx, 800, 17);
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);
  ctx.fillStyle = '#101828';
  drawFitText(ctx, value, x, y + 28, maxWidth, 900, 25, 17, 'left');
}
function createBoardingPassFallbackCanvas(el) {
  const index = Number(String(el?.id || '').replace('boarding-pass-', '')) || 0;
  const item = boardingPassItems()[index] || boardingPassItems()[0];
  if (!item || !item.f || !item.p) throw new Error('저장할 보딩패스 정보를 찾지 못했습니다.');
  const f = item.f;
  const p = item.p;
  const sector = item.sector;
  const seat = p.type === 'infant' ? 'INF' : (state.seats[sector]?.[p.id] || '-');
  const meal = p.type === 'infant' ? null : mealFor(sector, p.id);
  const hasMeal = mealAvailable() && meal && meal.id !== 'none';

  const W = 790, H = 1220;  // 내부 드로잉 좌표계 (기존 유지)
  const PAD = 40;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  // 배경은 투명 – roundRectPath로 clip 후 흰 카드만 그림
  roundRectPath(ctx, 0, 0, W, H, 56);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // ── Header ──────────────────────────────────────────────────────────────
  const HDR_H = 138;
  roundRectPath(ctx, 0, 0, W, HDR_H, 56);
  ctx.fillStyle = '#101828';
  ctx.fill();
  // clip bottom of header to straight edge
  ctx.fillRect(0, HDR_H - 56, W, 56);

  ctx.fillStyle = '#ffffff';
  setCanvasFont(ctx, 900, 27);
  ctx.textAlign = 'left';
  ctx.fillText(`BOARDING PASS`, PAD, 32);
  setCanvasFont(ctx, 500, 20);
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.fillText(sectorLabel(sector).toUpperCase(), PAD, 68);

  // WISH pill
  const WISH_X = W - PAD - 148, PILL_Y = 36;
  roundRectPath(ctx, WISH_X, PILL_Y, 60, 32, 16);
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.32)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  setCanvasFont(ctx, 800, 15);
  ctx.textAlign = 'center';
  ctx.fillText('WISH', WISH_X + 30, PILL_Y + 9);

  // DEMO pill
  const DEMO_X = W - PAD - 76;
  roundRectPath(ctx, DEMO_X, PILL_Y, 64, 32, 16);
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.strokeStyle = '#fb923c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  setCanvasFont(ctx, 900, 15);
  ctx.textAlign = 'center';
  ctx.fillText('DEMO', DEMO_X + 32, PILL_Y + 9);

  // ── Passenger ───────────────────────────────────────────────────────────
  const PAX_Y = 158;
  ctx.fillStyle = '#98a2b3';
  setCanvasFont(ctx, 700, 22);          // 구조 레이블 – 크기 유지
  ctx.textAlign = 'left';
  ctx.fillText('PASSENGER', PAD, PAX_Y);
  ctx.fillStyle = '#101828';
  drawFitText(ctx, passengerName(p), PAD, PAX_Y + 30, W - PAD * 2, 900, 44, 32, 'left'); // 데이터 +6 (38→44)

  // ── DEMO watermark ───────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(249,115,22,.075)';
  ctx.translate(W / 2 + 30, 340);
  ctx.rotate(-0.30);
  setCanvasFont(ctx, 900, 88);
  ctx.textAlign = 'center';
  ctx.fillText('DEMO', 0, 0);
  ctx.restore();

  // ── Route ───────────────────────────────────────────────────────────────
  const ROUTE_Y = 248;
  const CODE_SIZE = 66, CITY_SIZE = 30; // 도시명 데이터 +6 (24→30); 공항코드 유지

  // Departure (left)
  ctx.fillStyle = '#101828';
  drawFitText(ctx, f.departure_airport_id, PAD, ROUTE_Y, 230, 900, CODE_SIZE, 48, 'left');
  ctx.fillStyle = '#667085';
  drawFitText(ctx, airportLabel(f.departure_airport_id), PAD, ROUTE_Y + 74, 230, 600, CITY_SIZE, 20, 'left');

  // Arrival (right)
  ctx.fillStyle = '#101828';
  drawFitText(ctx, f.arrival_airport_id, W - PAD, ROUTE_Y, 230, 900, CODE_SIZE, 48, 'right');
  ctx.fillStyle = '#667085';
  drawFitText(ctx, airportLabel(f.arrival_airport_id), W - PAD, ROUTE_Y + 74, 230, 600, CITY_SIZE, 20, 'right');

  // Plane icon + lines
  const MID_X = W / 2;
  ctx.fillStyle = '#2563eb';
  setCanvasFont(ctx, 900, 30);
  ctx.textAlign = 'center';
  ctx.fillText('✈', MID_X, ROUTE_Y + 20);
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(PAD + 220, ROUTE_Y + 36); ctx.lineTo(MID_X - 28, ROUTE_Y + 36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(MID_X + 28, ROUTE_Y + 36); ctx.lineTo(W - PAD - 220, ROUTE_Y + 36); ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';

  // ── Ticket tear divider ──────────────────────────────────────────────────
  const DIV_Y = 388;
  ctx.strokeStyle = '#dde1e9';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([9, 7]);
  ctx.beginPath(); ctx.moveTo(36, DIV_Y); ctx.lineTo(W - 36, DIV_Y); ctx.stroke();
  ctx.setLineDash([]);
  // Circle notches – 투명 구멍 효과 (destination-out)
  [0, W].forEach(cx => {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, DIV_Y, 24, 0, Math.PI * 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#dde1e9'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  });

  // ── Fields grid ──────────────────────────────────────────────────────────
  // 2 columns, 3 rows. Left col x=PAD, right col x=W/2+12
  const FIELD_Y0 = 422;
  const FIELD_ROW_H = 122;  // 116→122 (더 큰 값 텍스트 44px 여백 확보)
  const COL_L = PAD;          // left column start x
  const COL_R = W / 2 + 14;   // right column start x
  const COL_W = W / 2 - PAD - 24; // each column max width

  const fieldRows = [
    [['FLIGHT', f.flight_number], ['SEAT', seat]],
    [['DATE', dateForSector(sector)], ['GATE', 'D' + ((index * 7 + 7) % 20 + 1)]],
    [['BOARDING', fmtTime(f.departure_at)], ['BOOKING', state.bookingCode || 'DEMO']],
  ];

  fieldRows.forEach(([leftField, rightField], ri) => {
    const fy = FIELD_Y0 + ri * FIELD_ROW_H;
    [[leftField, COL_L], [rightField, COL_R]].forEach(([[lbl, val], cx]) => {
      // Label: 구조 레이블 – 크기 유지 (20px)
      ctx.fillStyle = '#98a2b3';
      setCanvasFont(ctx, 700, 20);
      ctx.textAlign = 'left';
      ctx.fillText(lbl, cx, fy);
      // Value: 데이터 +6 (38→44)
      ctx.fillStyle = '#101828';
      drawFitText(ctx, String(val), cx, fy + 26, COL_W, 900, 44, 30, 'left');
    });
  });

  // Vertical separator between columns
  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 2, FIELD_Y0 - 8);
  ctx.lineTo(W / 2 + 2, FIELD_Y0 + fieldRows.length * FIELD_ROW_H - 20);
  ctx.stroke();

  // Meal field (full width, if applicable)
  let nextY = FIELD_Y0 + fieldRows.length * FIELD_ROW_H;
  if (hasMeal) {
    ctx.strokeStyle = '#e4e7ec';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(PAD, nextY - 14); ctx.lineTo(W - PAD, nextY - 14); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#98a2b3';
    setCanvasFont(ctx, 700, 20);          // 구조 레이블 – 크기 유지
    ctx.textAlign = 'left';
    ctx.fillText('MEAL', PAD, nextY + 2);
    ctx.fillStyle = '#101828';
    drawFitText(ctx, `기내식 · ${meal.title}`, PAD, nextY + 26, W - PAD * 2, 900, 26, 18, 'left'); // 기내식 폰트 크게 줄임 (26px)
    nextY += 86;
  }

  // ── QR section ───────────────────────────────────────────────────────────
  const QR_Y = Math.max(nextY + 28, 760);
  const QR_SIZE = 156;
  const QR_X = (W - QR_SIZE) / 2;

  // QR background card
  roundRectPath(ctx, QR_X - 20, QR_Y - 14, QR_SIZE + 40, QR_SIZE + 50, 22);
  ctx.fillStyle = '#f8fbff';
  ctx.fill();
  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawQrToCanvas(ctx, QR_X, QR_Y, QR_SIZE, 14);

  // ── Footer ───────────────────────────────────────────────────────────────
  const FOOTER_Y = Math.max(QR_Y + QR_SIZE + 60, 960);
  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, FOOTER_Y); ctx.lineTo(W - PAD, FOOTER_Y); ctx.stroke();

  ctx.fillStyle = 'rgba(17,28,61,.45)';
  setCanvasFont(ctx, 800, 14);
  ctx.textAlign = 'left';
  drawFitText(ctx, 'WISH BOARDING PASS · DEMO ONLY · 결제 없이 여행 목표만 저장했습니다', PAD, FOOTER_Y + 16, W - PAD * 2, 800, 14, 11, 'left');
  ctx.fillStyle = '#667085';
  setCanvasFont(ctx, 500, 15);
  drawFitText(ctx, '오늘은 결제하지 않고, 마음만 먼저 발권했어요.', PAD, FOOTER_Y + 42, W - PAD * 2, 500, 15, 12, 'left');

  // ── 실제 콘텐츠 높이 기준으로 카드 클립 (빈 공백 제거) ──────────────
  const contentH = FOOTER_Y + 60;  // 푸터 텍스트 끝 + 여백
  ctx.globalCompositeOperation = 'destination-in';
  roundRectPath(ctx, 0, 0, W, contentH, 56);  // 실제 높이로 둥근 모서리 클립
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // ── 1080×1350 출력 (비율 유지 균일 스케일, 좌우 중앙 배치) ──────────
  const outCanvas = document.createElement('canvas');
  outCanvas.width = 1080;
  outCanvas.height = 1350;
  const outCtx = outCanvas.getContext('2d');
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, 1080, 1350);  // 흰 배경
  const scale = Math.min(1080 / W, 1350 / contentH);  // 비율 유지 스케일
  const scaledW = Math.round(W * scale);
  const scaledH = Math.round(contentH * scale);
  const ox = Math.round((1080 - scaledW) / 2);  // 좌우 중앙
  const oy = Math.round((1350 - scaledH) / 2);  // 상하 중앙
  outCtx.drawImage(canvas, 0, 0, W, contentH, ox, oy, scaledW, scaledH);
  return outCanvas;
}
function createBoardingPassCanvas(el) {
  return createBoardingPassFallbackCanvas(el);
}
function triggerPngDownload(canvas, fileName) {
  let dataUrl = '';
  try {
    dataUrl = canvas.toDataURL('image/png');
  } catch (error) {
    alert('PNG 저장용 이미지를 만드는 중 오류가 발생했습니다.');
    return false;
  }

  const ua = navigator.userAgent || '';
  const isInAppBrowser = /KAKAOTALK|Instagram|FBAN|FBAV|Line|NAVER|DaumApps/i.test(ua);
  const supportsDownload = 'download' in document.createElement('a');

  if (supportsDownload && !isInAppBrowser) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  }

  const opened = window.open('', '_blank');
  if (opened) {
    opened.document.open();
    opened.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${fileName}</title><style>body{margin:0;background:#f8fbff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#101828}main{min-height:100vh;display:grid;place-items:center;padding:18px}img{max-width:100%;height:auto;border-radius:22px;box-shadow:0 18px 50px rgba(15,23,42,.18)}p{font-weight:800;text-align:center;line-height:1.5}</style></head><body><main><div><p>이미지를 길게 눌러 저장하거나, 브라우저 공유/저장 메뉴를 사용해 주세요.</p><img src="${dataUrl}" alt="${fileName}"></div></main></body></html>`);
    opened.document.close();
    return true;
  }

  location.href = dataUrl;
  return true;
}
function downloadBoardingPassPng(index) {
  const el = document.getElementById(`boarding-pass-${index}`);
  if (!el) { alert('저장할 보딩패스를 찾지 못했습니다.'); return; }
  try {
    const canvas = createBoardingPassCanvas(el);
    triggerPngDownload(canvas, el.dataset.fileName || `WishBoardingPass_${index + 1}.png`);
  } catch (error) {
    alert(error.message || 'PNG 저장 중 오류가 발생했습니다.');
  }
}
function downloadAllBoardingPassPng() {
  const cards = Array.from(document.querySelectorAll('.boarding-pass-capture'));
  if (!cards.length) { alert('저장할 보딩패스가 없습니다.'); return; }
  try {
    cards.forEach((card, i) => {
      const canvas = createBoardingPassCanvas(card);
      triggerPngDownload(canvas, card.dataset.fileName || `WishBoardingPass_${i + 1}.png`);
    });
    if (cards.length > 1) alert(`${cards.length}개의 PNG 저장 요청을 완료했습니다. 브라우저가 여러 파일 다운로드 허용을 물으면 허용을 눌러 주세요.`);
  } catch (error) {
    alert(error.message || '전체 PNG 저장 중 오류가 발생했습니다.');
  }
}
function routeWishText() {
  const f = selectedOutbound() || currentOutboundOptions()[0];
  return `${airportLabel(state.origin)} → ${airportLabel(state.destination || f?.arrival_airport_id || '')}`;
}
function updateShareMessage(value) { state.shareMessage = value; }
function setShareMessage(index) {
  state.shareMessage = SHARE_MESSAGES[index] || DEFAULT_SHARE_MESSAGE;
  render();
}
function shareMessageButtonsHtml() {
  return `<div class="share-message-buttons">${SHARE_MESSAGES.map((message, index) => `<button type="button" class="share-message-chip ${String(state.shareMessage || DEFAULT_SHARE_MESSAGE) === message ? 'active' : ''}" onclick="setShareMessage(${index})">문구 ${index + 1}</button>`).join('')}</div>`;
}
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const paragraphs = String(text || '').split('\n');
  for (const para of paragraphs) {
    let line = '';
    const chars = Array.from(para);
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = ch;
      } else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lineHeight; }
    else y += lineHeight;
  }
  return y;
}
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function drawRightValue(ctx, label, value, x1, x2, y, labelSize = 21, valueSize = 21) {
  ctx.fillStyle = '#667085';
  setCanvasFont(ctx, 900, labelSize);
  ctx.textAlign = 'left';
  ctx.fillText(label, x1, y);
  ctx.fillStyle = '#101828';
  drawFitText(ctx, value, x2, y, Math.max(120, x2 - x1 - 250), 900, valueSize, Math.max(15, valueSize - 5), 'right');
  ctx.textAlign = 'left';
}
function drawNoSpendSocialCard(ctx, x, y, w, h, compact=false) {
  const f = selectedOutbound() || currentOutboundOptions()[0];
  roundRectPath(ctx, x, y, w, h, compact ? 36 : 48);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const pad = compact ? 34 : 42;

  // ── Title ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#101828';
  setCanvasFont(ctx, 900, compact ? 27 : 33);  // +5 (22→27, 28→33)
  ctx.textAlign = 'left';
  ctx.fillText('오늘의 무지출 발권 완료', x + pad, y + (compact ? 32 : 40));
  ctx.fillStyle = '#667085';
  setCanvasFont(ctx, 500, compact ? 19 : 21);  // +5 (14→19, 16→21)
  drawFitText(ctx, '결제하지 않고, 언젠가의 여행 목표를 먼저 남겼어요.', x + pad, y + (compact ? 66 : 84), w - pad * 2, 500, compact ? 19 : 21, 14, 'left');

  // ── Airport codes (fixed 38→43px) ────────────────────────────────────────
  const codeY = y + (compact ? 118 : 144);  // 행 내용 커져서 시작점 아래로
  const CODE_SIZE = 43;                      // +5 (38→43)
  const cityOffset = CODE_SIZE + 10;

  ctx.fillStyle = '#101828';
  drawFitText(ctx, f.departure_airport_id, x + pad, codeY, compact ? 200 : 240, 900, CODE_SIZE, 33, 'left');
  ctx.fillStyle = '#101828';
  drawFitText(ctx, f.arrival_airport_id, x + w - pad, codeY, compact ? 200 : 240, 900, CODE_SIZE, 33, 'right');
  ctx.fillStyle = '#2563eb';
  drawFitText(ctx, '✈', x + w / 2, codeY + 8, 60, 900, compact ? 26 : 30, 20, 'center');

  ctx.fillStyle = '#667085';
  drawFitText(ctx, airportLabel(f.departure_airport_id), x + pad, codeY + cityOffset, compact ? 220 : 260, 500, compact ? 20 : 22, 14, 'left');  // +5 (15→20, 17→22)
  drawFitText(ctx, airportLabel(f.arrival_airport_id), x + w - pad, codeY + cityOffset, compact ? 220 : 260, 500, compact ? 20 : 22, 14, 'right');
  ctx.textAlign = 'left';

  // Thin separator line before info rows
  const sepY = codeY + cityOffset + (compact ? 30 : 36);
  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + pad, sepY);
  ctx.lineTo(x + w - pad, sepY);
  ctx.stroke();

  // ── Info rows ─────────────────────────────────────────────────────────────
  const fullRight = x + w - pad;
  const rowStart  = y + (compact ? 260 : 330);  // 콘텐츠 커진 만큼 아래로
  const rowGap    = compact ? 44 : 50;           // +8/+6 (36→44, 44→50)
  const rowFontSz = compact ? 22 : 25;           // +5 (17→22, 20→25)

  const rows = [
    ['실제 결제 금액', '0원'],
    ['아낀 금액',      won(totalPrice())],
    ['대신 저장한 여행', routeWishText()],
    ['상태',          '언젠가 꼭 가기'],
  ];

  rows.forEach(([label, value], i) => {
    const ry = rowStart + i * rowGap;
    // label: left-aligned from left pad
    ctx.fillStyle = '#667085';
    setCanvasFont(ctx, 700, rowFontSz);
    ctx.textAlign = 'left';
    ctx.fillText(label, x + pad, ry);
    // value: right-aligned to the full card right edge
    ctx.fillStyle = '#101828';
    drawFitText(ctx, value, fullRight, ry, w - pad * 2 - 80, 900, rowFontSz, compact ? 13 : 15, 'right');
  });

  // ── QR (bottom-right, positioned BELOW all rows) ──────────────────────────
  const qrSize = compact ? 88 : 112;
  const qrX = x + w - pad - qrSize;
  const qrY = y + h - (compact ? 128 : 158);

  roundRectPath(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + (compact ? 30 : 36), 16);
  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1;
  ctx.stroke();
  drawQrToCanvas(ctx, qrX, qrY, qrSize, compact ? 10 : 12);

  // ── Return trip text (bottom-left, limited to not reach QR) ──────────────
  ctx.fillStyle = '#1d4ed8';
  setCanvasFont(ctx, 900, compact ? 15 : 19);
  const returnText = state.tripType === 'roundtrip'
    ? `복귀 위시: ${airportLabel(state.destination)} → ${airportLabel(state.origin)}`
    : '편도 위시 보딩패스';
  const returnMaxW = qrX - x - pad - 20;
  drawFitText(ctx, returnText, x + pad, y + h - (compact ? 42 : 52), returnMaxW, 900, compact ? 20 : 24, 14, 'left'); // +5 (15→20, 19→24)
}
function downloadSocialImage(kind) {
  // ★ 핵심: PNG 저장 수 / 분석: 저장 포맷별 클릭률
  safeGtag('event', 'save_png', {
    save_format: kind === 'story' ? 'story_1080x1902' : 'square_1080x1080'
  });
  const f = selectedOutbound() || currentOutboundOptions()[0];
  if (!f) { alert('저장할 여정 정보를 찾지 못했습니다.'); return; }
  try {
    const W = 1080;
    const H = kind === 'story' ? 1902 : 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#2d6fed'); bg.addColorStop(.58, '#39b7e9'); bg.addColorStop(1, '#c7ecfb');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.beginPath(); ctx.arc(W - 100, 96, 242, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(90, H - 110, 270, 0, Math.PI * 2); ctx.fill();
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff'; ctx.font = `900 ${kind === 'story' ? 50 : 36}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    ctx.fillText('여행 위시 보딩패스', 78, kind === 'story' ? 86 : 62);
    ctx.font = `900 ${kind === 'story' ? 24 : 19}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    ctx.fillText('Wish Boarding Pass · DEMO ONLY', 78, kind === 'story' ? 166 : 116);
    ctx.font = `900 ${kind === 'story' ? 56 : 36}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
    const msgY = kind === 'story' ? 285 : 180;
    drawWrappedText(ctx, state.shareMessage || DEFAULT_SHARE_MESSAGE, 78, msgY, W - 156, kind === 'story' ? 70 : 46);
    if (kind === 'story') {
      drawNoSpendSocialCard(ctx, 72, 690, 936, 710, false);
      ctx.fillStyle = '#ffffff'; ctx.font = '900 24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText('오늘은 결제하지 말고, 여행 위시를 먼저 저장하세요.', 78, H - 154);
    } else {
      drawNoSpendSocialCard(ctx, 66, 408, 948, 610, true);
    }
    triggerPngDownload(canvas, `WishBoardingPass_v16_${kind}_${safeFilePart(state.bookingCode || 'DEMO')}.png`);
  } catch (error) { alert(error.message || 'SNS 이미지 저장 중 오류가 발생했습니다.'); }
}
function startWishBoardingPass() {
  safeGtag('event', 'boarding_pass_start'); // ★ 핵심: 보딩패스 만들기 클릭 수
  state.screen = 'booking'; state.step = 0; render(); window.scrollTo({ top:0, behavior:'smooth' });
}
function startTravelTest() {
  safeGtag('event', 'quiz_start'); // ★ 퀴즈 시작
  state.screen = 'quiz'; state.quizStep = 0; state.quizAnswers = {}; state.recommendation = null; render(); window.scrollTo({ top:0, behavior:'smooth' });
}
function resetToHome() { state.screen = 'home'; state.step = 0; render(); window.scrollTo({ top:0, behavior:'smooth' }); }
function selectQuizAnswer(code) { state.quizAnswers[state.quizStep] = code; render(); }
function nextQuizStep() {
  if (!quizAnswerCode(state.quizStep)) { alert('답변을 먼저 선택해 주세요.'); return; }
  if (state.quizStep < 2) { state.quizStep += 1; render(); return; }
  state.recommendation = selectedQuizRecommendation();
  safeGtag('event', 'quiz_complete', { // ★ 퀴즈 완료 (결과 화면 도달)
    recommended_destination: state.recommendation?.airportCode || '없음'
  });
  state.screen = 'recommend'; render(); window.scrollTo({ top:0, behavior:'smooth' });
}
function prevQuizStep() { if (state.quizStep > 0) { state.quizStep -= 1; render(); } else resetToHome(); }
function applyRecommendationToBooking() {
  const rec = state.recommendation || selectedQuizRecommendation();
  if (!rec) { alert('추천 결과를 찾지 못했어요. 다시 선택해 주세요.'); return; }
  safeGtag('event', 'quiz_apply', { // ★ 퀴즈 추천 후 발권하기 클릭
    recommended_destination: rec.airportCode || '없음'
  });
  state.origin = 'ICN';
  state.destination = rec.airportCode;
  state.tripType = 'roundtrip';
  state.recommendation = rec;
  resetSearchSelection();
  state.screen = 'booking';
  state.step = 0;
  render(); window.scrollTo({ top:0, behavior:'smooth' });
}
function renderHome() {
  app.innerHTML = `
    <section class="card home-card">
      <span class="chip orange">오늘은 결제하지 말고 마음만 먼저 발권</span>
      <h2 class="home-title">여행 위시를 PNG로 저장하는<br/>위시 보딩패스 만들기</h2>
      <p class="muted">진짜 결제 대신 가고 싶은 여행 목표를 고르고, DEMO/WISH 표시가 들어간 보딩패스를 저장해요.</p>
      <div class="home-actions">
        <button class="primary" onclick="startWishBoardingPass()">위시 보딩패스 만들기<br/><small style="display:block;margin-top:5px;font-size:12px;font-weight:800;opacity:.88">여행편 직접 선택</small></button>
        <button class="secondary" onclick="startTravelTest()">오늘의 여행지 고르기<br/><small style="display:block;margin-top:5px;font-size:12px;font-weight:800;opacity:.78">당신의 여행 스타일에 맞춘 여행지 추천</small></button>
      </div>
    </section>
    <div class="privacy-link-wrap">
      <button class="privacy-link-btn" onclick="openModal('privacy')">개인정보처리방침</button>
    </div>`;
}
function renderQuiz() {
  const q = questionByIndex(state.quizStep);
  if (!q) { app.innerHTML = '<section class="card"><p class="muted">질문 데이터를 불러오지 못했습니다.</p><button class="secondary" onclick="resetToHome()">처음으로</button></section>'; return; }
  const current = quizAnswerCode(state.quizStep);
  app.innerHTML = `
    <section class="card quiz-card">
      <div class="row"><h2 class="section-title">오늘의 여행지 고르기</h2><span class="chip blue">${state.quizStep + 1}/3</span></div>
      <div class="quiz-progress"><i style="width:${((state.quizStep + 1) / 3) * 100}%"></i></div>
      <h3 class="quiz-question">${h(q.question)}</h3>
      <div class="quiz-options">${q.options.map(o => `<button class="quiz-option ${current===o.code?'selected':''}" onclick="selectQuizAnswer('${h(o.code)}')"><b>${h(o.code)}</b><span>${h(o.answer)}</span><small>${h(o.tag)}</small></button>`).join('')}</div>
      <div class="footer-actions"><button class="secondary" onclick="prevQuizStep()">이전</button><button class="primary" ${current ? '' : 'disabled'} onclick="nextQuizStep()">${state.quizStep === 2 ? '여행지 추천받기' : '다음'}</button></div>
    </section>`;
}
function renderRecommendation() {
  const rec = state.recommendation || selectedQuizRecommendation();
  if (!rec) { app.innerHTML = '<section class="card"><p class="muted">추천 결과를 찾지 못했어요.</p><button class="secondary" onclick="startTravelTest()">다시 고르기</button></section>'; return; }
  app.innerHTML = `
    <section class="card result-card">
      <span class="chip orange">오늘의 위시 여행지</span>
      <h2 class="recommend-title">${h(rec.title)}</h2>
      <div class="wish-quote">${h(rec.boardingMessage)}</div>
      <div class="recommend-route"><span>ICN</span><b>✈</b><span>${h(rec.airportCode)}</span></div>
      <h3>${h(rec.city)} · ${h(rec.country)}</h3>
      <p class="muted">${h(rec.airportName)} · ${h(rec.region)}</p>
      <p class="recommend-reason">${h(rec.reason)}</p>
      <button class="primary" onclick="applyRecommendationToBooking()">위시 보딩패스 발권하기</button>
      <button class="ghost" style="margin-top:10px" onclick="startTravelTest()">다시 고르기</button>
    </section>`;
}

function openModal(type) { state.modal = type; state.helpKey = null; modalBackdrop.classList.remove('hidden'); renderModal(); }
function closeModal() { state.modal = null; state.airportQuery = ''; state.helpKey = null; modalBackdrop.classList.add('hidden'); modalSheet.innerHTML = ''; }
function closeModalBackdrop(e) { if (e.target === modalBackdrop) closeModal(); }
function openAirport(field) {
  state.airportField = field;
  state.activeRegion = regionOfAirport(airportById[state[field]]);
  state.airportQuery = '';
  openModal('airport');
}
function selectAirport(code) {
  if (state.airportField === 'origin') state.origin = code;
  else state.destination = code;
  if (state.origin === state.destination) {
    if (state.airportField === 'origin') state.destination = state.origin === 'ICN' ? 'NRT' : 'ICN';
    else state.origin = state.destination === 'ICN' ? 'NRT' : 'ICN';
  }
  resetSearchSelection();
  closeModal();
  render();
}
function setRegion(region) { state.activeRegion = region; state.airportQuery = ''; const inp = modalSheet.querySelector('.modal-search input'); if (inp) inp.value = ''; updateAirportResults(); }
function setAirportQuery(v) { state.airportQuery = v; updateAirportResults(); }
function changePax(type, delta) {
  const p = state.pax;
  if (type === 'adult') p.adult = Math.max(1, Math.min(9, p.adult + delta));
  if (type === 'child') p.child = Math.max(0, Math.min(8, p.child + delta));
  if (type === 'infant') p.infant = Math.max(0, Math.min(p.adult, p.infant + delta));
  if (p.infant > p.adult) p.infant = p.adult;
  state.passengerValidationAttempted = false;
  syncPassengers();
  ensureSeatDefaults();
  renderModal(); render();
}
function showHelp(key) { state.helpKey = state.helpKey === key ? null : key; renderModal(); }
function openMealPicker(sector, passengerId) {
  state.mealTarget = { sector, passengerId };
  openModal('meal');
}
function setMeal(id) {
  const meal = mealOptions.find(m => m.id === id);
  const passenger = passengerById(state.mealTarget.passengerId);
  if (!mealIsSelectable(meal, passenger)) { alert('이 메뉴는 해당 탑승객에게 선택할 수 없어요.'); return; }
  state.meals[state.mealTarget.sector][state.mealTarget.passengerId] = id;
  // 개별 변경 시 apply 상태 해제 (일관성 유지)
  if (state.mealApplied) state.mealApplied[state.mealTarget.sector] = false;
  closeModal(); render();
}
function copyOutboundMealsToInbound() {
  if (state.tripType !== 'roundtrip') return;
  if (state.mealApplied.roundtrip) {
    // 롤백: 이전 상태 복원
    state.meals.inbound = { ...(state.mealAppliedBackup.roundtrip || {}) };
    state.mealApplied.roundtrip = false;
  } else {
    // 적용: 현재 상태 백업 후 가는 편 메뉴 복사
    state.mealAppliedBackup.roundtrip = { ...state.meals.inbound };
    seatPassengers().forEach(p => {
      const meal = mealFor('outbound', p.id);
      if (mealIsSelectable(meal, p)) state.meals.inbound[p.id] = meal.id;
    });
    state.mealApplied.roundtrip = true;
  }
  render();
}
function applyFirstMealToSector(sector) {
  const first = seatPassengers()[0];
  if (!first) return;
  if (state.mealApplied[sector]) {
    // 롤백: 이전 상태 복원
    state.meals[sector] = { ...(state.mealAppliedBackup[sector] || {}) };
    state.mealApplied[sector] = false;
  } else {
    // 적용: 현재 상태 백업 후 첫 탑승객 메뉴 전체 적용
    state.mealAppliedBackup[sector] = { ...state.meals[sector] };
    const meal = mealFor(sector, first.id);
    seatPassengers().forEach(p => {
      if (mealIsSelectable(meal, p)) state.meals[sector][p.id] = meal.id;
    });
    state.mealApplied[sector] = true;
  }
  render();
}
function selectFlight(kind, id) {
  if (kind === 'outbound') { state.outboundId = id; state.seats.outbound = {}; state.seat = ''; }
  else { state.inboundId = id; state.seats.inbound = {}; }
  ensureSeatDefaults();
  render();
}
function setFare(id) {
  state.fareId = id;
  syncPassengers();
  ensureSeatDefaults(true);
  render();
}
function setReviewTab(tab) { state.reviewTab = tab; render(); }

function renderModal() {
  if (state.modal === 'airport') return renderAirportModal();
  if (state.modal === 'passenger') return renderPassengerModal();
  if (state.modal === 'meal') return renderMealModal();
  if (state.modal === 'privacy') return renderPrivacyModal();
}
function renderPrivacyModal() {
  modalSheet.className = 'sheet privacy-sheet';
  modalSheet.innerHTML = `
    <div class="sheet-header">
      <h2 class="sheet-title">개인정보처리방침</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>
    <div class="privacy-body">
      <p>여행 위시 보딩패스는 이용자의 개인정보 보호를 중요하게 생각하며, 개인정보 보호법 등 관련 법령을 준수하기 위해 다음과 같이 개인정보처리방침을 공개합니다.</p>

      <h3>1. 서비스의 성격</h3>
      <p>본 서비스는 실제 항공권 예매, 결제, 탑승권 발급을 제공하지 않는 데모 및 엔터테인먼트 목적의 웹 서비스입니다.</p>

      <h3>2. 수집하는 개인정보 항목</h3>
      <p>본 서비스는 회원가입, 로그인, 결제 기능을 제공하지 않으며, 사용자의 개인정보를 별도 데이터베이스에 저장하지 않습니다.</p>
      <p>다만 이용자가 보딩패스 이미지를 생성하기 위해 입력하는 이름, 연락처 등의 정보는 이용자의 브라우저 내에서 화면 표시 및 PNG 이미지 생성 목적으로 일시적으로 사용될 수 있습니다.</p>

      <h3>3. 개인정보의 처리 목적</h3>
      <p>입력된 정보는 위시 보딩패스 화면 생성, PNG 이미지 저장, 공유 기능 제공, 문의 대응을 위해 사용됩니다.</p>

      <h3>4. 개인정보의 보유 및 이용 기간</h3>
      <p>본 서비스는 이용자가 입력한 보딩패스 정보를 서버에 저장하지 않습니다. 입력 정보는 브라우저 화면 표시 및 이미지 생성에만 사용되며, 페이지 새로고침 또는 브라우저 종료 시 유지되지 않을 수 있습니다.</p>
      <p>문의 이메일을 통해 제공된 정보는 문의 처리 목적 달성 후 삭제합니다.</p>

      <h3>5. 개인정보의 제3자 제공</h3>
      <p>본 서비스는 이용자의 개인정보를 제3자에게 판매하거나 임의로 제공하지 않습니다.</p>
      <p>단, 이용자가 X, 카카오톡, 인스타그램 등 외부 SNS 공유 기능을 직접 이용하는 경우, 해당 플랫폼의 개인정보 처리방침이 적용될 수 있습니다.</p>

      <h3>6. 개인정보 처리의 위탁 및 국외 처리</h3>
      <p>본 서비스는 웹사이트 제공을 위해 Vercel Inc.의 호스팅 서비스를 이용합니다. 사이트 접속 과정에서 IP 주소, 브라우저 정보, 접속 로그 등 기술적 정보가 호스팅 제공자에 의해 처리될 수 있습니다.</p>
      <p>또한 Google Analytics 4 사용으로 인해 방문자의 행동 데이터(버튼 클릭, 페이지 방문 기록 등)가 Google LLC(미국)의 서버에 전송될 수 있습니다.</p>

      <h3>7. 쿠키 및 자동수집 장치</h3>
      <p>본 서비스는 맞춤형 광고를 위한 쿠키, 추적 픽셀, 제3자 광고 식별자를 사용하지 않습니다.</p>
      <p>본 서비스는 서비스 개선을 위해 Google Analytics 4(GA4)를 사용합니다. GA4는 방문자의 접속 기기, 브라우저 정보, 페이지 방문 기록, 버튼 클릭 등 행동 데이터를 수집합니다. 수집된 데이터는 Google의 서버에 저장되며, Google의 개인정보처리방침이 적용됩니다. 이용자는 Google 애널리틱스 차단 브라우저 부가기능 설치를 통해 데이터 수집을 거부할 수 있습니다.</p>

      <h3>8. 개인정보의 파기</h3>
      <p>본 서비스는 보딩패스 입력정보를 서버에 저장하지 않으므로 별도의 서버 내 파기 절차가 발생하지 않습니다.</p>
      <p>문의 이메일 등으로 접수된 개인정보는 처리 목적 달성 후 지체 없이 삭제합니다.</p>

      <h3>9. 이용자의 권리</h3>
      <p>이용자는 본인의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.</p>
      <p>다만 본 서비스는 회원정보 및 보딩패스 입력정보를 서버에 저장하지 않으므로, 삭제 요청 대상 정보가 존재하지 않을 수 있습니다.</p>

      <h3>10. 개인정보 관련 문의</h3>
      <p>개인정보 관련 문의는 아래 연락처로 접수할 수 있습니다.</p>
      <p>이메일: <a href="mailto:rlaakdrh1009@gmail.com" style="color:#2563eb;word-break:break-all">rlaakdrh1009@gmail.com</a></p>

      <h3>11. 개인정보처리방침의 변경</h3>
      <p>본 개인정보처리방침은 서비스 내용 또는 관련 법령 변경에 따라 수정될 수 있습니다.</p>
      <p style="color:#667085;font-size:12px;margin-top:16px">시행일자: 2026년 06월 30일</p>
    </div>`;
}
function renderAirportList(list, selectedCode) {
  if (!list.length) return `<div class="empty-list">검색 결과가 없습니다.<br/>도시명 또는 IATA 코드를 다시 입력해 주세요.</div>`;
  return list.map(a => `
    <button class="airport-option ${selectedCode===a.airport_id?'selected':''}" onclick="selectAirport('${h(a.airport_id)}')">
      <div class="main">${h(airportOptionLabel(a))}</div>
      <div class="sub">${h(airportSub(a))}</div>
    </button>`).join('');
}
function updateAirportResults() {
  const q = state.airportQuery;
  const list = sortedAirports(state.activeRegion, q);
  const selectedCode = state[state.airportField];
  const resultsEl = document.getElementById('airport-results');
  if (resultsEl) {
    resultsEl.innerHTML = (q ? `<div class="muted small" style="margin-bottom:8px">검색 결과</div>` : '') + renderAirportList(list, selectedCode);
  }
  // Update region buttons active state
  document.querySelectorAll('.region-btn').forEach(btn => {
    btn.classList.toggle('active', !q && state.activeRegion === btn.textContent.trim());
  });
}
function setupAirportSearchInput() {
  const inp = modalSheet.querySelector('.modal-search input');
  if (!inp) return;
  let composing = false;
  inp.addEventListener('compositionstart', () => { composing = true; });
  inp.addEventListener('compositionend', e => {
    composing = false;
    state.airportQuery = e.target.value;
    updateAirportResults();
  });
  inp.addEventListener('input', e => {
    if (!composing) {
      state.airportQuery = e.target.value;
      updateAirportResults();
    }
  });
}
function renderAirportModal() {
  const list = sortedAirports(state.activeRegion, state.airportQuery);
  const selectedCode = state[state.airportField];
  modalSheet.className = 'sheet airport-sheet';
  modalSheet.innerHTML = `
    <div class="sheet-header"><h2 class="sheet-title">출/도착지 선택</h2><button class="close-btn" onclick="closeModal()">×</button></div>
    <div class="airport-current">
      <div><div class="small-name">${h(airportLabel(state.origin))}</div><div class="big-code">${h(state.origin)}</div></div>
      <button class="modal-swap" onclick="modalSwapRoute()">↔</button>
      <div><div class="small-name">${h(airportLabel(state.destination))}</div><div class="big-code">${h(state.destination)}</div></div>
    </div>
    <div class="modal-search"><div class="search-field"><input placeholder="도시/공항명을 입력해 주세요." value="${h(state.airportQuery)}" autofocus /><span class="search-icon">⌕</span></div></div>
    <div class="airport-columns">
      <div class="region-list">
        ${REGIONS.map(r => `<button class="region-btn ${!state.airportQuery && state.activeRegion===r?'active':''}" onclick="setRegion('${h(r)}')">${h(r)}</button>`).join('')}
      </div>
      <div class="airport-list" id="airport-results">
        ${state.airportQuery ? `<div class="muted small" style="margin-bottom:8px">검색 결과</div>` : ''}
        ${renderAirportList(list, selectedCode)}
      </div>
    </div>`;
  // 한글 IME 조합 대응: 렌더 후 입력 이벤트 직접 부착
  setupAirportSearchInput();
}
function renderPassengerModal() {
  const helpText = {
    child: '소아는 만 2세 이상~만 12세 미만 승객입니다. 데모 요금 계산에서는 성인 운임의 75%로 계산합니다.',
    infant: '유아는 생후 7일 이상~만 2세 미만 승객입니다. 데모 요금 계산에서는 성인 운임의 10%로 계산합니다. 유아는 일반 좌석/일반 기내식 선택 대상에서 제외됩니다.'
  };
  modalSheet.className = 'sheet passenger-sheet';
  modalSheet.innerHTML = `
    <div class="sheet-header"><h2 class="sheet-title">탑승객 선택</h2><button class="done-btn" onclick="closeModal()">완료</button></div>
    <div class="sheet-body" style="overflow:visible">
      ${state.helpKey ? `<div class="help-pop ${h(state.helpKey)}">${h(helpText[state.helpKey])}</div>` : ''}
      ${paxRow('adult','성인','만 12세 이상', state.pax.adult, false)}
      ${paxRow('child','소아','만 2세 이상~만 12세 미만', state.pax.child, true)}
      ${paxRow('infant','유아','생후 7일 이상~만 2세 미만', state.pax.infant, true)}
      <div class="safe-note">안전한 데모 운영을 위해 생년월일·주민번호·여권번호는 입력받지 않도록 설계했어요.</div>
    </div>`;
}
function paxRow(type, title, sub, count, help) {
  const disableMinus = type === 'adult' ? count <= 1 : count <= 0;
  const disablePlus = type === 'infant' ? count >= state.pax.adult : count >= 9;
  return `<div class="pax-row">
    <div><div class="pax-name">${h(title)}${help ? `<button class="help-btn" onclick="showHelp('${type}')">?</button>` : ''}</div><div class="pax-sub">${h(sub)}</div></div>
    <div class="counter"><button ${disableMinus?'disabled':''} onclick="changePax('${type}',-1)">−</button><span class="count">${count}</span><button ${disablePlus?'disabled':''} onclick="changePax('${type}',1)">+</button></div>
  </div>`;
}
function renderMealModal() {
  const passenger = passengerById(state.mealTarget.passengerId);
  const currentId = state.meals[state.mealTarget.sector]?.[state.mealTarget.passengerId] || 'none';
  modalSheet.className = 'sheet meal-sheet';
  modalSheet.innerHTML = `
    <div class="sheet-header"><h2 class="sheet-title">기내식 선택</h2><button class="close-btn" onclick="closeModal()">×</button></div>
    <div class="sheet-body meal-list-body">
      <div class="meal-rule-box">
        <b>${h(selectedFare().name)}</b> · ${h(selectedFare().mealPolicy)}<br/>
        ${h(sectorLabel(state.mealTarget.sector))} ${h(sectorRouteLabel(state.mealTarget.sector))} · ${h(passenger?.label || '탑승객')} 기준으로 1개 메뉴만 선택됩니다.
      </div>
      ${mealOptions.map(m => {
        const disabled = !mealIsSelectable(m, passenger);
        const price = m.id === 'none' ? '₩0' : mealPriceLabel(m, passenger);
        return `<div class="meal-option meal-card ${currentId===m.id?'selected':''} ${disabled?'disabled':''}" ${disabled?'':'onclick="setMeal(\'' + h(m.id) + '\')"'}>
          <div class="meal-photo ${m.image ? '' : 'empty'}">${m.image ? `<img src="${h(m.image)}" alt="${h(m.title)}">` : '—'}</div>
          <div class="meal-info"><div class="meal-meta"><span class="chip blue">${h(m.category)}</span>${m.childOnly ? '<span class="chip orange">소아 전용</span>' : ''}</div><div class="meal-title">${h(m.title)}</div><div class="meal-desc">${h(m.desc)}</div><div class="meal-price">${h(price)}</div>${disabled ? '<div class="meal-disabled-text">해당 탑승객에게 선택할 수 없는 메뉴입니다.</div>' : ''}</div>
        </div>`;
      }).join('')}
      <div class="safe-note">편도 기준 탑승객 1명당 1개 메뉴만 선택됩니다. 왕복은 가는 편과 오는 편을 각각 다르게 선택할 수 있어요.</div>
    </div>`;
}
function render() {
  syncPassengers();
  renderProgress();
  if (state.screen === 'home') return renderHome();
  if (state.screen === 'quiz') return renderQuiz();
  if (state.screen === 'recommend') return renderRecommendation();
  if (state.step === 0) return renderSearch();
  if (state.step === 1) return renderFlights();
  if (state.step === 2) return renderPassengerInfo();
  if (state.step === 3) return renderSeatStep();
  if (state.step === 4) return mealAvailable() ? renderMealStep() : renderPayment();
  if (state.step === 5) return renderPayment();
  return renderComplete();
}
function renderSearch() {
  app.innerHTML = `
    <section class="card">
      <div class="row"><h2 class="section-title">여행 검색</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="resetToHome()">처음</button></div>
      <div class="trip-toggle"><button class="${state.tripType==='oneway'?'active':''}" onclick="setTripType('oneway')">편도</button><button class="${state.tripType==='roundtrip'?'active':''}" onclick="setTripType('roundtrip')">왕복</button></div>
      <div class="route-pickers">
        <button class="airport-box" onclick="openAirport('origin')"><span class="code">${h(state.origin)}</span><span class="label">${h(airportLabel(state.origin))}</span></button>
        <button class="swap-round" onclick="swapRoute()">↔</button>
        <button class="airport-box" onclick="openAirport('destination')"><span class="code">${h(state.destination)}</span><span class="label">${h(airportLabel(state.destination))}</span></button>
      </div>
      <div class="date-grid">
        <div class="field"><label>가는 날</label><input type="date" value="${h(state.departDate)}" onchange="state.departDate=this.value; resetSearchSelection(); render()" /></div>
        <div class="field ${state.tripType==='oneway'?'hidden':''}"><label>오는 날</label><input type="date" value="${h(state.returnDate)}" onchange="state.returnDate=this.value; resetSearchSelection(); render()" /></div>
      </div>
      <div class="field"><label>탑승객</label><button class="select-like" onclick="openModal('passenger')"><strong>${h(passengerSummary())}</strong><span>›</span></button></div>
      <button class="primary" onclick="resetSearchSelection(); go(1)">항공편 검색하기</button>
      <p class="notice">항공편 검색 가격은 보기 편하도록 기존 seed 운임보다 30% 낮춘 금액으로 표시됩니다. 유류할증료/공항세는 결제 직전 합산됩니다.</p>
    </section>
    <section class="card"><h2 class="section-title">위시 발권 포인트</h2><span class="chip blue">카드형 공항 팝업</span><span class="chip green">3개 항공사 유형</span><span class="chip purple">탑승객별 기내식</span><span class="chip orange">WISH · DEMO 안전 표시</span></section>`;
}
function renderFlights() {
  const outbound = currentOutboundOptions();
  const inbound = currentInboundOptions();
  const outSelected = selectedOutbound();
  app.innerHTML = `
    <section class="card">
      <div class="row"><h2 class="section-title">항공편 선택</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(0)">수정</button></div>
      <p class="muted">${h(airportLabel(state.origin))} → ${h(airportLabel(state.destination))} · ${state.tripType === 'roundtrip' ? '왕복' : '편도'} · ${h(passengerSummary())}</p>
    </section>
    <section class="card"><h2 class="section-title">가는 항공편</h2><p class="section-caption">저가/기본/대형 항공사 유형별로 1개씩 보여줘요.</p>${outbound.map(f => flightCard(f, 'outbound', state.outboundId)).join('')}</section>
    ${state.tripType === 'roundtrip' ? `<section class="card"><h2 class="section-title">오는 항공편</h2>${outSelected ? `<p class="section-caption">${h(airportLabel(state.destination))} → ${h(airportLabel(state.origin))} 복귀편입니다.</p>${inbound.map(f => flightCard(f, 'inbound', state.inboundId)).join('')}` : `<p class="muted">가는 항공편을 먼저 선택하면 오는 항공편 3개가 표시됩니다.</p>`}</section>` : ''}
    <section class="card">
      <h2 class="section-title">운임 선택</h2>
      ${fareRules.map(f => fareCard(f)).join('')}
      ${mealAvailable() ? `<div class="meal-choice"><b>기내식 선택:</b> 좌석 선택 후 별도 단계에서 ${h(sectorCount())}개 구간 × ${h(seatPassengerCount())}명 기준으로 탑승객별 선택<br/><div class="muted small" style="margin-top:6px">Standard는 메뉴 가격이 추가 결제되고, Flex는 추가요금 없이 선택됩니다.</div></div>` : `<div class="muted">Basic 운임은 기내식 선택 단계를 건너뛰고 좌석 선택 후 결제 확인으로 이동합니다.</div>`}
      <div style="height:12px"></div>
      <button class="primary" ${canProceedFare() ? '' : 'disabled'} onclick="go(2)">탑승객 정보 입력</button>
    </section>`;
}
function flightCard(f, kind, selectedId) {
  const airline = airlineById[f.airline_id] || {};
  const brand = airline.brand_color || '#2563eb';
  const logo = airline.logo_text || (f.airline_id || 'AM').slice(0,2);
  const type = f.airline_type || airline.airline_type || 'standard';
  return `<div class="flight-card ${selectedId===f.flight_id?'selected':''}" onclick="selectFlight('${kind}','${h(f.flight_id)}')">
    <div class="flight-top">
      <div class="airline-line"><div class="airline-logo" style="background:${h(brand)}">${h(logo)}</div><div><div class="airline">${h(f.airline_name)}</div><div class="muted small">${h(f.flight_number)} · ${h(f.aircraft)}${f.synthetic ? ' · 데모 편성' : ''}</div></div></div>
      <div><div class="original-price">${won(f.base_fare_krw)}</div><div class="price">${won(displayFare(f))}</div></div>
    </div>
    <div class="route"><div><div class="time">${h(fmtTime(f.departure_at))}</div><div class="airport">${h(f.departure_airport_id)}</div></div><div class="line-plane">✈</div><div style="text-align:right"><div class="time">${h(fmtTime(f.arrival_at))}</div><div class="airport">${h(f.arrival_airport_id)}</div></div></div>
    <div class="row"><span class="muted">직항 · ${h(durationText(f.duration_minutes))}</span><span><span class="chip ${TYPE_CHIP[type] || 'blue'}">${h(TYPE_LABEL[type] || f.airline_type_ko)}</span><span class="chip">잔여 ${h(f.available_seats || 0)}석</span></span></div>
  </div>`;
}
function fareCard(f) {
  return `<div class="fare ${state.fareId===f.id?'selected':''}" onclick="setFare('${f.id}')"><div class="row"><b>${h(f.name)}</b><b>${f.add ? '+' + won(f.add) : '포함'}</b></div><div>${f.perks.map(p => `<span class="chip">${h(p)}</span>`).join('')}</div><p class="muted small" style="margin:8px 0 0">${h(f.mealPolicy)}</p></div>`;
}
function renderPassengerInfo() {
  app.innerHTML = `
    <section class="card"><div class="row"><h2 class="section-title">탑승객 정보</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(1)">이전</button></div>
      <p class="section-caption">탑승객 수에 맞춰 정보를 각각 입력합니다. 성/이름/연락처를 모두 입력해야 다음 단계로 이동할 수 있어요.</p>
      ${renderPassengerForms()}
      <button class="primary" onclick="handlePassengerInfoNext()">좌석 선택으로</button>
    </section>`;
}
function renderPassengerForms() {
  return passengerList().map(p => passengerFormCard(p)).join('');
}
function passengerInputHtml(p, key, label, placeholder, extra='') {
  const error = passengerFieldError(p, key);
  return `<div class="field${passengerFieldClass(p, key)}"><label>${h(label)}</label><input ${extra} placeholder="${h(placeholder)}" value="${h(p[key])}" oninput="updatePassengerProfile('${h(p.id)}','${h(key)}',this.value,this);" /><div class="field-error">${h(error)}</div></div>`;
}
function passengerFormCard(p) {
  const note = p.type === 'infant' ? '<div class="muted small" style="margin-top:6px">유아는 일반 좌석/기내식 선택 없이 보호자 동반 탑승으로 표시됩니다.</div>' : '';
  return `<div class="pax-process-card">
    <div class="row"><b>${h(p.label)}</b><span class="chip ${p.type==='adult'?'blue':p.type==='child'?'orange':'green'}">${h(p.typeKo)}</span></div>
    <div class="grid-2">${passengerInputHtml(p, 'lastName', '성/Last name', '성')}${passengerInputHtml(p, 'firstName', '이름/First name', '이름')}</div>
    ${passengerInputHtml(p, 'phone', '연락처', '010-0000-0000', 'inputmode="numeric" maxlength="13"')}${note}
  </div>`;
}
function renderSeatStep() {
  ensureSeatDefaults();
  app.innerHTML = `
    ${renderSeatSelection()}
    <section class="card"><h2 class="section-title">좌석 선택 요약</h2>${summaryMini()}<button class="primary" ${canProceedSeats() ? '' : 'disabled'} onclick="nextStepAfterSeats()">${mealAvailable() ? '기내식 선택으로' : '결제 확인으로'}</button></section>`;
}
function renderMealStep() {
  app.innerHTML = `
    ${renderMealSelection()}
    <section class="card"><h2 class="section-title">기내식 선택 요약</h2>${summaryMini()}<button class="primary" onclick="go(5)">결제 확인으로</button></section>`;
}
function renderMealSelection() {
  if (!mealAvailable()) {
    return `<section class="card"><div class="row"><h2 class="section-title">기내식 선택</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(3)">이전</button></div><p class="muted">Basic 운임은 기내식 선택 옵션이 제공되지 않습니다.</p></section>`;
  }
  const mealRows = sectors().map(sector => `
    <div class="pax-process-card">
      <div class="row"><div><b>${h(sectorLabel(sector))}</b><div class="muted small">${h(sectorRouteLabel(sector))}</div></div><span class="chip blue">편도 기준 1인 1개</span></div>
      <div class="copy-actions">
        ${seatPassengers().length > 1 ? `<button class="ghost meal-apply-btn${state.mealApplied[sector] ? ' applied' : ''}" onclick="applyFirstMealToSector('${sector}')">${state.mealApplied[sector] ? '✓ 전체 적용됨 (탭하여 취소)' : '첫 탑승객 메뉴를 이 편 전체에 적용'}</button>` : ''}
        ${sector === 'outbound' && state.tripType === 'roundtrip' ? `<button class="ghost meal-apply-btn${state.mealApplied.roundtrip ? ' applied' : ''}" onclick="copyOutboundMealsToInbound()">${state.mealApplied.roundtrip ? '✓ 오는 편 적용됨 (탭하여 취소)' : '가는 편 메뉴를 오는 편에도 적용'}</button>` : ''}
      </div>
      ${seatPassengers().map(p => mealSelectionRow(sector, p)).join('')}
    </div>`).join('');
  return `<section class="card"><div class="row"><h2 class="section-title">기내식 선택</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(3)">이전</button></div>
    <div class="meal-rule-box"><b>${h(selectedFare().name)}</b> · ${h(selectedFare().mealPolicy)}<br/>좌석 선택 후 기내식을 선택하는 단계입니다. 탑승객별로 가는 편/오는 편 메뉴를 각각 다르게 선택할 수 있어요.</div>
    ${mealRows}
  </section>`;
}
function mealSelectionRow(sector, p) {
  const meal = mealFor(sector, p.id);
  return `<div class="pax-meal-row">
    <div><b>${h(p.label)}</b><div class="muted small">${meal.id === 'none' ? '선택 안 함' : `${h(meal.title)} · ${h(mealPriceLabel(meal, p))}`}</div></div>
    <button class="ghost" onclick="openMealPicker('${sector}','${h(p.id)}')">${meal.id === 'none' ? '선택' : '변경'}</button>
  </div>`;
}
function renderSeatSelection() {
  return `<section class="card"><div class="row"><h2 class="section-title">좌석 선택</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(2)">이전</button></div><p class="section-caption">한 페이지에서 탑승객을 전환하며 좌석을 복수 선택합니다. 왕복은 가는 편 탑승객 전원 좌석 선택 후 오는 편 좌석을 선택할 수 있어요.</p>
    ${sectors().map(sector => renderSeatSector(sector)).join('')}
  </section>`;
}
function renderSeatSector(sector) {
  const f = flightForSector(sector);
  if (!f) return '';
  if (sector === 'inbound' && state.tripType === 'roundtrip' && !sectorSeatComplete('outbound')) {
    return `<div class="pax-process-card seat-sector-card locked"><div class="row"><div><b>오는 편 좌석</b><div class="muted small">가는 편 탑승객 좌석을 모두 선택하면 열립니다.</div></div><span class="chip">대기</span></div></div>`;
  }
  const pax = seatPassengers();
  const targetId = state.seatTargetBySector[sector] || pax[0]?.id || '';
  const target = passengerById(targetId) || pax[0];
  return `<div class="pax-process-card seat-sector-card">
    <div class="row"><div><b>${h(sectorLabel(sector))} 좌석</b><div class="muted small">${h(f.flight_number)} · ${h(f.departure_airport_id)}→${h(f.arrival_airport_id)}</div></div><span class="chip ${TYPE_CHIP[f.airline_type] || 'blue'}">${h(TYPE_LABEL[f.airline_type] || f.airline_type_ko)}</span></div>
    <div class="seat-target-tabs">${pax.map(p => `<button class="${target?.id===p.id?'active':''}" onclick="setSeatTarget('${sector}','${h(p.id)}')">${h(p.label)} <small>${h(state.seats[sector]?.[p.id] || '-')}</small></button>`).join('')}</div>
    <div class="muted small" style="margin:8px 0 10px">현재 선택 대상: <b>${h(target?.label || '')}</b></div>
    ${renderSeatMap(f.airline_type, sector, target?.id || '')}
  </div>`;
}
function layoutForType(type) {
  if (type === 'major') return { type:'major', rows:24, blocks:['AB','CDEF','GH'], flexRows:4, wingAfter:11, label:'대형 항공 · 2-4-2 와이드바디' };
  if (type === 'low_cost') return { type:'low_cost', rows:18, blocks:['ABC','DEF'], flexRows:2, wingAfter:8, label:'저가 항공 · 3-3 컴팩트 기내' };
  return { type:'standard', rows:22, blocks:['ABC','DEF'], flexRows:3, wingAfter:9, label:'기본 항공 · 3-3 표준 기내' };
}
function isFlexZoneSeat(seat, type) {
  const row = parseInt(String(seat).match(/^\d+/)?.[0] || '0', 10);
  return row > 0 && row <= layoutForType(type).flexRows;
}
function isFareBlockedSeat(seat, type) {
  const isFlex = isFlexZoneSeat(seat, type);
  return selectedFare().id === 'flex' ? !isFlex : isFlex;
}
function isBlockedSeat(seat) {
  let sum = 0; for (const ch of seat) sum += ch.charCodeAt(0);
  return sum % 11 === 0 || ['1A','1B','2C','3D'].includes(seat);
}
function isTakenSeat(sector, passengerId, seat) {
  return Object.entries(state.seats[sector] || {}).some(([id, value]) => id !== passengerId && value === seat);
}
function isSeatUnavailable(seat, type, sector, passengerId) { return isBlockedSeat(seat) || isFareBlockedSeat(seat, type) || isTakenSeat(sector, passengerId, seat); }
function firstSeatFor(sector, passengerId) {
  const f = flightForSector(sector) || selectedOutbound() || currentOutboundOptions()[0];
  const layout = layoutForType(f.airline_type);
  for (let r=1; r<=layout.rows; r++) {
    for (const block of layout.blocks) {
      for (const col of block) {
        const seat = `${r}${col}`;
        if (!isSeatUnavailable(seat, layout.type, sector, passengerId)) return seat;
      }
    }
  }
  return '';
}
function ensureSeatDefaults(force=false) {
  syncPassengers();
  sectors().forEach(sector => {
    const f = flightForSector(sector);
    if (!f) return;
    state.seats[sector] ||= {};
    seatPassengers().forEach(p => {
      const cur = state.seats[sector]?.[p.id] || '';
      if (cur && (force || isSeatUnavailable(cur, f.airline_type, sector, p.id))) state.seats[sector][p.id] = '';
    });
  });
  const firstSeat = state.seats.outbound?.[seatPassengers()[0]?.id];
  state.seat = firstSeat || '';
}
function setSeatTarget(sector, passengerId) { state.seatTargetBySector[sector] = passengerId; render(); }
function selectSeat(sector, passengerId, seat) {
  state.seats[sector][passengerId] = seat;
  if (sector === 'outbound' && passengerId === seatPassengers()[0]?.id) state.seat = seat;
  const next = seatPassengers().find(p => !state.seats[sector]?.[p.id]);
  if (next) state.seatTargetBySector[sector] = next.id;
  else if (sector === 'outbound' && state.tripType === 'roundtrip') {
    const inboundNext = seatPassengers().find(p => !state.seats.inbound?.[p.id]) || seatPassengers()[0];
    if (inboundNext) state.seatTargetBySector.inbound = inboundNext.id;
  }
  render();
}
function renderSeatMap(type, sector, passengerId) {
  const layout = layoutForType(type);
  const selectedSeat = state.seats[sector]?.[passengerId] || '';
  let rows = '';
  for (let r=1; r<=layout.rows; r++) {
    const seats = [];
    layout.blocks.forEach((block, bi) => {
      if (bi > 0) seats.push('<div class="aisle"><span></span></div>');
      for (const col of block) {
        const seat = `${r}${col}`;
        const sold = isBlockedSeat(seat);
        const fareBlocked = isFareBlockedSeat(seat, layout.type);
        const taken = isTakenSeat(sector, passengerId, seat);
        const blocked = sold || fareBlocked || taken;
        const zone = r <= layout.flexRows ? 'flex-seat' : 'economy-seat';
        const title = fareBlocked ? (selectedFare().id === 'flex' ? 'Flex 운임은 Flex 구역만 선택할 수 있습니다.' : 'Flex 운임 전용 구역입니다.') : taken ? '이미 다른 탑승객이 선택한 좌석입니다.' : sold ? '이미 선택된 좌석입니다.' : '';
        seats.push(`<button title="${h(title)}" class="seat ${zone} ${selectedSeat===seat?'selected':''} ${blocked?'blocked':''} ${fareBlocked?'fare-blocked':''}" ${blocked?'disabled':''} onclick="selectSeat('${sector}','${h(passengerId)}','${seat}')">${seat}</button>`);
      }
    });
    const rowZone = r <= layout.flexRows ? 'flex-zone-row' : 'economy-zone-row';
    rows += `<div class="seat-row ${layout.type} ${rowZone}"><div class="row-num">${r}</div>${seats.join('')}</div>`;
    if (r === layout.flexRows) rows += `<div class="zone-divider">Flex Zone / 일반 좌석 구역</div>`;
    if (r === layout.wingAfter) rows += `<div class="wing-label">◇ WING AREA ◇</div>`;
  }
  return `<div class="aircraft-model ${layout.type}"><div class="aircraft-nose"><span>COCKPIT</span></div><div class="aircraft-wing left"></div><div class="aircraft-wing right"></div><div class="seat-cabin ${layout.type}"><div class="cabin-label">${h(layout.label)}</div><div class="seat-legend"><span><i class="legend-flex-avail"></i>Flex 선택가능</span><span><i class="legend-flex-block"></i>Flex 선택불가</span><span><i class="legend-selected"></i>선택됨</span><span><i class="legend-sold"></i>선택불가</span></div>${rows}</div><div class="aircraft-tail">TAIL</div></div>`;
}
function summaryMini() {
  const out = selectedOutbound(); const inbound = selectedInbound();
  const seatSummary = sectors().map(sector => `${sectorLabel(sector)} ${seatPassengers().map(p => `${p.label} ${state.seats[sector]?.[p.id] || '-'}`).join(', ')}`).join('<br/>');
  return `<div class="summary-line"><span>가는 편</span><b>${h(out.flight_number)} · ${h(out.departure_airport_id)}→${h(out.arrival_airport_id)}</b></div>${state.tripType==='roundtrip' && inbound ? `<div class="summary-line"><span>오는 편</span><b>${h(inbound.flight_number)} · ${h(inbound.departure_airport_id)}→${h(inbound.arrival_airport_id)}</b></div>` : ''}<div class="summary-line"><span>운임</span><b>${h(selectedFare().name)}</b></div>${mealAvailable() ? `<div class="summary-line"><span>기내식</span><b>${h(mealSummaryLabel())}</b></div>` : ''}<div class="summary-line"><span>좌석</span><b>${seatSummary}</b></div>`;
}
// ★ 핵심: 발급 완료 수 + 분석용 데이터 5개(목적지/출발지/운임등급/기내식) 한 번에 전송
function completeBooking() {
  makeBookingCode();
  const primaryMeal = mealAvailable()
    ? (mealFor('outbound', 'adult-1')?.title || '없음')
    : '없음';
  safeGtag('event', 'boarding_pass_issued', {
    destination: state.destination,   // 분석: 인기 목적지 TOP 10
    origin: state.origin,             // 분석: 인기 출발지/도착 지역
    ticket_class: state.fareId,       // 분석: Basic/Standard/Flex 비율
    meal: primaryMeal,                // 분석: 기내식 선택 비율
    trip_type: state.tripType
  });
  go(6);
}
function renderPayment() {
  state.reviewTab ||= 'route';
  app.innerHTML = `
    <section class="card"><div class="row"><h2 class="section-title">결제 전 최종 확인</h2><button class="secondary" style="width:auto;padding:9px 12px" onclick="go(mealAvailable()?4:3)">이전</button></div><div class="paybox">카드번호, CVC, 주민번호, 여권번호를 받지 않는 체험용 결제 화면입니다. 실제 결제는 발생하지 않습니다.</div></section>
    <section class="card"><h2 class="section-title">확인 탭</h2>${renderReviewTabs()}${renderReviewContent()}</section>
    <section class="card"><h2 class="section-title">결제수단</h2><div class="fare selected"><div class="row"><b>Demo Pay</b><span class="chip orange">실제 청구 없음</span></div><p class="muted">버튼을 누르면 예약번호와 탑승객별 데모 탑승권 화면이 생성됩니다.</p></div><button class="primary" onclick="completeBooking()">실제 결제 없이 발권 체험하기</button><p class="notice">실서비스와 혼동되지 않도록 모든 발급물에 DEMO 문구를 유지합니다.</p></section>`;
}
function renderReviewTabs() {
  const tabs = [ ['route','여정'], ['passengers','탑승객'], ['meals','기내식'], ['seats','좌석'], ['price','금액'] ];
  return `<div class="review-tabs">${tabs.map(([id,label]) => `<button class="review-tab ${state.reviewTab===id?'active':''}" onclick="setReviewTab('${id}')">${label}</button>`).join('')}</div>`;
}
function renderReviewContent() {
  if (state.reviewTab === 'route') return reviewRoute();
  if (state.reviewTab === 'passengers') return reviewPassengers();
  if (state.reviewTab === 'meals') return reviewMeals();
  if (state.reviewTab === 'seats') return reviewSeats();
  return reviewPrice();
}
function reviewRoute() {
  return `<div class="review-panel">${sectors().map(sector => {
    const f = flightForSector(sector);
    return `<div class="summary-line"><span>${h(sectorLabel(sector))}</span><b>${h(f.flight_number)} · ${h(f.departure_airport_id)}→${h(f.arrival_airport_id)} · ${h(fmtTime(f.departure_at))}</b></div>`;
  }).join('')}</div>`;
}
function passengerName(p) {
  const name = `${p.lastName || ''}/${p.firstName || ''}`.replace(/^\/$/, '');
  return name || p.label;
}
function reviewPassengers() {
  return `<div class="review-panel">${passengerList().map(p => `<div class="summary-line"><span>${h(p.label)}</span><b>${h(passengerName(p))}</b></div>`).join('')}</div>`;
}
function reviewMeals() {
  if (!mealAvailable()) return `<div class="review-panel"><p class="muted">Basic 운임은 기내식 선택 옵션이 제공되지 않습니다.</p></div>`;
  return `<div class="review-panel">${sectors().map(sector => `<div class="review-subtitle">${h(sectorLabel(sector))}</div>${seatPassengers().map(p => { const meal = mealFor(sector, p.id); return `<div class="summary-line"><span>${h(p.label)}</span><b>${h(meal.title)}${meal.id !== 'none' ? ` · ${h(mealPriceLabel(meal, p))}` : ''}</b></div>`; }).join('')}`).join('')}</div>`;
}
function reviewSeats() {
  return `<div class="review-panel">${sectors().map(sector => `<div class="review-subtitle">${h(sectorLabel(sector))}</div>${seatPassengers().map(p => `<div class="summary-line"><span>${h(p.label)}</span><b>${h(state.seats[sector]?.[p.id] || '-')}</b></div>`).join('')}`).join('')}</div>`;
}
function reviewPrice() {
  const aggs = mealAggregates();
  return `<div class="review-panel">
    <div class="summary-line"><span>항공권 운임 × 승객요율</span><b>${won(fareBaseTotal())}</b></div>
    <div class="summary-line"><span>${h(selectedFare().name)} 운임 추가</span><b>${won(fareAddTotal())}</b></div>
    ${mealAvailable() ? `<div class="summary-line"><span>기내식 선택</span><b>${h(mealSummaryLabel())}</b></div>` : ''}
    ${mealAvailable() && aggs.length ? aggs.map(a => `<div class="summary-line"><span>${h(a.meal.title)} × ${a.count}</span><b>${selectedFare().id === 'flex' ? 'Flex 포함' : won(a.total)}</b></div>`).join('') : ''}
    ${mealAvailable() && selectedFare().id === 'flex' && mealQuantity() ? `<div class="summary-line"><span>Flex 기내식 혜택</span><b>추가요금 없음</b></div>` : ''}
    <div class="summary-line"><span>공항세/유류할증료 데모</span><b>${won(fuelTaxTotal())}</b></div>
    <div class="summary-line total"><span>총 결제 체험 금액</span><b>${won(totalPrice())}</b></div>
  </div>`;
}
// ─── v12 Social Share Helpers ───────────────────────────────────────────────
function getSiteUrl() {
  try { return window.location.href.split('#')[0].split('?')[0]; } catch(e) { return 'https://wish.boarding.pass'; }
}
function buildShareText() {
  const route = routeWishText();
  const msg = (state.shareMessage || DEFAULT_SHARE_MESSAGE).replace(/\n/g, ' ');
  return `${msg} ✈️ ${route} #여행위시보딩패스 #WishBoardingPass`;
}
function showToast(message, duration = 2400) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  wrap.appendChild(el);
  requestAnimationFrame(() => { el.classList.add('show'); });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 320);
  }, duration);
}
function shareToTwitter() {
  const text = encodeURIComponent(buildShareText());
  const url = encodeURIComponent(getSiteUrl());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,width=580,height=420');
}
function shareToKakao() {
  const url = getSiteUrl();
  const text = buildShareText();
  // Web Share API 시도 (카카오톡이 옵션으로 나타남)
  if (navigator.share) {
    navigator.share({ title: '여행 위시 보딩패스', text, url }).catch(() => {});
    return;
  }
  // 폴백: 링크 복사
  copyShareLink();
}
function shareToInstagram() {
  const url = getSiteUrl();
  // Instagram은 직접 URL 공유 API 없음 → 이미지 저장 후 안내
  downloadSocialImage('story');
  setTimeout(() => {
    showToast('📸 스토리 이미지 저장 완료! Instagram 앱에서 업로드하세요.');
  }, 800);
}
function copyShareLink() {
  safeGtag('event', 'share_link_copy'); // ★ 핵심: 공유하기(링크복사) 클릭 수
  const url = getSiteUrl();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 링크가 클립보드에 복사됐어요!')).catch(() => fallbackCopyLink(url));
  } else {
    fallbackCopyLink(url);
  }
}
function fallbackCopyLink(url) {
  const ta = document.createElement('textarea');
  ta.value = url;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('🔗 링크가 복사됐어요!'); } catch(e) { showToast('링크: ' + url); }
  ta.remove();
}
function shareViaWebShare() {
  const url = getSiteUrl();
  const text = buildShareText();
  if (navigator.share) {
    navigator.share({ title: '여행 위시 보딩패스', text, url }).catch(() => copyShareLink());
  } else {
    copyShareLink();
  }
}
function renderShareSection() {
  return `
    <section class="card share-section-simple">
      <div class="row" style="align-items:center">
        <h2 class="section-title" style="margin:0">공유하기</h2>
        <button class="copy-link-btn" onclick="copyShareLink()">🔗 링크 복사</button>
      </div>
      <p class="notice" style="text-align:left;margin-top:8px">사이트 링크를 복사해서 공유하세요.</p>
    </section>`;
}
// ─────────────────────────────────────────────────────────────────────────────

function renderComplete() {
  app.innerHTML = `
    <section class="card"><h2 class="section-title">여행 위시 저장 완료 ✈️</h2><p class="muted">오늘은 결제하지 않고, 언젠가 떠날 여행 목표를 먼저 저장했어요. WISH/DEMO 표시가 들어간 SNS용 이미지를 저장할 수 있습니다.</p></section>
    <section class="card no-spend-card"><span class="chip orange">결제 대신 목표 저장</span><h2 class="section-title">오늘의 무지출 발권 완료</h2><p class="wish-save-copy">충동 결제 대신, 가고 싶은 여행을 하나의 위시로 남겼어요.</p><div class="summary-line"><span>실제 결제 금액</span><b>0원</b></div><div class="summary-line"><span>아낀 금액</span><b>${won(totalPrice())}</b></div><div class="summary-line"><span>대신 저장한 여행</span><b>${h(routeWishText())}</b></div><div class="summary-line"><span>상태</span><b>언젠가 꼭 가기</b></div></section>
    <section class="card download-panel">
      <h2 class="section-title">SNS 공유용 이미지 저장</h2>
      <p class="section-caption">여행 위시 요약 카드가 포함된 SNS 공유 이미지를 저장하세요. 보딩패스 이미지는 아래에서 꾹 눌러 저장할 수 있어요.</p>
      <div class="field" style="margin-bottom:14px"><label>저장할 문구</label>${shareMessageButtonsHtml()}<textarea class="share-textarea" oninput="updateShareMessage(this.value)">${h(state.shareMessage || DEFAULT_SHARE_MESSAGE)}</textarea></div>
      <div class="sns-save-grid">
        <button class="secondary" onclick="downloadSocialImage('story')">
          <span style="font-size:18px">📱</span><br/>
          <b>스토리용</b><br/>
          <small style="color:#667085;font-weight:700">1080 × 1902</small>
        </button>
        <button class="secondary" onclick="downloadSocialImage('square')">
          <span style="font-size:18px">⬜</span><br/>
          <b>정사각형</b><br/>
          <small style="color:#667085;font-weight:700">1080 × 1080</small>
        </button>
      </div>
    </section>
    ${renderShareSection()}
    <section class="card" style="padding-bottom:10px">
      <h2 class="section-title">보딩패스</h2>
      <p class="muted" style="margin-bottom:16px">이미지를 꾹 눌러서 저장할 수 있어요.</p>
      ${boardingPassesHtml()}
    </section>
    <div class="footer-actions"><button class="primary" onclick="resetToHome()">다시 발권하기</button></div>`;
}
function boardingPassesHtml() {
  // 보딩패스를 즉시 canvas PNG → <img>로 렌더링
  // 모바일 꾹 눌러 저장 / 탭하여 다운로드 가능
  const parts = boardingPassItems().map(item => {
    try {
      const fakeEl = { id: `boarding-pass-${item.index}` };
      const canvas = createBoardingPassFallbackCanvas(fakeEl);
      const dataUrl = canvas.toDataURL('image/png');
      const fileName = boardingPassFileName(item);
      return `<div class="boarding-img-wrap">
        <img
          src="${dataUrl}"
          alt="보딩패스 ${item.index + 1}"
          class="boarding-pass-img"
          data-file-name="${h(fileName)}"
          onclick="downloadFromDataUrl(this)"
          style="width:100%;display:block;border-radius:28px;box-shadow:0 6px 28px rgba(0,0,0,.13);cursor:pointer"
        />
        <p style="text-align:center;font-size:11px;color:#98a2b3;margin-top:8px;font-weight:800">꾹 눌러 저장 · 탭하여 다운로드</p>
      </div>`;
    } catch(e) {
      return boardingPassHtml(item.f, item.sector, item.p, item.index, boardingPassFileName(item));
    }
  });
  return parts.join('<div style="height:24px"></div>');
}
function downloadFromDataUrl(imgEl) {
  // ★ 핵심: PNG 저장 수 / 분석: 저장 포맷별 클릭률
  safeGtag('event', 'save_png', { save_format: 'boarding_pass' });
  const a = document.createElement('a');
  a.href = imgEl.src;
  a.download = imgEl.dataset.fileName || 'WishBoardingPass.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function boardingPassHtml(f, sector, p, index = 0, fileName = '') {
  const seat = p.type === 'infant' ? 'INF' : (state.seats[sector]?.[p.id] || '-');
  const meal = p.type === 'infant' ? null : mealFor(sector, p.id);
  const mealBlock = mealAvailable() && meal && meal.id !== 'none' ? `<div style="grid-column:1/-1;border-top:1px dashed #e4e7ec;margin-top:4px;padding-top:12px"><label>Meal</label><b class="meal-name">${h(meal.title)}</b></div>` : '';
  return `<section class="boarding boarding-stack boarding-pass-capture" id="boarding-pass-${index}" data-file-name="${h(fileName)}"><div class="boarding-head"><b>BOARDING PASS · ${h(sectorLabel(sector))}</b><span class="watermark">DEMO</span></div><div class="boarding-body"><div class="muted small">Passenger</div><b class="boarding-passenger-name">${h(passengerName(p))}</b><div class="big-route"><div><div class="big-code">${h(f.departure_airport_id)}</div><div class="muted">${h(airportLabel(f.departure_airport_id))}</div></div><div class="route-plane">✈</div><div style="text-align:right"><div class="big-code">${h(f.arrival_airport_id)}</div><div class="muted">${h(airportLabel(f.arrival_airport_id))}</div></div></div><div class="grid-2 boarding-fields"><div><label>Flight</label><b>${h(f.flight_number)}</b></div><div><label>Seat</label><b>${h(seat)}</b></div><div><label>Date</label><b>${h(dateForSector(sector))}</b></div><div><label>Gate</label><b>D${((index * 7 + 7) % 20) + 1}</b></div><div><label>Boarding</label><b>${h(fmtTime(f.departure_at))}</b></div><div><label>Booking</label><b>${h(state.bookingCode)}</b></div>${mealBlock}</div><div class="qr"><img src="${QR_IMAGE_SRC}" alt="WISH DEMO QR"/><span>WISH DEMO QR</span></div></div></section>`;
}
syncPassengers();
render();
