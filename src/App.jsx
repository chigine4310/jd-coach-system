import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';
import { 
  UserCircle, MoveRight, Cake, Share2, HandCoins, Landmark, Dumbbell,
  BadgePercent, Gift, ShoppingCart, ArrowRight, ToggleLeft, ToggleRight,
  UserCheck, UserMinus, Settings2, AlertTriangle, Briefcase, Link as LinkIcon,
  ChevronDown, Clock, Download, FileSpreadsheet, UserSearch, Info, Upload,
  BarChart3, AlertCircle, PieChart as PieChartIcon, Calculator, Building,
  PlusCircle, MinusCircle, ShieldAlert, CreditCard, Bell, Target, Settings, Search, History,
  Sparkles, Copy, MessageSquare, Loader2, ShieldCheck, ClipboardList, Calendar, 
  TrendingUp, Contact, Users, Wallet, Check, CalendarDays, Edit2, Trash2, 
  FileJson, DollarSign, Save, X, Cloud, CheckCircle2,
  Timer, LogIn, LogOut, CalendarOff, CheckSquare, XSquare, Receipt,
  ChevronLeft, ChevronRight, CalendarCheck
} from 'lucide-react';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'coach-payroll-v66';

const getLocalDateString = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const getLocalMonthString = () => getLocalDateString().slice(0, 7);

const getMonthFirstDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const getMonthLastDay = () => {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};

const CONFIG = {
  classFeeFormal: 1000,     
  tempCommissionRate: 0.44, 
  athleteCommissionRate: 0.40,
  probationCommissionRate: 0.30, 
  sales5Rate: 0.03,         
  sales10Rate: 0.03,        
  referralFee: 0,         
  laborRate: 0.115,         
  healthRate: 0.0517,       
  pensionRate: 0.06,        
  taxThresholdFormal: 88500,
  taxThresholdTemp: 86000,  
  taxRate: 0.05,            
  vatRate: 0.05,            
  corporateTaxRate: 0.20,   
  avgClassPrice: 2300,
  sleeperDaysWarning: 30    
};

const TAIWAN_HOLIDAYS = {
  '2026-01-01': '元旦',
  '2026-02-16': '春節(除夕)',
  '2026-02-17': '春節(初一)',
  '2026-02-18': '春節(初二)',
  '2026-02-19': '春節(初三)',
  '2026-02-20': '春節(初四)',
  '2026-02-28': '二二八紀念日',
  '2026-04-03': '兒童節',
  '2026-04-04': '清明節',
  '2026-04-06': '清明補假',
  '2026-05-01': '勞動節',
  '2026-06-19': '端午節',
  '2026-09-25': '中秋節',
  '2026-10-09': '國慶彈性休',
  '2026-10-10': '國慶日',
  '2027-01-01': '元旦',
  '2027-02-05': '春節(除夕)',
  '2027-02-06': '春節(初一)',
  '2027-02-07': '春節(初二)',
  '2027-02-08': '春節(初三)'
};

