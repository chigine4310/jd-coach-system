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
  Timer, LogIn, LogOut, CalendarOff, CheckSquare, XSquare
} from 'lucide-react';
// ✅ 這是正確的寫法 (對應您 .env 裡的大寫變數名稱)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
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

const LEAVE_TYPES = {
  'personal': { label: '事假', rate: 1.0, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'sick': { label: '病假 (半薪)', rate: 0.5, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'menstrual': { label: '生理假 (半薪)', rate: 0.5, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  'annual': { label: '特別休假 (全薪)', rate: 0.0, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'comp_leave': { label: '補休 (全薪)', rate: 0.0, color: 'text-lime-600 bg-lime-50 border-lime-200' },
  'marriage': { label: '婚假 (全薪)', rate: 0.0, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200' },
  'bereavement': { label: '喪假 (全薪)', rate: 0.0, color: 'text-slate-600 bg-slate-100 border-slate-300' },
  'official': { label: '公假 (全薪)', rate: 0.0, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  'typhoon_unpaid': { label: '颱風假 (無薪)', rate: 1.0, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  'typhoon_paid': { label: '颱風假 (有薪)', rate: 0.0, color: 'text-teal-600 bg-teal-50 border-teal-200' }
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

  const [logData, setLogData] = useState({
    employeeId: '', customerName: '', deductFromCustomerId: '', referralSourceId: '',
    sessionTime: '', classDuration: '90min', classes: '1', companyRevenue: '0', overtime: '0', 
    sales10: '0', sales5: '0', salesAthlete: '0', purchaseDate: getLocalDateString(),
    paymentMethod: '現金', isAthleteProject: false,
    productName: '', productPrice: '', productQty: '1', eventSupportPay: '0',
    specialEventType: '' 
  });

  const [activeFinanceTab, setActiveFinanceTab] = useState('overview');
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
    const employeesRef = collection(db, 'artifacts', appId, 'employees');
    const logsRef = collection(db, 'artifacts', appId, 'logs');
    const customersRef = collection(db, 'artifacts', appId, 'customers');
    const attRef = collection(db, 'artifacts', appId, 'attendance');
    const leaveRef = collection(db, 'artifacts', appId, 'leaves');
    let loadedCount = 0;
    const checkLoaded = () => { loadedCount++; if (loadedCount >= 3) setIsDataLoaded(true); };
    
    const unsubEmp = onSnapshot(employeesRef, (s) => {
      const empList = s.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("🔥 成功抓到員工/教練資料：", empList);
      setEmployees(empList); 
      checkLoaded(); 
    }, (err) => {
      console.error("❌ 抓取員工資料失敗 (權限或路徑錯誤)：", err);
    });
    const unsubLog = onSnapshot(logsRef, (s) => { setDailyLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (err) => console.error(err));
    const unsubCust = onSnapshot(customersRef, (s) => { setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))); checkLoaded(); }, (err) => console.error(err));
    const unsubAtt = onSnapshot(attRef, (s) => { setAttendanceRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, (err) => console.error(err));
    const unsubLeave = onSnapshot(leaveRef, (s) => { setLeaveRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))); }, (err) => console.error(err));
    
    return () => { unsubEmp(); unsubLog(); unsubCust(); unsubAtt(); unsubLeave(); };
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
    
    const isOvertimeLog = log.classDuration === 'overtime30min' || log.classDuration === 'overtime60min'; 
    
    let validClasses = isNewAthlete ? (rawClsCount / 3) : rawClsCount;
    if (isOvertimeLog) {
       validClasses = 0; 
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
                if (cumulative > 35) {
                  if (cumulative >= 76) m = 0.5;
                  else if (cumulative >= 66) m = 0.48;
                  else if (cumulative >= 56) m = 0.46;
                  else if (cumulative >= 46) m = 0.42;
                  else m = 0.4;
                }
                classPay += X * m; 
              } else if (empType === 'formalB') {
                let m = 0;
                if (cumulative > 25) {
                   if (cumulative >= 76) m = 0.46;
                   else if (cumulative >= 66) m = 0.44;
                   else if (cumulative >= 56) m = 0.42;
                   else if (cumulative >= 46) m = 0.38;
                   else if (cumulative >= 36) m = 0.36;
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
      const b = calculateEntrySalary(emp, log, cumulative, 0); 
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
    
    const empLeaves = leaveRecords.filter(l => l.employeeId === empId && l.date.startsWith(month) && l.status === 'approved');
    let leaveDeduction = 0;
    empLeaves.forEach(leave => {
       const rate = LEAVE_TYPES[leave.type]?.rate || 0;
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
    const totalOpCosts = Object.values(operatingCosts).reduce((sum, val) => sum + Number(val || 0), 0) * monthDiff;
    const companyOperatingProfit = companyGrossProfit - totalOpCosts;
    const companyEstimatedIncomeTax = companyOperatingProfit > 0 ? Math.round(companyOperatingProfit * CONFIG.corporateTaxRate) : 0;
    const companyNetIncome = companyOperatingProfit - companyEstimatedIncomeTax;

    return {
      payroll, topCustomers, sleeperCustomersCount, totalUnusedClasses, totalUnearnedRevenue,     
      totalRevenue: finalTotalRevenue, baseRevenue: totalRevenue, companyNetRevenue, companyVatPayable,
      totalPayrollCorpCost, companyGrossProfit, totalOpCosts, companyOperatingProfit,
      companyEstimatedIncomeTax, companyNetIncome, totalClassesGlobal, paymentMethodsCounts,
      paymentMethodsAmounts, athleteProjectClasses, athleteProjectRevenue,
      activeCoaches: payroll.filter(p => p.totalClasses > 0 || p.grossPay > 0).length,
      filteredRecordCount: validLogs.length
    };
  }, [dailyLogs, employees, customers, customBaseSalaries, customIsCompany, operatingCosts, extraRevenue, filterStartDate, filterEndDate, referralData]);

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
        await updateDoc(doc(db, 'artifacts', appId, 'customers', payer.id), {
          remaining: Math.max(0, Number(payer.remaining) + bonusT - classesToDeduct)
        });
      }

      await addDoc(collection(db, 'artifacts', appId, 'logs'), { 
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
        companyRevenue: (isCompanyRevenue || isEditActivityCustomer || editingLog.specialEventType) ? (Number(logData.companyRevenue) || 0) : 0,
        purchaseDate: editingLog.purchaseDate || editingLog.date,
        updatedAt: new Date().toISOString()
      };

      if (updatedLog.referralSourceId && updatedLog.referralSourceId !== updatedLog.employeeId && !isCompanyRevenue && !isEditActivityCustomer) {
      } else if (!updatedLog.referralSourceId) {
         updatedLog.referralReceiverId = '';
      }

      const { calc, isOwn, isSource, cumulativeAfter, seqCount, id, ...logToSave } = updatedLog;
      Object.keys(logToSave).forEach(key => logToSave[key] === undefined && delete logToSave[key]);

      await updateDoc(doc(db, 'artifacts', appId, 'logs', editingLog.id), logToSave);
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
      const { id, ...dataToSave } = editingCustomer;
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      dataToSave.name = dataToSave.name.trim();
      dataToSave.remaining = Number(dataToSave.remaining) || 0;

      await updateDoc(doc(db, 'artifacts', appId, 'customers', editingCustomer.id), { 
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
      const { id, ...dataToSave } = editingEmployee;
      Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

      dataToSave.name = dataToSave.name.trim();
      if (dataToSave.baseSalary !== undefined && dataToSave.baseSalary !== '') {
        dataToSave.baseSalary = Number(dataToSave.baseSalary);
      }

      await updateDoc(doc(db, 'artifacts', appId, 'employees', editingEmployee.id), { 
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
        await addDoc(collection(db, 'artifacts', appId, 'customers'), { 
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
    triggerSync(async () => { await addDoc(collection(db, 'artifacts', appId, 'employees'), { ...newEmp, createdAt: new Date().toISOString() }); setNewEmp({ name: '', xValue: '', type: 'formalA', isBossNoPay: false, baseSalary: '', startDate: getLocalDateString(), projectTitle: '', promotionDate: '', prePromotionType: '' }); });
  };

  const triggerDeleteLog = (log) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除紀錄', message: '確定刪除這筆營運紀錄？', action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'logs', log.id))) }); };
  const triggerDeleteEmployee = (emp) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除教練', message: `確定永久刪除教練？`, action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'employees', emp.id))) }); };
  const triggerDeleteCustomer = (cust) => { setConfirmModal({ isOpen: true, type: 'danger', title: '刪除學員', message: `確定永久刪除學員？`, action: async () => triggerSync(async () => await deleteDoc(doc(db, 'artifacts', appId, 'customers', cust.id))) }); };

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
            if (data.employees) for (const item of data.employees) await setDoc(doc(db, 'artifacts', appId, 'employees', item.id), item);
            if (data.customers) for (const item of data.customers) await setDoc(doc(db, 'artifacts', appId, 'customers', item.id), item);
            if (data.logs) for (const item of data.logs) await setDoc(doc(db, 'artifacts', appId, 'logs', item.id), item);
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
    const apiKey = ""; 
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
    const currentMonth = leaveData.date.slice(0, 7);
    const [y, m] = currentMonth.split('-').map(Number);
    let prevY = y;
    let prevM = m - 1;
    if (prevM === 0) { prevM = 12; prevY -= 1; }
    const prevMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;

    const prevMonthAtt = attendanceRecords.filter(r => r.employeeId === loggedInCoachId && r.date?.startsWith(prevMonth));
    const dailyWorkMins = {};
    prevMonthAtt.forEach(r => {
      if (!dailyWorkMins[r.date]) dailyWorkMins[r.date] = 0;
      dailyWorkMins[r.date] += (r.workMinutes || 0);
    });
    
    let earnedMins = 0;
    Object.values(dailyWorkMins).forEach(mins => {
      if (mins > 480) earnedMins += (mins - 480);
    });
    const earned = Math.floor(earnedMins / 60);

    const currentMonthCompLeaves = leaveRecords.filter(l => 
      l.employeeId === loggedInCoachId && 
      l.date?.startsWith(currentMonth) && 
      l.type === 'comp_leave' && 
      l.status !== 'rejected'
    );
    const used = currentMonthCompLeaves.reduce((sum, l) => sum + Number(l.hours), 0);

    return { earned, used, available: Math.max(0, earned - used) };
  }, [attendanceRecords, leaveRecords, loggedInCoachId, leaveData.date]);

  const handleClockIn = async () => {
    if (!loggedInCoachId) return;
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    triggerSync(async () => {
      await addDoc(collection(db, 'artifacts', appId, 'attendance'), {
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
    
    const [inHours, inMins] = clockInTime.split(':').map(Number);
    const [outHours, outMins] = timeString.split(':').map(Number);
    
    let diffMins = (outHours * 60 + outMins) - (inHours * 60 + inMins);
    if (diffMins < 0) diffMins += 24 * 60;

    triggerSync(async () => {
      await updateDoc(doc(db, 'artifacts', appId, 'attendance', recordId), {
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
    if (!emp?.type?.startsWith('formal')) {
        alert("非正式員工無需在此系統請假，排班請直接與主管協調。");
        return;
    }

    if (leaveData.type === 'comp_leave' && Number(leaveData.hours) > compHoursInfo.available) {
        alert(`可用補休時數不足！\n\n依據您的打卡紀錄，上個月(${compHoursInfo.earned}h) 扣除本月已排補休(${compHoursInfo.used}h) 後，僅剩 [ ${compHoursInfo.available} 小時 ] 可用。`);
        return;
    }

    triggerSync(async () => {
      await addDoc(collection(db, 'artifacts', appId, 'leaves'), {
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
      await updateDoc(doc(db, 'artifacts', appId, 'leaves', leaveId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    });
  };

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
                        if (password === '16121') handleMockLogin('boss');
                        else setAuthError('密碼錯誤，請重新輸入');
                    }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                  <button onClick={() => { setShowBossPassword(false); setAuthError(''); setPassword(''); }} className="w-1/3 bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-black shadow-sm hover:bg-slate-200 transition active:scale-95">取消</button>
                  <button onClick={() => {
                      if (password === '16121') handleMockLogin('boss');
                      else setAuthError('密碼錯誤，請重新輸入');
                  }} className="w-2/3 bg-amber-600 text-white py-4 rounded-[2rem] font-black shadow-xl hover:bg-amber-