"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ColorPicker } from '../UI/ColorPicker';
import { ChartData, ChartConfig } from '@/types';

interface ChartColorEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chartConfig: ChartConfig | null;
  onUpdate: (updates: Partial<ChartConfig>) => void;
}

export function ChartColorEditor({ isOpen, onClose, chartConfig, onUpdate }: ChartColorEditorProps) {
  const [localData, setLocalData] = useState<ChartData | null>(null);
  const [localStyling, setLocalStyling] = useState<any>(null);
  const [localTitle, setLocalTitle] = useState<string>('');

  // Initialize local state when chart config changes
  useEffect(() => {
    if (chartConfig) {
      setLocalData(chartConfig.data);
      setLocalStyling(chartConfig.styling);
      setLocalTitle(chartConfig.title || '');
    }
  }, [chartConfig]);

  if (!chartConfig || !localData || !localStyling) return null;

  const handleDatasetColorChange = (datasetIndex: number, color: string) => {
    const updatedData = {
      ...localData,
      datasets: localData.datasets.map((dataset, index) => 
        index === datasetIndex ? { ...dataset, color } : dataset
      )
    };
    setLocalData(updatedData);
  };

  const handleStylingChange = (key: string, value: string) => {
    const updatedStyling = {
      ...localStyling,
      [key]: value
    };
    setLocalStyling(updatedStyling);
  };

  const handleApply = () => {
    onUpdate({
      data: localData,
      styling: localStyling,
      title: localTitle
    });
    onClose();
  };

  const handleReset = () => {
    if (chartConfig) {
      setLocalData(chartConfig.data);
      setLocalStyling(chartConfig.styling);
      setLocalTitle(chartConfig.title || '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Chart Colors</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chart Title */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">Chart Title</Label>
            <Input
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Enter chart title"
            />
          </Card>

          {/* Chart Styling */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">Chart Styling</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm">Background Color</Label>
                <ColorPicker
                  color={localStyling.backgroundColor || '#ffffff'}
                  onChange={(color) => handleStylingChange('backgroundColor', color)}
                />
              </div>
              <div>
                <Label className="text-sm">Border Color</Label>
                <ColorPicker
                  color={localStyling.borderColor || '#e5e7eb'}
                  onChange={(color) => handleStylingChange('borderColor', color)}
                />
              </div>
              <div>
                <Label className="text-sm">Text Color</Label>
                <ColorPicker
                  color={localStyling.textColor || '#374151'}
                  onChange={(color) => handleStylingChange('textColor', color)}
                />
              </div>
            </div>
          </Card>

          {/* Dataset Colors */}
          <Card className="p-4">
            <Label className="text-base font-medium mb-3 block">Data Series Colors</Label>
            <div className="space-y-3">
              {localData.datasets.map((dataset, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: dataset.color || '#3B82F6' }}
                    />
                    <span className="font-medium">{dataset.name}</span>
                  </div>
                  <ColorPicker
                    color={dataset.color || '#3B82F6'}
                    onChange={(color) => handleDatasetColorChange(index, color)}
                  />
                </div>
              ))}
            </div>
          </Card>
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
            <Button onClick={handleApply}>
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}