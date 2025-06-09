"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartSelector } from './ChartSelector';
import { ChartEditor } from './ChartEditor';
import { ChartRenderer } from './ChartRenderer';
import { ChartType, ChartConfig, ChartData } from '@/types';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChartCreate: (chartConfig: ChartConfig) => void;
}

const initialChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      name: 'Series 1',
      data: [10, 20, 15, 25, 30],
      color: '#3B82F6'
    }
  ]
};

export function ChartModal({ isOpen, onClose, onChartCreate }: ChartModalProps) {
  const [selectedType, setSelectedType] = useState<ChartType>('bar');
  const [chartData, setChartData] = useState<ChartData>(initialChartData);
  const [chartTitle, setChartTitle] = useState('Sample Chart');
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  const handleCreate = () => {
    console.log('Creating chart with data:', { selectedType, chartData, chartTitle, dimensions });
    
    // Generate unique position for each new chart
    const randomOffset = Math.floor(Math.random() * 100);
    
    const chartConfig: ChartConfig = {
      id: `chart_${Date.now()}_${Math.random()}`, // Ensure unique ID
      type: selectedType,
      data: chartData,
      title: chartTitle,
      position: { x: 100 + randomOffset, y: 100 + randomOffset }, // Offset position for multiple charts
      dimensions,
      styling: {
        backgroundColor: '#ffffff',
        borderColor: '#e5e7eb',
        textColor: '#374151'
      }
    };

    console.log('Final chart config:', chartConfig);
    onChartCreate(chartConfig);
  };

  const handleReset = () => {
    setSelectedType('bar');
    setChartData(initialChartData);
    setChartTitle('Sample Chart');
    setDimensions({ width: 400, height: 300 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Insert Chart</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            {/* Chart Type Selection */}
            <div>
              <Label className="text-base font-medium">Chart Type</Label>
              <ChartSelector
                selectedType={selectedType}
                onTypeSelect={setSelectedType}
              />
            </div>

            {/* Chart Title */}
            <div>
              <Label htmlFor="chart-title">Chart Title</Label>
              <Input
                id="chart-title"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title"
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chart-width">Width (px)</Label>
                <Input
                  id="chart-width"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ 
                    ...prev, 
                    width: parseInt(e.target.value) || 400 
                  }))}
                  min={200}
                  max={800}
                />
              </div>
              <div>
                <Label htmlFor="chart-height">Height (px)</Label>
                <Input
                  id="chart-height"
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ 
                    ...prev, 
                    height: parseInt(e.target.value) || 300 
                  }))}
                  min={150}
                  max={600}
                />
              </div>
            </div>

            {/* Data Editor */}
            <ChartEditor
              chartData={chartData}
              onDataChange={setChartData}
            />
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Preview</Label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center">
              <ChartRenderer
                type={selectedType}
                data={chartData}
                title={chartTitle}
                dimensions={dimensions}
                styling={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e5e7eb',
                  textColor: '#374151'
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Insert Chart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}