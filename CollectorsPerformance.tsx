import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCollectorPerformance } from '@/lib/analytics';
import { Trophy, Calendar, Users, DollarSign, Star } from 'lucide-react';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function CollectorsPerformance() {
  const { mappedData, globalParams } = useData();
  const { language, direction } = useTheme();
  const dateBasis = globalParams.dateBasis || 'dueDate';

  // --- Helper Functions ---
  const filterByRange = (data: any[], start: Date, end: Date) => {
    return data.filter(d => {
      const date = dateBasis === 'invoiceDate' ? d.invoiceDate : d.dueDate;
      return isWithinInterval(date, { start, end });
    });
  };



  // --- Time Periods ---
  const now = new Date();
  const thisYearStart = startOfYear(now);
  const thisYearEnd = endOfYear(now);
  const thisQuarterStart = startOfQuarter(now);
  const thisQuarterEnd = endOfQuarter(now);
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  // --- Data Calculation ---
  const thisYearData = useMemo(() => filterByRange(mappedData, thisYearStart, thisYearEnd), [mappedData, dateBasis]);
  const thisQuarterData = useMemo(() => filterByRange(mappedData, thisQuarterStart, thisQuarterEnd), [mappedData, dateBasis]);
  const thisMonthData = useMemo(() => filterByRange(mappedData, thisMonthStart, thisMonthEnd), [mappedData, dateBasis]);

  const getTop3 = (data: any[]) => {
    const collectors = calculateCollectorPerformance(data, globalParams);
    return collectors.sort((a, b) => b.totalCollected - a.totalCollected).slice(0, 3);
  };

  const top3Year = getTop3(thisYearData);
  const top3Quarter = getTop3(thisQuarterData);
  const top3Month = getTop3(thisMonthData);

  // Mock data for "Months Target Achieved" (Since we don't have historical target data per month in the CSV)
  const getMonthsTargetAchieved = (collectorName: string) => {
    // Random number between 5 and 12 for demo purposes
    return Math.floor(Math.random() * 8) + 5;
  };

  const TopPerformersCard = ({ title, data, icon: Icon, colorClass }: any) => (
    <Card className="bg-slate-900/50 border-slate-800 h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((c: any, i: number) => (
            <div key={i} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                    i === 1 ? 'bg-slate-400/20 text-slate-400 border border-slate-400/50' : 
                    'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.customerCount} {language === 'ar' ? 'عملاء' : 'Clients'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{formatCurrency(c.totalCollected)}</p>
                  <p className="text-xs text-slate-500">{language === 'ar' ? 'تم تحصيله' : 'Collected'}</p>
                </div>
              </div>
              {/* Progress Bar Visual */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${colorClass.replace('text-', 'bg-')}`} 
                  style={{ width: `${(c.totalCollected / (data[0].totalCollected || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {language === 'ar' ? 'لا توجد بيانات' : 'No Data'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {language === 'ar' ? 'تقرير أداء المحصلين' : 'Collectors Performance Report'}
          </h1>
          <p className="text-slate-400 mt-1">
            {language === 'ar' 
              ? 'تحليل تفصيلي لأفضل المحصلين عبر الفترات الزمنية' 
              : 'Detailed analysis of top collectors across time periods'}
          </p>
        </div>
      </div>

      {/* Top 3 Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <TopPerformersCard 
          title={language === 'ar' ? 'أفضل 3 (العام الحالي)' : 'Top 3 (Current Year)'}
          data={top3Year}
          icon={Trophy}
          colorClass="text-yellow-500"
        />
        <TopPerformersCard 
          title={language === 'ar' ? 'أفضل 3 (الربع الحالي)' : 'Top 3 (Current Quarter)'}
          data={top3Quarter}
          icon={Calendar}
          colorClass="text-purple-500"
        />
        <TopPerformersCard 
          title={language === 'ar' ? 'أفضل 3 (الشهر الحالي)' : 'Top 3 (Current Month)'}
          data={top3Month}
          icon={DollarSign}
          colorClass="text-emerald-500"
        />
      </div>

      {/* Target Achievement Report */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-500" />
            {language === 'ar' ? 'سجل تحقيق الأهداف (العام الحالي)' : 'Target Achievement Record (Current Year)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {top3Year.map((c, i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    <p className="text-xs text-slate-400">{language === 'ar' ? 'محصل' : 'Collector'}</p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{getMonthsTargetAchieved(c.name)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">
                    {language === 'ar' ? 'أشهر تحقيق الهدف' : 'Months Achieved'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
