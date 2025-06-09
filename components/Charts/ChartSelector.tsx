"use client";

import { Button } from '@/components/ui/button';
import { ChartType } from '@/types';
import { BarChart3, LineChart, AreaChart, PieChart, ScatterChart, Radar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartSelectorProps {
  selectedType: ChartType;
  onTypeSelect: (type: ChartType) => void;
}

const chartTypes = [
  { type: 'bar' as ChartType, icon: BarChart3, label: 'Bar Chart' },
  { type: 'line' as ChartType, icon: LineChart, label: 'Line Chart' },
  { type: 'area' as ChartType, icon: AreaChart, label: 'Area Chart' },
  { type: 'pie' as ChartType, icon: PieChart, label: 'Pie Chart' },
  { type: 'scatter' as ChartType, icon: ScatterChart, label: 'Scatter Plot' },
  { type: 'radar' as ChartType, icon: Radar, label: 'Radar Chart' },
];

export function ChartSelector({ selectedType, onTypeSelect }: ChartSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {chartTypes.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={selectedType === type ? "default" : "outline"}
          className={cn(
            "h-20 flex flex-col space-y-2",
            selectedType === type && "bg-blue-600 hover:bg-blue-700"
          )}
          onClick={() => onTypeSelect(type)}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}