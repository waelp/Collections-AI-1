import { useState, useEffect } from 'react';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '@/lib/formatters';
import { useTheme } from '@/contexts/ThemeContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, UserPlus, Target, DollarSign, Shield, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'collector';
  status: 'active' | 'inactive';
  password?: string; // In a real app, this would be hashed
}

interface BonusRule {
  id: string;
  name: string;
  minScore: number;
  percentage: number;
}

interface CollectorSalary {
  collectorName: string;
  salary: number;
}

export default function Admin() {
  const { direction, language } = useTheme();
  const { mappedData } = useData();
  
  // --- State Management ---
  
  // Users
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Wael Allam', email: 'wael@company.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Mohammed Mokpel', email: 'mokpel@company.com', role: 'collector', status: 'active' },
    { id: '3', name: 'Nadi Malki', email: 'nadi@company.com', role: 'collector', status: 'active' },
    { id: '4', name: 'Hajjar Mohtaseb', email: 'hajjar@company.com', role: 'collector', status: 'active' },
  ]);
  
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'collector', status: 'active' });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Bonus Rules
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([
    { id: '1', name: 'Standard Bonus', minScore: 35, percentage: 2.5 },
    { id: '2', name: 'High Performance', minScore: 40, percentage: 5.0 },
    { id: '3', name: 'Elite Bonus', minScore: 45, percentage: 7.5 },
  ]);

  // Salaries
  const [salaries, setSalaries] = useState<CollectorSalary[]>([]);

  // --- Derived Data ---

  // Get unique collectors from data who have non-zero balance
  const activeCollectors = Array.from(new Set(
    mappedData
      .filter(d => d.totalBalance !== 0 && d.collectorName)
      .map(d => d.collectorName)
  )).sort();

  // Initialize salaries for new collectors
  useEffect(() => {
    setSalaries(prev => {
      const newSalaries = [...prev];
      activeCollectors.forEach(collector => {
        if (!newSalaries.find(s => s.collectorName === collector)) {
          newSalaries.push({ collectorName: collector, salary: 0 });
        }
      });
      return newSalaries;
    });
  }, [activeCollectors.length]); // Only run when collector count changes

  // Calculate Monthly Targets & Performance
  const collectorPerformance = activeCollectors.map(collector => {
    const collectorData = mappedData.filter(d => d.collectorName === collector);
    const totalBalance = collectorData.reduce((sum, item) => sum + item.totalBalance, 0);
    const totalCollected = collectorData.reduce((sum, item) => sum + (item.amountCollected || 0), 0);
    
    // Simple logic for target: 10% of total balance (can be made editable later)
    const monthlyTarget = totalBalance * 0.10; 
    
    return {
      name: collector,
      totalBalance,
      monthlyTarget,
      totalCollected,
      bonusThreshold: 85 // Default
    };
  });

  // --- Handlers ---

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    
    setUsers([...users, { ...newUser, id: Date.now().toString() } as User]);
    setIsAddUserOpen(false);
    setNewUser({ role: 'collector', status: 'active' });
    toast.success(language === 'ar' ? 'تمت إضافة المستخدم بنجاح' : 'User added successfully');
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    toast.success(language === 'ar' ? 'تم حذف المستخدم' : 'User deleted');
  };

  const handleAddBonusRule = () => {
    setBonusRules([...bonusRules, { 
      id: Date.now().toString(), 
      name: 'New Rule', 
      minScore: 0, 
      percentage: 0 
    }]);
  };

  const handleUpdateBonusRule = (id: string, field: keyof BonusRule, value: any) => {
    setBonusRules(bonusRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const handleDeleteBonusRule = (id: string) => {
    setBonusRules(bonusRules.filter(r => r.id !== id));
  };

  const handleUpdateSalary = (collectorName: string, value: number) => {
    setSalaries(salaries.map(s => 
      s.collectorName === collectorName ? { ...s, salary: value } : s
    ));
  };

  const handleSaveAll = () => {
    // In a real app, this would save to backend
    // Here we just persist to local storage or context if needed
    toast.success(language === 'ar' ? 'تم حفظ جميع التغييرات بنجاح' : 'All changes saved successfully');
  };

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {language === 'ar' ? 'لوحة تحكم المدير' : 'Admin Dashboard'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' 
              ? 'إدارة المستخدمين والأهداف وقواعد المكافآت' 
              : 'Manage users, targets, and bonus rules'}
          </p>
        </div>
        <Button onClick={handleSaveAll} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          {language === 'ar' ? 'حفظ الكل' : 'Save All'}
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600" style={{color: '#f7f3f3'}}>
            <UserPlus className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'المستخدمين' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="targets" className="data-[state=active]:bg-blue-600" style={{color: '#f4f0f0'}}>
            <Target className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'الأهداف الشهرية' : 'Monthly Targets'}
          </TabsTrigger>
          <TabsTrigger value="bonus" className="data-[state=active]:bg-blue-600" style={{color: '#f9f5f5'}}>
            <DollarSign className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'قواعد المكافآت' : 'Bonus Rules'}
          </TabsTrigger>
          <TabsTrigger value="salaries" className="data-[state=active]:bg-blue-600" style={{color: '#f4f0f0'}}>
            <Wallet className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'الرواتب' : 'Salaries'}
          </TabsTrigger>
        </TabsList>

        {/* Users Management Tab */}
        <TabsContent value="users">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'إضافة وتعديل وحذف مستخدمي النظام' : 'Add, edit, and remove system users'}
                </CardDescription>
              </div>
              
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle>{language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الاسم' : 'Name'}</Label>
                      <Input 
                        value={newUser.name || ''} 
                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                      <Input 
                        type="email"
                        value={newUser.email || ''} 
                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
                      <Input 
                        type="password"
                        value={newUser.password || ''} 
                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(v: any) => setNewUser({...newUser, role: v})}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="collector">Collector</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddUser} className="bg-blue-600">
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                    <TableHead className="text-slate-400">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">{user.name}</TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          user.role === 'admin' 
                            ? 'border-purple-500 text-purple-400' 
                            : 'border-blue-500 text-blue-400'
                        }>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Management Tab */}
        <TabsContent value="targets">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                {language === 'ar' ? 'الأهداف الشهرية' : 'Monthly Targets'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'يتم عرض المحصلين الذين لديهم رصيد قائم فقط (Total Balance > 0)' 
                  : 'Showing collectors with outstanding balance only (Total Balance > 0)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">{language === 'ar' ? 'المحصل' : 'Collector'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'إجمالي المبالغ' : 'Total Balance'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'المتوقع (الهدف)' : 'Target'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'المحصل فعلياً' : 'Collected'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'حد المكافأة (%)' : 'Bonus Threshold (%)'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectorPerformance.map((perf, idx) => (
                    <TableRow key={idx} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">{perf.name}</TableCell>
                      <TableCell className="text-right text-slate-300">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(perf.totalBalance)}
                      </TableCell>
                      <TableCell className="text-right text-blue-400">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(perf.monthlyTarget)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(perf.totalCollected)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Input 
                            type="number" 
                            defaultValue={perf.bonusThreshold}
                            className="bg-slate-950 border-slate-800 text-white w-20 text-center h-8"
                          />
                          <span className="text-slate-500">%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {collectorPerformance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        {language === 'ar' ? 'لا يوجد محصلين لديهم رصيد قائم حالياً' : 'No collectors with outstanding balance found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonus Rules Tab */}
        <TabsContent value="bonus">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {language === 'ar' ? 'قواعد احتساب المكافآت' : 'Bonus Calculation Rules'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'تكوين شرائح المكافآت بناءً على نقاط الأداء' : 'Configure bonus tiers based on performance score'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bonusRules.map((rule) => (
                  <div key={rule.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-slate-800 rounded-lg bg-slate-950/50">
                    <div className="space-y-2">
                      <Label className="text-slate-400">{language === 'ar' ? 'اسم الشريحة' : 'Tier Name'}</Label>
                      <Input 
                        value={rule.name}
                        onChange={(e) => handleUpdateBonusRule(rule.id, 'name', e.target.value)}
                        className="bg-slate-900 border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">{language === 'ar' ? 'الحد الأدنى للنقاط' : 'Min Score'}</Label>
                      <Input 
                        type="number"
                        value={rule.minScore}
                        onChange={(e) => handleUpdateBonusRule(rule.id, 'minScore', parseFloat(e.target.value))}
                        className="bg-slate-900 border-slate-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400">{language === 'ar' ? 'نسبة المكافأة (%)' : 'Bonus Percentage (%)'}</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          step="0.1"
                          value={rule.percentage}
                          onChange={(e) => handleUpdateBonusRule(rule.id, 'percentage', parseFloat(e.target.value))}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteBonusRule(rule.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={handleAddBonusRule}
                  className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إضافة شريحة جديدة' : 'Add New Tier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salaries Tab */}
        <TabsContent value="salaries">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                {language === 'ar' ? 'إدارة الرواتب' : 'Salary Management'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' 
                  ? 'تحديد الرواتب الأساسية للمحصلين (تستخدم في حساب المكافآت)' 
                  : 'Set base salaries for collectors (used in bonus calculation)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">{language === 'ar' ? 'المحصل' : 'Collector'}</TableHead>
                    <TableHead className="text-right text-slate-400">{language === 'ar' ? 'الراتب الأساسي (SAR)' : 'Base Salary (SAR)'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary, idx) => (
                    <TableRow key={idx} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">{salary.collectorName}</TableCell>
                      <TableCell className="text-right">
                        <Input 
                          type="number" 
                          value={salary.salary}
                          onChange={(e) => handleUpdateSalary(salary.collectorName, parseFloat(e.target.value))}
                          className="bg-slate-950 border-slate-800 text-white w-40 ml-auto text-right"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {salaries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                        {language === 'ar' ? 'لا يوجد محصلين نشطين' : 'No active collectors found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