const LEAVE_TYPES = {
  'personal': { label: '事假', rate: 1.0, advanceDays: 1, notice: '依規定須提前 1 天申請', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'sick': { label: '病假 (半薪)', rate: 0.5, advanceDays: 0, notice: '突發狀況可當日申請 (需附證明)', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'menstrual': { label: '生理假 (半薪)', rate: 0.5, advanceDays: 0, notice: '可當日申請', color: 'text-pink-600 bg-pink-50 border-pink-200' },
  'annual': { label: '特別休假 (全薪)', rate: 0.0, advanceDays: 3, notice: '建議提前 3 天排定，避免影響營運', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'comp_leave': { label: '補休 (全薪)', rate: 0.0, advanceDays: 3, notice: '須提前 3 天申請', color: 'text-lime-600 bg-lime-50 border-lime-200' },
  'marriage': { label: '婚假 (全薪)', rate: 0.0, advanceDays: 7, notice: '須提前 7 天申請 (需附證明)', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200' },
  'bereavement': { label: '喪假 (全薪)', rate: 0.0, advanceDays: 0, notice: '可當日申請 (百日內請畢)', color: 'text-slate-600 bg-slate-100 border-slate-300' },
  'official': { label: '公假 (全薪)', rate: 0.0, advanceDays: 3, notice: '須提前 3 天申請 (需附證明)', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  'typhoon': { label: '颱風假', rate: 0.0, advanceDays: 0, notice: '依政府停班停課公告為準，免扣薪', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' }
};

const formatClasses = (num) => Number.isInteger(num) ? num : Number(num.toFixed(1));

const getCoachTypeLabel = (type) => {
  switch (type) {
    case 'formal': return '正式 A'; // Legacy support
    case 'formalA': return '正式 A';
    case 'formalB': return '正式 B';
    case 'temp': return '承攬 A'; // Legacy support
    case 'tempA': return '承攬 A';
    case 'tempB': return '承攬 B';
    case 'probation': return '實習 A'; // Legacy support
    case 'probationA': return '實習 A';
    case 'probationB': return '實習 B';
    case 'project': return '專案技能';
    default: return '未知';
  }
};

const getBaseSalaryDefaults = (type) => {
  if (type === 'formal' || type === 'formalA') return 32000;
  if (type === 'formalB') return 32000; // 22000 + 10000 行政
  return 0;
};

const getLaborBracket = (pay) => {
  const brackets = [27470, 28590, 30300, 31800, 33300, 34800, 36300, 38200, 40100, 42000, 43900, 45800];
  return brackets.find(b => b >= pay) || 45800;
};

const getHealthBracket = (pay) => {
  const brackets = [27470, 28590, 30300, 31800, 33300, 34800, 36300, 38200, 40100, 42000, 43900, 45800, 48200, 50600, 53000, 55400, 57800, 60800, 63800, 66800, 69800, 72800, 76500, 80200, 83900, 87600, 92100, 96600, 101100, 105600, 110100, 115500, 120900, 126300, 131700, 137100, 142500, 147900, 150000, 219500];
  return brackets.find(b => b >= pay) || 219500;
};

const App = () => {
  const [user, setUser] = useState(null); 
  const [isAppLoggedIn, setIsAppLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState('boss');
  
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBossPassword, setShowBossPassword] = useState(false);
  const [showCoachSelect, setShowCoachSelect] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [loggedInCoachId, setLoggedInCoachId] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const [employees, setEmployees] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [customers, setCustomers] = useState([]); 
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance');
  const [athleteMode, setAthleteMode] = useState('deduct'); 
  const [dailyOpMode, setDailyOpMode] = useState('deduct'); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [collectionStartDate, setCollectionStartDate] = useState(getLocalDateString());
  const [collectionEndDate, setCollectionEndDate] = useState(getLocalDateString());
  const [summaryMonth, setSummaryMonth] = useState(getLocalMonthString());
  const [syncStatus, setSyncStatus] = useState('idle');

  const [logQueryType, setLogQueryType] = useState('date');
  const [logQueryDate, setLogQueryDate] = useState(getLocalDateString());
  const [logQueryMonth, setLogQueryMonth] = useState(getLocalMonthString());
  const [logSearchText, setLogSearchText] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const [editingLog, setEditingLog] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'danger', title: '', message: '', action: null });
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '', isLoading: false });
  const [selectedCoachForDetails, setSelectedCoachForDetails] = useState(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState(null);
  
  const [newEmp, setNewEmp] = useState({ name: '', xValue: '', type: 'formalA', isBossNoPay: false, baseSalary: '', startDate: getLocalDateString(), projectTitle: '', promotionDate: '', prePromotionType: '' });
  const [newCust, setNewCust] = useState({ 
    name: '', birthday: '', gender: '不透露', occupation: '', remaining: '0', 
    joinDate: getLocalDateString(), referrerId: '', referredByCustomerId: '',
    isAthleteProjectMember: false, isSpecialEventMember: false
  });
  
  const [leaveData, setLeaveData] = useState({
    date: getLocalDateString(), type: 'personal', hours: '8', reason: ''
  });

  const [expenseData, setExpenseData] = useState({
    employeeId: '', date: getLocalDateString(), item: '', amount: '', invoiceType: '電子發票', invoiceTypeOther: ''
  });

  const [logData, setLogData] = useState({
    employeeId: '', customerName: '', deductFromCustomerId: '', referralSourceId: '',
    sessionTime: '', classDuration: '90min', classes: '1', companyRevenue: '0', overtime: '0', 
    sales10: '0', sales5: '0', salesAthlete: '0', purchaseDate: getLocalDateString(),
    paymentMethod: '現金', isAthleteProject: false,
    productName: '', productPrice: '', productQty: '1', eventSupportPay: '0',
    specialEventType: '' 
  });

  const [activeFinanceTab, setActiveFinanceTab] = useState('overview');
  const [scheduleMonth, setScheduleMonth] = useState(getLocalMonthString());
  const [customBaseSalaries, setCustomBaseSalaries] = useState({}); 
  const [customIsCompany, setCustomIsCompany] = useState({}); 
  const [filterStartDate, setFilterStartDate] = useState(getMonthFirstDay()); 
  const [filterEndDate, setFilterEndDate] = useState(getMonthLastDay());     
  const [operatingCosts, setOperatingCosts] = useState({
    rent: 40000, utilities: 3000, marketing: 10000, misc: 5000        
  });
  const [extraRevenue, setExtraRevenue] = useState(0); 

  const referralData = useMemo(() => {
    const map = {}; 
    const counts = {}; 
    const sortedLogs = [...dailyLogs].sort((a,b) => {
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    sortedLogs.forEach(log => {
      if (log.referralSourceId && log.employeeId !== log.referralSourceId && !log.specialEventType && log.employeeId !== 'COMPANY_REVENUE') {
        const customerKey = log.customerName?.trim().toLowerCase();
        const matchedCustomer = customers.find(c => c.name?.trim().toLowerCase() === customerKey);
        if (matchedCustomer?.customerType === 'activity') return;

        const isNewAth = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
        const rawCls = Number(log.classes) || 0;
        const valCls = isNewAth ? rawCls / 3 : rawCls;

        if (valCls > 0) {
          const trackingKey = `${log.referralSourceId}_${customerKey}`;
          const prevCount = counts[trackingKey] || 0;

          if (prevCount < 10) {
            const eligible = Math.min(valCls, 10 - prevCount);
            const startSeq = prevCount + 1;
            const endSeq = prevCount + eligible;
            let seqStr = '';

            if (Number.isInteger(valCls) && Number.isInteger(prevCount)) {
               if (eligible === 1) seqStr = `第 ${startSeq}/10 堂`;
               else seqStr = `第 ${startSeq}-${endSeq}/10 堂`;
            } else {
               seqStr = `累計 ${formatClasses(prevCount + eligible)}/10 堂`;
            }
            map[log.id] = { seqString: seqStr, eligibleClasses: eligible };
          } else {
            map[log.id] = { seqString: '已滿 10 堂', eligibleClasses: 0 };
          }
          counts[trackingKey] = prevCount + valCls;
        }
      }
    });
    return map;
  }, [dailyLogs, customers]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("底層授權連線異常", e);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setAuthLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setAuthError('');
    // 請將下方的 '123456' 改為您想要的密碼
    if (email === 'jd.traininglab@gmail.com' && password === '您的新密碼') {
      setUserRole('boss');
      setIsAppLoggedIn(true);
      return; 
    }
    try {
      if (isRegistering) { 
        await createUserWithEmailAndPassword(auth, email, password); 
      } else { 
        await signInWithEmailAndPassword(auth, email, password); 
      }
      setUserRole('boss');
      setIsAppLoggedIn(true);
    } catch (err) { 
      setAuthError('登入失敗，請確認帳號密碼是否正確'); 
    }
  };

  const handleMockLogin = (role) => {
    setUserRole(role);
    setIsAppLoggedIn(true);
  };

  useEffect(() => {
    if (!user) return;
    const employeesRef = collection(db, 'artifacts', appId, 'public', 'data', 'employees');
    const logsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
    const customersRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
    const attRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    const leaveRef = collection(db, 'artifacts', appId, 'public', 'data', 'leaves');
    const expRef = collection(db, 'artifacts', appId, 'public', 'data', 'expenses');
    let loadedCount = 0;
    const checkLoaded = () => { loadedCount++; if (loadedCount >= 3) setIsDataLoaded(true); };
    
    const unsubEmp = onSnapshot(employeesRef, (s) => { setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (err) => console.error(err));
    const unsubLog = onSnapshot(logsRef, (s) => { setDailyLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (err) => console.error(err));
    const unsubCust = onSnapshot(customersRef, (s) => { setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (err) => console.error(err));
    const unsubAtt = onSnapshot(attRef, (s) => { setAttendanceRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, (err) => console.error(err));
    const unsubLeave = onSnapshot(leaveRef, (s) => { setLeaveRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, (err) => console.error(err));
    const unsubExp = onSnapshot(expRef, (s) => { setExpenses(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, (err) => console.error(err));
    
    return () => { unsubEmp(); unsubLog(); unsubCust(); unsubAtt(); unsubLeave(); unsubExp(); };
  }, [user]);

  useEffect(() => {
    if (!employees.length) return;
    setCustomBaseSalaries(prev => {
      const next = { ...prev };
      employees.forEach(emp => {
        if (next[emp.id] === undefined) {
          const isBoss = emp.isBossNoPay || emp.name === '顏秀如';
          next[emp.id] = isBoss ? 0 : (emp.baseSalary !== undefined && emp.baseSalary !== '' ? Number(emp.baseSalary) : getBaseSalaryDefaults(emp.type)); 
        }
      });
      return next;
    });

    setCustomIsCompany(prev => {
      const next = { ...prev };
      employees.forEach(emp => {
        if (next[emp.id] === undefined) next[emp.id] = false;
      });
      return next;
    });
  }, [employees]);

  const triggerSync = async (action) => {
    setSyncStatus('syncing');
    try { 
      await action(); 
      setSyncStatus('success'); 
      setTimeout(() => setSyncStatus('idle'), 2000); 
    } catch (e) { 
      console.error("雲端同步錯誤: ", e);
      alert(`儲存失敗，請檢查網路連線或資料格式: ${e.message}`);
      setSyncStatus('error'); 
      setTimeout(() => setSyncStatus('idle'), 3000); 
    }
  };

  const calculateEntrySalary = (emp, log, baseCount, eligibleRef = 0) => {
    if (!emp || emp.id === 'COMPANY_REVENUE') return { classPay: 0, bonus: 0, refAdj: 0, eventSupportPay: 0, total: 0, validClasses: 0 };
    
    const matchedCustomer = customers.find(c => c.name?.trim().toLowerCase() === log.customerName?.trim().toLowerCase());
    const isActivity = matchedCustomer?.customerType === 'activity';
    const isNewAthlete = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
    const isOldAthlete = log.isAthleteProject && !isNewAthlete && log.classDuration !== 'athlete_buy';
    
    let rawClsCount = log.specialEventType ? (Number(log.classes) || 1) : (Number(log.classes) || 0);
    if (isActivity) rawClsCount = 0; 
    
    const isOvertimeLog = log.classDuration === 'overtime30min' || log.classDuration === 'overtime60min'; // 保留歷史紀錄判定
    
    let validClasses = isNewAthlete ? (rawClsCount / 3) : rawClsCount;
    if (isOvertimeLog) {
       validClasses = 0; // 加時不計入累計堂數 (歷史資料)
    }
    
    let classPay = 0;
    let cumulative = baseCount;
    
    let effectiveType = emp.type;
    if (emp.promotionDate && log.date < emp.promotionDate && emp.prePromotionType) {
        effectiveType = emp.prePromotionType;
    }

    const empType = effectiveType === 'formal' ? 'formalA' : 
                    effectiveType === 'temp' ? 'tempA' : 
                    effectiveType === 'probation' ? 'probationA' : effectiveType;

    let seniorityYears = 0;
    if (emp.startDate && log.date && emp.startDate.length >= 10 && log.date.length >= 10) {
        const [sy, sm, sd] = emp.startDate.split('-').map(Number);
        const [ly, lm, ld] = log.date.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd);
        const current = new Date(ly, lm - 1, ld);
        seniorityYears = current.getFullYear() - start.getFullYear();
        if (current < new Date(current.getFullYear(), start.getMonth(), start.getDate())) {
            seniorityYears--;
        }
        seniorityYears = Math.max(0, seniorityYears);
    }
    const discount = seniorityYears; // 每年年資折抵一堂

    if (log.specialEventType === '隨喜40min') {
      classPay = Number(log.companyRevenue) || 0; 
    } else if (log.specialEventType === '進階體驗90min') {
      classPay = 500;
    } else if (log.classDuration === 'athlete_buy') {
      classPay = 0;
    } else {
        const X = log.classFee ? Number(log.classFee) : (
            log.classDuration === '150min' ? 4300 :
            log.classDuration === '120min' ? 3400 :
            log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
            log.classDuration === 'overtime30min' ? 900 : 2500
        ); 
        const clsCount = rawClsCount;
        
        for (let i = 0; i < clsCount; i++) {
          if (!isOvertimeLog) {
             cumulative += (isNewAthlete ? 1/3 : 1);
          }
          
          if (isNewAthlete) {
             classPay += 250;
          } else if (isOldAthlete) {
             classPay += 750;
          } else {
              if (empType === 'probationA') {
                classPay += 1000; 
              } else if (empType === 'probationB') {
                if (cumulative <= 20) classPay += X * 0.30;
                else if (cumulative <= 30) classPay += X * 0.32;
                else if (cumulative <= 40) classPay += X * 0.34;
                else classPay += X * 0.36;
              } else if (empType === 'tempA') {
                classPay += X * 0.44;
              } else if (empType === 'tempB') {
                classPay += X * 0.40;
              } else if (empType === 'formalA') {
                let m = 0; 
                if (cumulative > Math.max(0, 35 - discount)) {
                  if (cumulative >= Math.max(0, 76 - discount)) m = 0.5;
                  else if (cumulative >= Math.max(0, 66 - discount)) m = 0.48;
                  else if (cumulative >= Math.max(0, 56 - discount)) m = 0.46;
                  else if (cumulative >= Math.max(0, 46 - discount)) m = 0.42;
                  else m = 0.4;
                }
                classPay += X * m; 
              } else if (empType === 'formalB') {
                 let m = 0;
                 if (cumulative > Math.max(0, 25 - discount)) {
                    if (cumulative >= Math.max(0, 76 - discount)) m = 0.46;
                    else if (cumulative >= Math.max(0, 66 - discount)) m = 0.44;
                    else if (cumulative >= Math.max(0, 56 - discount)) m = 0.42;
                    else if (cumulative >= Math.max(0, 46 - discount)) m = 0.38;
                    else if (cumulative >= Math.max(0, 36 - discount)) m = 0.36;
                    else m = 0.36; 
                 }
                 classPay += X * m;
              }
          }
        }
    }
    
    let productBonus = 0;
    if (['花生球', '黑色迷你滾筒', '木色迷你滾筒', '綠色迷你滾筒'].includes(log.productName)) {
      productBonus = (Number(log.productQty) || 0) * 99;
    }
    
    const bonus = (Number(log.sales10) || 0) * 750 + (Number(log.sales5) || 0) * 345 + productBonus;
    const refAdj = Math.round(eligibleRef * 100);
    const eventSupportPay = Number(log.eventSupportPay) || 0;
    
    return { classPay: Math.round(classPay), bonus, refAdj, eventSupportPay, total: Math.round(classPay + bonus + refAdj + eventSupportPay), validClasses };
  };

  const calculateSettlement = (empId, month) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return null;
    const mLogs = dailyLogs.filter(l => l.date && l.date.startsWith(month)).sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
    const empLogs = mLogs.filter(l => l.employeeId === empId);
    let totalClasses = 0, totalClassPay = 0, totalBonus = 0, totalRef = 0, totalEventSupport = 0, cumulative = 0;
    
    empLogs.forEach(log => {
      const b = calculateEntrySalary(emp, log, cumulative, 0); // 自己上課不帶入轉介
      totalClasses += b.validClasses; 
      totalClassPay += b.classPay;
      totalBonus += b.bonus;
      totalEventSupport += b.eventSupportPay;
      cumulative += b.validClasses;
    });
    
    mLogs.forEach(l => {
      if (l.referralSourceId === emp.id && l.employeeId !== emp.id) {
         const eligible = referralData[l.id]?.eligibleClasses || 0;
         totalRef += 0;
      }
    });
    
    const isBoss = emp.isBossNoPay || emp.name === '顏秀如';
    const baseSalary = isBoss ? 0 : (emp.baseSalary !== undefined && emp.baseSalary !== '' ? Number(emp.baseSalary) : getBaseSalaryDefaults(emp.type));
    
    // 計算該月份勞基法請假扣薪
    const empLeaves = leaveRecords.filter(l => l.employeeId === empId && l.date.startsWith(month) && l.status === 'approved');
    let leaveDeduction = 0;
    empLeaves.forEach(leave => {
       const rate = LEAVE_TYPES[leave.type]?.rate || 0;
       // 勞基法標準：底薪 / 30天 / 8小時 = 時薪
       const hourlyWage = baseSalary / 240; 
       leaveDeduction += hourlyWage * Number(leave.hours) * rate;
    });
    const finalBaseSalary = Math.max(0, Math.round(baseSalary - leaveDeduction));
    
    const grossSalary = Math.round(finalBaseSalary + totalClassPay + totalBonus + totalRef + totalEventSupport);
    
    let typeLabel = getCoachTypeLabel(emp.type);
    
    return { totalClasses, grossSalary, totalRef, totalBonus, totalEventSupport, typeLabel, baseSalary: finalBaseSalary, originalBaseSalary: baseSalary, leaveDeduction: Math.round(leaveDeduction) };
  };

  const financeDashboard = useMemo(() => {
    if (!isDataLoaded) return { totalRev: 0, employeeSummary: {} };
    const logs = dailyLogs.filter(l => l.date === selectedDate).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    let totalRev = 0;
    const summary = {};
    const monthClasses = {};
    employees.forEach(e => {
      const prev = dailyLogs.filter(l => l.employeeId === e.id && l.date < selectedDate && l.date.startsWith(selectedDate.slice(0, 7)));
      monthClasses[e.id] = prev.reduce((s, c) => {
         const mCust = customers.find(cust => cust.name?.trim().toLowerCase() === c.customerName?.trim().toLowerCase());
         const isAct = mCust?.customerType === 'activity' && !c.specialEventType; 
         const isNewAth = c.classDuration?.startsWith('athlete_') && c.classDuration !== 'athlete_buy';
         const cls = c.specialEventType ? (Number(c.classes) || 1) : (Number(c.classes) || 0);
         const isOvertimeLog = c.classDuration === 'overtime30min' || c.classDuration === 'overtime60min';
         return s + (isAct || isOvertimeLog ? 0 : (isNewAth ? cls / 3 : cls));
      }, 0);
    });
    logs.forEach(log => {
      let classRev = 0;
      const matchedCust = customers.find(c => c.name?.trim().toLowerCase() === log.customerName?.trim().toLowerCase());
      const isActivityLog = matchedCust?.customerType === 'activity' && !log.specialEventType;

      if (log.specialEventType === '隨喜40min') {
         classRev = Number(log.companyRevenue) || 0;
      } else if (log.specialEventType === '進階體驗90min') {
         classRev = 1000;
      } else if (log.specialEventType?.startsWith('出差任務')) {
         classRev = Number(log.companyRevenue) || 0; 
      } else if (log.employeeId === 'COMPANY_REVENUE' || isActivityLog) {
        classRev = Number(log.companyRevenue) || 0;
      } else if (log.paymentMethod !== '代扣' && Number(log.classes) > 0) {
        const isNewAth = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
        const isOldAth = log.isAthleteProject && !isNewAth && log.classDuration !== 'athlete_buy';
        if (isNewAth) {
            classRev = Number(log.classes) * 250;
        } else if (isOldAth) {
            classRev = Number(log.classes) * 750;
        } else {
            const X = log.classFee ? Number(log.classFee) : (
                log.classDuration === '150min' ? 4300 :
                log.classDuration === '120min' ? 3400 :
                log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
                log.classDuration === 'overtime30min' ? 900 : 2500
            );
            classRev = Number(log.classes) * X;
        }
      }
      
      let productRev = (Number(log.productPrice) || 0) * (Number(log.productQty) || 0);
      totalRev += classRev + (Number(log.sales10) * 25000) + (Number(log.sales5) * 11500) + (Number(log.salesAthlete) * 6000) + productRev;
    });
    employees.forEach(emp => {
      const isBoss = emp.isBossNoPay || emp.name === '顏秀如';
      let dailyTotal = 0, count = 0, ref = 0, bonus = 0, eventSupportPay = 0, base = monthClasses[emp.id] || 0;
      logs.forEach(l => {
        if (l.employeeId === emp.id) {
          const b = calculateEntrySalary(emp, l, base, 0);
          dailyTotal += b.total; count += b.validClasses; base += b.validClasses;
          bonus += b.bonus;
          eventSupportPay += b.eventSupportPay;
        } 
        if (l.referralSourceId === emp.id && l.employeeId !== emp.id) { 
          const eligible = referralData[l.id]?.eligibleClasses || 0;
          if (eligible > 0) {
            dailyTotal += 0; 
            ref += 0; 
          }
        }
      });
      if (isBoss) { dailyTotal = 0; ref = 0; bonus = 0; eventSupportPay = 0; }
      if (dailyTotal !== 0 || count !== 0) summary[emp.id] = { count, totalPay: dailyTotal, ref, bonus, eventSupportPay };
    });
    return { totalRev, employeeSummary: summary };
  }, [dailyLogs, selectedDate, employees, customers, isDataLoaded]);

  // 新增：每日現金與轉帳代收對帳計算
  const dailyCollections = useMemo(() => {
    if (!isDataLoaded) return { collectionsByCoach: {}, totalCash: 0, totalTransfer: 0, total: 0 };
    const logs = dailyLogs.filter(l => {
      const d = l.date || '';
      const passStart = collectionStartDate ? d >= collectionStartDate : true;
      const passEnd = collectionEndDate ? d <= collectionEndDate : true;
      return passStart && passEnd;
    });
    const collectionsByCoach = {};
    let totalCash = 0, totalTransfer = 0;

    logs.forEach(log => {
      if (log.paymentMethod === '代扣') return; 

      let logRev = 0;
      const matchedCust = customers.find(c => c.name?.trim().toLowerCase() === log.customerName?.trim().toLowerCase());
      const isActivityLog = matchedCust?.customerType === 'activity' && !log.specialEventType;

      if (log.specialEventType === '隨喜40min') {
         logRev = Number(log.companyRevenue) || 0;
      } else if (log.specialEventType === '進階體驗90min') {
         logRev = 1000;
      } else if (log.specialEventType?.startsWith('出差任務')) {
         logRev = Number(log.companyRevenue) || 0; 
      } else if (log.employeeId === 'COMPANY_REVENUE' || isActivityLog) {
        logRev = Number(log.companyRevenue) || 0;
      } else if (Number(log.classes) > 0) {
        const isNewAth = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
        const isOldAth = log.isAthleteProject && !isNewAth && log.classDuration !== 'athlete_buy';
        if (isNewAth) {
            logRev = Number(log.classes) * 250;
        } else if (isOldAth) {
            logRev = Number(log.classes) * 750;
        } else {
            const X = log.classFee ? Number(log.classFee) : (
                log.classDuration === '150min' ? 4300 :
                log.classDuration === '120min' ? 3400 :
                log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
                log.classDuration === 'overtime30min' ? 900 : 2500
            );
            logRev = Number(log.classes) * X;
        }
      }
      
      let productRev = (Number(log.productPrice) || 0) * (Number(log.productQty) || 0);
      logRev += (Number(log.sales10) * 25000) + (Number(log.sales5) * 11500) + (Number(log.salesAthlete) * 6000) + productRev;

      if (logRev > 0) {
         const eId = log.employeeId || 'COMPANY_REVENUE';
         if (!collectionsByCoach[eId]) {
            collectionsByCoach[eId] = { cash: 0, transfer: 0, total: 0 };
         }
         if (log.paymentMethod === '現金') {
            collectionsByCoach[eId].cash += logRev;
            totalCash += logRev;
         } else if (log.paymentMethod === '轉帳') {
            collectionsByCoach[eId].transfer += logRev;
            totalTransfer += logRev;
         }
         collectionsByCoach[eId].total += logRev;
      }
    });
    return { collectionsByCoach, totalCash, totalTransfer, total: totalCash + totalTransfer };
  }, [dailyLogs, collectionStartDate, collectionEndDate, customers, isDataLoaded]);

  const analyzedData = useMemo(() => {
    const validLogs = dailyLogs.filter(r => {
      const rDate = r.date || '1970-01-01';
      const passStart = filterStartDate ? rDate >= filterStartDate : true;
      const passEnd = filterEndDate ? rDate <= filterEndDate : true;
      return passStart && passEnd;
    });
    
    const baseDateString = filterEndDate || getLocalDateString();
    const baseDateObj = new Date(baseDateString);
    
    let calcStart = filterStartDate;
    let calcEnd = filterEndDate;
    if (!calcStart && validLogs.length > 0) {
        calcStart = validLogs.reduce((min, p) => p.date < min ? p.date : min, validLogs[0].date);
    }
    if (!calcEnd && validLogs.length > 0) {
        calcEnd = validLogs.reduce((max, p) => p.date > max ? p.date : max, validLogs[0].date);
    }
    let monthDiff = 1;
    if (calcStart && calcEnd) {
         let sy = parseInt(calcStart.slice(0, 4)), sm = parseInt(calcStart.slice(5, 7));
         let ey = parseInt(calcEnd.slice(0, 4)), em = parseInt(calcEnd.slice(5, 7));
         monthDiff = (ey - sy) * 12 + (em - sm) + 1;
    }
    if (monthDiff < 1 || isNaN(monthDiff)) monthDiff = 1;
    
    const coachStats = {};
    employees.forEach(emp => {
      coachStats[emp.id] = {
        ...emp,
        totalClasses: 0,
        totalSales5: 0,
        totalSales10: 0,
        salesBonus: 0,
        referralBonus: 0,
        referralClassesGenerated: 0,
        eventSupportPay: 0,
        classIncome: 0,
        customers: new Set()
      };
    });

    const monthlyLogsByCoach = {};
    dailyLogs.forEach(l => {
      if (!l.date) return;
      const m = l.date.slice(0, 7);
      const cId = l.employeeId;
      if (!monthlyLogsByCoach[m]) monthlyLogsByCoach[m] = {};
      if (!monthlyLogsByCoach[m][cId]) monthlyLogsByCoach[m][cId] = [];
      monthlyLogsByCoach[m][cId].push(l);
    });

    const logPayMap = {}; 
    Object.keys(monthlyLogsByCoach).forEach(m => {
      Object.keys(monthlyLogsByCoach[m]).forEach(cId => {
        const emp = employees.find(e => e.id === cId);
        if (!emp) return;
        const logs = monthlyLogsByCoach[m][cId].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
        let cumulative = 0;
        logs.forEach(log => {
           const b = calculateEntrySalary(emp, log, cumulative);
           logPayMap[log.id] = b.classPay;
           cumulative += b.validClasses;
        });
      });
    });

    const customerStats = {};
    let totalRevenue = 0;
    let totalClassesGlobal = 0;
    const paymentMethodsCounts = {};
    const paymentMethodsAmounts = {};
    let athleteProjectClasses = 0;
    let athleteProjectRevenue = 0;

    customers.forEach(c => {
       customerStats[c.id] = {
           name: c.name,
           remainingClasses: Number(c.remaining) || 0,
           usedClasses: 0,
           purchasedClasses: 0,
           sales: 0,
           lastDate: '1970-01-01'
       };
    });

    validLogs.forEach(log => {
      const matchedCust = customers.find(c => c.name?.trim().toLowerCase() === log.customerName?.trim().toLowerCase());
      const isActivityLog = matchedCust?.customerType === 'activity' && !log.specialEventType;
      
      const isNewAthlete = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
      const isOldAthlete = log.isAthleteProject && !isNewAthlete && log.classDuration !== 'athlete_buy';
      const isAthlete = isNewAthlete || isOldAthlete;
      const isOvertimeLog = log.classDuration === 'overtime30min' || log.classDuration === 'overtime60min';
      
      const rawClasses = log.specialEventType ? (Number(log.classes) || 1) : (Number(log.classes) || 0);
      const classes = isActivityLog ? 0 : rawClasses;
      let validClasses = isNewAthlete ? (classes / 3) : classes;
      if(isOvertimeLog) validClasses = 0;
      
      const s10Qty = Number(log.sales10) || 0;
      const s5Qty = Number(log.sales5) || 0;
      const sAthQty = Number(log.salesAthlete) || 0;
      const pMethod = log.paymentMethod || '現金';
      const teacherId = log.employeeId;
      const sourceId = log.referralSourceId;
      const receiverId = log.referralReceiverId;
      const eventSupportPay = Number(log.eventSupportPay) || 0;
      
      let classCashRev = 0;
      if (log.specialEventType === '隨喜40min') {
         classCashRev = Number(log.companyRevenue) || 0;
      } else if (log.specialEventType === '進階體驗90min') {
         classCashRev = 1000;
      } else if (log.specialEventType?.startsWith('出差任務')) {
         classCashRev = Number(log.companyRevenue) || 0;
      } else if (teacherId === 'COMPANY_REVENUE' || isActivityLog) {
        classCashRev = Number(log.companyRevenue) || 0;
      } else if (pMethod !== '代扣' && classes > 0) {
        if (isNewAthlete) {
            classCashRev = classes * 250;
        } else if (isOldAthlete) {
            classCashRev = classes * 750;
        } else {
            const X = log.classFee ? Number(log.classFee) : (
                log.classDuration === '150min' ? 4300 :
                log.classDuration === '120min' ? 3400 :
                log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
                log.classDuration === 'overtime30min' ? 900 : 2500
            );
            classCashRev = classes * X;
        }
      }

      let productBonus = 0;
      if (['花生球', '黑色迷你滾筒', '木色迷你滾筒', '綠色迷你滾筒'].includes(log.productName)) {
         productBonus = (Number(log.productQty) || 0) * 99;
      }

      const recordSales = (s10Qty * 25000) + (s5Qty * 11500) + (sAthQty * 6000) + ((Number(log.productQty)||0) * (Number(log.productPrice)||0)) + classCashRev;
      const purchased = (s10Qty * 11) + (s5Qty * 5) + (sAthQty * 24);
      const currentSalesBonus = (s10Qty * 25000 * 0.03) + (s5Qty * 11500 * 0.03) + productBonus;

      if (sourceId && sourceId !== teacherId) {
        const eligible = referralData[log.id]?.eligibleClasses || 0;
        if (eligible > 0 && coachStats[sourceId]) {
          coachStats[sourceId].referralBonus += 0;
          coachStats[sourceId].referralClassesGenerated += eligible;
        }
      }

      if (teacherId && coachStats[teacherId]) {
        coachStats[teacherId].totalClasses += validClasses;
        coachStats[teacherId].totalSales5 += s5Qty;
        coachStats[teacherId].totalSales10 += s10Qty;
        coachStats[teacherId].salesBonus += currentSalesBonus;
        coachStats[teacherId].eventSupportPay += eventSupportPay;
        coachStats[teacherId].classIncome += (logPayMap[log.id] || 0); 
        coachStats[teacherId].customers.add(log.customerName);
      }

      if (matchedCust && customerStats[matchedCust.id]) {
        customerStats[matchedCust.id].usedClasses += classes;
        customerStats[matchedCust.id].sales += recordSales;
        customerStats[matchedCust.id].purchasedClasses += purchased;
        if (log.date && log.date > customerStats[matchedCust.id].lastDate) {
          customerStats[matchedCust.id].lastDate = log.date;
        }
      }

      totalClassesGlobal += validClasses;
      totalRevenue += recordSales;
      
      paymentMethodsCounts[pMethod] = (paymentMethodsCounts[pMethod] || 0) + 1;
      paymentMethodsAmounts[pMethod] = (paymentMethodsAmounts[pMethod] || 0) + recordSales;
      
      if (isAthlete) {
        athleteProjectClasses += validClasses;
        athleteProjectRevenue += classCashRev + (sAthQty * 6000);
      }
    });

    let totalUnusedClasses = 0;
    let totalUnearnedRevenue = 0;
    let sleeperCustomersCount = 0;

    const topCustomers = Object.entries(customerStats).map(([id, stats]) => {
      const remainingValue = stats.remainingClasses > 0 ? stats.remainingClasses * CONFIG.avgClassPrice : 0;
      const lastDateObj = new Date(stats.lastDate !== '1970-01-01' ? stats.lastDate : baseDateString);
      const daysSinceLastClass = Math.max(0, Math.floor((baseDateObj - lastDateObj) / (1000 * 60 * 60 * 24)));
      const isSleeper = stats.remainingClasses > 0 && daysSinceLastClass >= CONFIG.sleeperDaysWarning;
      
      if (stats.remainingClasses > 0) {
        totalUnusedClasses += stats.remainingClasses;
        totalUnearnedRevenue += remainingValue;
      }
      if (isSleeper) sleeperCustomersCount++;

      return {
        ...stats,
        id,
        remainingValue,
        lastDate: stats.lastDate === '1970-01-01' ? '無紀錄' : stats.lastDate,
        daysSinceLastClass,
        isSleeper
      };
    }); 

    const finalTotalRevenue = totalRevenue + Number(extraRevenue || 0);
    let totalPayrollCorpCost = 0; 
    
    const payroll = Object.values(coachStats).map(coach => {
      const isBoss = coach.isBossNoPay || coach.name === '顏秀如';

      const salesBonus = coach.salesBonus || 0;
      const refBonus = coach.referralBonus || 0;
      const eventSupportPay = coach.eventSupportPay || 0;
      
      let defaultBase = isBoss ? 0 : (coach.baseSalary !== undefined && coach.baseSalary !== '' ? Number(coach.baseSalary) : getBaseSalaryDefaults(coach.type));
      let baseSalary = (customBaseSalaries[coach.id] !== undefined ? customBaseSalaries[coach.id] : defaultBase) * monthDiff;

      // 在進階財報中扣除區間內的請假扣薪
      const empLeaves = leaveRecords.filter(l => l.employeeId === coach.id && l.status === 'approved' && (!filterStartDate || l.date >= filterStartDate) && (!filterEndDate || l.date <= filterEndDate));
      let leaveDeduction = 0;
      empLeaves.forEach(leave => {
         const rate = LEAVE_TYPES[leave.type]?.rate || 0;
         const hourlyWage = (defaultBase) / 240; 
         leaveDeduction += hourlyWage * Number(leave.hours) * rate;
      });
      baseSalary = Math.max(0, Math.round(baseSalary - leaveDeduction));

      let classIncome = coach.classIncome || 0;
      let grossPay = Math.round(baseSalary + classIncome + salesBonus + refBonus + eventSupportPay);
      const isCompany = customIsCompany[coach.id] || false;

      let laborInsEmp = 0, healthInsEmp = 0, tax = 0, invoiceVat = 0;
      let laborInsCorp = 0, healthInsCorp = 0, pensionCorp = 0;
      let netPay = 0, totalCorpCost = 0;

      if (isCompany) {
        invoiceVat = Math.round(grossPay * CONFIG.vatRate);
        netPay = grossPay + invoiceVat;
        totalCorpCost = grossPay; 
      } else {
        const isPartTime = coach.type?.startsWith('temp') || false;
        if (!isPartTime && coach.type !== 'project') { 
          const lBracket = getLaborBracket(grossPay);
          const hBracket = getHealthBracket(grossPay);
          laborInsEmp = Math.round(lBracket * CONFIG.laborRate * 0.2);
          healthInsEmp = Math.round(hBracket * CONFIG.healthRate * 0.3);
          laborInsCorp = Math.round(lBracket * CONFIG.laborRate * 0.7);
          healthInsCorp = Math.round(hBracket * CONFIG.healthRate * 0.6 * 1.57);
          pensionCorp = Math.round(lBracket * CONFIG.pensionRate);
        } else if (isPartTime) {
          if (grossPay >= 27470) healthInsEmp = Math.round(grossPay * 0.0211); 
        }

        const taxThreshold = isPartTime ? CONFIG.taxThresholdTemp : CONFIG.taxThresholdFormal;
        if (grossPay >= taxThreshold) {
          tax = Math.round(grossPay * CONFIG.taxRate);
        }
        
        netPay = grossPay - laborInsEmp - healthInsEmp - tax;
        totalCorpCost = grossPay + laborInsCorp + healthInsCorp + pensionCorp;
      }

      totalPayrollCorpCost += totalCorpCost;

      return {
        ...coach,
        baseSalary, classIncome, salesBonus, refBonus, eventSupportPay, grossPay,
        laborInsEmp, healthInsEmp, tax, invoiceVat, isCompany, netPay,
        laborInsCorp, healthInsCorp, pensionCorp, totalCorpCost
      };
    }).sort((a, b) => b.netPay - a.netPay);

    const companyNetRevenue = Math.round(finalTotalRevenue / (1 + CONFIG.vatRate));
    const companyVatPayable = finalTotalRevenue - companyNetRevenue;
    const companyGrossProfit = companyNetRevenue - totalPayrollCorpCost;
    
    const approvedExpensesTotal = expenses
      .filter(e => e.status === 'approved' && (!filterStartDate || e.date >= filterStartDate) && (!filterEndDate || e.date <= filterEndDate))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalOpCosts = (Object.values(operatingCosts).reduce((sum, val) => sum + Number(val || 0), 0) * monthDiff) + approvedExpensesTotal;
    const companyOperatingProfit = companyGrossProfit - totalOpCosts;
    const companyEstimatedIncomeTax = companyOperatingProfit > 0 ? Math.round(companyOperatingProfit * CONFIG.corporateTaxRate) : 0;
    const companyNetIncome = companyOperatingProfit - companyEstimatedIncomeTax;

    return {
      payroll, topCustomers, sleeperCustomersCount, totalUnusedClasses, totalUnearnedRevenue,     
      totalRevenue: finalTotalRevenue, baseRevenue: totalRevenue, companyNetRevenue, companyVatPayable,
      totalPayrollCorpCost, companyGrossProfit, totalOpCosts, companyOperatingProfit,
      companyEstimatedIncomeTax, companyNetIncome, totalClassesGlobal, paymentMethodsCounts,
      paymentMethodsAmounts, athleteProjectClasses, athleteProjectRevenue, approvedExpensesTotal,
      activeCoaches: payroll.filter(p => p.totalClasses > 0 || p.grossPay > 0).length,
      filteredRecordCount: validLogs.length
    };
  }, [dailyLogs, employees, customers, customBaseSalaries, customIsCompany, operatingCosts, extraRevenue, filterStartDate, filterEndDate, referralData, expenses]);

  const addingClasses = (Number(logData.sales10) || 0) * 11 + (Number(logData.sales5) || 0) * 5 + (Number(logData.salesAthlete) || 0) * 24;
  const matchedStudentForm = customers.find(c => c.name?.trim().toLowerCase() === logData.customerName?.trim().toLowerCase());
  const isFormActivityProject = matchedStudentForm?.customerType === 'activity' || logData.specialEventType;
  
  const isDeducting = logData.paymentMethod === '代扣' && dailyOpMode === 'deduct';
  const deductingClasses = isDeducting ? (Number(logData.classes) || 0) : 0;
  
  const payerToShow = (logData.paymentMethod === '代扣' && logData.deductFromCustomerId) 
      ? customers.find(c => c.id === logData.deductFromCustomerId) 
      : matchedStudentForm;
  const currentBalance = payerToShow ? Number(payerToShow.remaining) : 0;
  const finalBalance = currentBalance + addingClasses - deductingClasses;

  const coachLogsForModal = useMemo(() => {
    if (!selectedCoachForDetails) return [];
    const mLogs = dailyLogs.filter(l => l.date && l.date.startsWith(summaryMonth)).sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || ''));
    let cumulative = 0;
    let seqCount = 0; 
    const rows = [];
    mLogs.forEach(log => {
      let isOwn = log.employeeId === selectedCoachForDetails.id;
      let isSource = log.referralSourceId === selectedCoachForDetails.id && log.employeeId !== selectedCoachForDetails.id;
      if (isOwn || isSource) {
        let b = { total: 0, classPay: 0, bonus: 0, refAdj: 0, eventSupportPay: 0, validClasses: 0 };
        if (isOwn) {
          b = calculateEntrySalary(selectedCoachForDetails, log, cumulative, 0);
          cumulative += b.validClasses;
        }
        if (isSource) {
          const eligible = referralData[log.id]?.eligibleClasses || 0;
          if (isOwn) {
             b.refAdj = 0;
             b.total += b.refAdj;
          } else {
             b = { total: 0, classPay: 0, bonus: 0, refAdj: 0, eventSupportPay: 0, validClasses: 0 };
          }
        }

        let currentSeq = null;
        if (isOwn && b.validClasses > 0) {
           seqCount++;
           currentSeq = seqCount;
        }

        rows.push({ ...log, calc: b, isOwn, isSource, cumulativeAfter: cumulative, seqCount: currentSeq });
      }
    });
    return rows;
  }, [selectedCoachForDetails, dailyLogs, summaryMonth, customers]);

  const customerLogsForModal = useMemo(() => {
    if (!selectedCustomerForDetails) return [];
    const logs = dailyLogs
      .filter(l => l.customerName?.trim().toLowerCase() === selectedCustomerForDetails.name?.trim().toLowerCase())
      .filter(l => userRole === 'coach' && loggedInCoachId ? (l.employeeId === loggedInCoachId || l.referralSourceId === loggedInCoachId) : true)
      .sort((a,b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || '').localeCompare(b.createdAt || ''));
    
    let seqCounter = 0;
    const processed = logs.map(log => {
      let currentSeq = null;
      const effectiveClasses = log.specialEventType ? (Number(log.classes) || 1) : (Number(log.classes) || 0);
      if (effectiveClasses > 0) {
          seqCounter++;
          currentSeq = seqCounter;
      }
      return { ...log, seqCount: currentSeq };
    });
    return processed.reverse();
  }, [dailyLogs, selectedCustomerForDetails]);

  const detailSettlement = selectedCoachForDetails ? calculateSettlement(selectedCoachForDetails.id, summaryMonth) : null;

  const coachRestDaysInfo = useMemo(() => {
    if (!selectedCoachForDetails || !selectedCoachForDetails.type?.startsWith('formal')) return { count: 0, dates: [] };
    
    const [year, month] = summaryMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const workingDates = new Set(
      coachLogsForModal
        .filter(row => row.isOwn && row.date && row.date.startsWith(summaryMonth))
        .map(row => row.date)
    );

    const allDates = Array.from({ length: daysInMonth }, (_, i) => {
      return `${summaryMonth}-${String(i + 1).padStart(2, '0')}`;
    });

    const restDates = allDates.filter(d => !workingDates.has(d));
    return { count: restDates.length, dates: restDates };
  }, [selectedCoachForDetails, summaryMonth, coachLogsForModal]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logData.employeeId || !user) return;
    triggerSync(async () => {
      const finalCustomerName = logData.customerName?.trim() || '內部事務 / 專案活動';
      const student = customers.find(c => c.name?.trim().toLowerCase() === finalCustomerName.toLowerCase());
      const isActivityCustomer = student?.customerType === 'activity' && !logData.specialEventType;

      const isCompanyRevenue = logData.employeeId === 'COMPANY_REVENUE';
      const isDeductMode = activeTab === 'athlete' ? athleteMode === 'deduct' : dailyOpMode === 'deduct';
      
      const clsCount = (isCompanyRevenue || isActivityCustomer) ? 0 : (logData.specialEventType ? (Number(logData.classes) || 1) : (Number(logData.classes) || 0));
      const companyRevenueVal = (isCompanyRevenue || isActivityCustomer || logData.specialEventType) ? (Number(logData.companyRevenue) || 0) : 0;
      
      const s10 = Number(logData.sales10) || 0;
      const s5 = Number(logData.sales5) || 0;
      const sAth = Number(logData.salesAthlete) || 0;
      const bonusT = (s10 * 11) + (s5 * 5) + (sAth * 24); 
      
      let payerId = '';
      if (logData.paymentMethod === '代扣' && logData.deductFromCustomerId) {
         payerId = logData.deductFromCustomerId;
      } else if (student) {
         payerId = student.id;
      }
      const payer = customers.find(c => c.id === payerId);
      
      let refReceiverId = '', refSourceId = logData.referralSourceId;
      if (refSourceId && refSourceId !== logData.employeeId && !isCompanyRevenue && !logData.specialEventType) {
        refReceiverId = logData.employeeId;
      }

      const isDeducting = logData.paymentMethod === '代扣' && isDeductMode;
      const classesToDeduct = isDeducting ? clsCount : 0;

      if (payer) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', payer.id), {
          remaining: Math.max(0, Number(payer.remaining) + bonusT - classesToDeduct)
        });
      }

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { 
        ...logData, 
        customerName: finalCustomerName,
        classDuration: logData.classDuration || '90min',
        classFee: logData.classDuration?.startsWith('athlete_') ? 250 : (
            logData.classDuration === '150min' ? 4300 :
            logData.classDuration === '120min' ? 3400 :
            logData.classDuration === '60min' || logData.classDuration === 'overtime60min' ? 1800 : 
            logData.classDuration === 'overtime30min' ? 900 : 2500
        ),
        deductFromCustomerId: (logData.paymentMethod === '代扣' && logData.deductFromCustomerId) ? logData.deductFromCustomerId : '', 
        referralReceiverId: refReceiverId, 
        referralSourceId: refSourceId,
        date: selectedDate, 
        purchaseDate: logData.purchaseDate || selectedDate,
        classes: clsCount, 
        companyRevenue: companyRevenueVal,
        eventSupportPay: Number(logData.eventSupportPay) || 0,
        salesAthlete: String(sAth),
        createdAt: new Date().toISOString()
      });
      setLogData({ 
        employeeId: '', customerName: '', deductFromCustomerId: '', referralSourceId: '', sessionTime: '', 
        classDuration: activeTab === 'athlete' ? (athleteMode === 'buy' ? 'athlete_buy' : 'athlete_90min') : '90min', 
        classes: activeTab === 'athlete' ? (athleteMode === 'buy' ? '0' : '3') : '1', 
        companyRevenue: '0', overtime: '0', sales10: '0', sales5: '0', 
        salesAthlete: activeTab === 'athlete' && athleteMode === 'buy' ? '1' : '0', 
        purchaseDate: selectedDate,
        paymentMethod: activeTab === 'athlete' && athleteMode === 'buy' ? '現金' : (activeTab === 'athlete' ? '代扣' : '現金'), 
        isAthleteProject: activeTab === 'athlete', 
        productName: '', productPrice: '', productQty: '1', eventSupportPay: '0',
        specialEventType: activeTab === 'special' ? '隨喜40min' : ''
      });
    });
  };

  const handleUpdateLog = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    triggerSync(async () => {
      const editingCustomerObj = customers.find(c => c.name?.trim().toLowerCase() === editingLog.customerName?.trim().toLowerCase());
      const isEditActivityCustomer = editingCustomerObj?.customerType === 'activity' && !editingLog.specialEventType;
      const isCompanyRevenue = editingLog.employeeId === 'COMPANY_REVENUE';

      let updatedLog = {
        ...editingLog,
        classes: (isCompanyRevenue || isEditActivityCustomer) ? 0 : (editingLog.specialEventType ? (Number(editingLog.classes) || 1) : Number(editingLog.classes)),
        companyRevenue: (isCompanyRevenue || isEditActivityCustomer || editingLog.specialEventType) ? (Number(editingLog.companyRevenue) || 0) : 0,
        purchaseDate: editingLog.purchaseDate || editingLog.date,
        updatedAt: new Date().toISOString()
      };

      if (updatedLog.referralSourceId && updatedLog.referralSourceId !== updatedLog.employeeId && !isCompanyRevenue && !isEditActivityCustomer) {
      } else if (!updatedLog.referralSourceId) {
         updatedLog.referralReceiverId = '';
      }

      // 移除 UI 專用運算屬性與 undefined，避免 Firebase 阻擋寫入
      const { calc, isOwn, isSource, cumulativeAfter, seqCount, id, ...logToSave } = updatedLog;
      Object.keys(logToSave).forEach(key => logToSave[key] === undefined && delete logToSave[key]);

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', editingLog.id), logToSave);
      setEditingLog(null);
    });
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name?.trim()) {
      alert("學員姓名不能為空");
      return;
    }
    triggerSync(async () => { 
      // 過濾 undefined 與內部 id 欄位
      const { id, ...dataToSave } = editingCustomer;
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      dataToSave.name = dataToSave.name.trim();
      dataToSave.remaining = Number(dataToSave.remaining) || 0;

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', editingCustomer.id), { 
        ...dataToSave, 
        updatedAt: new Date().toISOString() 
      }); 
      setEditingCustomer(null); 
    });
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name?.trim()) {
      alert("教練姓名不能為空");
      return;
    }
    triggerSync(async () => { 
      // 過濾 undefined 與內部 id 欄位
      const { id, ...dataToSave } = editingEmployee;
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      dataToSave.name = dataToSave.name.trim();
      if (dataToSave.baseSalary !== undefined && dataToSave.baseSalary !== '') {
        dataToSave.baseSalary = Number(dataToSave.baseSalary);
      }

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', editingEmployee.id), { 
        ...dataToSave, 
        updatedAt: new Date().toISOString() 
      }); 
      setEditingEmployee(null); 
    });
  };

  const [customerSortConfig, setCustomerSortConfig] = useState({ key: 'usedClasses', direction: 'desc' });

  const sortedTopCustomers = useMemo(() => {
    if (!analyzedData || !analyzedData.topCustomers) return [];
    const sorted = [...analyzedData.topCustomers];
    sorted.sort((a, b) => {
      if (a[customerSortConfig.key] < b[customerSortConfig.key]) return customerSortConfig.direction === 'asc' ? -1 : 1;
      if (a[customerSortConfig.key] > b[customerSortConfig.key]) return customerSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [analyzedData.topCustomers, customerSortConfig]);

  const requestCustomerSort = (key) => {
    let direction = 'desc';
    if (customerSortConfig.key === key && customerSortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setCustomerSortConfig({ key, direction });
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCust.name?.trim()) return;
    
    const existingCust = customers.find(c => c.name?.trim() === newCust.name?.trim());
    
    const doAdd = () => {
      triggerSync(async () => {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), { 
           ...newCust, 
           customerType: 'person', 
           remaining: Number(newCust.remaining) || 0, 
           createdAt: new Date().toISOString() 
        });
        setNewCust({ name: '', birthday: '', gender: '不透露', occupation: '', remaining: '0', joinDate: getLocalDateString(), referrerId: '', referredByCustomerId: '', isAthleteProjectMember: false, isSpecialEventMember: false });
      });
    };

    if (existingCust) {
      const isSamePerson = (existingCust.birthday === newCust.birthday) && (existingCust.gender === newCust.gender);
      if (isSamePerson) {
        setConfirmModal({ isOpen: true, type: 'danger', title: '學員重複建檔警告', message: `資料庫已有完全相同資料：姓名「${existingCust.name}」。請確認是否重複！`, action: async () => doAdd() });
        return;
      } else {
        setConfirmModal({ isOpen: true, type: 'warning', title: '同名學員衝突警告', message: `系統已有一位「${existingCust.name}」。建議改名為「${newCust.name}-${newCust.birthday || '2'}」。確定繼續？`, action: async () => doAdd() });
        return;
      }
    }
    doAdd();
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.name?.trim()) return;
    triggerSync(async () => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), { ...newEmp, createdAt: new Date().toISOString() }); setNewEmp({ name: '', xValue: '', type: 'formalA', isBossNoPay: false, baseSalary: '', startDate: getLocalDateString(), projectTitle: '', promotionDate: '', prePromotionType: '' }); });
  };

  const triggerDeleteLog = (log) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除紀錄', message: '確定刪除這筆營運紀錄？', action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', log.id))) }); };
  const triggerDeleteEmployee = (emp) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除教練', message: `確定永久刪除教練？`, action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', emp.id))) }); };
  const triggerDeleteCustomer = (cust) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除學員', message: `確定永久刪除學員？`, action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', cust.id))) }); };

  const handleLogout = () => { 
    setConfirmModal({ 
      isOpen: true, title: '安全登出', message: '您確定要返回登入畫面嗎？', type: 'warning', 
      action: async () => { 
          setIsAppLoggedIn(false); 
          setActiveTab('attendance'); 
          setShowBossPassword(false); 
          setShowCoachSelect(false);
          setSelectedCoachId('');
          setLoggedInCoachId(null);
          setPassword(''); 
          setAuthError(''); 
      } 
    }); 
  };

  const handleExportSummary = () => {
    const headers = ['教練姓名', '類型', '月總堂數', '銷售獎勵總額', '轉介獎勵總額', '活動支援總額', '估計實領總額'];
    const rows = employees.map(emp => {
      const p = calculateSettlement(emp.id, summaryMonth);
      if (!p) return null;
      return [emp.name, p.typeLabel, p.totalClasses, p.totalBonus, p.totalRef, p.totalEventSupport, p.grossSalary];
    }).filter(row => row !== null);
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `築動月結報表_${summaryMonth}.csv`;
    link.click();
  };

  const handleExportCoachPayslip = () => {
    if (!selectedCoachForDetails || !detailSettlement) return;

    const coachName = selectedCoachForDetails.name;
    let csvContent = "\uFEFF"; 

    csvContent += `【築動運動防護 - 員工薪資單(工資清冊)】\n\n`;
    csvContent += `計薪月份（工資計算期間）,${summaryMonth}\n`;
    csvContent += `員工姓名,${coachName}\n`;
    csvContent += `職務類型,${detailSettlement.typeLabel}\n\n`;

    const commission = detailSettlement.grossSalary - detailSettlement.baseSalary - detailSettlement.totalBonus - detailSettlement.totalRef - detailSettlement.totalEventSupport;

    csvContent += `一、應發金額明細（工資各項目給付明細）\n`;
    csvContent += `1. 本薪/底薪 (勞雇議定固定薪資),$${detailSettlement.baseSalary || 0}\n`;
    csvContent += `2. 業績抽成 (本月累計 ${formatClasses(detailSettlement.totalClasses)} 堂),$${commission}\n`;
    csvContent += `3. 銷售推廣獎金,$${detailSettlement.totalBonus}\n`;
    csvContent += `4. 轉介開發獎金,$${detailSettlement.totalRef}\n`;
    csvContent += `5. 其他不固定薪資/津貼 (活動出差等),$${detailSettlement.totalEventSupport}\n`;
    csvContent += `【應發工資總額】,$${detailSettlement.grossSalary}\n\n`;

    if (selectedCoachForDetails.type?.startsWith('formal')) {
      csvContent += `二、出勤與休假情形\n`;
      csvContent += `本月全天無課/未排班天數,${coachRestDaysInfo.count} 天\n`;
      if (coachRestDaysInfo.count > 0) {
        csvContent += `未排班日期明細,"${coachRestDaysInfo.dates.map(d => parseInt(d.slice(8), 10)).join('、')}"\n`;
      }
      
      const empLeaves = leaveRecords.filter(l => l.employeeId === selectedCoachForDetails.id && l.date.startsWith(summaryMonth) && l.status === 'approved');
      if (empLeaves.length > 0) {
         csvContent += `本月請假扣薪紀錄 (已核准假單)\n`;
         empLeaves.forEach(leave => {
            const lInfo = LEAVE_TYPES[leave.type];
            csvContent += `- ${leave.date} : ${lInfo.label} ${leave.hours} 小時 (${leave.reason || '無事由'})\n`;
         });
         if (detailSettlement.leaveDeduction > 0) {
            csvContent += `(請假依法規依比例扣減底薪共計 $${detailSettlement.leaveDeduction} 元，已反映於上方本薪中)\n`;
         }
      }
      csvContent += `\n`;
    }

    // Find the finance data for deductions
    const financeData = analyzedData.payroll.find(p => p.id === selectedCoachForDetails.id);
    const laborIns = financeData?.laborInsEmp || 0;
    const healthIns = financeData?.healthInsEmp || 0;
    const tax = financeData?.tax || 0;
    const invoiceVat = financeData?.invoiceVat || 0;
    
    csvContent += `三、應扣金額明細（依法令或勞雇約定扣除項目）\n`;
    if (financeData?.isCompany) {
       csvContent += `1. 代扣稅額/營業稅 (承攬或公司戶),$${invoiceVat}\n`;
       csvContent += `【應扣金額總計】,$${invoiceVat}\n\n`;
       csvContent += `四、實發金額（實際發放淨額）,$${detailSettlement.grossSalary + invoiceVat}\n\n`;
    } else {
       csvContent += `1. 勞工保險費 (自付額),$${laborIns}\n`;
       csvContent += `2. 全民健康保險費 (自付額),$${healthIns}\n`;
       if (tax > 0) csvContent += `3. 預扣所得稅,$${tax}\n`;
       const totalDeductions = laborIns + healthIns + tax;
       csvContent += `【應扣金額總計】,$${totalDeductions}\n\n`;
       csvContent += `四、實發金額（實際發放淨額）,$${detailSettlement.grossSalary - totalDeductions}\n\n`;
    }

    csvContent += `※ 以下為本月提供勞務(授課/推廣)之明細備查：\n`;
    csvContent += "明細序號,發生日期,學員姓名/對象,課程名稱/專案項目,扣除點數/堂數,課費抽成,銷售推廣獎金,轉介與活動津貼,單筆小計\n";

    coachLogsForModal.forEach((row) => {
      const date = row.date || '';
      let customerInfo = row.customerName || '';
      if (!row.isOwn) customerInfo += " (轉介抽成)";

      let projectInfo = row.specialEventType ? row.specialEventType :
                        row.classDuration === 'athlete_buy' ? '儲值' :
                        row.classDuration?.startsWith('athlete_') ? `運動員專案` :
                        row.classDuration === '150min' ? '150 min 課程' :
                        row.classDuration === '120min' ? '120 min 課程' :
                        row.classDuration === 'overtime30min' ? '加時 30 min (歷史)' :
                        row.classDuration === 'overtime60min' ? '加時 60 min (歷史)' :
                        `一般課程 (${row.classDuration})`;

      let extraSales = [];
      if (Number(row.sales10) > 0) extraSales.push(`10+1組 x${row.sales10}`);
      if (Number(row.sales5) > 0) extraSales.push(`5堂組 x${row.sales5}`);
      if (Number(row.salesAthlete) > 0) extraSales.push(`運動員包 x${row.salesAthlete}`);
      if (Number(row.productQty) > 0 && ['花生球', '黑色迷你滾筒', '木色迷你滾筒', '綠色迷你滾筒'].includes(row.productName)) extraSales.push(`${row.productName} x${row.productQty}`);
      if (extraSales.length > 0) projectInfo += ` + ${extraSales.join(" / ")}`;

      if (!row.isOwn && row.isSource) {
        const refInfo = referralData[row.id];
        if (refInfo && refInfo.eligibleClasses > 0) {
          projectInfo += ` [🤝 轉介紀錄: ${refInfo.seqString}]`;
        } else {
          projectInfo += ` [⛔ 轉介已滿10堂無獎金]`;
        }
      }

      const clsNum = row.specialEventType ? (Number(row.classes) || 1) : row.classes;
      const classesRepr = row.isOwn ? (row.specialEventType ? (row.specialEventType.startsWith('出差任務') ? `${clsNum} 堂(差)` : `1 堂(特)`) : row.classDuration?.startsWith('athlete_') && row.classDuration !== 'athlete_buy' ? `扣 ${clsNum} 點` : `${clsNum} 堂`) : '-';

      const classPay = row.calc.classPay;
      const bonus = row.calc.bonus;
      const refAdjEvent = row.calc.refAdj + row.calc.eventSupportPay;
      const total = row.calc.total;

      const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;
      const seqDisplay = row.seqCount ? `#${row.seqCount}` : '-';

      csvContent += `${escapeCSV(seqDisplay)},${escapeCSV(date)},${escapeCSV(customerInfo)},${escapeCSV(projectInfo)},${escapeCSV(classesRepr)},$${classPay},$${bonus},$${refAdjEvent},$${total}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${coachName}_個人薪資明細_${summaryMonth}.csv`;
    link.click();
  };

  const handleExportSettings = () => {
    const settings = { customBaseSalaries, customIsCompany, operatingCosts, extraRevenue };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "築動_進階財報參數設定檔.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportSettings = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target.result);
        if (settings.operatingCosts) setOperatingCosts(settings.operatingCosts);
        if (settings.customBaseSalaries) setCustomBaseSalaries(prev => ({...prev, ...settings.customBaseSalaries}));
        if (settings.customIsCompany) setCustomIsCompany(prev => ({...prev, ...settings.customIsCompany}));
        if (settings.extraRevenue !== undefined) setExtraRevenue(settings.extraRevenue);
        alert("參數設定檔載入成功！");
      } catch(err) {
        alert("設定檔解析失敗！");
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleExportAdvancedCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    let headers = [];
    let rows = [];

    if (activeFinanceTab === 'payroll') {
      headers = ["員工姓名", "型態", "是否公司戶開發票", "自訂底薪", "課費抽成總計", "賣課獎金", "轉介獎勵", "活動支援", "應發薪資(Gross)", "代扣稅或發票稅", "勞保(自付)", "健保(自付)", "實發薪資(Net)", "勞保(公司負擔)", "健保(公司負擔)", "勞退(公司負擔)", "公司總負擔"];
      rows = analyzedData.payroll.map(c => [
        `"${c.name}"`, getCoachTypeLabel(c.type), c.isCompany ? '是' : '否',
        c.baseSalary, c.classIncome, c.salesBonus, c.refBonus, c.eventSupportPay, c.grossPay,
        c.isCompany ? c.invoiceVat : c.tax, c.laborInsEmp, c.healthInsEmp, c.netPay,
        c.laborInsCorp, c.healthInsCorp, c.pensionCorp, c.totalCorpCost
      ]);
    } else if (activeFinanceTab === 'customer') {
       headers = ["客戶姓名", "區間購買堂數", "區間消耗堂數", "剩餘未上課堂數(Live)", "預估卡彈金額(預收負債)", "距今未上課天數", "最後活動日", "是否為高風險流失客"];
       rows = analyzedData.topCustomers.map(c => [
         `"${c.name}"`, c.purchasedClasses, c.usedClasses, c.remainingClasses, c.remainingValue,
         c.daysSinceLastClass, `"${c.lastDate}"`, c.isSleeper ? '是' : '否'
       ]);
    } else {
       alert("請切換至「薪資與稅務」或「客戶資產表」分頁來匯出 CSV。");
       return;
    }

    csvContent += headers.join(",") + "\n";
    rows.forEach(row => { csvContent += row.join(",") + "\n"; });
    const dateRangeStr = (filterStartDate || filterEndDate) ? `${filterStartDate || '最初'}至${filterEndDate || '最新'}` : '全部區間';
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `JD_進階財報_${activeFinanceTab}_${dateRangeStr}.csv`;
    link.click();
  };

  const handleExportDatabase = () => {
    const backupData = { employees, customers, logs: dailyLogs };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `JD_Database_Backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
  };

  const handleImportDatabase = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setConfirmModal({
      isOpen: true, type: 'warning', title: '資料庫覆蓋警告',
      message: '匯入將會把備份檔的資料完整寫入當前版本。確定要執行嗎？',
      action: async () => {
        setSyncStatus('syncing');
        try {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const data = JSON.parse(event.target.result);
            if (data.employees) for (const item of data.employees) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', item.id), item);
            if (data.customers) for (const item of data.customers) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', item.id), item);
            if (data.logs) for (const item of data.logs) await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', item.id), item);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
            alert('資料庫遷移成功！');
          };
          reader.readAsText(file);
        } catch (error) {
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 3000);
          alert('匯入失敗，請確認檔案格式。');
        }
        e.target.value = '';
      }
    });
  };

  const handleAICall = async (prompt, title) => {
    setAiModal({ isOpen: true, title, content: '', isLoading: true });
    const apiKey = ""; // Canvas 運行環境會自動提供 API 金鑰
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }]
    };
    try {
      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "AI 沒有回應內容，請稍後再試。";
      setAiModal({ isOpen: true, title, content: text, isLoading: false });
    } catch (e) {
      setAiModal({ isOpen: true, title, content: "生成失敗，請確認網路連線或稍後再試。", isLoading: false });
    }
  };

  const handleGenerateFinanceInsight = () => {
    const prompt = `你現在是「築動運動防護」的 AI 營運顧問。根據以下近期的營運數據，請提供 3 點精簡的營運診斷與建議（總字數控制在 200 字以內，語氣專業但有活力，適合直接給負責人看）：
    - 區間淨營收：${analyzedData.companyNetRevenue} 元
    - 消耗總堂數：${analyzedData.totalClassesGlobal} 堂
    - 預收帳款負債：${analyzedData.totalUnearnedRevenue} 元
    - 沉睡流失客(高風險)：${analyzedData.sleeperCustomersCount} 人`;
    handleAICall(prompt, '✨ AI 營運分析與建議');
  };

  const handleGenerateSleeperMessage = (cus) => {
    const prompt = `你現在是「築動運動防護」的健身教練/客服。請幫我寫一段簡短、溫暖、關心的 Line 訊息給學員「${cus.name}」。
    狀況：他已經 ${cus.daysSinceLastClass} 天沒來上課了，目前帳上還有 ${cus.remainingClasses} 堂課。
    要求：鼓勵他回來運動，語氣要像朋友般自然，不帶推銷感，並加入適當的 Emoji。字數約 50-80 字。`;
    handleAICall(prompt, `💬 給 ${cus.name} 的 AI 關懷訊息`);
  };

  const compHoursInfo = useMemo(() => {
    if (!loggedInCoachId || !leaveData.date) return { earned: 0, used: 0, available: 0 };
    // 取得當前請假月份 (限當月結算，不跨月)
    const currentMonth = leaveData.date.slice(0, 7);

    // 1. 計算當月的每日加班總和 (超過 8 小時/480 分鐘的部分)
    const currentMonthAtt = attendanceRecords.filter(r => r.employeeId === loggedInCoachId && r.date?.startsWith(currentMonth));
    const dailyWorkMins = {};
    currentMonthAtt.forEach(r => {
      if (!dailyWorkMins[r.date]) dailyWorkMins[r.date] = 0;
      dailyWorkMins[r.date] += (r.workMinutes || 0);
    });
    
    let earnedMins = 0;
    Object.values(dailyWorkMins).forEach(mins => {
      if (mins > 480) earnedMins += (mins - 480);
    });
    const earned = Math.floor(earnedMins / 60); // 轉換為小時

    // 2. 計算本月已經使用或申請中的補休
    const currentMonthCompLeaves = leaveRecords.filter(l => 
      l.employeeId === loggedInCoachId && 
      l.date?.startsWith(currentMonth) && 
      l.type === 'comp_leave' && 
      l.status !== 'rejected'
    );
    const used = currentMonthCompLeaves.reduce((sum, l) => sum + Number(l.hours), 0);

    return { earned, used, available: Math.max(0, earned - used) };
  }, [attendanceRecords, leaveRecords, loggedInCoachId, leaveData.date]);

  const annualLeaveInfo = useMemo(() => {
    if (!loggedInCoachId) return null;
    const emp = employees.find(e => e.id === loggedInCoachId);
    if (!emp || !emp.type?.startsWith('formal') || !emp.startDate) return null;
    
    const [sy, sm, sd] = emp.startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    
    const [ty, tm, td] = getLocalDateString().split('-').map(Number);
    const today = new Date(ty, tm - 1, td);
    
    let diffMonths = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    if (today.getDate() < start.getDate()) diffMonths--;

    let years = Math.floor(diffMonths / 12);
    let months = diffMonths % 12;

    let total = 0;
    if (years >= 10) total = Math.min(30, 15 + (years - 9));
    else if (years >= 5) total = 15;
    else if (years >= 3) total = 14;
    else if (years >= 2) total = 10;
    else if (years >= 1) total = 7;
    else if (diffMonths >= 6) total = 3;
    
    let periodStart, periodEnd;
    if (diffMonths >= 6 && diffMonths < 12) {
       periodStart = new Date(sy, sm - 1 + 6, sd);
       periodEnd = new Date(sy, sm - 1 + 12, sd - 1);
    } else if (years >= 1) {
       periodStart = new Date(sy, sm - 1, sd);
       periodStart.setFullYear(today.getFullYear());
       if (today < periodStart) {
           periodStart.setFullYear(today.getFullYear() - 1);
       }
       periodEnd = new Date(periodStart);
       periodEnd.setFullYear(periodEnd.getFullYear() + 1);
       periodEnd.setDate(periodEnd.getDate() - 1);
    } else {
       return { total: 0, used: 0, remaining: 0, years, months, periodStart: null, periodEnd: null };
    }

    const pStartStr = `${periodStart.getFullYear()}-${String(periodStart.getMonth()+1).padStart(2,'0')}-${String(periodStart.getDate()).padStart(2,'0')}`;
    const pEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth()+1).padStart(2,'0')}-${String(periodEnd.getDate()).padStart(2,'0')}`;

    const usedHours = leaveRecords.filter(l => 
        l.employeeId === loggedInCoachId && 
        l.type === 'annual' && 
        l.status !== 'rejected' && 
        l.date >= pStartStr && 
        l.date <= pEndStr
    ).reduce((sum, l) => sum + Number(l.hours), 0);

    const usedDays = usedHours / 8; // 假設一天為 8 小時

    return { total, used: usedDays, remaining: total - usedDays, years, months, periodStart: pStartStr, periodEnd: pEndStr };
  }, [loggedInCoachId, employees, leaveRecords]);

  const handleClockIn = async () => {
    if (!loggedInCoachId) return;
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    triggerSync(async () => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), {
        employeeId: loggedInCoachId,
        date: getLocalDateString(),
        clockInTime: timeString,
        clockOutTime: null,
        workMinutes: 0,
        createdAt: now.toISOString()
      });
    });
  };

  const handleClockOut = async (recordId, clockInTime) => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    
    // Calculate minutes
    const [inHours, inMins] = clockInTime.split(':').map(Number);
    const [outHours, outMins] = timeString.split(':').map(Number);
    
    let diffMins = (outHours * 60 + outMins) - (inHours * 60 + inMins);
    if (diffMins < 0) diffMins += 24 * 60; // Cross midnight

    triggerSync(async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', recordId), {
        clockOutTime: timeString,
        workMinutes: diffMins,
        updatedAt: now.toISOString()
      });
    });
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!loggedInCoachId || !leaveData.date || !leaveData.hours) return;
    
    const emp = employees.find(e => e.id === loggedInCoachId);
    if (emp?.type?.startsWith('temp')) {
        alert("承攬人員無需在此系統請假，排班請直接與主管協調。");
        return;
    }

    // 驗證補休時數 (強制當月結算)
    if (leaveData.type === 'comp_leave' && Number(leaveData.hours) > compHoursInfo.available) {
        alert(`可用補休時數不足！\n\n依據您的打卡紀錄，本月超時(${compHoursInfo.earned}h) 扣除本月已排補休(${compHoursInfo.used}h) 後，僅剩 [ ${compHoursInfo.available} 小時 ] 可用。\n\n*系統規定：當月超時必須當月補完，不得跨月延續。`);
        return;
    }

    triggerSync(async () => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leaves'), {
        employeeId: loggedInCoachId,
        date: leaveData.date,
        type: leaveData.type,
        hours: Number(leaveData.hours),
        reason: leaveData.reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setLeaveData({ date: getLocalDateString(), type: 'personal', hours: '8', reason: '' });
      alert("假單已送出，等待主管簽核！");
    });
  };

  const handleLeaveApproval = async (leaveId, newStatus) => {
    triggerSync(async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leaves', leaveId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    });
  };

  const handleApplyExpense = async (e) => {
    e.preventDefault();
    const submitterId = userRole === 'boss' ? expenseData.employeeId : loggedInCoachId;
    if (!submitterId || !expenseData.item || !expenseData.amount) return;
    
    const finalInvoiceType = expenseData.invoiceType === '其他' ? expenseData.invoiceTypeOther : expenseData.invoiceType;

    triggerSync(async () => {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), {
        employeeId: submitterId,
        date: expenseData.date,
        item: expenseData.item,
        amount: Number(expenseData.amount),
        invoiceType: finalInvoiceType,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setExpenseData({ employeeId: '', date: getLocalDateString(), item: '', amount: '', invoiceType: '電子發票', invoiceTypeOther: '' });
      alert("請款單已送出！等待簽核中。");
    });
  };

  const handleExpenseApproval = async (expId, newStatus) => {
    triggerSync(async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'expenses', expId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    });
  };

  const scheduleInfo = useMemo(() => {
    if (!loggedInCoachId || !scheduleMonth) return null;
    const [year, month] = scheduleMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    let requiredDaysOff = 0;
    const daysArr = [];
    
    const workRecords = attendanceRecords.filter(r => r.employeeId === loggedInCoachId && r.date?.startsWith(scheduleMonth));
    const workDaysSet = new Set(workRecords.map(r => r.date));
    
    const leaveRecordsMonth = leaveRecords.filter(l => l.employeeId === loggedInCoachId && l.date?.startsWith(scheduleMonth) && l.status !== 'rejected');
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const d = new Date(year, month - 1, i);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const holidayName = TAIWAN_HOLIDAYS[dateStr];
        
        if (isWeekend || holidayName) {
            requiredDaysOff++;
        }
        
        const isWorked = workDaysSet.has(dateStr);
        const leaveForDay = leaveRecordsMonth.find(l => l.date === dateStr);
        
        daysArr.push({
            date: dateStr,
            day: i,
            dayOfWeek,
            isWeekend,
            holidayName,
            isWorked,
            leave: leaveForDay
        });
    }
    
    const actualWorkDays = workDaysSet.size;
    const actualDaysOff = daysInMonth - actualWorkDays; 
    const diff = actualDaysOff - requiredDaysOff;
    
    return {
        year, month, daysInMonth, firstDay, daysArr,
        requiredDaysOff, actualWorkDays, actualDaysOff, diff
    };
  }, [scheduleMonth, loggedInCoachId, attendanceRecords, leaveRecords]);

  if (authLoading) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 font-black uppercase font-sans"><Loader2 className="animate-spin text-amber-600" size={64} /><p>系統環境準備中...</p></div>;

  if (!isAppLoggedIn) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-black uppercase tracking-tighter">
      <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="bg-amber-600 p-5 rounded-3xl text-white shadow-xl mb-4"><ShieldCheck size={48} /></div>
          <h2 className="text-3xl font-black text-slate-800 text-center leading-tight font-sans">築動教練課務<br/>雲端管理系統</h2>
          <p className="text-slate-400 text-xs mt-2 tracking-widest uppercase text-center font-sans">JD Rebuild Training Lab</p>
        </div>
        
        <div className="flex flex-col gap-4 relative z-10">
          {authError && <p className="text-rose-500 text-center text-sm font-sans mb-2 animate-in fade-in">{authError}</p>}
          
          {!showBossPassword && !showCoachSelect ? (
            <>
              <button onClick={() => setShowBossPassword(true)} className="w-full bg-amber-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-amber-700 transition flex items-center justify-center gap-3 active:scale-95">
                <ShieldCheck size={24} />
                Owner 登入
              </button>
              <button onClick={() => setShowCoachSelect(true)} className="w-full bg-slate-800 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl border border-slate-700 hover:bg-slate-700 transition flex items-center justify-center gap-3 active:scale-95 mt-2">
                <Dumbbell size={24} className="text-sky-400" />
                夥伴登入
              </button>
            </>
          ) : showBossPassword ? (
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
              <input 
                type="password" 
                placeholder="請輸入 Owner 密碼" 
                className="w-full bg-slate-50 border border-amber-200 rounded-[2rem] px-6 py-4 text-center text-xl font-black outline-none focus:border-amber-500 tracking-widest font-mono"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError('');
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        if (password === '16121') {
                            setActiveTab('attendance');
                            handleMockLogin('boss');
                        } else {
                            setAuthError('密碼錯誤，請重新輸入');
                        }
                    }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                  <button onClick={() => { setShowBossPassword(false); setAuthError(''); setPassword(''); }} className="w-1/3 bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-black shadow-sm hover:bg-slate-200 transition active:scale-95">取消</button>
                  <button onClick={() => {
                      if (password === '16121') {
                          setActiveTab('attendance');
                          handleMockLogin('boss');
                      } else {
                          setAuthError('密碼錯誤，請重新輸入');
                      }
                  }} className="w-2/3 bg-amber-600 text-white py-4 rounded-[2rem] font-black shadow-xl hover:bg-amber-700 transition flex items-center justify-center gap-2 active:scale-95">確認登入</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
              <select 
                className="w-full bg-slate-50 border border-slate-700 rounded-[2rem] px-6 py-4 text-center text-xl font-black outline-none focus:border-sky-500 tracking-widest text-slate-800"
                value={selectedCoachId}
                onChange={(e) => {
                    setSelectedCoachId(e.target.value);
                    setAuthError('');
                }}
              >
                <option value="">-- 請選擇您的教練身份 --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div className="flex gap-2">
                  <button onClick={() => { setShowCoachSelect(false); setAuthError(''); setSelectedCoachId(''); }} className="w-1/3 bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-black shadow-sm hover:bg-slate-200 transition active:scale-95">取消</button>
                  <button onClick={() => {
                      if (selectedCoachId) {
                          setLoggedInCoachId(selectedCoachId);
                          setLogData(prev => ({ ...prev, employeeId: selectedCoachId }));
                          const selectedEmp = employees.find(e => e.id === selectedCoachId);
                          if (selectedEmp?.type?.startsWith('temp')) {
                              setActiveTab('daily');
                          } else {
                              setActiveTab('attendance');
                          }
                          handleMockLogin('coach');
                      } else {
                          setAuthError('請先選擇教練身份');
                      }
                  }} className="w-2/3 bg-slate-800 text-white py-4 rounded-[2rem] font-black shadow-xl hover:bg-slate-700 transition flex items-center justify-center gap-2 active:scale-95">確認登入</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isDataLoaded) return <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 font-black uppercase tracking-widest font-sans"><Loader2 className="animate-spin text-amber-600" size={64} /><p>雲端數據同步中...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-black uppercase tracking-tighter font-sans">
      <div className="max-w-[1400px] mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-3xl text-white shadow-lg rotate-2 hover:rotate-0 transition-transform ${userRole === 'boss' ? 'bg-amber-600' : 'bg-slate-800'}`}><ClipboardList size={32} /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-800 leading-none">築動教練課務雲端系統</h1>
              <div className="flex items-center gap-3 mt-3">
                 <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] flex items-center gap-1"><ShieldCheck size={12} className={userRole === 'boss' ? 'text-emerald-500' : 'text-sky-500'} /> {userRole === 'boss' ? 'SECURED PRO (BOSS)' : `COACH PORTAL - ${employees.find(e => e.id === loggedInCoachId)?.name || ''}`}</p>
                 
                 {/* 雲端即時同步指示燈 */}
                 <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded border transition-colors ${syncStatus === 'syncing' ? 'bg-amber-50 text-amber-600 border-amber-200' : syncStatus === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : syncStatus === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                   {syncStatus === 'syncing' && <><Loader2 size={10} className="animate-spin"/> 雲端寫入中</>}
                   {syncStatus === 'success' && <><CheckCircle2 size={10}/> 已安全儲存</>}
                   {syncStatus === 'error' && <><AlertCircle size={10}/> 同步失敗</>}
                   {syncStatus === 'idle' && <><Cloud size={10}/> 雲端已同步</>}
                 </div>

                 <button onClick={handleLogout} className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded text-[9px] font-black hover:bg-rose-100 transition border border-rose-100">Logout</button>
              </div>
            </div>
          </div>
          <nav className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto shadow-inner border border-slate-200 w-full xl:w-auto">
            {[
              ...(!(userRole === 'coach' && employees.find(e => e.id === loggedInCoachId)?.type?.startsWith('temp')) ? [{ id: 'attendance', label: '出勤/請假', icon: <Timer size={16}/> }] : []),
              { id: 'daily', label: '每日營運', icon: <Calendar size={16}/> }, 
              { id: 'athlete', label: '運動員專案', icon: <Dumbbell size={16}/> },
              { id: 'special', label: '特別活動', icon: <Gift size={16}/> }, 
              { id: 'expenses', label: '請款報帳', icon: <Receipt size={16}/> }, 
              ...(userRole === 'boss' ? [{ id: 'summary', label: '月結表', icon: <TrendingUp size={16}/> }] : []), 
              { id: 'customers', label: '客人資料庫', icon: <Contact size={16}/> }, 
              ...(userRole === 'boss' ? [
                { id: 'employees', label: '教練管理', icon: <Users size={16}/> },
                { id: 'finance', label: '進階財報', icon: <PieChartIcon size={16}/> },
                { id: 'settings', label: '維護', icon: <Settings2 size={16}/> }
              ] : [])
            ].map(t => (
              <button key={t.id} onClick={() => {
                  setActiveTab(t.id);
                  if (t.id === 'athlete') {
                      setAthleteMode('deduct'); 
                      setLogData(prev => ({
                          ...prev, 
                          isAthleteProject: true, 
                          classDuration: 'athlete_90min', 
                          classes: '3', 
                          salesAthlete: '0', 
                          paymentMethod: '代扣',
                          sales10: '0',
                          sales5: '0',
                          companyRevenue: '0',
                          specialEventType: '',
                          customerName: ''
                      }));
                  } else if (t.id === 'daily') {
                      setDailyOpMode('deduct');
                      setLogData(prev => ({
                          ...prev, 
                          isAthleteProject: false, 
                          classDuration: '90min', 
                          classes: '1', 
                          salesAthlete: '0', 
                          paymentMethod: '現金',
                          specialEventType: '',
                          customerName: ''
                      }));
                  } else if (t.id === 'special') {
                      setLogData(prev => ({
                          ...prev, 
                          isAthleteProject: false, 
                          classDuration: '', 
                          classes: '1', 
                          salesAthlete: '0', 
                          paymentMethod: '現金',
                          specialEventType: '隨喜40min',
                          companyRevenue: '',
                          customerName: ''
                      }));
                  }
              }} className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-1 xl:flex-none ${activeTab === t.id ? 'bg-amber-600 text-white shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}>{t.icon} {t.label}</button>
            ))}
          </nav>
        </header>

        {activeTab === 'attendance' && (
          <div className="animate-in fade-in duration-300 font-black">
             {userRole === 'coach' ? (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 flex flex-col items-center text-center">
                       <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-inner border border-indigo-100"><Timer size={48} /></div>
                       <h2 className="text-3xl tracking-tighter text-slate-800 mb-2">線上出勤打卡系統</h2>
                     
                     {(() => {
                        const todaysRecords = attendanceRecords
                            .filter(r => r.employeeId === loggedInCoachId && r.date === getLocalDateString())
                            .sort((a, b) => a.clockInTime.localeCompare(b.clockInTime));
                        const activeRecord = todaysRecords.find(r => !r.clockOutTime);
                        const totalMins = todaysRecords.reduce((sum, r) => sum + (r.workMinutes || 0), 0);
                        const totalH = Math.floor(totalMins / 60);
                        const totalM = totalMins % 60;
                        
                        const emp = employees.find(e => e.id === loggedInCoachId);
                        const isTemp = emp?.type?.startsWith('temp');

                        if (isTemp) {
                           return <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 w-full"><AlertTriangle size={32} className="mx-auto mb-3" /> 承攬身分，無需進行上下班打卡與線上請假。</div>;
                        }

                        return (
                          <div className="w-full flex flex-col gap-6">
                             {!activeRecord ? (
                               <button onClick={handleClockIn} className="w-full max-w-sm mx-auto bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center gap-3 tracking-widest">
                                 <LogIn size={28} /> 上班打卡 (Clock In)
                               </button>
                             ) : (
                               <div className="w-full max-w-sm mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-4">
                                 <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-6 rounded-3xl flex flex-col gap-1 shadow-inner">
                                   <span className="text-xs uppercase tracking-widest">當前上班時間</span>
                                   <span className="text-4xl font-mono tracking-tighter">{activeRecord.clockInTime}</span>
                                 </div>
                                 <button onClick={() => handleClockOut(activeRecord.id, activeRecord.clockInTime)} className="w-full bg-slate-800 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-slate-700 active:scale-95 transition flex items-center justify-center gap-3 tracking-widest">
                                   <LogOut size={28} /> 下班打卡 (Clock Out)
                                 </button>
                               </div>
                             )}

                             {todaysRecords.length > 0 && (
                               <div className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2.5rem] shadow-inner text-slate-600 mt-4">
                                 <h3 className="text-lg mb-4 text-slate-800 font-black">今日打卡分段紀錄</h3>
                                 <div className="space-y-3 mb-6">
                                   {todaysRecords.map((r, idx) => (
                                     <div key={r.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                       <span className="font-mono">{r.clockInTime} - {r.clockOutTime || '執勤中'}</span>
                                       {r.clockOutTime && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{Math.floor(r.workMinutes/60)}h {r.workMinutes%60}m</span>}
                                     </div>
                                   ))}
                                 </div>
                                 <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-indigo-700">
                                   <span>今日已累計工時</span>
                                   <span className="text-2xl font-mono">{totalH}h {totalM}m</span>
                                 </div>
                               </div>
                             )}
                          </div>
                        );
                     })()}
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 flex flex-col">
                      <h2 className="text-3xl tracking-tighter text-slate-800 mb-6 flex items-center gap-3"><CalendarOff className="text-amber-500" size={32}/> 線上假單申請</h2>
                      <form onSubmit={handleApplyLeave} className="space-y-5 flex-1 flex flex-col">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">請假日期</label>
                            <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black outline-none" value={leaveData.date} onChange={(e) => setLeaveData({...leaveData, date: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest">請假時數</label>
                            <input type="number" required min="0.5" step="0.5" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black outline-none text-indigo-600" value={leaveData.hours} onChange={(e) => setLeaveData({...leaveData, hours: e.target.value})} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest">假別</label>
                          <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black outline-none" value={leaveData.type} onChange={(e) => setLeaveData({...leaveData, type: e.target.value})}>
                            {Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                          
                          {/* 假別規定提示與違規警告 */}
                          {(() => {
                              const currentType = LEAVE_TYPES[leaveData.type];
                              const today = new Date(getLocalDateString());
                              const selectedDate = new Date(leaveData.date);
                              const diffDays = Math.floor((selectedDate - today) / (1000 * 60 * 60 * 24));
                              const isLate = diffDays < currentType.advanceDays;

                              return (
                                <div className="mt-2 flex flex-col gap-1">
                                  <div className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1">
                                    <Info size={12} /> {currentType.notice}
                                  </div>
                                  {isLate && (
                                    <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 flex items-start gap-1 animate-in slide-in-from-top-1">
                                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                      <span>
                                        <strong>注意：</strong>您選擇的日期不符合「提前 {currentType.advanceDays} 天」之規定。若為突發緊急狀況，送出後請務必盡速向主管口頭報備。
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                          })()}

                          {leaveData.type === 'comp_leave' && (
                             <div className="text-[10px] bg-sky-50 text-sky-700 p-2 rounded-lg border border-sky-200 mt-2">
                                💡 提醒：可用補休時數 {compHoursInfo.available} 小時 (當月結算)
                             </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 uppercase tracking-widest">事由 (選填)</label>
                          <input type="text" placeholder="簡單說明請假原因..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black outline-none" value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-amber-600 active:scale-95 transition mt-auto flex items-center justify-center gap-2">
                          <CheckSquare size={20} /> 送出假單
                        </button>
                      </form>
                      
                      <div className="mt-6">
                        <h3 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">我最近的請假紀錄</h3>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                           {leaveRecords.filter(l => l.employeeId === loggedInCoachId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(l => (
                              <div key={l.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                 <span className="font-mono text-slate-500">{l.date}</span>
                                 <span className="font-black text-slate-700">{LEAVE_TYPES[l.type]?.label.split(' ')[0]} ({l.hours}h)</span>
                                 <span className={`font-black ${l.status === 'approved' ? 'text-emerald-600' : l.status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>{l.status === 'approved' ? '已核准' : l.status === 'rejected' ? '被退回' : '審核中'}</span>
                              </div>
                           ))}
                           {leaveRecords.filter(l => l.employeeId === loggedInCoachId).length === 0 && <p className="text-slate-400 text-xs italic text-center py-2">尚無請假紀錄</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {scheduleInfo && (
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 flex flex-col">
                     <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl"><CalendarCheck size={28} /></div>
                           <div>
                             <h2 className="text-2xl text-slate-800 tracking-tighter">當月排班與法定休假比對</h2>
                             <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">依勞基法「一例一休」與「國定假日」核算排班基準</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                           <button onClick={() => {
                               const d = new Date(`${scheduleMonth}-01`);
                               d.setMonth(d.getMonth() - 1);
                               setScheduleMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                           }} className="p-2 hover:bg-slate-200 rounded-xl transition"><ChevronLeft size={20}/></button>
                           <span className="font-mono text-lg text-slate-700 tracking-widest">{scheduleMonth}</span>
                           <button onClick={() => {
                               const d = new Date(`${scheduleMonth}-01`);
                               d.setMonth(d.getMonth() + 1);
                               setScheduleMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                           }} className="p-2 hover:bg-slate-200 rounded-xl transition"><ChevronRight size={20}/></button>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-center items-center">
                           <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">本月總天數</span>
                           <span className="text-2xl font-mono text-slate-700">{scheduleInfo.daysInMonth}</span>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center">
                           <span className="text-[10px] text-indigo-500 uppercase tracking-widest mb-1">法定應排休假</span>
                           <span className="text-2xl font-mono text-indigo-700">{scheduleInfo.requiredDaysOff} <span className="text-xs font-sans text-indigo-400">天</span></span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center">
                           <span className="text-[10px] text-emerald-500 uppercase tracking-widest mb-1">實際已排休假</span>
                           <span className="text-2xl font-mono text-emerald-700">{scheduleInfo.actualDaysOff} <span className="text-xs font-sans text-emerald-400">天</span></span>
                        </div>
                        <div className={`p-4 rounded-2xl border flex flex-col justify-center items-center ${scheduleInfo.diff < 0 ? 'bg-rose-50 border-rose-200' : scheduleInfo.diff === 0 ? 'bg-lime-50 border-lime-200' : 'bg-amber-50 border-amber-200'}`}>
                           <span className={`text-[10px] uppercase tracking-widest mb-1 ${scheduleInfo.diff < 0 ? 'text-rose-500' : scheduleInfo.diff === 0 ? 'text-lime-600' : 'text-amber-600'}`}>{scheduleInfo.diff < 0 ? '⚠ 尚缺休假 (需補休)' : scheduleInfo.diff === 0 ? '✅ 剛剛好符合法規' : '✨ 超額休假'}</span>
                           <span className={`text-2xl font-mono ${scheduleInfo.diff < 0 ? 'text-rose-600' : scheduleInfo.diff === 0 ? 'text-lime-700' : 'text-amber-700'}`}>{Math.abs(scheduleInfo.diff)} <span className="text-xs font-sans">天</span></span>
                        </div>
                     </div>

                     {annualLeaveInfo && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-[2rem] shadow-md text-white flex flex-col justify-between relative overflow-hidden">
                               <div className="absolute top-0 right-0 opacity-10 scale-150 -translate-y-4 translate-x-4"><Sparkles size={120} /></div>
                               <div className="flex items-center gap-4 relative z-10 mb-6">
                                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0"><Sparkles size={28} /></div>
                                  <div>
                                     <h3 className="text-xl font-black tracking-widest mb-1">法定特別休假 (特休) 額度</h3>
                                     <p className="text-[10px] text-emerald-100 uppercase tracking-widest font-sans">
                                        當前年資：{annualLeaveInfo.years} 年 {annualLeaveInfo.months} 個月 
                                     </p>
                                  </div>
                               </div>
                               <div className="flex gap-4 items-center bg-black/10 p-4 rounded-2xl backdrop-blur-sm relative z-10 w-full justify-between">
                                  <div className="text-center px-2">
                                     <div className="text-[10px] text-emerald-100 uppercase mb-1 tracking-widest">給予總天數</div>
                                     <div className="text-2xl font-mono font-black">{annualLeaveInfo.total}</div>
                                  </div>
                                  <div className="w-[1px] h-10 bg-white/20"></div>
                                  <div className="text-center px-2">
                                     <div className="text-[10px] text-emerald-100 uppercase mb-1 tracking-widest">已休(含審核)</div>
                                     <div className="text-2xl font-mono font-black">{annualLeaveInfo.used}</div>
                                  </div>
                                  <div className="w-[1px] h-10 bg-white/20"></div>
                                  <div className="text-center px-2 text-amber-300">
                                     <div className="text-[10px] uppercase mb-1 font-black tracking-widest">剩餘可用</div>
                                     <div className="text-3xl font-mono font-black leading-none">{annualLeaveInfo.remaining}</div>
                                  </div>
                               </div>
                            </div>

                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-[2rem] shadow-md text-white flex flex-col justify-between relative overflow-hidden">
                               <div className="absolute top-0 right-0 opacity-10 scale-150 -translate-y-4 translate-x-4"><BadgePercent size={120} /></div>
                               <div className="flex items-center gap-4 relative z-10 mb-6">
                                   <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0"><BadgePercent size={28} /></div>
                                   <div>
                                       <h3 className="text-xl font-black tracking-widest mb-1">🎉 築動年資成就解鎖</h3>
                                       <p className="text-[10px] text-amber-100 uppercase tracking-widest font-sans flex flex-wrap items-center gap-1">
                                           感謝您與築動共同成長！您已累積 {annualLeaveInfo.years} 年年資
                                       </p>
                                   </div>
                               </div>
                               <div className="bg-black/10 p-4 rounded-2xl backdrop-blur-sm relative z-10 flex justify-between items-center w-full">
                                   <div>
                                      <div className="text-[10px] text-amber-100 uppercase mb-1 tracking-widest">當前基本堂數門檻</div>
                                      <div className="text-2xl font-mono font-black">{(() => {
                                          const emp = employees.find(e => e.id === loggedInCoachId);
                                          if(emp?.type === 'formalA' || emp?.type === 'formal') return Math.max(0, 35 - annualLeaveInfo.years);
                                          if(emp?.type === 'formalB') return Math.max(0, 25 - annualLeaveInfo.years);
                                          return '--';
                                      })()} <span className="text-sm font-sans tracking-tighter">堂</span></div>
                                   </div>
                                   <div className="text-right">
                                      <div className="text-[10px] text-amber-100 uppercase mb-1 tracking-widest">每月門檻減免</div>
                                      <div className="text-3xl font-mono font-black text-white leading-none">-{annualLeaveInfo.years} <span className="text-sm font-sans tracking-tighter">堂</span></div>
                                   </div>
                               </div>
                            </div>
                        </div>
                     )}

                     <div className="w-full border border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-slate-50">
                        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
                           {['日', '一', '二', '三', '四', '五', '六'].map((day, idx) => (
                              <div key={day} className={`p-3 text-center text-xs tracking-widest uppercase ${idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-500'}`}>{day}</div>
                           ))}
                        </div>
                        <div className="grid grid-cols-7 gap-[1px] bg-slate-200">
                           {Array.from({ length: scheduleInfo.firstDay }).map((_, idx) => (
                              <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[100px] p-2"></div>
                           ))}
                           {scheduleInfo.daysArr.map(dayInfo => (
                              <div key={dayInfo.date} className="bg-white min-h-[100px] p-2 flex flex-col relative group transition-colors hover:bg-slate-50">
                                 <div className="flex justify-between items-start mb-2">
                                    <span className={`text-sm font-mono ${dayInfo.isWeekend || dayInfo.holidayName ? 'text-rose-500' : 'text-slate-700'}`}>{dayInfo.day}</span>
                                    {dayInfo.holidayName && <span className="text-[9px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md leading-none shadow-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]" title={dayInfo.holidayName}>{dayInfo.holidayName}</span>}
                                 </div>
                                 
                                 <div className="flex-1 flex flex-col gap-1 justify-end">
                                    {dayInfo.isWorked && (
                                       <div className="bg-emerald-100 text-emerald-700 text-[10px] p-1.5 rounded-lg text-center flex items-center justify-center gap-1">
                                          <Timer size={10} /> 有打卡
                                       </div>
                                    )}
                                    {dayInfo.leave && (
                                       <div className={`text-[10px] p-1.5 rounded-lg text-center shadow-sm border ${dayInfo.leave.status === 'approved' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                          {LEAVE_TYPES[dayInfo.leave.type]?.label.split(' ')[0]} ({dayInfo.leave.hours}h)
                                       </div>
                                    )}
                                    {!dayInfo.isWorked && !dayInfo.leave && dayInfo.date <= getLocalDateString() && (
                                       <div className="bg-slate-100 text-slate-400 text-[10px] p-1 rounded-lg text-center">休假/無排班</div>
                                    )}
                                 </div>
                              </div>
                           ))}
                           {Array.from({ length: (7 - ((scheduleInfo.daysInMonth + scheduleInfo.firstDay) % 7)) % 7 }).map((_, idx) => (
                              <div key={`empty-end-${idx}`} className="bg-slate-50/50 min-h-[100px] p-2"></div>
                           ))}
                        </div>
                     </div>
                  </div>
                  )}
                </div>
             ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 min-h-[600px]">
                     <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                       <h2 className="text-3xl text-slate-800 flex items-center gap-4 tracking-tighter"><Timer className="text-indigo-600" size={32} /> 員工出勤紀錄</h2>
                       <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                         <Clock size={16} className="text-slate-400" />
                         <input type="month" className="bg-transparent outline-none text-slate-700 font-mono text-sm" value={logQueryMonth} onChange={(e) => setLogQueryMonth(e.target.value)} />
                       </div>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest">
                            <tr>
                              <th className="p-6">日期</th>
                              <th className="p-6">員工姓名</th>
                              <th className="p-6">打卡時段明細</th>
                              <th className="p-6 text-right">當日總工時</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                             {(() => {
                                const filtered = attendanceRecords.filter(r => r.date?.startsWith(logQueryMonth));
                                if (filtered.length === 0) {
                                  return <tr><td colSpan="4" className="p-10 text-center text-slate-400">這個月目前尚無任何打卡紀錄。</td></tr>;
                                }
                                
                                // 將紀錄依據「日期 + 員工」分組
                                const grouped = {};
                                filtered.forEach(r => {
                                   const key = `${r.date}_${r.employeeId}`;
                                   if (!grouped[key]) grouped[key] = { date: r.date, employeeId: r.employeeId, segments: [], totalMinutes: 0 };
                                   grouped[key].segments.push(r);
                                   grouped[key].totalMinutes += (r.workMinutes || 0);
                                });

                                return Object.values(grouped)
                                  .sort((a, b) => b.date.localeCompare(a.date) || a.employeeId.localeCompare(b.employeeId))
                                  .map(group => {
                                    const emp = employees.find(e => e.id === group.employeeId);
                                    const h = Math.floor(group.totalMinutes / 60);
                                    const m = group.totalMinutes % 60;
                                    const sortedSegments = group.segments.sort((a,b) => a.clockInTime.localeCompare(b.clockInTime));
                                    const hasActive = sortedSegments.some(s => !s.clockOutTime);

                                    return (
                                      <tr key={`${group.date}_${group.employeeId}`} className="hover:bg-slate-50 transition">
                                        <td className="p-6 font-mono text-slate-500">{group.date}</td>
                                        <td className="p-6 font-black text-slate-800 text-lg flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">{emp?.name?.[0]}</div>
                                          {emp?.name || '未知'}
                                        </td>
                                        <td className="p-6">
                                          <div className="flex flex-col gap-1">
                                            {sortedSegments.map(seg => (
                                              <div key={seg.id} className="font-mono text-sm bg-slate-50 border border-slate-100 rounded px-2 py-1 w-fit flex gap-2">
                                                <span className="text-emerald-600 font-black">{seg.clockInTime}</span>
                                                <span className="text-slate-300">-</span>
                                                <span className={`font-black ${seg.clockOutTime ? "text-rose-500" : "text-slate-400 font-sans text-xs tracking-widest uppercase"}`}>{seg.clockOutTime || '執勤中'}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </td>
                                        <td className="p-6 text-right font-mono font-black text-indigo-600 bg-indigo-50/30">
                                          {!hasActive ? `${h}h ${m}m` : <span className="text-slate-400 text-xs font-sans tracking-widest uppercase">計算中...</span>}
                                        </td>
                                      </tr>
                                    );
                                  });
                             })()}
                          </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 min-h-[600px]">
                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                       <h2 className="text-3xl text-slate-800 flex items-center gap-4 tracking-tighter"><CalendarOff className="text-amber-500" size={32} /> 假單簽核管理</h2>
                    </div>
                    <div className="space-y-4">
                       {leaveRecords.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(leave => {
                         const emp = employees.find(e => e.id === leave.employeeId);
                         if (!emp) return null;
                         const lType = LEAVE_TYPES[leave.type] || LEAVE_TYPES.personal;
                         return (
                           <div key={leave.id} className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${leave.status === 'pending' ? 'bg-amber-50/30 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                             <div className="flex gap-4 items-start">
                               <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-xl font-black shrink-0">{emp.name[0]}</div>
                               <div>
                                 <div className="flex items-center gap-2 mb-1">
                                   <span className="text-lg font-black text-slate-800">{emp.name}</span>
                                   <span className={`text-[10px] px-2 py-0.5 rounded border ${lType.color}`}>{lType.label}</span>
                                 </div>
                                 <div className="text-sm font-mono text-slate-500 mb-1 flex gap-2">
                                    <span className="font-black">{leave.date}</span> 
                                    <span className="bg-slate-200 px-1.5 rounded">{leave.hours} 小時</span>
                                 </div>
                                 <p className="text-xs text-slate-500 italic">事由：{leave.reason || '未填寫'}</p>
                               </div>
                             </div>
                             
                             <div className="flex gap-2 justify-end shrink-0">
                               {leave.status === 'pending' ? (
                                  <>
                                    <button onClick={() => handleLeaveApproval(leave.id, 'rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-100 flex items-center gap-1 border border-rose-200"><XSquare size={14}/> 退回</button>
                                    <button onClick={() => handleLeaveApproval(leave.id, 'approved')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md hover:bg-emerald-600 flex items-center gap-1"><CheckSquare size={14}/> 核准</button>
                                  </>
                               ) : (
                                  <span className={`px-4 py-2 rounded-xl text-xs font-black border ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                     {leave.status === 'approved' ? '已核准 (連動薪資)' : '已退回'}
                                  </span>
                               )}
                             </div>
                           </div>
                         )
                       })}
                       {leaveRecords.length === 0 && (
                          <div className="text-center p-10 text-slate-400">目前沒有任何假單紀錄。</div>
                       )}
                    </div>
                  </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="animate-in fade-in duration-300 font-black">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Receipt size={28} /></div>
                   <div>
                     <h2 className="text-2xl text-slate-800 tracking-tighter">新增請款單</h2>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">代墊費用、店內活動開銷報帳申請</p>
                   </div>
                 </div>
                 <form onSubmit={handleApplyExpense} className="space-y-5">
                   {userRole === 'boss' ? (
                     <div className="space-y-1">
                       <label className="text-[10px] text-slate-400 uppercase">申請人 (代為輸入)</label>
                       <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-black outline-none" value={expenseData.employeeId} onChange={e => setExpenseData({...expenseData, employeeId: e.target.value})}>
                         <option value="">-- 選擇請款人 --</option>
                         {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                       </select>
                     </div>
                   ) : null}
                   <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase">消費/發生日期</label>
                     <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-black outline-none" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase">請款項目 / 說明</label>
                     <input type="text" required placeholder="例如：購買飲水機濾心、學員活動點心..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-black outline-none" value={expenseData.item} onChange={e => setExpenseData({...expenseData, item: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-[10px] text-slate-400 uppercase">發票 / 憑證種類</label>
                       <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm font-black outline-none" value={expenseData.invoiceType} onChange={e => setExpenseData({...expenseData, invoiceType: e.target.value})}>
                         <option value="電子發票">電子發票</option>
                         <option value="紙本發票">紙本發票</option>
                         <option value="收據">收據</option>
                         <option value="其他">其他 (自行填寫)</option>
                       </select>
                     </div>
                     {expenseData.invoiceType === '其他' && (
                       <div className="space-y-1 animate-in fade-in zoom-in duration-200">
                         <label className="text-[10px] text-slate-400 uppercase">填寫憑證名稱</label>
                         <input type="text" required placeholder="請輸入憑證種類..." className="w-full bg-slate-50 border border-amber-200 rounded-2xl p-3 text-sm font-black outline-none focus:border-amber-400 text-amber-700 shadow-inner" value={expenseData.invoiceTypeOther || ''} onChange={e => setExpenseData({...expenseData, invoiceTypeOther: e.target.value})} />
                       </div>
                     )}
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] text-slate-400 uppercase">金額 (元)</label>
                     <input type="number" required placeholder="請輸入請款金額" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xl text-indigo-600 font-black outline-none shadow-inner" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
                   </div>
                   <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black shadow-lg hover:bg-indigo-700 transition active:scale-95">送出請款</button>
                 </form>
               </div>

               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-200 min-h-[600px]">
                 <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <h2 className="text-2xl text-slate-800 flex items-center gap-4 tracking-tighter">請款紀錄與簽核</h2>
                 </div>
                 <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {expenses.filter(exp => userRole === 'boss' || exp.employeeId === loggedInCoachId).sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(exp => {
                      const emp = employees.find(e => e.id === exp.employeeId);
                      if (!emp) return null;
                      return (
                        <div key={exp.id} className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${exp.status === 'pending' ? 'bg-amber-50/30 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex gap-4 items-start">
                             <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-xl font-black shrink-0">{emp.name[0]}</div>
                             <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-lg font-black text-slate-800">{emp.name}</span>
                                 <span className="text-sm font-mono text-indigo-600 font-black">${exp.amount.toLocaleString()}</span>
                               </div>
                               <div className="text-xs text-slate-500 font-black mb-1 flex gap-2 items-center flex-wrap">
                                  <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{exp.date}</span> 
                                  {exp.invoiceType && <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded border border-sky-100">{exp.invoiceType}</span>}
                                  <span>{exp.item}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex gap-2 justify-end shrink-0">
                             {exp.status === 'pending' ? (
                                userRole === 'boss' ? (
                                  <>
                                    <button onClick={() => handleExpenseApproval(exp.id, 'rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-100 flex items-center gap-1 border border-rose-200"><XSquare size={14}/> 駁回</button>
                                    <button onClick={() => handleExpenseApproval(exp.id, 'approved')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md hover:bg-emerald-600 flex items-center gap-1"><CheckSquare size={14}/> 核准撥款</button>
                                  </>
                                ) : (
                                  <span className="text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs">等待簽核中</span>
                                )
                             ) : (
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${exp.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                   {exp.status === 'approved' ? '已核准撥款 (計入財報)' : '已駁回'}
                                </span>
                             )}
                           </div>
                        </div>
                      )
                    })}
                    {expenses.filter(exp => userRole === 'boss' || exp.employeeId === loggedInCoachId).length === 0 && (
                       <div className="text-center p-10 text-slate-400">目前尚無任何請款紀錄。</div>
                    )}
                 </div>
               </div>
            </div>
          </div>
        )}

        {(activeTab === 'daily' || activeTab === 'athlete' || activeTab === 'special') && (
          <div className={`grid grid-cols-1 ${userRole === 'boss' ? 'xl:grid-cols-12' : 'xl:grid-cols-2'} gap-8 animate-in fade-in duration-300`}>
            <div className={`${userRole === 'boss' ? 'xl:col-span-4' : 'xl:col-span-1'} space-y-6`}>
              {userRole === 'boss' && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative border border-slate-800">
                  <p className="text-amber-400 text-[10px] uppercase tracking-widest flex items-center gap-2 mb-2 font-black font-sans"><Wallet size={14} /> 本日預計總實收 (全館)</p>
                  <h3 className="text-4xl font-black tracking-tighter mb-8 font-sans">${financeDashboard.totalRev.toLocaleString()}</h3>
                  <div className="space-y-4 border-t border-white/10 pt-8">
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-4">今日教練所得摘要</p>
                    {Object.entries(financeDashboard.employeeSummary).map(([id, data]) => (
                      <div key={id} className="bg-white/5 p-4 rounded-2xl border border-white/5 transition hover:bg-white/10 flex justify-between items-start">
                         <div className="flex flex-col"><span className="font-black text-lg text-amber-200 leading-none mb-1">{employees.find(e => e.id === id)?.name || '未知'}</span><span className="text-[10px] text-slate-500 uppercase">今日累計 {formatClasses(data.count)} 堂</span></div>
                         <div className="text-right">
                           <span className="text-xl font-black text-emerald-400 font-mono tracking-tighter">+${data.totalPay.toLocaleString()}</span>
                           <div className="flex flex-wrap justify-end gap-1 mt-1">{data.bonus > 0 && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded border border-amber-500/30">獎金</span>}{data.ref > 0 && <span className="text-[8px] bg-sky-500/20 text-sky-300 px-1 rounded border border-sky-500/30">轉介</span>}{data.eventSupportPay > 0 && <span className="text-[8px] bg-fuchsia-500/20 text-fuchsia-300 px-1 rounded border border-fuchsia-500/30">支援</span>}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4 border-t border-white/10 pt-8 mt-6">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-sky-400 text-[9px] uppercase tracking-widest flex items-center gap-1"><Wallet size={12}/> 教練代收帳款對帳 (現金/轉帳)</p>
                    </div>
                    <div className="flex items-center gap-2 mb-4 bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                       <input type="date" className="bg-transparent text-sky-300 text-[10px] outline-none w-full font-mono" value={collectionStartDate} onChange={e => setCollectionStartDate(e.target.value)} />
                       <span className="text-slate-500 text-[10px]">至</span>
                       <input type="date" className="bg-transparent text-sky-300 text-[10px] outline-none w-full font-mono" value={collectionEndDate} onChange={e => setCollectionEndDate(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <div className="bg-sky-900/30 p-3 rounded-xl border border-sky-500/20"><div className="text-[10px] text-sky-200/70">總現金代收</div><div className="text-lg font-mono text-sky-300">${dailyCollections.totalCash.toLocaleString()}</div></div>
                       <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-500/20"><div className="text-[10px] text-indigo-200/70">總轉帳代收</div><div className="text-lg font-mono text-indigo-300">${dailyCollections.totalTransfer.toLocaleString()}</div></div>
                    </div>
                    {Object.entries(dailyCollections.collectionsByCoach).map(([id, data]) => (
                      <div key={id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                         <span className="font-black text-sm text-sky-100">{employees.find(e => e.id === id)?.name || (id === 'COMPANY_REVENUE' ? '公司活動直收' : '未知')}</span>
                         <div className="text-right">
                           <div className="text-lg font-black text-white font-mono">${data.total.toLocaleString()}</div>
                           <div className="text-[10px] text-slate-400 font-mono">現:${data.cash.toLocaleString()} / 轉:${data.transfer.toLocaleString()}</div>
                         </div>
                      </div>
                    ))}
                    {Object.keys(dailyCollections.collectionsByCoach).length === 0 && <p className="text-slate-500 text-xs text-center py-2 italic">區間內尚無代收帳款紀錄</p>}
                  </div>
                </div>
              )}
              
              {userRole === 'coach' && loggedInCoachId && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl border border-slate-800 mb-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <p className="text-sky-400 text-[10px] uppercase tracking-widest flex items-center gap-1 mb-3"><Wallet size={14} /> 我的代收帳款對帳 (現金/轉帳)</p>
                    <div className="p-3 bg-white/10 rounded-[1rem]"><CheckCircle2 size={24} className="text-sky-400" /></div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700 w-fit">
                    <input type="date" className="bg-transparent text-sky-300 text-[11px] outline-none font-mono" value={collectionStartDate} onChange={e => setCollectionStartDate(e.target.value)} />
                    <span className="text-slate-500 text-[10px]">至</span>
                    <input type="date" className="bg-transparent text-sky-300 text-[11px] outline-none font-mono" value={collectionEndDate} onChange={e => setCollectionEndDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-baseline mt-2">
                    <span className="text-4xl font-black font-mono text-white">${(dailyCollections.collectionsByCoach[loggedInCoachId]?.total || 0).toLocaleString()}</span>
                    <span className="text-sm text-slate-400 font-mono">
                      現金: ${(dailyCollections.collectionsByCoach[loggedInCoachId]?.cash || 0).toLocaleString()} / 
                      轉帳: ${(dailyCollections.collectionsByCoach[loggedInCoachId]?.transfer || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 font-sans font-black">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl border-l-4 ${activeTab === 'athlete' ? 'border-amber-500' : (activeTab === 'special' ? 'border-fuchsia-500' : (userRole === 'boss' ? 'border-amber-600' : 'border-slate-800'))} pl-3 uppercase tracking-tighter`}>
                    {activeTab === 'athlete' ? '運動員專案錄入' : (activeTab === 'special' ? '特別活動錄入' : '一般營運錄入表')}
                  </h2>
                  <input type="date" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 outline-none font-mono" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>

                {activeTab === 'athlete' && (
                  <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
                    <button type="button" onClick={() => {
                      setAthleteMode('buy');
                      setLogData(prev => ({...prev, paymentMethod: '現金', classes: '0', salesAthlete: '1', classDuration: 'athlete_buy', employeeId: employees[0]?.id || ''}));
                    }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${athleteMode === 'buy' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                      💰 儲值包 (買點數)
                    </button>
                    <button type="button" onClick={() => {
                      setAthleteMode('deduct');
                      setLogData(prev => ({...prev, paymentMethod: '代扣', classes: '3', classDuration: 'athlete_90min', salesAthlete: '0', employeeId: ''}));
                    }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${athleteMode === 'deduct' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                      ⏱️ 隨堂扣點
                    </button>
                  </div>
                )}
                
                {activeTab === 'daily' && (
                  <div className="flex gap-2 mb-6 bg-slate-100 p-1.5 rounded-2xl">
                    <button type="button" onClick={() => {
                      setDailyOpMode('buy');
                      setLogData(prev => ({...prev, paymentMethod: '現金', classes: '0', classDuration: '90min'}));
                    }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${dailyOpMode === 'buy' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                      💰 購課儲值包
                    </button>
                    <button type="button" onClick={() => {
                      setDailyOpMode('deduct');
                      setLogData(prev => ({...prev, paymentMethod: '代扣', classes: '1', classDuration: '90min'}));
                    }} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${dailyOpMode === 'deduct' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                      ⏱️ 一般上課扣抵
                    </button>
                  </div>
                )}
                
                {activeTab === 'special' && (
                  <div className="flex gap-2 mb-6 bg-fuchsia-50 p-1.5 rounded-2xl border border-fuchsia-100 flex-wrap">
                    <button type="button" onClick={() => {
                      setLogData(prev => ({...prev, specialEventType: '隨喜40min', companyRevenue: '', paymentMethod: '現金', classes: '1'}));
                    }} className={`flex-1 py-3 px-2 rounded-xl text-xs md:text-sm font-black transition-all ${logData.specialEventType === '隨喜40min' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-fuchsia-500 hover:bg-fuchsia-100'}`}>
                      ✨ 隨喜 40 分鐘
                    </button>
                    <button type="button" onClick={() => {
                      setLogData(prev => ({...prev, specialEventType: '進階體驗90min', companyRevenue: '1000', paymentMethod: '現金', classes: '1'}));
                    }} className={`flex-1 py-3 px-2 rounded-xl text-xs md:text-sm font-black transition-all ${logData.specialEventType === '進階體驗90min' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-fuchsia-500 hover:bg-fuchsia-100'}`}>
                      🚀 進階體驗 90 分鐘
                    </button>
                    <button type="button" onClick={() => {
                      setLogData(prev => ({...prev, specialEventType: '出差任務', companyRevenue: '', paymentMethod: '現金', classes: '1', customerName: '', eventSupportPay: ''}));
                    }} className={`flex-1 py-3 px-2 rounded-xl text-xs md:text-sm font-black transition-all ${logData.specialEventType === '出差任務' ? 'bg-fuchsia-600 text-white shadow-md' : 'text-fuchsia-500 hover:bg-fuchsia-100'}`}>
                      💼 外出接活動 (自訂堂數/金額)
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddLog} className="space-y-4">
                  <select required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none shadow-sm" value={logData.employeeId} onChange={(e) => setLogData({...logData, employeeId: e.target.value})}>
                    <option value="">-- 上課/銷售 教練 --</option>
                    {userRole === 'boss' && activeTab === 'daily' && dailyOpMode === 'deduct' && <option value="COMPANY_REVENUE">🏢 公司活動收入 (計入總營收)</option>}
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  
                  <div className="relative">
                    <input list="customer-list" type="text" placeholder={activeTab === 'special' ? "上課學員姓名 或 活動名稱" : "上課學員姓名 (若純發獎金可不填)"} required={activeTab==='athlete' || activeTab==='special'} className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 text-sm font-black outline-none shadow-sm ${activeTab === 'athlete' ? 'border-amber-300 bg-amber-50/30' : (activeTab === 'special' ? 'border-fuchsia-300 bg-fuchsia-50/30' : 'border-slate-200')}`} value={logData.customerName} onChange={(e) => setLogData({ ...logData, customerName: e.target.value })} />
                    <datalist id="customer-list">
                      {customers.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                    
                    {activeTab === 'athlete' && (
                       <div className="mt-2 bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-inner">
                         <p className="text-[10px] text-amber-600 mb-1 flex items-center gap-1"><Landmark size={12}/> 運動員專案成員快速選擇</p>
                         <select className="w-full bg-white text-amber-700 text-xs p-2 rounded-lg border border-amber-200 outline-none" onChange={(e) => setLogData({...logData, customerName: e.target.value})} value={logData.customerName}>
                           <option value="">-- 請選擇專案學員 --</option>
                           {customers.filter(c => c.isAthleteProjectMember).map(c => <option key={c.id} value={c.name}>{c.name} (剩餘 {c.remaining} 點)</option>)}
                         </select>
                       </div>
                    )}
                    {activeTab === 'special' && (
                       <div className="mt-2 bg-fuchsia-50 border border-fuchsia-200 p-3 rounded-xl shadow-inner">
                         <p className="text-[10px] text-fuchsia-600 mb-1 flex items-center gap-1"><Gift size={12}/> 特別專案與活動名稱快速選擇</p>
                         <select className="w-full bg-white text-fuchsia-700 text-xs p-2 rounded-lg border border-fuchsia-200 outline-none" onChange={(e) => setLogData({...logData, customerName: e.target.value})} value={logData.customerName}>
                           <option value="">-- 請選擇特別專案學員或活動 --</option>
                           <optgroup label="企業專案 / 外包活動 (出差用)">
                             {customers.filter(c => c.customerType === 'activity').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </optgroup>
                           <optgroup label="特別專案來源客 (個人)">
                             {customers.filter(c => c.isSpecialEventMember).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                           </optgroup>
                           <option value="內部事務 / 專案活動">內部事務 / 出差 (無特定學員)</option>
                         </select>
                       </div>
                    )}
                  </div>
                  
                  {((activeTab === 'daily' && dailyOpMode === 'deduct') || (activeTab === 'athlete' && athleteMode === 'deduct')) && (
                    <div className="p-5 bg-amber-50/80 rounded-[2rem] border border-amber-200/60 space-y-4 shadow-inner">
                      <p className="text-[10px] text-amber-700 font-black italic flex items-center gap-2 uppercase tracking-widest"><Wallet size={14}/> 課堂代扣與付款方式</p>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setLogData({...logData, paymentMethod: '代扣'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${logData.paymentMethod === '代扣' ? 'bg-amber-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>💳 餘額扣抵</button>
                         <button type="button" onClick={() => setLogData({...logData, paymentMethod: '現金', deductFromCustomerId: ''})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${logData.paymentMethod === '現金' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>💵 現金付款</button>
                         <button type="button" onClick={() => setLogData({...logData, paymentMethod: '轉帳', deductFromCustomerId: ''})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${logData.paymentMethod === '轉帳' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>🏦 銀行轉帳</button>
                      </div>
                      {logData.paymentMethod === '代扣' && (
                         <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-1">
                           <select className="w-full bg-white border border-amber-300 rounded-xl px-4 py-3 text-xs font-black outline-none shadow-sm text-amber-900" value={logData.deductFromCustomerId} onChange={(e) => setLogData({...logData, deductFromCustomerId: e.target.value})}>
                             <option value="">-- 預設扣除【上課學員本人】餘額 --</option>
                             {customers.filter(c => Number(c.remaining) > 0).map(c => <option key={c.id} value={c.id}>改扣他人：{c.name} (剩 {c.remaining} 堂/點)</option>)}
                           </select>
                         </div>
                      )}
                    </div>
                  )}

                  {((activeTab === 'athlete' && athleteMode === 'buy') || (activeTab === 'daily' && dailyOpMode === 'buy') || activeTab === 'special') && (
                    <div className="p-5 bg-amber-50/80 rounded-[2rem] border border-amber-200/60 space-y-4 shadow-inner">
                      <p className="text-[10px] text-amber-700 font-black italic flex items-center gap-2 uppercase tracking-widest"><Wallet size={14}/> 付款方式</p>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setLogData({...logData, paymentMethod: '現金'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${logData.paymentMethod === '現金' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>💵 現金付款</button>
                         <button type="button" onClick={() => setLogData({...logData, paymentMethod: '轉帳'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all shadow-sm ${logData.paymentMethod === '轉帳' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>🏦 銀行轉帳</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'daily' && (
                    <div className="p-5 bg-sky-50 rounded-[2rem] border border-sky-100 space-y-3 shadow-inner">
                      <p className="text-[9px] text-sky-600 font-black italic flex items-center gap-2 uppercase tracking-widest"><Gift size={12}/> 課程轉介教練</p>
                      <select className="w-full bg-white border border-sky-200 rounded-xl px-4 py-3 text-xs font-black outline-none shadow-sm" value={logData.referralSourceId} onChange={(e) => setLogData({...logData, referralSourceId: e.target.value})}><option value="">-- 無轉介教練 --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} 老師 (推薦人)</option>)}</select>
                    </div>
                  )}
                  
                  {activeTab === 'athlete' && athleteMode === 'deduct' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                      <input type="text" placeholder="時段 (例 14:00)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black outline-none" value={logData.sessionTime} onChange={(e) => setLogData({...logData, sessionTime: e.target.value})} />
                      <div className="w-full md:col-span-2 flex gap-2">
                        <div className="relative flex-1">
                          <input type="number" step="30" min="30" placeholder="上課分鐘數" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black outline-none text-amber-600 pl-14" value={logData.classDuration?.startsWith('athlete_') ? logData.classDuration.split('_')[1].replace('min','') : '90'} onChange={(e) => {
                              const mins = e.target.value;
                              const pts = Math.max(1, Math.floor(Number(mins) / 30)).toString();
                              setLogData({...logData, classDuration: `athlete_${mins}min`, classes: pts});
                          }} />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">時間</span>
                        </div>
                        <div className="w-1/3 bg-slate-100 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black text-amber-700 flex items-center justify-center">
                          扣 {logData.classes} 點
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'daily' && dailyOpMode === 'deduct' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                      <input type="text" placeholder="時段 (例 14:00)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black outline-none" value={logData.sessionTime} onChange={(e) => setLogData({...logData, sessionTime: e.target.value})} />
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner text-[11px] md:text-sm font-black outline-none text-indigo-600" value={logData.classDuration} onChange={(e) => setLogData({...logData, classDuration: e.target.value})}>
                        <option value="90min">90 min 課程 ($2500)</option>
                        <option value="60min">60 min 課程 ($1800)</option>
                        <option value="120min">120 min 課程 ($3400)</option>
                        <option value="150min">150 min 課程 ($4300)</option>
                      </select>
                      {logData.employeeId === 'COMPANY_REVENUE' || isFormActivityProject ? (
                        <input type="number" placeholder="活動實收金額(元)" className="w-full bg-slate-50 border border-indigo-200 rounded-xl p-3 text-indigo-600 shadow-inner font-black outline-none" value={logData.companyRevenue} onChange={(e) => setLogData({...logData, companyRevenue: e.target.value})} />
                      ) : (
                        <input type="number" placeholder="堂數" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-amber-600 shadow-inner font-black outline-none" value={logData.classes} onChange={(e) => setLogData({...logData, classes: e.target.value})} />
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'special' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                      <input type="text" placeholder="時段 (例 14:00)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black outline-none" value={logData.sessionTime} onChange={(e) => setLogData({...logData, sessionTime: e.target.value})} />
                      {logData.specialEventType === '隨喜40min' ? (
                        <input type="number" required placeholder="隨喜收費金額(全歸教練)" className="w-full bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3 text-fuchsia-600 shadow-inner font-black outline-none" value={logData.companyRevenue} onChange={(e) => setLogData({...logData, companyRevenue: e.target.value})} />
                      ) : logData.specialEventType?.startsWith('出差任務') ? (
                        <div className="flex flex-col md:flex-row gap-2 w-full col-span-1 md:col-span-2">
                          <input type="number" placeholder="認列堂數" className="w-full md:w-1/3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-600 shadow-inner font-black outline-none" value={logData.classes} onChange={(e) => setLogData({...logData, classes: e.target.value})} />
                          <input type="number" placeholder="公司實收費用(元)" className="w-full md:w-1/3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-600 shadow-inner font-black outline-none" value={logData.companyRevenue} onChange={(e) => setLogData({...logData, companyRevenue: e.target.value})} />
                          <input type="number" placeholder="發給教練薪資(元)" className="w-full md:w-1/3 bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3 text-fuchsia-600 shadow-inner font-black outline-none" value={logData.eventSupportPay} onChange={(e) => setLogData({...logData, eventSupportPay: e.target.value})} />
                        </div>
                      ) : (
                        <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 shadow-inner text-sm font-black text-slate-500 flex items-center justify-center">
                          固定收費 $1000 (教練$500/教室$500)
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'daily' && (
                    <div className="p-5 bg-teal-50/50 rounded-[2rem] border border-teal-100/50 space-y-3">
                      <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest italic flex items-center gap-2"><ShoppingCart size={12}/> 實體商品販售</p>
                      <div className="flex gap-2">
                        <select className="flex-1 bg-white border border-teal-200 rounded-xl px-4 py-3 text-xs font-black outline-none shadow-sm" value={logData.productName} onChange={(e) => {
                          const val = e.target.value;
                          let p = logData.productPrice;
                          if (val === '花生球' || val === '綠色迷你滾筒') p = '399';
                          if (val === '木色迷你滾筒') p = '419';
                          if (val === '黑色迷你滾筒') p = '439';
                          setLogData({...logData, productName: val, productPrice: p});
                        }}>
                          <option value="">-- 無購買商品 --</option>
                          <option value="花生球">花生球 ($399)</option>
                          <option value="綠色迷你滾筒">綠色迷你滾筒 ($399)</option>
                          <option value="木色迷你滾筒">木色迷你滾筒 ($419)</option>
                          <option value="黑色迷你滾筒">黑色迷你滾筒 ($439)</option>
                          <option value="其他">其他商品</option>
                        </select>
                        {logData.productName && (
                          <input type="number" placeholder="單價(元)" className="w-24 bg-white border border-teal-200 rounded-xl px-3 py-3 text-xs font-black outline-none shadow-sm text-teal-700" value={logData.productPrice} onChange={(e) => setLogData({...logData, productPrice: e.target.value})} />
                        )}
                        {logData.productName && (
                          <input type="number" placeholder="數量" className="w-20 bg-white border border-teal-200 rounded-xl px-3 py-3 text-xs font-black outline-none shadow-sm text-teal-700" value={logData.productQty} onChange={(e) => setLogData({...logData, productQty: e.target.value})} />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'athlete' && athleteMode === 'buy' && (
                    <div className="p-5 bg-amber-50/50 rounded-[2rem] border border-amber-100/50 space-y-3">
                      <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest italic flex items-center gap-2">📦 購買運動員專屬點數包</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[8px] text-amber-600 ml-1 font-black">運動員包 (+24點 / $6000)</p>
                          <input type="number" className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm font-black shadow-sm text-amber-600" value={logData.salesAthlete} onChange={(e) => setLogData({...logData, salesAthlete: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-amber-600 ml-1 font-black">專案買課日期</p>
                          <input type="date" className="w-full bg-white border border-amber-200 rounded-xl p-3 text-sm font-black shadow-sm text-amber-600" value={logData.purchaseDate} onChange={(e) => setLogData({...logData, purchaseDate: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'daily' && (
                    <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 space-y-3">
                      <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest italic flex items-center gap-2">📦 購買一般課堂組合與獎金</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><p className="text-[8px] text-slate-400 ml-1">10+1 組數 (+11堂)</p><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-sm font-black shadow-sm" value={logData.sales10} onChange={(e) => setLogData({...logData, sales10: e.target.value})} /></div>
                        <div className="space-y-1"><p className="text-[8px] text-slate-400 ml-1">5 堂組數 (+5堂)</p><input type="number" className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-sm font-black shadow-sm" value={logData.sales5} onChange={(e) => setLogData({...logData, sales5: e.target.value})} /></div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'daily' && dailyOpMode === 'deduct' && (
                    <div className="p-5 bg-fuchsia-50/50 rounded-[2rem] border border-fuchsia-100/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[9px] text-fuchsia-600 font-black uppercase tracking-widest italic flex items-center gap-2">🚩 教練活動薪資 / 額外獎金</p>
                        <button type="button" onClick={() => setLogData({...logData, classes: '0', customerName: '', eventSupportPay: ''})} className="text-[9px] bg-fuchsia-200/50 text-fuchsia-700 px-3 py-1.5 rounded-lg font-black hover:bg-fuchsia-200 transition active:scale-95">一鍵切換發放模式</button>
                      </div>
                      <input type="number" placeholder="請輸入教練當次活動薪資/獎金 (元)" className="w-full bg-white border border-fuchsia-200 rounded-xl p-3 text-sm font-black shadow-sm" value={logData.eventSupportPay} onChange={(e) => setLogData({...logData, eventSupportPay: e.target.value})} />
                      {isFormActivityProject && activeTab === 'daily' && <p className="text-[10px] text-fuchsia-500/80 italic mt-1">* 目標為活動專案，不計算一般堂數抽成，以此欄位做為教練活動薪資。</p>}
                    </div>
                  )}

                  {payerToShow && (addingClasses > 0 || isDeducting) && !isFormActivityProject && (
                    <div className="p-5 bg-white border-2 border-emerald-500/20 rounded-[2rem] flex flex-col gap-2 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/50"></div>
                      <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest ml-2 flex items-center gap-1"><Check size={12}/> {payerToShow.name} 結算後餘額預覽</span>
                      <div className="flex items-center gap-2 font-mono font-black text-lg ml-2">
                        <span className="text-slate-500">{currentBalance}</span>
                        {addingClasses > 0 && <span className="text-indigo-500" title="購買增加">+{addingClasses}</span>}
                        {deductingClasses > 0 && <span className="text-rose-500" title="本次上課扣抵">-{deductingClasses}</span>}
                        <span className="text-slate-300">=</span>
                        <span className={`text-2xl tracking-tighter ${finalBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{finalBalance} {activeTab === 'athlete' ? '點' : '堂'}</span>
                      </div>
                      {finalBalance < 0 && <span className="text-[9px] text-rose-500 italic ml-2 mt-1">*警告：結算後堂數/點數將為負數</span>}
                    </div>
                  )}

                  <button type="submit" className={`w-full text-white py-5 rounded-[2.2rem] font-black text-xl transition shadow-xl ${activeTab === 'athlete' ? 'bg-amber-600 hover:bg-amber-700' : (activeTab === 'special' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : (userRole === 'boss' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-600 hover:bg-amber-700'))}`}>同步營運數據</button>
                </form>
              </div>
            </div>
            
            <div className={`${userRole === 'boss' ? 'xl:col-span-8' : 'xl:col-span-1'}`}>
              <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[750px] font-sans">
                <div className="p-10 border-b border-slate-100 bg-white flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-slate-800 text-2xl flex items-center gap-3 tracking-tighter"><CalendarDays size={28} className="text-indigo-600" /> 全館營運明細錄查詢</h2>
                  </div>
                  <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none shadow-sm" value={logQueryType} onChange={(e) => setLogQueryType(e.target.value)}>
                      <option value="date">依日期</option>
                      <option value="month">依月份</option>
                      <option value="all">全部紀錄</option>
                    </select>
                    {logQueryType === 'date' && <input type="date" className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none shadow-sm" value={logQueryDate} onChange={(e) => setLogQueryDate(e.target.value)} />}
                    {logQueryType === 'month' && <input type="month" className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black outline-none shadow-sm" value={logQueryMonth} onChange={(e) => setLogQueryMonth(e.target.value)} />}
                    <div className="flex-1 relative min-w-[200px]">
                      <UserSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="搜尋學員姓名..." className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-black outline-none shadow-sm" value={logSearchText} onChange={(e) => setLogSearchText(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      <tr><th className="px-10 py-6">日期 / 學員</th>{userRole === 'boss' && <th className="px-6 py-6 text-center">實收</th>}<th className="px-10 py-6 text-center text-sky-600">轉介流向</th><th className="px-8 py-6 text-center text-emerald-600">教練所得</th><th className="px-10 py-6 text-right">操作</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-black">
                      {dailyLogs.filter(log => {
                        let matchDate = true;
                        if (logQueryType === 'date') matchDate = log.date === logQueryDate;
                        else if (logQueryType === 'month') matchDate = logQueryMonth ? log.date?.startsWith(logQueryMonth) : true;
                        let matchSearch = true;
                        if (logSearchText) matchSearch = log.customerName?.toLowerCase().includes(logSearchText.toLowerCase());
                        
                        let matchCoach = true;
                        if (userRole === 'coach' && loggedInCoachId) {
                            matchCoach = (log.employeeId === loggedInCoachId || log.referralSourceId === loggedInCoachId);
                        }

                        return matchDate && matchSearch && matchCoach;
                      }).sort((a,b) => {
                        if (a.date !== b.date) return (b.date || '').localeCompare(a.date || '');
                        return (b.createdAt || '').localeCompare(a.createdAt || '');
                      }).map((log) => {
                          const receiverCoach = employees.find(e => e.id === log.employeeId);
                          const referrerCoach = employees.find(e => e.id === log.referralSourceId);
                          const logCustomerObj = customers.find(c => c.name?.trim().toLowerCase() === log.customerName?.trim().toLowerCase());
                          const isActivityLog = logCustomerObj?.customerType === 'activity' && !log.specialEventType;

                          const b = receiverCoach ? calculateEntrySalary(receiverCoach, log, dailyLogs.filter(l => l.employeeId === receiverCoach.id && (l.date < log.date || (l.date === log.date && (l.createdAt || '') < (log.createdAt || '')))).reduce((s, c) => {
                             const lCust = customers.find(cust => cust.name?.trim().toLowerCase() === c.customerName?.trim().toLowerCase());
                             const isAct = lCust?.customerType === 'activity' && !c.specialEventType;
                             const isNewAth = c.classDuration?.startsWith('athlete_') && c.classDuration !== 'athlete_buy';
                             const rawCls = c.specialEventType ? (Number(c.classes) || 1) : (Number(c.classes) || 0);
                             const isOvertimeLog = c.classDuration === 'overtime30min' || c.classDuration === 'overtime60min';
                             return s + (isAct || isOvertimeLog ? 0 : (isNewAth ? rawCls / 3 : rawCls));
                          }, 0)) : { total: 0 };
                          
                          const payer = customers.find(c => c.id === log.deductFromCustomerId);
                          let classCashRev = 0;
                          
                          if (log.specialEventType === '隨喜40min') {
                              classCashRev = Number(log.companyRevenue) || 0;
                          } else if (log.specialEventType === '進階體驗90min') {
                              classCashRev = 1000;
                          } else if (log.specialEventType?.startsWith('出差任務')) {
                              classCashRev = Number(log.companyRevenue) || 0;
                          } else if (log.employeeId === 'COMPANY_REVENUE' || isActivityLog) {
                              classCashRev = Number(log.companyRevenue) || 0;
                          } else if (log.paymentMethod !== '代扣' && Number(log.classes) > 0) {
                              const isNewAth = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
                              const isOldAth = log.isAthleteProject && !isNewAth && log.classDuration !== 'athlete_buy';
                              if (isNewAth) {
                                  classCashRev = Number(log.classes) * 250;
                              } else if (isOldAth) {
                                  classCashRev = Number(log.classes) * 750;
                              } else {
                                  const X = log.classFee ? Number(log.classFee) : (
                                      log.classDuration === '150min' ? 4300 :
                                      log.classDuration === '120min' ? 3400 :
                                      log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
                                      log.classDuration === 'overtime30min' ? 900 : 2500
                                  );
                                  classCashRev = Number(log.classes) * X;
                              }
                          }
                          const revenue = classCashRev + (Number(log.sales10) * 25000) + (Number(log.sales5) * 11500) + (Number(log.salesAthlete) * 6000) + ((Number(log.productPrice) || 0) * (Number(log.productQty) || 0));
                          
                          return (
                            <tr key={log.id} className="hover:bg-amber-50/10 transition-all font-black">
                              <td className="px-10 py-8">
                                <div className="font-black text-slate-800 text-lg mb-1 leading-tight flex items-center gap-2">
                                  {logQueryType !== 'date' && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded border border-indigo-100 font-mono tracking-tighter">{log.date?.slice(5)}</span>}
                                  <span>{log.customerName}</span>
                                  {isActivityLog && !log.specialEventType && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded border border-indigo-700 italic font-sans tracking-widest ml-1">專案活動</span>}
                                  {log.specialEventType && <span className="text-[10px] bg-fuchsia-600 text-white px-2 py-0.5 rounded border border-fuchsia-700 italic font-sans tracking-widest ml-1">{log.specialEventType}</span>}
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] mt-1">
                                  {payer && payer.name !== log.customerName && <div className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 italic flex items-center gap-1 w-fit"><LinkIcon size={10}/> 代扣：{payer.name}</div>}
                                  <div className="flex items-center flex-wrap gap-2 text-slate-400">
                                    <Clock size={10}/> <span>{log.sessionTime || '--:--'}</span> 
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border text-slate-500 flex items-center gap-1">
                                      {log.employeeId === 'COMPANY_REVENUE' ? '🏢 公司營收' : `教：${receiverCoach?.name || '未知'}`}
                                      {log.classDuration === 'athlete_buy' && <span className="text-amber-600 font-black">(純購課儲值)</span>}
                                      {(log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy') && <span className="text-amber-600 font-black">({log.classDuration.split('_')[1]})</span>}
                                      {log.classDuration === '60min' && <span className="text-indigo-500 font-black">60m</span>}
                                      {log.classDuration === '120min' && <span className="text-indigo-500 font-black">120m</span>}
                                      {log.classDuration === '150min' && <span className="text-indigo-500 font-black">150m</span>}
                                      {log.classDuration === 'overtime30min' && <span className="text-rose-500 font-black">加時30m(舊)</span>}
                                      {log.classDuration === 'overtime60min' && <span className="text-rose-500 font-black">加時60m(舊)</span>}
                                    </span> 
                                    <span className={`px-2 py-0.5 rounded border ${log.paymentMethod === '轉帳' ? 'text-blue-600 bg-blue-50 border-blue-100' : log.paymentMethod === '代扣' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>[{log.paymentMethod}]</span>
                                    {Number(log.salesAthlete) > 0 && log.purchaseDate && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">買課:{log.purchaseDate.slice(5)}</span>}
                                  </div>
                                </div>
                              </td>
                              {userRole === 'boss' && <td className="px-6 py-8 text-center text-lg font-mono text-slate-500">${revenue.toLocaleString()}</td>}
                              <td className="px-10 py-8 text-center">
                                {log.referralSourceId && log.referralSourceId !== log.employeeId ? (
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100">
                                      <span className="text-sky-700 text-[10px]">{referrerCoach?.name}</span>
                                      <ArrowRight size={10} className="text-sky-300"/>
                                      <span className="text-rose-600 text-[10px]">{receiverCoach?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[8px] text-slate-400 uppercase">跨月累計</span>
                                      {referralData[log.id] && (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black whitespace-nowrap shadow-sm ${referralData[log.id].eligibleClasses > 0 ? 'bg-amber-100 text-amber-700 border-amber-400' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                          {referralData[log.id].eligibleClasses > 0 ? `🤝 轉介紀錄 (${referralData[log.id].seqString})` : `⛔ 已達10堂上限`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : <span className="text-slate-200">---</span>}
                              </td>
                              <td className="px-8 py-8 text-center text-emerald-600 font-mono text-2xl tracking-tighter">
                                ${b.total.toLocaleString()}
                                {b.eventSupportPay > 0 && <div className="text-[10px] text-fuchsia-500 mt-1 uppercase tracking-widest bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-100 w-fit mx-auto">不固定薪資 +${b.eventSupportPay}</div>}
                              </td>
                              <td className="px-10 py-8 text-right"><button onClick={() => setEditingLog(log)} className="p-3 text-slate-300 hover:text-amber-600 transition-colors"><Edit2 size={20} /></button><button onClick={() => triggerDeleteLog(log)} className="p-3 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button></td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && userRole === 'boss' && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden font-black animate-in fade-in">
             <div className="p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-6">
              <div className="flex items-center gap-6"><h2 className="text-4xl font-black italic underline decoration-amber-500 underline-offset-8 uppercase text-slate-800">Payroll Summary</h2><div className="flex items-center gap-2 bg-amber-600 px-5 py-2.5 rounded-2xl text-white shadow-xl"><Calendar size={18} /><input type="month" className="bg-transparent border-none outline-none text-white font-mono" value={summaryMonth} onChange={(e) => setSummaryMonth(e.target.value)} /></div></div>
              <button onClick={handleExportSummary} className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 active:scale-95 shadow-2xl transition"><Download size={24} /> 導出 Excel (CSV)</button>
            </div>
            <div className="overflow-x-auto text-sm text-slate-600 font-black">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                  <tr><th className="px-12 py-10">教練姓名</th><th className="px-8 py-10 text-center">類型 / 底薪扣款</th><th className="px-8 py-10 text-center">月總堂數</th><th className="px-8 py-10 text-center text-amber-600">推銷獎金</th><th className="px-8 py-10 text-center text-sky-400">轉介獎勵</th><th className="px-8 py-10 text-center text-fuchsia-500">不固定薪資</th><th className="px-12 py-10 text-right">實領總計</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const p = calculateSettlement(emp.id, summaryMonth);
                    if (!p) return null;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-all font-black">
                        <td className="px-12 py-12">
                          <button onClick={() => setSelectedCoachForDetails(emp)} className="text-2xl tracking-tighter text-slate-800 hover:text-amber-600 hover:underline decoration-amber-400 underline-offset-4 transition-all active:scale-95 text-left outline-none flex items-center gap-2">
                            {emp.name} <Search size={14} className="text-slate-300"/>
                          </button>
                        </td>
                        <td className="px-8 py-12 text-center">
                          <span className={`text-[10px] px-3 py-1 rounded-lg text-white font-black ${emp.type?.startsWith('formal') ? 'bg-amber-600' : (emp.type?.startsWith('temp') ? 'bg-slate-400' : (emp.type?.startsWith('probation') ? 'bg-sky-500' : 'bg-indigo-500'))}`}>{p.typeLabel}</span>
                          {(emp.isBossNoPay || emp.name === '顏秀如') && <span className="block mt-2 text-[9px] text-rose-500 font-black tracking-widest bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">負責人(無底薪)</span>}
                          {p.leaveDeduction > 0 && <span className="block mt-2 text-[9px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded">請假扣薪 -${p.leaveDeduction.toLocaleString()}</span>}
                        </td>
                        <td className="px-8 py-12 text-center text-4xl font-mono text-slate-800">{formatClasses(p.totalClasses)}</td>
            <td className="px-8 py-12 text-center text-2xl font-mono text-amber-600">${p.totalBonus.toLocaleString()}</td>
            <td className="px-8 py-12 text-center text-2xl font-mono text-sky-500">
              ${p.totalRef.toLocaleString()}
              {p.totalRef > 0 && <div className="text-[10px] text-sky-600 bg-sky-50 px-2 py-1 rounded-lg mt-2 w-fit mx-auto font-sans font-black tracking-widest border border-sky-100">💰 轉介 {(p.totalRef / 100)} 堂</div>}
            </td>
            <td className="px-8 py-12 text-center text-2xl font-mono text-fuchsia-500">${p.totalEventSupport.toLocaleString()}</td>
            <td className="px-12 py-12 text-right"> <div className="bg-amber-600 text-white px-10 py-6 rounded-[2.5rem] font-black text-4xl shadow-2xl tracking-tighter font-mono">${(p.grossSalary || 0).toLocaleString()}</div> </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in zoom-in font-black">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-200 h-fit">
                <h2 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800 italic underline decoration-amber-500">學員資料建檔</h2>
                <form onSubmit={handleAddCustomer} className="space-y-6">
                  <input type="text" required placeholder="學員姓名" className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-xl font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" value={newCust.name} onChange={(e) => setNewCust({...newCust, name: e.target.value})} />
                  
                  <div className="flex flex-col gap-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-amber-300 text-amber-600" checked={newCust.isAthleteProjectMember} onChange={(e) => setNewCust({...newCust, isAthleteProjectMember: e.target.checked})} />
                      <span className="text-sm text-amber-700 font-black flex items-center gap-1"><Landmark size={16}/> 運動員專案成員</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-fuchsia-300 text-fuchsia-600" checked={newCust.isSpecialEventMember} onChange={(e) => setNewCust({...newCust, isSpecialEventMember: e.target.checked})} />
                      <span className="text-sm text-fuchsia-700 font-black flex items-center gap-1"><Gift size={16}/> 特別專案活動來源</span>
                    </label>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                    <p className="text-[10px] text-slate-400 pl-2 uppercase font-black tracking-widest">性別</p>
                    <div className="flex gap-2">{['男', '女', '不透露'].map(g => (<button key={g} type="button" onClick={() => setNewCust({...newCust, gender: g})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newCust.gender === g ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>{g}</button>))}</div>
                  </div>

                  {newCust.customerType !== 'activity' && (
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="生日 MM/DD" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none text-slate-700 shadow-inner" value={newCust.birthday} onChange={(e) => setNewCust({...newCust, birthday: e.target.value})} />
                      <input type="text" placeholder="職業" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none text-slate-700 shadow-inner" value={newCust.occupation} onChange={(e) => setNewCust({...newCust, occupation: e.target.value})} />
                    </div>
                  )}
                  
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100 shadow-inner">
                    <p className="text-[10px] text-amber-600 uppercase font-black italic tracking-widest flex items-center gap-2"><Briefcase size={14}/> {newCust.customerType === 'activity' ? '專案負責/開發教練' : '開發與介紹鏈結'}</p>
                    <div className="space-y-1"><p className="text-[9px] text-slate-400 pl-1">主要開發教練 (Developer)</p><select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none shadow-sm" value={newCust.referrerId} onChange={(e) => setNewCust({...newCust, referrerId: e.target.value})}><option value="">-- 無固定開發教練 --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} 教練</option>)}</select></div>
                    {newCust.customerType !== 'activity' && (
                      <div className="space-y-1"><p className="text-[9px] text-slate-400 pl-1">介紹學員 (Referral)</p><select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none shadow-sm" value={newCust.referredByCustomerId} onChange={(e) => setNewCust({...newCust, referredByCustomerId: e.target.value})}><option value="">-- 直接客戶 (無介紹) --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    )}
                  </div>
                  <div className="space-y-2"><p className="text-[10px] text-slate-400 pl-4 uppercase tracking-widest">{newCust.customerType === 'activity' ? '預設包班/專案堂數' : '當前課堂餘額'}</p><input type="number" placeholder="餘額/總堂數" className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-xl font-black text-amber-600 outline-none shadow-inner" value={newCust.remaining} onChange={(e) => setNewCust({...newCust, remaining: e.target.value})} /></div>
                  <button type="submit" className={`w-full text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl transition active:scale-95 tracking-widest ${newCust.customerType === 'activity' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-600 hover:bg-amber-700'}`}>建檔存入</button>
                </form>
             </div>
             <div className="xl:col-span-2 flex flex-col gap-6 font-black">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
                   <UserSearch className="text-amber-500" size={24}/>
                   <input type="text" placeholder="搜尋學員姓名觀看個人資料與剩餘堂數..." className="w-full bg-transparent border-none outline-none font-black text-lg text-slate-700 placeholder:text-slate-300" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase())).sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(c => {
                    const introBy = customers.find(prev => prev.id === c.referredByCustomerId);
                    const coachBy = employees.find(e => e.id === c.referrerId);
                    return (
                      <div key={c.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 hover:border-amber-500/50 transition-all group flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <button onClick={() => setSelectedCustomerForDetails(c)} className="text-3xl font-black tracking-tighter mb-2 text-slate-800 leading-none hover:text-amber-600 hover:underline decoration-amber-400 flex items-center gap-2 text-left outline-none transition-all active:scale-95">
                              {c.name} <Search size={20} className="text-slate-300" />
                            </button>
                            <div className="flex flex-wrap gap-2 text-[9px] font-black tracking-widest text-slate-400 uppercase mt-2">
                               {c.isAthleteProjectMember && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1"><Landmark size={10}/> 運動員專案</span>}
                               {c.isSpecialEventMember && <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded border border-fuchsia-200 flex items-center gap-1"><Gift size={10}/> 特別活動來源</span>}
                               {c.customerType === 'activity' ? (
                                  <span className="bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded border border-indigo-100">🏢 專案活動 (不計抽成)</span>
                               ) : (
                                  <>
                                    <span className={`px-2 py-0.5 rounded border ${c.gender === '男' ? 'bg-blue-50 text-blue-500 border-blue-100' : c.gender === '女' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{c.gender || '不透露'}</span>
                                    {c.occupation && <span className="bg-slate-100 px-2 py-0.5 rounded">{c.occupation}</span>}
                                    {c.birthday && <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded flex items-center gap-1 font-mono font-black tracking-tighter"><Cake size={10}/> {c.birthday}</span>}
                                  </>
                               )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => setEditingCustomer(c)} className="p-3 text-slate-300 hover:text-indigo-600 active:scale-75 bg-slate-50 md:bg-transparent rounded-full"><Edit2 size={24}/></button><button onClick={() => triggerDeleteCustomer(c)} className="p-3 text-slate-300 hover:text-rose-600 active:scale-75"><Trash2 size={24}/></button></div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 mb-6"><div className="flex justify-between items-center mb-1 font-mono font-black tracking-widest"><span className="text-[10px] text-slate-400 uppercase">餘額/總數</span><span className={`text-4xl font-black ${Number(c.remaining) < 3 ? 'text-rose-500' : 'text-amber-600'}`}>{c.remaining}</span></div><div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-3"><div className="h-full bg-amber-500 transition-all shadow-sm" style={{width: `${Math.min(100, (Number(c.remaining) / 20) * 100)}%`}}></div></div></div>
                        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400 italic font-black uppercase">{coachBy && <p className="flex items-center gap-1.5"><UserCheck size={12} className="text-emerald-500"/> 開發教練: {coachBy.name}</p>}{introBy && <p className="flex items-center gap-1.5"><Share2 size={12} className="text-sky-500"/> 介紹人: {introBy.name}</p>}</div>
                      </div>
                    );
                  })}
                  {customers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                    <div className="col-span-full p-10 text-center text-slate-400 font-black">找不到符合「{customerSearch}」的學員。</div>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'employees' && userRole === 'boss' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in font-black">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-200">
                <h2 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800 italic underline decoration-amber-500">教練管理系統</h2>
                <form onSubmit={handleAddEmployee} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'formalA'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'formalA' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>正式 A</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'formalB'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'formalB' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>正式 B</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'tempA'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'tempA' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>承攬 A</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'tempB'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'tempB' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>承攬 B</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'probationA'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'probationA' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>實習 A</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'probationB'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all ${newEmp.type === 'probationB' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>實習 B</button>
                    <button type="button" onClick={() => setNewEmp({...newEmp, type: 'project'})} className={`py-4 px-2 rounded-[1.5rem] text-xs font-black transition-all col-span-2 md:col-span-3 xl:col-span-2 ${newEmp.type === 'project' ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>專案技能 (自訂職稱)</button>
                  </div>
                  
                  {newEmp.type === 'project' && (
                     <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 animate-in fade-in">
                       <input type="text" placeholder="請輸入專案工作職稱" className="w-full bg-white border border-amber-200 rounded-xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" value={newEmp.projectTitle || ''} onChange={(e) => setNewEmp({...newEmp, projectTitle: e.target.value})} />
                     </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" required placeholder="教練姓名" className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-xl font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" value={newEmp.name} onChange={(e) => setNewEmp({...newEmp, name: e.target.value})} />
                    <input type="number" placeholder="固定底薪(若不填將帶入預設)" className="md:w-1/3 bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 text-xl font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-indigo-600 placeholder:text-slate-300" value={newEmp.baseSalary || ''} onChange={(e) => setNewEmp({...newEmp, baseSalary: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1">
                       <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">入職日</p>
                       <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-slate-600" value={newEmp.startDate || ''} onChange={(e) => setNewEmp({...newEmp, startDate: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                       <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">轉正/轉兼職日期 (選填)</p>
                       <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-slate-600" value={newEmp.promotionDate || ''} onChange={(e) => setNewEmp({...newEmp, promotionDate: e.target.value})} />
                     </div>
                     {newEmp.promotionDate && (
                       <div className="space-y-1">
                         <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">轉正前職位</p>
                         <select className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 text-sm font-black outline-none focus:ring-2 focus:ring-amber-500 shadow-inner text-slate-600" value={newEmp.prePromotionType || ''} onChange={(e) => setNewEmp({...newEmp, prePromotionType: e.target.value})}>
                           <option value="">-- 請選擇前職位 --</option>
                           <option value="probationA">實習 A</option>
                           <option value="probationB">實習 B</option>
                           <option value="tempA">承攬 A</option>
                           <option value="tempB">承攬 B</option>
                         </select>
                       </div>
                     )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pl-2">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-amber-600" checked={newEmp.isBossNoPay || false} onChange={(e) => setNewEmp({...newEmp, isBossNoPay: e.target.checked})} />
                    <span className="text-sm text-slate-600 font-black">設為負責人 (免固定底薪，但保留抽成/獎金/勞健保等正常計算)</span>
                  </label>
                  <button type="submit" className="w-full bg-amber-600 text-white py-7 rounded-[3rem] font-black text-2xl shadow-xl hover:bg-amber-500 active:scale-95 transition tracking-widest">建立團隊檔案</button>
                </form>
             </div>

             {/* 職位條件說明面板 */}
             <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-200 font-sans">
               <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800 tracking-tighter">
                 <Info size={28} className="text-sky-500" /> 各職位薪資與抽成條件備忘錄
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-auto bg-slate-100 px-3 py-1 rounded-xl">系統內建邏輯 (如需修改請通知 AI)</span>
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 
                 {/* 正式教練 */}
                 <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex flex-col gap-3">
                   <h4 className="text-lg font-black text-amber-800 border-b border-amber-200/50 pb-2">🎖️ 正式教練 (Formal)</h4>
                   <div className="space-y-4 text-xs text-amber-900/80">
                     <div>
                       <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded mr-2">正式 A</span>
                       預設底薪 $32,000。
                       <p className="mt-1">✅ 需打卡請假 (勞基法)。基本門檻 35 堂 (隨年資遞減)。</p>
                       <ul className="list-disc pl-4 mt-1 font-mono tracking-tighter">
                         <li>36 ~ 45 堂：40%</li>
                         <li>46 ~ 55 堂：42%</li>
                         <li>56 ~ 65 堂：46%</li>
                         <li>66 ~ 75 堂：48%</li>
                         <li>76 堂以上：50%</li>
                       </ul>
                     </div>
                     <div className="border-t border-amber-200/50 pt-3">
                       <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded mr-2">正式 B</span>
                       預設底薪 $32,000 (含行政津貼)。
                       <p className="mt-1">✅ 需打卡請假。基本門檻 25 堂 (隨年資遞減)。</p>
                       <ul className="list-disc pl-4 mt-1 font-mono tracking-tighter">
                         <li>26 ~ 45 堂：36%</li>
                         <li>46 ~ 55 堂：38%</li>
                         <li>56 ~ 65 堂：42%</li>
                         <li>66 ~ 75 堂：44%</li>
                         <li>76 堂以上：46%</li>
                       </ul>
                     </div>
                   </div>
                 </div>

                 {/* 承攬教練 */}
                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-3">
                   <h4 className="text-lg font-black text-slate-700 border-b border-slate-200 pb-2">🤝 承攬教練 (Temp)</h4>
                   <div className="space-y-4 text-xs text-slate-600">
                     <p className="italic text-rose-500 font-black mb-2">⚠ 免打卡、免線上請假，無底薪，無基本堂數門檻。</p>
                     <div>
                       <span className="font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded mr-2">承攬 A</span>
                       <p className="mt-1">採固定高抽成制，每堂課皆抽取課費之 <strong className="font-mono text-sm text-slate-800">44%</strong>。</p>
                     </div>
                     <div className="border-t border-slate-200 pt-3">
                       <span className="font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded mr-2">承攬 B</span>
                       <p className="mt-1">採固定高抽成制，每堂課皆抽取課費之 <strong className="font-mono text-sm text-slate-800">40%</strong>。</p>
                     </div>
                   </div>
                 </div>

                 {/* 實習與專案 */}
                 <div className="bg-sky-50/50 p-6 rounded-[2rem] border border-sky-100 flex flex-col gap-3">
                   <h4 className="text-lg font-black text-sky-800 border-b border-sky-200/50 pb-2">🌱 實習與其他 (Probation)</h4>
                   <div className="space-y-4 text-xs text-sky-900/80">
                     <p className="italic text-sky-600 font-black mb-2">✅ 需打卡請假 (受勞基法規範)。無預設底薪。</p>
                     <div>
                       <span className="font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded mr-2">實習 A</span>
                       <p className="mt-1">無底薪。每堂課採固定費率 <strong className="font-mono text-sm text-sky-800">$1,000</strong>。</p>
                     </div>
                     <div className="border-t border-sky-200/50 pt-3">
                       <span className="font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded mr-2">實習 B</span>
                       <p className="mt-1">無底薪。依累計堂數階梯抽成：</p>
                       <ul className="list-disc pl-4 mt-1 font-mono tracking-tighter">
                         <li>1 ~ 20 堂：30%</li>
                         <li>21 ~ 30 堂：32%</li>
                         <li>31 ~ 40 堂：34%</li>
                         <li>41 堂以上：36%</li>
                       </ul>
                     </div>
                     <div className="border-t border-sky-200/50 pt-3">
                       <span className="font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded mr-2">專案技能</span>
                       <p className="mt-1">自訂職稱。抽成規則與底薪由老闆透過後台手動輸入與指派額外獎金。</p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             <div className="space-y-4">
                {employees.sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(emp => (
                  <div key={emp.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex justify-between items-center group font-black">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${emp.type?.startsWith('formal') ? 'bg-amber-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>{emp.name?.[0]}</div>
                      <div>
                        <h4 className="text-2xl font-black leading-none text-slate-800 flex items-center gap-3">
                          {emp.name}
                          {(emp.isBossNoPay || emp.name === '顏秀如') && <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-200 px-2 py-1 rounded-lg tracking-widest leading-none">負責人</span>}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-1 italic tracking-widest flex items-center flex-wrap gap-2">
                           <span>{getCoachTypeLabel(emp.type)} {emp.type === 'project' && emp.projectTitle && `(${emp.projectTitle})`}</span>
                           {emp.startDate && <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans text-[10px]">入職: {emp.startDate}</span>}
                           {((emp.baseSalary !== undefined && emp.baseSalary !== '') || getBaseSalaryDefaults(emp.type) > 0) && <span className="bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-sans text-[10px]">底薪 ${(emp.baseSalary !== undefined && emp.baseSalary !== '' ? Number(emp.baseSalary) : getBaseSalaryDefaults(emp.type)).toLocaleString()}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all font-black"><button onClick={() => setEditingEmployee(emp)} className="p-4 text-slate-300 hover:text-amber-600"><Edit2 size={24}/></button><button onClick={() => triggerDeleteEmployee(emp)} className="p-4 text-slate-300 hover:text-rose-500"><Trash2 size={24}/></button></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'settings' && userRole === 'boss' && (
          <div className="max-w-4xl mx-auto animate-in zoom-in font-black">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-200">
                <div className="flex items-center gap-4 mb-4"><div className="bg-slate-900 p-4 rounded-3xl text-white shadow-lg"><Settings2 size={32} /></div><h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest italic underline decoration-amber-500">系統資料庫遷移</h2></div>
                <p className="text-slate-400 text-xs mb-10 tracking-widest leading-relaxed">跨版本數據匯入/匯出。請先匯出 JSON 備份檔，再至新系統匯入即可完成資料遷移。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 flex flex-col items-center justify-center text-center gap-4 shadow-inner"><FileJson size={48} className="text-amber-500" /><h3 className="text-xl font-black text-amber-800">1. 下載舊版備份</h3><button onClick={handleExportDatabase} className="w-full bg-amber-600 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-amber-700 active:scale-95 flex items-center justify-center gap-2"><Download size={20} /> 匯出資料庫</button></div>
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-center text-center gap-4 shadow-inner relative"><Upload size={48} className="text-slate-400" /><h3 className="text-xl font-black text-slate-700">2. 匯入新版系統</h3><input type="file" id="db-upload" accept=".json" className="hidden" onChange={handleImportDatabase} /><label htmlFor="db-upload" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-xl hover:bg-slate-800 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"><Upload size={20} /> 選擇檔案匯入</label></div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'finance' && userRole === 'boss' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex flex-col xl:flex-row justify-between items-center gap-6">
              <div className="flex gap-2 overflow-x-auto w-full xl:w-auto p-1 bg-slate-50 rounded-2xl shadow-inner border border-slate-100">
                {[
                  { id: 'overview', label: '總覽/P&L', icon: BarChart3 },
                  { id: 'payroll', label: '薪資/稅務', icon: DollarSign },
                  { id: 'coach', label: '教練貢獻', icon: TrendingUp },
                  { id: 'customer', label: '資產餘額', icon: Users },
                  { id: 'risk', label: '風控/對帳', icon: ShieldAlert }
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveFinanceTab(t.id)} className={`px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeFinanceTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                    <t.icon size={16}/> {t.label}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner font-mono text-sm">
                  <div className="px-3 py-2 border-r border-slate-200 text-slate-400 font-black flex items-center gap-1 bg-white"><Calendar size={14}/>起</div>
                  <input type="date" className="bg-transparent px-3 py-2 outline-none text-slate-700" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                  <div className="px-3 py-2 border-x border-slate-200 text-slate-400 font-black bg-white">訖</div>
                  <input type="date" className="bg-transparent px-3 py-2 outline-none text-slate-700" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                </div>
                
                <div className="flex gap-2">
                  <button onClick={handleExportSettings} title="下載參數設定檔" className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-amber-600 hover:border-amber-200 transition-colors shadow-sm"><Save size={18}/></button>
                  <label title="還原參數設定檔" className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer shadow-sm"><Settings size={18}/><input type="file" accept=".json" className="hidden" onChange={handleImportSettings} /></label>
                </div>
              </div>
            </div>

            {activeFinanceTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 col-span-2 md:col-span-1 flex flex-col justify-center text-center">
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">區間含稅總營收</div>
                    <div className="text-3xl font-black text-slate-800 font-mono">${analyzedData.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 col-span-2 md:col-span-1 flex flex-col justify-center text-center">
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">區間消耗堂數</div>
                    <div className="text-3xl font-black text-indigo-600 font-mono">{formatClasses(analyzedData.totalClassesGlobal)} <span className="text-base font-sans tracking-tighter">堂</span></div>
                  </div>
                  <div className="bg-indigo-50 p-8 rounded-[2.5rem] shadow-sm border border-indigo-100 col-span-2 md:col-span-2 relative overflow-hidden flex flex-col justify-center">
                    <div className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={14}/> 預收未上課總堂數 (即時)</div>
                    <div className="text-4xl font-black text-indigo-700 font-mono">{analyzedData.totalUnusedClasses} <span className="text-base font-sans tracking-tighter">堂</span></div>
                  </div>
                  <div className="bg-rose-50 p-8 rounded-[2.5rem] shadow-sm border border-rose-100 col-span-2 md:col-span-2 relative overflow-hidden flex flex-col justify-center">
                    <div className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"><AlertCircle size={14}/> 預收帳款餘額負債 (即時)</div>
                    <div className="text-4xl font-black text-rose-700 font-mono">${analyzedData.totalUnearnedRevenue.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button onClick={handleGenerateFinanceInsight} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[2rem] font-black text-lg shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-3">
                    <Sparkles size={24} className="text-indigo-200" />
                    一鍵生成 AI 營運診斷與建議
                  </button>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                  <h3 className="text-2xl font-black mb-8 flex items-center text-slate-800 tracking-tighter"><Building size={24} className="mr-3 text-amber-600" /> 營運成本與業外收入設定</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-inner">
                      <label className="text-[10px] font-black text-emerald-700 flex items-center mb-3 uppercase tracking-widest"><PlusCircle size={14} className="mr-1" /> 業外收入</label>
                      <input type="number" value={extraRevenue} onChange={e => setExtraRevenue(e.target.value)} className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-right font-black font-mono text-lg shadow-sm outline-none" />
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-inner">
                      <label className="text-[10px] font-black text-rose-700 flex items-center mb-3 uppercase tracking-widest"><MinusCircle size={14} className="mr-1" /> 租金支出</label>
                      <input type="number" value={operatingCosts.rent} onChange={e => setOperatingCosts({...operatingCosts, rent: e.target.value})} className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-right font-black font-mono text-lg shadow-sm outline-none" />
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-inner">
                      <label className="text-[10px] font-black text-rose-700 flex items-center mb-3 uppercase tracking-widest"><MinusCircle size={14} className="mr-1" /> 水電瓦斯</label>
                      <input type="number" value={operatingCosts.utilities} onChange={e => setOperatingCosts({...operatingCosts, utilities: e.target.value})} className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-right font-black font-mono text-lg shadow-sm outline-none" />
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-inner">
                      <label className="text-[10px] font-black text-rose-700 flex items-center mb-3 uppercase tracking-widest"><MinusCircle size={14} className="mr-1" /> 行銷廣告</label>
                      <input type="number" value={operatingCosts.marketing} onChange={e => setOperatingCosts({...operatingCosts, marketing: e.target.value})} className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-right font-black font-mono text-lg shadow-sm outline-none" />
                    </div>
                    <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 shadow-inner">
                      <label className="text-[10px] font-black text-rose-700 flex items-center mb-3 uppercase tracking-widest"><MinusCircle size={14} className="mr-1" /> 其他雜支</label>
                      <input type="number" value={operatingCosts.misc} onChange={e => setOperatingCosts({...operatingCosts, misc: e.target.value})} className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl text-right font-black font-mono text-lg shadow-sm outline-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-white">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={160} /></div>
                  <h3 className="text-2xl font-black mb-10 flex items-center text-amber-400 tracking-tighter relative z-10"><Briefcase size={24} className="mr-3" /> 築動運動企業 - P&L 損益試算表</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 mb-8">
                    <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">淨營收 (未稅)</div>
                      <div className="text-2xl font-black font-mono">${analyzedData.companyNetRevenue.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-500 mt-2 tracking-widest uppercase">扣除銷項稅額 ${analyzedData.companyVatPayable.toLocaleString()}</div>
                    </div>
                    <div className="bg-rose-500/20 p-6 rounded-[2rem] border border-rose-500/30">
                      <div className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-2">直接人事成本</div>
                      <div className="text-2xl font-black text-rose-300 font-mono">-${analyzedData.totalPayrollCorpCost.toLocaleString()}</div>
                      <div className="text-[9px] text-rose-500 mt-2 tracking-widest uppercase">薪資+勞健退+發票稅</div>
                    </div>
                    <div className="bg-emerald-500/20 p-6 rounded-[2rem] border border-emerald-500/30">
                      <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">營業毛利 Gross Profit</div>
                      <div className="text-2xl font-black text-emerald-300 font-mono">${analyzedData.companyGrossProfit.toLocaleString()}</div>
                      <div className="text-[9px] text-emerald-500 mt-2 tracking-widest uppercase">淨營收 - 人事成本</div>
                    </div>
                    <div className="bg-orange-500/20 p-6 rounded-[2rem] border border-orange-500/30">
                      <div className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">營業費用 OPEX</div>
                      <div className="text-2xl font-black text-orange-300 font-mono">-${analyzedData.totalOpCosts.toLocaleString()}</div>
                      <div className="text-[9px] text-orange-500 mt-2 tracking-widest uppercase">固費 + 員工請款報帳 ${analyzedData.approvedExpensesTotal.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pt-8 border-t border-white/10">
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                      <div className="text-sky-400 text-[10px] font-black uppercase tracking-widest mb-2">營業利益 Operating Profit</div>
                      <div className="text-4xl font-black text-sky-300 font-mono">${analyzedData.companyOperatingProfit.toLocaleString()}</div>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">預估營所稅 20%</div>
                      <div className="text-4xl font-black text-slate-300 font-mono">-${analyzedData.companyEstimatedIncomeTax.toLocaleString()}</div>
                    </div>
                    <div className="bg-amber-600 p-8 rounded-[2.5rem] shadow-2xl">
                      <div className="text-amber-200 text-[10px] font-black uppercase tracking-widest mb-2">稅後淨利 Net Income</div>
                      <div className="text-5xl font-black text-white font-mono">${analyzedData.companyNetIncome.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFinanceTab === 'payroll' && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button onClick={handleExportAdvancedCSV} className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] shadow-xl font-black tracking-widest text-xs uppercase transition active:scale-95"><Download size={16} className="mr-2" /> 匯出薪資明細 (CSV)</button>
                </div>
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden font-black">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="p-6 sticky left-0 bg-slate-50 shadow-[1px_0_0_0_#f1f5f9] z-10">員工姓名</th>
                          <th className="p-6">設定/型態</th>
                          <th className="p-6 text-right text-indigo-500">自訂底薪</th>
                          <th className="p-6 text-right text-amber-500">課費抽成總計</th>
                          <th className="p-6 text-right text-emerald-500">賣課獎金</th>
                          <th className="p-6 text-right text-sky-500">轉介獎勵</th>
                          <th className="p-6 text-right text-fuchsia-500">不固定薪資</th>
                          <th className="p-6 text-right bg-slate-100 text-slate-800">應發(Gross)</th>
                          <th className="p-6 text-right text-rose-500">代扣稅/發票稅</th>
                          <th className="p-6 text-right text-rose-500">勞/健保(自)</th>
                          <th className="p-6 text-right bg-emerald-50 text-emerald-700 font-black text-sm">實發(Net)</th>
                          <th className="p-6 text-right border-l border-slate-200 text-slate-400">勞/健/退(公)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {analyzedData.payroll.map(coach => (
                          <tr key={coach.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-6 font-black text-base text-slate-800 sticky left-0 bg-white shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50 z-10">{coach.name}</td>
                            <td className="p-6">
                              <div className="flex flex-col gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-widest w-fit ${coach.type?.startsWith('formal') ? 'bg-amber-100 text-amber-700' : coach.type?.startsWith('temp') ? 'bg-slate-200 text-slate-600' : coach.type?.startsWith('probation') ? 'bg-sky-100 text-sky-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>{getCoachTypeLabel(coach.type)}</span>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input type="checkbox" checked={coach.isCompany} onChange={(e) => setCustomIsCompany(prev => ({...prev, [coach.id]: e.target.checked}))} className="rounded border-slate-300 text-indigo-600 w-3 h-3" />
                                  <span className="text-[10px] text-slate-500">開發票</span>
                                </label>
                              </div>
                            </td>
                            <td className="p-6 text-right"><input type="number" value={customBaseSalaries[coach.id] ?? ''} onChange={(e) => setCustomBaseSalaries(prev => ({...prev, [coach.id]: Number(e.target.value)}))} className="w-20 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-right outline-none font-mono text-indigo-700" /></td>
                <td className="p-6 text-right font-mono text-amber-600 font-black">${coach.classIncome.toLocaleString()}</td>
                <td className="p-6 text-right text-emerald-600 font-mono">{coach.salesBonus > 0 ? `$${coach.salesBonus.toLocaleString()}` : '-'}</td>
                <td className="p-6 text-right font-mono text-sky-500">
                  {coach.refBonus > 0 ? (
                    <div className="flex flex-col items-end">
                      <span>+${coach.refBonus.toLocaleString()}</span>
                      <span className="text-[9px] bg-sky-100 text-sky-600 px-1.5 py-0.5 rounded mt-1 font-sans font-black tracking-widest border border-sky-200">💰 轉介 {coach.referralClassesGenerated} 堂</span>
                    </div>
                  ) : '-'}
                </td>
                <td className="p-6 text-right text-fuchsia-500 font-mono">{coach.eventSupportPay > 0 ? `$${coach.eventSupportPay.toLocaleString()}` : '-'}</td>
                <td className="p-6 text-right bg-slate-100/50 font-mono text-sm">${coach.grossPay.toLocaleString()}</td>
                <td className="p-6 text-right font-mono text-rose-500">{coach.isCompany ? `+${coach.invoiceVat.toLocaleString()}` : (coach.tax > 0 ? `-${coach.tax.toLocaleString()}` : '-')}</td>
                            <td className="p-6 text-right text-rose-500 font-mono">-{coach.laborInsEmp + coach.healthInsEmp}</td>
                            <td className="p-6 text-right bg-emerald-50/80 text-emerald-600 font-mono text-lg">${coach.netPay.toLocaleString()}</td>
                            <td className="p-6 text-right border-l border-slate-100 font-mono text-slate-400">{coach.laborInsCorp + coach.healthInsCorp + coach.pensionCorp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeFinanceTab === 'coach' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-black">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                  <h3 className="text-xl mb-8 flex items-center text-slate-800 tracking-tighter"><TrendingUp size={24} className="mr-3 text-indigo-600"/> 授課堂數排行榜</h3>
                  <div className="space-y-6">
                    {[...analyzedData.payroll].sort((a,b) => b.totalClasses - a.totalClasses).map(coach => {
                      const max = Math.max(...analyzedData.payroll.map(c => c.totalClasses)) || 1;
                      const pct = `${(coach.totalClasses / max) * 100}%`;
                      return (
                        <div key={coach.id}>
                          <div className="flex justify-between text-sm mb-2"><span className="text-slate-700">{coach.name}</span><span className="font-mono text-indigo-600 text-lg">{formatClasses(coach.totalClasses)} 堂</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-500 h-full rounded-full transition-all shadow-sm" style={{ width: pct }}></div></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                  <h3 className="text-xl mb-8 flex items-center text-slate-800 tracking-tighter"><HandCoins size={24} className="mr-3 text-emerald-600"/> 銷售業績排行榜 (5堂/11堂包)</h3>
                  <div className="space-y-6">
                    {[...analyzedData.payroll].sort((a,b) => (b.totalSales5+b.totalSales10) - (a.totalSales5+a.totalSales10)).map(coach => {
                      const total = (coach.totalSales10 * 25000) + (coach.totalSales5 * 11500);
                      const max = Math.max(...analyzedData.payroll.map(c => (c.totalSales10*25000) + (c.totalSales5*11500))) || 1;
                      const pct = `${(total / max) * 100}%`;
                      return (
                        <div key={coach.id}>
                          <div className="flex justify-between text-sm mb-2"><span className="text-slate-700">{coach.name}</span><span className="font-mono text-emerald-600 text-lg">${total.toLocaleString()}</span></div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                             <div className="bg-emerald-500 h-full rounded-full transition-all shadow-sm" style={{ width: pct }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeFinanceTab === 'customer' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <p className="text-slate-400 text-sm font-black flex items-center gap-2"><Info size={16}/> 點擊欄位標題可進行排序</p>
                   <button onClick={handleExportAdvancedCSV} className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] shadow-xl font-black tracking-widest text-xs uppercase transition active:scale-95"><Download size={16} className="mr-2" /> 匯出資產餘額表 (CSV)</button>
                </div>
                <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden font-black">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs">
                      <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
                        <tr>
                          <th className="p-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestCustomerSort('name')}>
                             <div className="flex items-center gap-1">學員姓名 {customerSortConfig.key === 'name' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestCustomerSort('purchasedClasses')}>
                             <div className="flex items-center justify-end gap-1">區間購買堂數 {customerSortConfig.key === 'purchasedClasses' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-right cursor-pointer hover:bg-slate-100 transition-colors text-indigo-600" onClick={() => requestCustomerSort('usedClasses')}>
                             <div className="flex items-center justify-end gap-1">🏆 區間消耗(上課)堂數 {customerSortConfig.key === 'usedClasses' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-right text-slate-500 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestCustomerSort('remainingClasses')}>
                             <div className="flex items-center justify-end gap-1">即時剩餘總堂數 {customerSortConfig.key === 'remainingClasses' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-right text-rose-600 bg-rose-50/30 cursor-pointer hover:bg-rose-100/50 transition-colors" onClick={() => requestCustomerSort('remainingValue')}>
                             <div className="flex items-center justify-end gap-1">預估卡彈負債 {customerSortConfig.key === 'remainingValue' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-right border-l border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestCustomerSort('daysSinceLastClass')}>
                             <div className="flex items-center justify-end gap-1">距今未活動天數 {customerSortConfig.key === 'daysSinceLastClass' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                          <th className="p-6 text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestCustomerSort('lastDate')}>
                             <div className="flex items-center gap-1">最後活動日 {customerSortConfig.key === 'lastDate' && (customerSortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sortedTopCustomers.map(cus => (
                          <tr key={cus.id} className={`hover:bg-slate-50 transition-colors ${cus.isSleeper ? 'bg-rose-50/30' : ''}`}>
                            <td className="p-6 font-black text-sm flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${cus.isSleeper ? 'bg-rose-500 shadow-rose-200' : 'bg-slate-800 shadow-slate-200'} shadow-md`}>{cus.name[0]}</div>
                              {cus.name} {cus.isSleeper && <AlertCircle size={14} className="text-rose-500" />}
                            </td>
                            <td className="p-6 text-right font-mono">{formatClasses(cus.purchasedClasses)} 堂</td>
                            <td className="p-6 text-right font-mono text-indigo-600 text-lg font-black bg-indigo-50/10">{formatClasses(cus.usedClasses)} 堂</td>
                            <td className="p-6 text-right font-mono text-slate-600 bg-slate-50/10 text-base">{formatClasses(cus.remainingClasses)} 堂</td>
                            <td className="p-6 text-right font-mono text-rose-600 bg-rose-50/10 text-base">${cus.remainingValue.toLocaleString()}</td>
                            <td className={`p-6 text-right font-mono border-l border-slate-100 ${cus.isSleeper ? 'text-rose-600' : 'text-slate-400'}`}>{cus.daysSinceLastClass} 天</td>
                            <td className="p-6 font-mono text-slate-400">{cus.lastDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeFinanceTab === 'risk' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-black">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl mb-8 flex items-center text-slate-800 tracking-tighter"><CreditCard size={24} className="mr-3 text-sky-600"/> 金流對帳儀表板</h3>
                    <div className="space-y-6">
                      {Object.entries(analyzedData.paymentMethodsAmounts).map(([method, amount]) => {
                        const total = Object.values(analyzedData.paymentMethodsAmounts).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                        return (
                          <div key={method}>
                            <div className="flex justify-between text-sm mb-2"><span className="text-slate-700 uppercase tracking-widest">{method}</span><span className="font-mono text-sky-600 text-lg">${amount.toLocaleString()} ({pct}%)</span></div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-sky-500 h-full rounded-full transition-all shadow-sm" style={{ width: `${pct}%` }}></div></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">區間總實收對帳金額</span>
                    <span className="text-3xl font-black font-mono text-slate-800">${analyzedData.baseRevenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200">
                  <h3 className="text-xl mb-8 flex items-center text-slate-800 tracking-tighter"><Target size={24} className="mr-3 text-emerald-600"/> 專案與開發動能</h3>
                  <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 mb-8 shadow-inner">
                    <div className="text-emerald-700 text-[10px] uppercase tracking-widest mb-4">運動員專案 (Athlete) 產能</div>
                    <div className="flex justify-between items-end">
                      <div><span className="text-4xl font-black text-emerald-600 font-mono">{formatClasses(analyzedData.athleteProjectClasses)}</span><span className="text-xs text-emerald-600/70 ml-2">標準堂</span></div>
                      <div><span className="text-4xl font-black text-emerald-600 font-mono">${analyzedData.athleteProjectRevenue.toLocaleString()}</span><span className="text-xs text-emerald-600/70 ml-2">元</span></div>
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-4">推手教練 (帶來新轉介)</div>
                  <div className="space-y-4">
                    {[...analyzedData.payroll].filter(c => c.referralClassesGenerated > 0).sort((a,b) => b.referralClassesGenerated - a.referralClassesGenerated).map(coach => (
                      <div key={coach.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-slate-700 text-sm">{coach.name}</span>
                        <span className="text-indigo-600 font-mono bg-indigo-50 px-3 py-1 rounded-lg">推動 {coach.referralClassesGenerated} 堂</span>
                      </div>
                    ))}
                    {[...analyzedData.payroll].filter(c => c.referralClassesGenerated > 0).length === 0 && <p className="text-slate-300 text-xs italic">區間無轉介紀錄</p>}
                  </div>
                </div>

                <div className="bg-rose-50 p-10 rounded-[3rem] shadow-sm border border-rose-200 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl flex items-center text-rose-700 tracking-tighter"><Bell size={24} className="mr-3"/> 沉睡流失預警 (高風險)</h3>
                    <span className="bg-rose-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg">{analyzedData.sleeperCustomersCount} 位危險客</span>
                  </div>
                  <p className="text-xs text-rose-600/70 mb-6 leading-relaxed">以下學員帳上仍有剩餘堂數，但已經超過 <strong className="text-rose-700 text-sm mx-1">{CONFIG.sleeperDaysWarning}</strong> 天未進場活動。請盡速主叫聯繫，避免要求退費造成公司鉅額損失。</p>
                  <div className="overflow-x-auto bg-white rounded-[2rem] shadow-sm border border-rose-100 p-2">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="text-[10px] text-rose-400 uppercase tracking-widest border-b border-rose-50">
                        <tr><th className="p-4">學員姓名</th><th className="p-4 text-right">距今未上課</th><th className="p-4 text-right">卡彈餘額</th><th className="p-4 text-right">預估卡彈金額</th><th className="p-4 text-center">AI 召回助理</th></tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50 text-slate-700">
                        {analyzedData.topCustomers.filter(c => c.isSleeper).map(cus => (
                          <tr key={cus.id} className="hover:bg-rose-50/50 transition">
                            <td className="p-4 font-black text-sm">{cus.name}</td>
                            <td className="p-4 text-right font-mono font-black text-rose-600 text-base">{cus.daysSinceLastClass} 天</td>
                            <td className="p-4 text-right font-mono text-slate-500">{cus.remainingClasses} 堂</td>
                            <td className="p-4 text-right font-mono text-slate-500">${cus.remainingValue.toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleGenerateSleeperMessage(cus)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1 active:scale-95">
                                <MessageSquare size={12}/> 生成關心
                              </button>
                            </td>
                          </tr>
                        ))}
                        {analyzedData.topCustomers.filter(c => c.isSleeper).length === 0 && <tr><td colSpan="5" className="p-8 text-center text-emerald-500 font-black tracking-widest uppercase">太棒了！目前全數會員穩定消耗中。</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {confirmModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 font-black">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-12 border border-slate-200 text-center">
                <AlertTriangle size={80} className={`${confirmModal.type === 'danger' ? 'text-rose-500' : 'text-amber-500'} mb-8 mx-auto animate-pulse`} />
                <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase text-slate-800">{confirmModal.title}</h3>
                <p className="text-slate-500 mb-12 leading-relaxed">{confirmModal.message}</p>
                <div className="flex w-full gap-4"><button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-[2rem] font-black text-xl">取消返回</button><button onClick={async () => { await confirmModal.action(); setConfirmModal({ ...confirmModal, isOpen: false }); }} className={`flex-1 py-6 rounded-[2rem] font-black text-xl text-white active:scale-95 transition shadow-xl ${confirmModal.type === 'danger' ? 'bg-rose-600' : 'bg-amber-600'}`}>確定執行</button></div>
            </div>
          </div>
        )}

        {aiModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-black animate-in fade-in">
            <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl p-10 border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <button onClick={() => setAiModal({ isOpen: false, title: '', content: '', isLoading: false })} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all bg-slate-50 rounded-full p-2"><X size={20} /></button>
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-800 tracking-tighter">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Sparkles size={24} /></div>
                  {aiModal.title}
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[150px] relative">
                    {aiModal.isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-indigo-500 py-10">
                            <Loader2 className="animate-spin" size={36} />
                            <p className="text-sm tracking-widest uppercase">Gemini AI 生成中...</p>
                        </div>
                    ) : (
                        <div className="space-y-4 font-sans font-medium text-slate-700">
                            <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{aiModal.content}</div>
                            <button onClick={() => { navigator.clipboard.writeText(aiModal.content); alert("已複製到剪貼簿！"); }} className="absolute -bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-2 text-xs font-black tracking-widest">
                                <Copy size={14} /> 複製內容
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        )}

        {editingLog && (() => {
          const editingCustomerObj = customers.find(c => c.name?.trim().toLowerCase() === editingLog.customerName?.trim().toLowerCase());
          const isEditActivityProject = editingCustomerObj?.customerType === 'activity' || editingLog.specialEventType;
          const isEditNewAthlete = editingLog.classDuration?.startsWith('athlete_') && editingLog.classDuration !== 'athlete_buy';
          const isEditOldAthlete = editingLog.isAthleteProject && !isEditNewAthlete && editingLog.classDuration !== 'athlete_buy';
          return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-black">
             <div className="bg-white rounded-[3.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 relative border border-slate-200 font-sans">
                <button onClick={() => setEditingLog(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all font-black"><X size={32} /></button>
                <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-indigo-600 uppercase tracking-widest"><Edit2 size={32} /> 修改紀錄詳情</h3>
                <form onSubmit={handleUpdateLog} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 ml-1 uppercase">上課教練 / 營收項目</p>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" value={editingLog.employeeId} onChange={(e) => setEditingLog({...editingLog, employeeId: e.target.value})}>
                        {userRole === 'boss' && <option value="COMPANY_REVENUE">🏢 公司活動收入</option>}
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 ml-1 uppercase">上課日期</p>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none text-indigo-600" value={editingLog.date || ''} onChange={(e) => setEditingLog({...editingLog, date: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div className="space-y-1"><p className="text-[10px] text-slate-400 ml-1 uppercase">付款方式</p><select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.paymentMethod} onChange={(e) => setEditingLog({...editingLog, paymentMethod: e.target.value})}><option value="現金">現金</option><option value="轉帳">轉帳</option><option value="代扣">代扣</option></select></div>
                    <div className="space-y-1">
                       <p className="text-[10px] text-slate-400 ml-1 uppercase">課程長度 / 扣點</p>
                       {editingLog.isAthleteProject ? (
                           <div className="flex gap-2 w-full">
                             <div className="relative flex-1">
                                 <input type="number" step="30" min="30" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-amber-600 pl-14 outline-none" 
                                   value={editingLog.classDuration?.split('_')[1]?.replace('min','') || '90'} 
                                   onChange={(e) => {
                                     const mins = e.target.value;
                                     const pts = Math.max(1, Math.floor(Number(mins) / 30)).toString();
                                     setEditingLog({...editingLog, classDuration: `athlete_${mins}min`, classes: pts, classFee: 250});
                                 }} />
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black uppercase">分鐘數</span>
                             </div>
                             <div className="w-1/3 bg-slate-100 border border-slate-200 rounded-xl p-3 font-black text-amber-700 flex items-center justify-center">
                               扣 {editingLog.classes} 點
                             </div>
                           </div>
                       ) : (
                           <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-indigo-600" value={editingLog.classDuration || '90min'} onChange={(e) => setEditingLog({...editingLog, classDuration: e.target.value, classFee: e.target.value === '150min' ? 4300 : e.target.value === '120min' ? 3400 : (e.target.value === '60min' || e.target.value === 'overtime60min') ? 1800 : e.target.value === 'overtime30min' ? 900 : 2500})}>
                              <option value="90min">90 min 課程</option>
                              <option value="60min">60 min 課程</option>
                              <option value="120min">120 min 課程</option>
                              <option value="150min">150 min 課程</option>
                              {editingLog.classDuration === 'overtime30min' && <option value="overtime30min">加時 30 min (歷史)</option>}
                              {editingLog.classDuration === 'overtime60min' && <option value="overtime60min">加時 60 min (歷史)</option>}
                           </select>
                       )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div className="space-y-1">
                       <p className="text-[10px] text-slate-400 ml-1 uppercase">{(editingLog.employeeId === 'COMPANY_REVENUE' || isEditActivityProject) ? (editingLog.specialEventType === '進階體驗90min' ? '活動實收金額' : (editingLog.specialEventType?.startsWith('出差任務') ? '認列堂數 / 實收金額' : '活動實收金額 (元)')) : '堂數/點數'}</p>
                       {(editingLog.employeeId === 'COMPANY_REVENUE' || isEditActivityProject) ? (
                          editingLog.specialEventType === '進階體驗90min' ? (
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-black text-slate-500 flex items-center justify-center text-sm">
                              固定收費 $1000 (教練$500/教室$500)
                            </div>
                          ) : editingLog.specialEventType?.startsWith('出差任務') ? (
                            <div className="flex gap-2 w-full">
                              <input type="number" placeholder="堂數" className="w-1/3 bg-amber-50 border border-amber-200 rounded-xl p-3 font-black text-amber-600" value={editingLog.classes} onChange={(e) => setEditingLog({...editingLog, classes: e.target.value})} />
                              <input type="number" placeholder="公司收費" className="w-2/3 bg-slate-50 border border-indigo-200 rounded-xl p-3 font-black text-indigo-600" value={editingLog.companyRevenue || 0} onChange={(e) => setEditingLog({...editingLog, companyRevenue: e.target.value})} />
                            </div>
                          ) : (
                            <input type="number" className="w-full bg-slate-50 border border-indigo-200 rounded-xl p-3 font-black text-indigo-600" value={editingLog.companyRevenue || 0} onChange={(e) => setEditingLog({...editingLog, companyRevenue: e.target.value})} />
                          )
                       ) : (
                          <input type="number" disabled={editingLog.isAthleteProject} className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-indigo-600 ${editingLog.isAthleteProject ? 'opacity-50 cursor-not-allowed' : ''}`} value={editingLog.classes} onChange={(e) => setEditingLog({...editingLog, classes: e.target.value})} />
                       )}
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] text-fuchsia-500 font-black ml-1 uppercase">活動參與 / 出差費 / 不固定薪資 (元)</p>
                       <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.eventSupportPay || '0'} onChange={(e) => setEditingLog({...editingLog, eventSupportPay: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                    <div className="space-y-1"><p className="text-[10px] text-teal-500 font-black">商品名稱</p><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.productName || ''} onChange={(e) => setEditingLog({...editingLog, productName: e.target.value})} /></div>
                    <div className="space-y-1"><p className="text-[10px] text-teal-500 font-black">單價</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.productPrice || ''} onChange={(e) => setEditingLog({...editingLog, productPrice: e.target.value})} /></div>
                    <div className="space-y-1"><p className="text-[10px] text-teal-500 font-black">數量</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.productQty || ''} onChange={(e) => setEditingLog({...editingLog, productQty: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                    <div className="space-y-1"><p className="text-[10px] text-indigo-500 font-black">10+1 組數</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.sales10} onChange={(e) => setEditingLog({...editingLog, sales10: e.target.value})} /></div>
                    <div className="space-y-1"><p className="text-[10px] text-indigo-500 font-black">5 堂組數</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.sales5} onChange={(e) => setEditingLog({...editingLog, sales5: e.target.value})} /></div>
                    <div className="space-y-1"><p className="text-[10px] text-amber-500 font-black">運動員包</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-amber-600" value={editingLog.salesAthlete || '0'} onChange={(e) => setEditingLog({...editingLog, salesAthlete: e.target.value})} /></div>
                    <div className="space-y-1"><p className="text-[10px] text-amber-500 font-black">買課日期 (專案)</p><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black text-amber-600 text-xs" value={editingLog.purchaseDate || editingLog.date || ''} onChange={(e) => setEditingLog({...editingLog, purchaseDate: e.target.value})} /></div>
                  </div>
                  <div className="space-y-1 border-t border-slate-100 pt-6">
                    <p className="text-[10px] text-sky-500 font-black ml-1 uppercase">轉介來源教練</p>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black" value={editingLog.referralSourceId || ''} onChange={(e) => setEditingLog({...editingLog, referralSourceId: e.target.value})}>
                        <option value="">-- 無 --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition">儲存修改</button>
                </form>
             </div>
          </div>
          );
        })()}

        {editingCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-black">
             <div className="bg-white rounded-[3.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 relative border border-slate-200 font-sans">
                <button onClick={() => setEditingCustomer(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all font-black"><X size={32} /></button>
                <h3 className="text-3xl font-black mb-8 flex items-center gap-4 text-emerald-600 italic underline decoration-emerald-200"><UserCircle size={32} /> 修改詳細資料</h3>
                <form onSubmit={handleUpdateCustomer} className="space-y-5">
                  <div className="flex gap-2 mb-2 border-b border-slate-100 pb-4">
                    <button type="button" onClick={() => setEditingCustomer({...editingCustomer, customerType: 'person'})} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${editingCustomer.customerType !== 'activity' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>👤 一般學員</button>
                    <button type="button" onClick={() => setEditingCustomer({...editingCustomer, customerType: 'activity'})} className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all ${editingCustomer.customerType === 'activity' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>🏢 專案活動</button>
                  </div>
                  
                  <div className="flex flex-col gap-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-amber-300 text-amber-600" checked={editingCustomer.isAthleteProjectMember} onChange={(e) => setEditingCustomer({...editingCustomer, isAthleteProjectMember: e.target.checked})} />
                      <span className="text-sm text-amber-700 font-black flex items-center gap-1"><Landmark size={16}/> 標記為「運動員專案」成員</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded border-fuchsia-300 text-fuchsia-600" checked={editingCustomer.isSpecialEventMember} onChange={(e) => setEditingCustomer({...editingCustomer, isSpecialEventMember: e.target.checked})} />
                      <span className="text-sm text-fuchsia-700 font-black flex items-center gap-1"><Gift size={16}/> 標記為「特別專案活動」來源客</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2"><p className="text-[10px] text-slate-400 pl-2 uppercase">{editingCustomer.customerType === 'activity' ? '活動/專案名稱' : '姓名'}</p><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" value={editingCustomer.name} onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})} /></div>
                    {editingCustomer.customerType !== 'activity' && (
                       <div><p className="text-[10px] text-slate-400 pl-2 uppercase">性別</p><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none" value={editingCustomer.gender} onChange={(e) => setEditingCustomer({...editingCustomer, gender: e.target.value})}><option value="男">男</option><option value="女">女</option><option value="不透露">不透露</option></select></div>
                    )}
                  </div>
                  {editingCustomer.customerType !== 'activity' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-slate-400 pl-2 uppercase">生日 MM/DD</p><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none" value={editingCustomer.birthday} onChange={(e) => setEditingCustomer({...editingCustomer, birthday: e.target.value})} /></div>
                      <div><p className="text-[10px] text-slate-400 pl-2 uppercase">職業</p><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none" value={editingCustomer.occupation} onChange={(e) => setEditingCustomer({...editingCustomer, occupation: e.target.value})} /></div>
                    </div>
                  )}
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-inner">
                    <p className="text-[10px] text-amber-600 uppercase font-black italic tracking-widest flex items-center gap-2"><Briefcase size={14}/> 鏈結歸屬修改</p>
                    <div className="space-y-1">
                      <p className="text-[9px] text-slate-400 pl-1">開發教練 (Developer)</p>
                      <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none" value={editingCustomer.referrerId || ''} onChange={(e) => setEditingCustomer({...editingCustomer, referrerId: e.target.value})}>
                        <option value="">-- 無固定開發教練 --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name} 教練</option>)}
                      </select>
                    </div>
                    {editingCustomer.customerType !== 'activity' && (
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 pl-1">介紹學員 (Referral By)</p>
                        <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-black outline-none" value={editingCustomer.referredByCustomerId || ''} onChange={(e) => setEditingCustomer({...editingCustomer, referredByCustomerId: e.target.value})}>
                          <option value="">-- 直接客戶 (無介紹) --</option>
                          {customers.filter(c => c.id !== editingCustomer.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><p className="text-[10px] text-slate-400 pl-4 uppercase font-black">餘額調整</p><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black text-2xl text-emerald-600 outline-none shadow-inner" value={editingCustomer.remaining} onChange={(e) => setEditingCustomer({...editingCustomer, remaining: e.target.value})} /></div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition">儲存並同步至雲端</button>
                </form>
             </div>
          </div>
        )}

        {editingEmployee && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 font-black">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 relative border border-slate-200 font-sans">
              <button onClick={() => setEditingEmployee(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-all font-black"><X size={32} /></button>
              <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-indigo-600 uppercase tracking-widest"><Users size={32} /> 修改教練資訊</h3>
              <form onSubmit={handleUpdateEmployee} className="space-y-6">
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black outline-none shadow-sm" value={editingEmployee.name} onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none" value={editingEmployee.type} onChange={(e) => setEditingEmployee({...editingEmployee, type: e.target.value})}>
                    <option value="formalA">正式 A</option>
                    <option value="formalB">正式 B</option>
                    <option value="tempA">承攬 A</option>
                    <option value="tempB">承攬 B</option>
                    <option value="probationA">實習 A</option>
                    <option value="probationB">實習 B</option>
                    <option value="project">專案技能</option>
                  </select>
                  <input type="number" placeholder="固定底薪(選填)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none text-indigo-600" value={editingEmployee.baseSalary !== undefined ? editingEmployee.baseSalary : ''} onChange={(e) => setEditingEmployee({...editingEmployee, baseSalary: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-1">
                     <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">入職日</p>
                     <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none text-slate-600" value={editingEmployee.startDate || ''} onChange={(e) => setEditingEmployee({...editingEmployee, startDate: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">轉正/轉兼職日期</p>
                     <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none text-slate-600" value={editingEmployee.promotionDate || ''} onChange={(e) => setEditingEmployee({...editingEmployee, promotionDate: e.target.value})} />
                   </div>
                   {editingEmployee.promotionDate && (
                     <div className="space-y-1">
                       <p className="text-[10px] text-slate-400 pl-2 uppercase font-black">轉正前職位</p>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-black outline-none text-slate-600" value={editingEmployee.prePromotionType || ''} onChange={(e) => setEditingEmployee({...editingEmployee, prePromotionType: e.target.value})}>
                         <option value="">-- 請選擇 --</option>
                         <option value="probationA">實習 A</option>
                         <option value="probationB">實習 B</option>
                         <option value="tempA">承攬 A</option>
                         <option value="tempB">承攬 B</option>
                       </select>
                     </div>
                   )}
                </div>

                {editingEmployee.type === 'project' && (
                   <input type="text" placeholder="請輸入專案工作職稱" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none shadow-sm" value={editingEmployee.projectTitle || ''} onChange={(e) => setEditingEmployee({...editingEmployee, projectTitle: e.target.value})} />
                )}
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600" checked={editingEmployee.isBossNoPay === true || (editingEmployee.isBossNoPay === undefined && editingEmployee.name === '顏秀如')} onChange={(e) => setEditingEmployee({...editingEmployee, isBossNoPay: e.target.checked})} />
                  <span className="text-sm text-slate-600 font-black">設為負責人 (免固定底薪，但保留抽成/獎金/勞健保等正常計算)</span>
                </label>
                <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition">確認修改</button>
              </form>
            </div>
          </div>
        )}

        {selectedCoachForDetails && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 font-black">
            <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-full flex flex-col shadow-2xl relative border border-slate-200 font-sans overflow-hidden animate-in zoom-in duration-200">
               <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                  <h3 className="text-3xl font-black flex items-center gap-4 text-indigo-600 uppercase tracking-widest">
                    <FileSpreadsheet size={32} /> {selectedCoachForDetails.name} - {summaryMonth} 課堂明細
                  </h3>
                  <div className="flex gap-3 items-center">
                    <button onClick={handleExportCoachPayslip} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-emerald-700 active:scale-95 transition-all">
                      <Download size={16} /> 匯出薪資單
                    </button>
                    <button onClick={() => setSelectedCoachForDetails(null)} className="text-slate-400 hover:text-slate-900 transition-all font-black bg-white p-2 rounded-full shadow-sm border border-slate-200"><X size={24} /></button>
                  </div>
               </div>
               <div className="overflow-y-auto p-0 flex-1 bg-white">
                 <table className="w-full text-left whitespace-nowrap text-xs md:text-sm">
                   <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-widest sticky top-0 shadow-sm z-10">
                     <tr>
                       <th className="px-5 py-5 text-center">序號</th>
                       <th className="px-5 py-5 text-center">日期</th>
                       <th className="px-5 py-5">學員/來源</th>
                       <th className="px-5 py-5">課程/項目</th>
                       <th className="px-5 py-5 text-center">扣點/堂數</th>
                       <th className="px-5 py-5 text-right text-indigo-500">課費</th>
                       <th className="px-5 py-5 text-right text-amber-500">推銷獎金</th>
                       <th className="px-5 py-5 text-right text-sky-500">轉介獎金及不固定薪資</th>
                       <th className="px-6 py-5 text-right text-emerald-600 font-black">單筆合計</th>
                       <th className="px-5 py-5 text-right">操作</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {coachLogsForModal.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700">
                          <td className="px-5 py-5 text-center font-mono text-slate-500">
                            {row.seqCount ? `#${row.seqCount}` : '-'}
                          </td>
                          <td className="px-5 py-5 text-center font-mono text-slate-500">
                            {row.date?.slice(5)}
                          </td>
                          <td className="px-5 py-5">
                            <div className="font-black text-slate-800 text-sm">
                              {row.customerName}
                            </div>
                            {!row.isOwn && <div className="text-[9px] text-sky-500 border border-sky-200 bg-sky-50 px-1 rounded w-fit mt-1">來自轉介抽成</div>}
                          </td>
                          <td className="px-5 py-5">
                            <div className="text-sm font-black text-slate-700 flex flex-col gap-1">
                              {row.specialEventType ? row.specialEventType :
                               row.classDuration === 'athlete_buy' ? '運動員儲值' :
                               row.classDuration?.startsWith('athlete_') ? `運動員專案 (${row.classDuration.split('_')[1]})` :
                               row.classDuration === 'overtime30min' ? '加時 30 min (歷史)' :
                               row.classDuration === 'overtime60min' ? '加時 60 min (歷史)' :
                               `一般課程 (${row.classDuration})`}
                              {Number(row.sales10) > 0 && <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100 font-sans w-fit">10+1組 x{row.sales10}</span>}
                              {Number(row.sales5) > 0 && <span className="text-[9px] text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100 font-sans w-fit">5堂組 x{row.sales5}</span>}
                              {Number(row.salesAthlete) > 0 && <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-200 font-sans w-fit">運動員包 x{row.salesAthlete} {row.purchaseDate && `(${row.purchaseDate.slice(5)})`}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-5 text-center font-mono">
                            {row.isOwn ? (
                                row.specialEventType ?
                                <span className={`text-sm font-black ${row.specialEventType.startsWith('出差任務') ? 'text-amber-600' : 'text-fuchsia-600'}`}>{row.specialEventType.startsWith('出差任務') ? `${row.classes} 堂(差)` : '1 堂(特)'}</span> :
                                row.classDuration === 'athlete_buy' ?
                                <span className="text-sm font-black text-amber-600">儲值</span> :
                                row.classDuration?.startsWith('athlete_') ? 
                                <span className="text-sm font-black text-amber-600">-{row.classes} 點</span> :
                                (row.classDuration === 'overtime30min' || row.classDuration === 'overtime60min') ?
                                <span className="text-sm font-black text-rose-500">不計堂</span> :
                                <span className="text-sm font-black text-indigo-600">{row.classes} 堂</span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-5 py-5 text-right font-mono text-indigo-500">
                            {row.calc.classPay > 0 ? `$${row.calc.classPay.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-5 py-5 text-right font-mono text-amber-500">
                            {row.calc.bonus > 0 ? `$${row.calc.bonus.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-5 py-5 text-right font-mono text-sky-500">
                            {row.calc.eventSupportPay > 0 ? `$${row.calc.eventSupportPay.toLocaleString()}` : '-'}
                            {row.isSource && referralData[row.id] && referralData[row.id].eligibleClasses > 0 && <div className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-400 font-sans font-black tracking-widest mt-1 w-fit ml-auto">🤝 轉介紀錄 ({referralData[row.id].seqString})</div>}
                          </td>
                          <td className="px-6 py-5 text-right font-mono text-emerald-600 font-black text-lg">
                            ${row.calc.total.toLocaleString()}
                          </td>
                          <td className="px-5 py-5 text-right">
                            <button onClick={() => setEditingLog(row)} className="p-1.5 text-slate-300 hover:text-amber-600 transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => triggerDeleteLog(row)} className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                     ))}
                     {coachLogsForModal.length === 0 && (
                        <tr><td colSpan="10" className="text-center py-12 text-slate-400">本月無任何課堂明細紀錄。</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
               <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">本月累計</span>
                      <span className="text-xl text-slate-700 font-mono">{formatClasses(detailSettlement?.totalClasses)} <span className="text-sm font-sans tracking-tighter">標準堂</span></span>
                    </div>
                    {selectedCoachForDetails?.type?.startsWith('formal') && (
                      <div className="flex flex-col max-w-[200px] md:max-w-xs border-l border-slate-200 pl-8">
                        <span className="text-[10px] text-sky-500 uppercase tracking-widest mb-1">全天無課/休假 ({coachRestDaysInfo.count}天)</span>
                        <span className="text-xs text-slate-500 font-mono truncate" title={coachRestDaysInfo.dates.map(d => parseInt(d.slice(8), 10)).join(', ')}>
                          {coachRestDaysInfo.count > 0 ? coachRestDaysInfo.dates.map(d => parseInt(d.slice(8), 10)).join(', ') : '無休假'}
                        </span>
                      </div>
                    )}
                    {selectedCoachForDetails?.type?.startsWith('formal') && (() => {
                        let coachSeniorityYearsModal = 0;
                        if (selectedCoachForDetails?.startDate) {
                            const [sy, sm, sd] = selectedCoachForDetails.startDate.split('-').map(Number);
                            const [ly, lm] = summaryMonth.split('-').map(Number);
                            const start = new Date(sy, sm - 1, sd);
                            const current = new Date(ly, lm - 1, 1);
                            coachSeniorityYearsModal = current.getFullYear() - start.getFullYear();
                            if (current < new Date(current.getFullYear(), start.getMonth(), start.getDate())) {
                                coachSeniorityYearsModal--;
                            }
                            coachSeniorityYearsModal = Math.max(0, coachSeniorityYearsModal);
                        }
                        const baseTargetModal = selectedCoachForDetails?.type === 'formalA' || selectedCoachForDetails?.type === 'formal' ? Math.max(0, 35 - coachSeniorityYearsModal) : (selectedCoachForDetails?.type === 'formalB' ? Math.max(0, 25 - coachSeniorityYearsModal) : null);
                        
                        return baseTargetModal !== null ? (
                          <div className="flex flex-col max-w-[200px] md:max-w-xs border-l border-slate-200 pl-8">
                            <span className="text-[10px] text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1"><BadgePercent size={12}/> 年資成就 ({coachSeniorityYearsModal}年)</span>
                            <span className="text-xs text-slate-700 font-black">
                              基本門檻降至 <span className="text-base text-amber-600 font-mono">{baseTargetModal}</span> 堂
                            </span>
                          </div>
                        ) : null;
                    })()}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-emerald-600/70 uppercase tracking-widest mb-1">估計實領總計</span>
                    <span className="text-4xl font-black text-emerald-600 font-mono tracking-tighter">${detailSettlement?.grossSalary.toLocaleString()}</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {selectedCustomerForDetails && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8 font-black">
              <div className="bg-white rounded-[3.5rem] w-full max-w-5xl max-h-full flex flex-col shadow-2xl relative border border-slate-200 font-sans overflow-hidden animate-in zoom-in duration-200">
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-3xl font-black flex items-center gap-4 text-amber-600 uppercase tracking-widest">
                      <History size={32} /> {selectedCustomerForDetails.name} - 歷史消費與上課明細
                    </h3>
                    <button onClick={() => setSelectedCustomerForDetails(null)} className="text-slate-400 hover:text-slate-900 transition-all font-black bg-white p-2 rounded-full shadow-sm border border-slate-200"><X size={24} /></button>
                 </div>
                 <div className="overflow-y-auto p-0 flex-1 bg-white">
                    <table className="w-full text-left whitespace-nowrap text-xs md:text-sm">
                      <thead className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-widest sticky top-0 shadow-sm z-10">
                        <tr>
                          <th className="px-8 py-5">序號 / 日期</th>
                          <th className="px-6 py-5">教練 / 營收項目</th>
                          <th className="px-6 py-5 text-center">堂數 / 時長</th>
                          <th className="px-6 py-5 text-center">付款方式</th>
                          <th className="px-6 py-5 text-right text-emerald-600">實收金額</th>
                          <th className="px-8 py-5 text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerLogsForModal.map((log) => {
                           const coach = employees.find(e => e.id === log.employeeId);
                           const isActivityLog = selectedCustomerForDetails.customerType === 'activity' && !log.specialEventType;
                           
                           let classCashRev = 0;
                           if (log.specialEventType === '隨喜40min') {
                               classCashRev = Number(log.companyRevenue) || 0;
                           } else if (log.specialEventType === '進階體驗90min') {
                               classCashRev = 1000;
                           } else if (log.specialEventType?.startsWith('出差任務')) {
                               classCashRev = Number(log.companyRevenue) || 0;
                           } else if (log.employeeId === 'COMPANY_REVENUE' || isActivityLog) {
                               classCashRev = Number(log.companyRevenue) || 0;
                           } else if (log.paymentMethod !== '代扣' && Number(log.classes) > 0) {
                               const isNewAth = log.classDuration?.startsWith('athlete_') && log.classDuration !== 'athlete_buy';
                               const isOldAth = log.isAthleteProject && !isNewAth && log.classDuration !== 'athlete_buy';
                               if (isNewAth) {
                                   classCashRev = Number(log.classes) * 250;
                               } else if (isOldAth) {
                                   classCashRev = Number(log.classes) * 750;
                               } else {
                                   const X = log.classFee ? Number(log.classFee) : (
                                       log.classDuration === '150min' ? 4300 :
                                       log.classDuration === '120min' ? 3400 :
                                       log.classDuration === '60min' || log.classDuration === 'overtime60min' ? 1800 : 
                                       log.classDuration === 'overtime30min' ? 900 : 2500
                                   );
                                   classCashRev = Number(log.classes) * X;
                               }
                           }
                           const revenue = classCashRev + (Number(log.sales10) * 25000) + (Number(log.sales5) * 11500) + (Number(log.salesAthlete) * 6000) + ((Number(log.productPrice) || 0) * (Number(log.productQty) || 0));

                           return (
                             <tr key={log.id} className="hover:bg-slate-50 transition-colors text-slate-700">
                               <td className="px-8 py-5 font-mono text-slate-500">
                                 {log.seqCount && <span className="text-slate-300 mr-2 font-black">#{log.seqCount}</span>}
                                 {log.date?.slice(5)}
                               </td>
                               <td className="px-6 py-5">
                                 <div className="font-black text-slate-800 text-base flex items-center gap-2">
                                   {log.employeeId === 'COMPANY_REVENUE' ? '🏢 公司活動收入' : (coach?.name || '未知教練')}
                                   {log.referralSourceId && log.referralSourceId !== log.employeeId && referralData[log.id] && (
                                     <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase tracking-widest whitespace-nowrap ${referralData[log.id].eligibleClasses > 0 ? 'bg-amber-100 text-amber-700 border-amber-400' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                       {referralData[log.id].eligibleClasses > 0 ? `🤝 轉介紀錄 (${referralData[log.id].seqString})` : `⛔ 轉介已滿10堂`}
                                     </span>
                                   )}
                                 </div>
                               </td>
                               <td className="px-6 py-5 text-center font-mono">
                                 {isActivityLog ? <span className="text-slate-300">-</span> : (
                                   log.specialEventType ?
                                     <span className={`text-lg font-black ${log.specialEventType.startsWith('出差任務') ? 'text-amber-600' : 'text-fuchsia-600'}`}>{log.specialEventType.startsWith('出差任務') ? `${log.classes} 堂(差)` : '特(1堂)'}</span> :
                                   log.classDuration === 'athlete_buy' ?
                                     <span className="text-lg font-black text-amber-600">儲值</span> :
                                   log.classDuration?.startsWith('athlete_') ? 
                                     <span className="text-lg font-black text-amber-600">-{log.classes} 點</span> : 
                                     <span className="text-lg font-black text-indigo-600">{log.classes} 堂</span>
                                 )}
                                 <div className="text-[10px] text-slate-400 mt-1">
                                   {log.classDuration === 'athlete_buy' ? '--:--' : (log.specialEventType ? log.specialEventType : (log.classDuration?.startsWith('athlete_') ? log.classDuration.split('_')[1] + 'm' : (log.classDuration === '150min' ? '150m' : log.classDuration === '120min' ? '120m' : log.classDuration === 'overtime30min' ? '加時30m (歷史)' : log.classDuration === 'overtime60min' ? '加時60m (歷史)' : log.classDuration)))} / {log.sessionTime || '--:--'}
                                 </div>
                                 {(Number(log.sales10) > 0 || Number(log.sales5) > 0) && <div className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1 mt-1 w-fit mx-auto font-sans">買課包</div>}
                                 {Number(log.salesAthlete) > 0 && <div className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1 mt-1 w-fit mx-auto font-sans">買運動員包 {log.purchaseDate && `(${log.purchaseDate.slice(5)})`}</div>}
                                 {(Number(log.productQty) > 0 && log.productName) && <div className="text-[9px] text-teal-600 bg-teal-50 border border-teal-100 rounded px-1 mt-1 w-fit mx-auto font-sans">買商品</div>}
                               </td>
                               <td className="px-6 py-5 text-center">
                                 <span className={`px-2 py-0.5 rounded border text-[10px] ${log.paymentMethod === '轉帳' ? 'text-blue-600 bg-blue-50 border-blue-100' : log.paymentMethod === '代扣' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>[{log.paymentMethod}]</span>
                               </td>
                               <td className="px-6 py-5 text-right font-mono text-emerald-600 font-black text-xl">
                                 ${revenue.toLocaleString()}
                               </td>
                               <td className="px-8 py-5 text-right">
                                 <button onClick={() => setEditingLog(log)} className="p-2 text-slate-300 hover:text-amber-600 transition-colors"><Edit2 size={16} /></button>
                                 <button onClick={() => triggerDeleteLog(log)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                               </td>
                             </tr>
                           );
                        })}
                        {customerLogsForModal.length === 0 && (
                           <tr><td colSpan="6" className="text-center py-12 text-slate-400">目前尚無任何消費或上課紀錄。</td></tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}

        <footer className="mt-32 text-center border-t border-slate-300 pt-16 pb-24 opacity-60 font-black tracking-tighter uppercase font-sans">
          <p className="text-slate-600 text-[11px] tracking-[1.5em] mb-4">築動運動防護 • JD Rebuild Training Lab Integrated Engine</p>
          <p className="text-slate-400 text-[10px] underline decoration-indigo-300 decoration-4 shadow-sm shadow-indigo-100 font-mono tracking-tighter font-black">AUTHENTICATED • v66.0 PRO CRM • SYNCED DYNAMIC</p>
        </footer>
      </div>
    </div>
  );
};

export default App;