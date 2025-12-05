import { Switch, Route, Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useData } from "@/contexts/DataContext";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Menu, 
  X, 
  PieChart, 
  BarChart2, 
  DollarSign,
  BookOpen,
  ShieldAlert,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Home from "@/pages/Home";
import DataMapping from "@/pages/DataMapping";
import VarianceAnalysis from "@/pages/VarianceAnalysis";
import InvoicesRisk from "@/pages/InvoicesRisk";
import CustomerAnalysis from "@/pages/Customers";
import SalesRisk from "@/pages/SalesRisk";
import SmartReport from "@/pages/SmartReport";
import CollectorsBonus from "@/pages/CollectorsBonus";
import CollectorsPerformance from "@/pages/CollectorsPerformance";
import Admin from "@/pages/Admin";
import Documentation from "@/pages/Documentation";
import SettingsDashboard from "@/pages/SettingsDashboard";
import UserManagement from "@/pages/UserManagement";
import Login from "@/pages/Login";
import Landing from "@/pages/Landing";

function App() {
  const { theme, language, direction } = useTheme();
  const { isMapped, currentUser, logout } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  // Redirect to landing or login if not authenticated
  useEffect(() => {
    if (!currentUser && location !== '/login' && location !== '/landing') {
      setLocation('/landing');
    }
  }, [currentUser, location, setLocation]);

  // Responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  // Define menu items with role-based access
  const allMenuItems = [
    { 
      path: "/data-mapping", 
      label: language === 'ar' ? 'البيانات والربط' : 'Data & Mapping', 
      icon: Upload,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/", 
      label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', 
      icon: LayoutDashboard, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/variance", 
      label: language === 'ar' ? 'تحليل التباين' : 'Variance Analysis', 
      icon: TrendingUp, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/invoices-risk", 
      label: language === 'ar' ? 'الفواتير والمخاطر' : 'Invoices & Risk', 
      icon: AlertTriangle, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/customer-analysis", 
      label: language === 'ar' ? 'تحليل العملاء' : 'Customer Analysis', 
      icon: Users, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/sales-risk", 
      label: language === 'ar' ? 'المبيعات والمخاطر' : 'Sales & Risk', 
      icon: PieChart, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/smart-report", 
      label: language === 'ar' ? 'التقرير الذكي' : 'Smart Report', 
      icon: BookOpen, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/collectors-performance", 
      label: language === 'ar' ? 'أداء المحصلين' : 'Collectors Performance', 
      icon: BarChart2, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/collectors-bonus", 
      label: language === 'ar' ? 'المحصلين والمكافآت' : 'Collectors & Bonus', 
      icon: DollarSign, 
      disabled: !isMapped,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/admin", 
      label: language === 'ar' ? 'لوحة الإدارة' : 'Admin Dashboard', 
      icon: ShieldAlert,
      roles: ['admin'] // Only admin can see this
    },
    { 
      path: "/documentation", 
      label: language === 'ar' ? 'التوثيق' : 'Documentation', 
      icon: FileText,
      roles: ['admin', 'collector', 'viewer']
    },
    { 
      path: "/user-management", 
      label: language === 'ar' ? 'إدارة المستخدمين' : 'User Management', 
      icon: Users,
      roles: ['admin'] // Only admin can see this
    },
    { 
      path: "/settings", 
      label: language === 'ar' ? 'الإعدادات' : 'Settings', 
      icon: Settings,
      roles: ['admin'] // Only admin can see this
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  // If on landing page, render only landing component
  if (location === '/landing') {
    return (
      <>
        <Landing />
        <Toaster position="top-right" theme="dark" />
      </>
    );
  }

  // If on login page, render only login component
  if (location === '/login') {
    return (
      <>
        <Login />
        <Toaster position="top-right" theme="dark" />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-50 flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 z-50
          w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
          ${direction === 'rtl' ? 'border-l border-r-0' : ''}
        `}
      >
        <div className="p-6 border-b border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-lg tracking-tight">Collections AI</span>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Designed & Developed by Wael Allam</p>
            <p className="text-[10px] opacity-75">كافة حقوق النشر والتوزيع محمية</p>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{currentUser?.name}</div>
              <div className="text-xs text-slate-400 capitalize">{currentUser?.role}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.disabled ? '#' : item.path}>
                <div 
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-800'}
                    ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:text-slate-100'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <div className={`absolute ${direction === 'rtl' ? 'left-0' : 'right-0'} w-1 h-6 bg-blue-400 rounded-l-full`} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                AI
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">AI Assistant</div>
                <div className="text-[10px] text-slate-500">Online</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'ar' 
                ? 'تحليل البيانات يتم محلياً لضمان الخصوصية والأمان.' 
                : 'Data analysis is performed locally to ensure privacy and security.'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            {/* Breadcrumbs or Title could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">System Operational</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/data-mapping" component={DataMapping} />
            <Route path="/variance" component={VarianceAnalysis} />
            <Route path="/invoices-risk" component={InvoicesRisk} />
            <Route path="/customer-analysis" component={CustomerAnalysis} />
            <Route path="/sales-risk" component={SalesRisk} />
            <Route path="/smart-report" component={SmartReport} />
            <Route path="/collectors-performance" component={CollectorsPerformance} />
            <Route path="/collectors-bonus" component={CollectorsBonus} />
            <Route path="/admin" component={Admin} />
            <Route path="/documentation" component={Documentation} />
            <Route path="/settings" component={SettingsDashboard} />
            <Route path="/user-management" component={UserManagement} />
            <Route>
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
                <p>The requested page does not exist.</p>
              </div>
            </Route>
          </Switch>
        </div>
      </main>

      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;
