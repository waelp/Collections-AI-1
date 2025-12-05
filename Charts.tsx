import React from 'react';
import { formatNumber, formatCurrency, formatPercent, formatCompact } from '@/lib/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendChartProps {
  data: any[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Performance Trends (6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `${value}%`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="collectionRate" 
                name="Collection Rate" 
                stroke="var(--color-emerald-500)" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="cei" 
                name="CEI" 
                stroke="var(--primary)" 
                strokeWidth={2} 
                dot={false} 
              />
              <Line 
                type="monotone" 
                dataKey="dso" 
                name="DSO" 
                stroke="var(--destructive)" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function VolumeChart({ data }: TrendChartProps) {
  // Mock volume data based on trends for visualization
  const volumeData = data.map(d => ({
    name: d.name,
    collected: d.collectionRate * 1000,
    outstanding: (100 - d.collectionRate) * 1000,
  }));

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Volume Analysis</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `$${value/1000}k`} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend />
              <Bar dataKey="collected" name="Collected" fill="var(--color-emerald-500)" stackId="a" radius={[0, 0, 4, 4]} />
              <Bar dataKey="outstanding" name="Outstanding" fill="var(--primary)" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
