"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { ChartData } from '@/types';
import { ColorPicker } from '../ui/ColorPicker';

interface ChartEditorProps {
  chartData: ChartData;
  onDataChange: (data: ChartData) => void;
}

export function ChartEditor({ chartData, onDataChange }: ChartEditorProps) {
  const [newLabel, setNewLabel] = useState('');

  const addLabel = () => {
    if (newLabel.trim()) {
      const updatedData = {
        ...chartData,
        labels: [...chartData.labels, newLabel.trim()],
        datasets: chartData.datasets.map(dataset => ({
          ...dataset,
          data: [...dataset.data, 0]
        }))
      };
      onDataChange(updatedData);
      setNewLabel('');
    }
  };

  const removeLabel = (index: number) => {
    const updatedData = {
      ...chartData,
      labels: chartData.labels.filter((_, i) => i !== index),
      datasets: chartData.datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.filter((_, i) => i !== index)
      }))
    };
    onDataChange(updatedData);
  };

  const updateLabelValue = (labelIndex: number, datasetIndex: number, value: number) => {
    const updatedData = {
      ...chartData,
      datasets: chartData.datasets.map((dataset, dsIndex) =>
        dsIndex === datasetIndex
          ? {
            ...dataset,
            data: dataset.data.map((val, valIndex) =>
              valIndex === labelIndex ? value : val
            )
          }
          : dataset
      )
    };
    onDataChange(updatedData);
  };

  const addDataset = () => {
    const newDataset = {
      name: `Series ${chartData.datasets.length + 1}`,
      data: new Array(chartData.labels.length).fill(0),
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
    };
    onDataChange({
      ...chartData,
      datasets: [...chartData.datasets, newDataset]
    });
  };

  const removeDataset = (index: number) => {
    onDataChange({
      ...chartData,
      datasets: chartData.datasets.filter((_, i) => i !== index)
    });
  };

  const updateDatasetName = (index: number, name: string) => {
    const updatedData = {
      ...chartData,
      datasets: chartData.datasets.map((dataset, i) =>
        i === index ? { ...dataset, name } : dataset
      )
    };
    onDataChange(updatedData);
  };

  const updateDatasetColor = (index: number, color: string) => {
    const updatedData = {
      ...chartData,
      datasets: chartData.datasets.map((dataset, i) =>
        i === index ? { ...dataset, color } : dataset
      )
    };
    onDataChange(updatedData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Data Configuration</Label>
      </div>

      {/* Labels Section */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Categories</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add category"
                className="w-32"
                onKeyPress={(e) => e.key === 'Enter' && addLabel()}
              />
              <Button size="sm" onClick={addLabel}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {chartData.labels.map((label, index) => (
              <Badge key={index} variant="outline" className="flex items-center space-x-1">
                <span>{label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-100"
                  onClick={() => removeLabel(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Datasets Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Data Series</Label>
            <Button size="sm" onClick={addDataset} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Series
            </Button>
          </div>

          {chartData.datasets.map((dataset, datasetIndex) => (
            <div key={datasetIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Input
                    value={dataset.name}
                    onChange={(e) => updateDatasetName(datasetIndex, e.target.value)}
                    className="w-32"
                  />
                  <ColorPicker
                    color={dataset.color || '#3B82F6'}
                    onChange={(color) => updateDatasetColor(datasetIndex, color)}
                  />
                </div>
                {chartData.datasets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDataset(datasetIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {chartData.labels.map((label, labelIndex) => (
                  <div key={labelIndex} className="flex items-center space-x-2">
                    <Label className="text-xs w-16 truncate">{label}:</Label>
                    <Input
                      type="number"
                      value={dataset.data[labelIndex] || 0}
                      onChange={(e) => updateLabelValue(
                        labelIndex,
                        datasetIndex,
                        parseFloat(e.target.value) || 0
                      )}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}