import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DateFilter, EvaluationBasis } from '@/types/data';
import { Calendar, Calculator } from 'lucide-react';

interface FiltersProps {
  period: DateFilter;
  onPeriodChange: (value: DateFilter) => void;
  basis: EvaluationBasis;
  onBasisChange: (value: EvaluationBasis) => void;
}

export function Filters({ period, onPeriodChange, basis, onBasisChange }: FiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Time Period</Label>
          <Select value={period} onValueChange={(v) => onPeriodChange(v as DateFilter)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-px h-10 bg-border mx-2 hidden md:block" />

      <div className="flex items-center gap-2">
        <Calculator className="w-4 h-4 text-muted-foreground" />
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Evaluation Basis</Label>
          <Select value={basis} onValueChange={(v) => onBasisChange(v as EvaluationBasis)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select basis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoiceDate">Invoice Date</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
