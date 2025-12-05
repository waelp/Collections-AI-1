import { useData } from '@/contexts/DataContext';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateCollectorPerformance } from '@/lib/analytics';
import { DEFAULT_PARAMETERS } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemo } from 'react';

export default function CollectorsBonus() {
  const { mappedData, globalParams } = useData();
  const { direction } = useTheme();
  
  // Filter out collectors with 0 total balance
  const activeCollectorsData = useMemo(() => {
    // Group by collector first to check total balance
    const collectorBalances = new Map<string, number>();
    mappedData.forEach(d => {
      if (d.collectorName) {
        collectorBalances.set(d.collectorName, (collectorBalances.get(d.collectorName) || 0) + d.totalBalance);
      }
    });

    // Filter mappedData to only include active collectors
    return mappedData.filter(d => {
      const balance = collectorBalances.get(d.collectorName || '');
      return balance && balance !== 0;
    });
  }, [mappedData]);

  const collectors = useMemo(() => 
    calculateCollectorPerformance(activeCollectorsData, globalParams),
  [activeCollectorsData, globalParams]);

  // Mock salary data (In real app, fetch from Admin settings)
  const getSalary = (name: string) => {
    // This would come from the Admin context/state
    return 10000; 
  };

  // Mock bonus rules (In real app, fetch from Admin settings)
  const calculateBonus = (score: number, salary: number) => {
    // Example logic based on score
    if (score >= 45) return salary * 0.075; // 7.5%
    if (score >= 40) return salary * 0.05;  // 5.0%
    if (score >= 35) return salary * 0.025; // 2.5%
    return 0;
  };

  return (
    <div className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {direction === 'rtl' ? 'المحصلين والمكافآت' : 'Collectors & Bonus'}
        </h1>
        <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 gap-2">
          <Download className="h-4 w-4" />
          {direction === 'rtl' ? 'تصدير جميع المحصلين' : 'Export All'}
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            {direction === 'rtl' ? 'أداء المحصلين (الرصيد القائم > 0)' : 'Collector Performance (Active Balance > 0)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs text-slate-500 uppercase bg-slate-900/50 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold">{direction === 'rtl' ? 'المحصل' : 'COLLECTOR'}</th>
                  <th className="px-4 py-3 font-bold">{direction === 'rtl' ? 'الراتب' : 'SALARY'}</th>
                  <th className="px-4 py-3 font-bold">{direction === 'rtl' ? 'المحصل / الهدف' : 'COLLECTED / TARGET'}</th>
                  <th className="px-4 py-3 font-bold">DSO</th>
                  <th className="px-4 py-3 font-bold">CEI</th>
                  <th className="px-4 py-3 font-bold">ADD</th>
                  <th className="px-4 py-3 font-bold">30 DAYS</th>
                  <th className="px-4 py-3 font-bold text-blue-400">{direction === 'rtl' ? 'النقاط' : 'SCORE'}</th>
                  <th className="px-4 py-3 font-bold text-emerald-400">{direction === 'rtl' ? 'المكافأة' : 'BONUS'}</th>
                  <th className="px-4 py-3 font-bold text-right">{direction === 'rtl' ? 'التقييم' : 'RATING'}</th>
                </tr>
              </thead>
              <tbody>
                {collectors.map((collector) => {
                  const salary = getSalary(collector.name);
                  const bonus = calculateBonus(collector.score, salary);
                  
                  return (
                    <tr key={collector.name} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="px-4 py-4 font-medium text-white">{collector.name}</td>
                      <td className="px-4 py-4">{new Intl.NumberFormat('en-US').format(salary)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">
                            {collector.target > 0 
                              ? ((collector.totalCollected / collector.target) * 100).toFixed(1) 
                              : '0.0'}%
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(collector.totalCollected)} / 
                            {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(collector.target)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white">{Math.round(collector.dso)}</td>
                      <td className="px-4 py-4 text-white">{Math.round(collector.cei)}%</td>
                      <td className="px-4 py-4 text-white">{Math.round(collector.add)}</td>
                      <td className="px-4 py-4 text-white">
                        {/* Placeholder for 30 Days collection % - assuming logic needs to be added to analytics */}
                        {((Math.random() * 20) + 10).toFixed(1)}%
                      </td> 
                      <td className="px-4 py-4 font-bold text-blue-400">{Math.round(collector.score)}</td>
                      <td className="px-4 py-4 font-bold text-emerald-400">{new Intl.NumberFormat('en-US').format(bonus)} SAR</td>
                      <td className="px-4 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          collector.rating === 'Outstanding' ? 'bg-purple-500/20 text-purple-400' :
                          collector.rating === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' :
                          collector.rating === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {collector.rating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {collectors.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      {direction === 'rtl' ? 'لا توجد بيانات متاحة' : 'No Data Available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
