"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToolButton } from './ToolButton';
import { ToolGroup } from './ToolGroup';
// import { ColorPicker } from '../UI/ColorPicker';
import { DrawingTool, StrokeProperties } from '@/types';
import {
  MousePointer2,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Type,
  Eraser,
  BarChart3,
  Undo,
  Redo,
  Grid3X3
} from 'lucide-react';
import { ColorPicker } from '../ui/ColorPicker';

interface MainToolbarProps {
  selectedTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  strokeProperties: StrokeProperties;
  onStrokeChange: (properties: Partial<StrokeProperties>) => void;
  onChartModalOpen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
}

export function MainToolbar({
  selectedTool,
  onToolSelect,
  strokeProperties,
  onStrokeChange,
  onChartModalOpen,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showGrid,
  onToggleGrid
}: MainToolbarProps) {
  const tools = [
    { tool: 'select' as DrawingTool, icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { tool: 'pen' as DrawingTool, icon: Pen, label: 'Pen', shortcut: 'P' },
    { tool: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle', shortcut: 'R' },
    { tool: 'circle' as DrawingTool, icon: Circle, label: 'Circle', shortcut: 'O' },
    { tool: 'arrow' as DrawingTool, icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
    { tool: 'line' as DrawingTool, icon: Minus, label: 'Line', shortcut: 'L' },
    { tool: 'text' as DrawingTool, icon: Type, label: 'Text', shortcut: 'T' },
    { tool: 'eraser' as DrawingTool, icon: Eraser, label: 'Eraser', shortcut: 'E' },
  ];

  return (
    <Card className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 p-3 shadow-lg border-gray-200">
      <div className="flex items-center space-x-2">
        {/* History Controls */}
        <ToolGroup>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-10 w-10 p-0"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-10 w-10 p-0"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </ToolGroup>

        {/* Drawing Tools */}
        <ToolGroup>
          {tools.map(({ tool, icon, label, shortcut }) => (
            <ToolButton
              key={tool}
              icon={icon}
              label={label}
              shortcut={shortcut}
              isActive={selectedTool === tool}
              onClick={() => onToolSelect(tool)}
            />
          ))}
        </ToolGroup>

        {/* Chart Tool */}
        <ToolGroup>
          <ToolButton
            icon={BarChart3}
            label="Insert Chart"
            onClick={onChartModalOpen}
          />
        </ToolGroup>

        {/* Stroke Properties */}
        <ToolGroup>
          <ColorPicker
            color={strokeProperties.color}
            onChange={(color) => onStrokeChange({ color })}
            label="Stroke Color"
          />
          <div className="flex items-center space-x-2 px-2">
            <span className="text-xs text-gray-600">Size:</span>
            <div className="w-20">
              <Slider
                value={[strokeProperties.width]}
                onValueChange={([width]) => onStrokeChange({ width })}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
            <span className="text-xs text-gray-600 w-6 text-right">
              {strokeProperties.width}
            </span>
          </div>
        </ToolGroup>

        {/* View Controls */}
        <ToolGroup showSeparator={false}>
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="sm"
            onClick={onToggleGrid}
            className="h-10 w-10 p-0"
            title="Toggle Grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </ToolGroup>
      </div>
    </Card>
  );
}