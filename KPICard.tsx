import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info, ArrowUp, ArrowDown, Minus, LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/formatters";

interface KPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  trend?: number;
  color?: string;
  info?: string;
  target?: number;
  format?: 'number' | 'currency' | 'percent';
  inverseTrend?: boolean;
  icon?: LucideIcon;
}

export function KPICard({ 
  title, 
  value, 
  previousValue, 
  trend, 
  color, 
  info,
  target,
  format = 'number',
  inverseTrend = false,
  icon: Icon
}: KPICardProps) {
  
  // Format value based on type
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return formatCurrency(val, 'USD');
    }
    if (format === 'percent') {
      return formatPercent(val);
    }
    return formatNumber(val);
  };

  // Determine trend color and icon
  const getTrendInfo = (trendValue: number) => {
    if (trendValue === 0) return { color: "text-slate-500", icon: Minus };
    
    // Default: Positive is Good (Green), Negative is Bad (Red)
    // Inverse: Positive is Bad (Red), Negative is Good (Green) -> e.g. DSO
    const isPositiveGood = !inverseTrend;
    const isGood = isPositiveGood ? trendValue > 0 : trendValue < 0;
    
    return {
      color: isGood ? "text-emerald-500" : "text-red-500",
      icon: trendValue > 0 ? ArrowUp : ArrowDown
    };
  };

  const trendInfo = trend !== undefined ? getTrendInfo(trend) : { color: "", icon: Minus };
  const TrendIcon = trendInfo.icon;

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-slate-600" />}
            {title}
          </p>
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-slate-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h3 className={cn("text-2xl font-bold", color || "text-white")}>
              {formatValue(value)}
            </h3>
            {target !== undefined && (
              <span className="text-xs text-slate-500">
                / {formatValue(target)}
              </span>
            )}
          </div>

          {trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className={cn("flex items-center font-medium", trendInfo.color)}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {Math.round(Math.abs(trend))}%
              </span>
              <span className="text-slate-500">
                vs prev
              </span>
            </div>
          )}
          
          {previousValue !== undefined && trend === undefined && (
             <p className="text-xs text-slate-500">
               Prev: {formatValue(previousValue)}
             </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
