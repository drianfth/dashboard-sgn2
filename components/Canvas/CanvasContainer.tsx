"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { MainToolbar } from '../Toolbar/MainToolbar';
import { ChartModal } from '../Charts/ChartModal';
import { ChartColorEditor } from '../Charts/ChartColorEditor';
import { DrawingTool, StrokeProperties, DrawingElement, ChartConfig } from '@/types';

interface CanvasContainerProps {
  selectedTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  strokeProperties: StrokeProperties;
  onStrokeChange: (properties: Partial<StrokeProperties>) => void;
  elements: DrawingElement[];
  onElementAdd: (element: DrawingElement) => void;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<DrawingElement>) => void;
  onElementRemove?: (elementId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  isChartModalOpen: boolean;
  onToggleChartModal: () => void;
  selectedElements?: string[];
}

export function CanvasContainer({
  selectedTool,
  onToolSelect,
  strokeProperties,
  onStrokeChange,
  elements,
  onElementAdd,
  onElementSelect,
  onElementUpdate,
  onElementRemove,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  isChartModalOpen,
  onToggleChartModal,
  selectedElements = []
}: CanvasContainerProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [isChartColorEditorOpen, setIsChartColorEditorOpen] = useState(false);
  const [selectedChartConfig, setSelectedChartConfig] = useState<ChartConfig | null>(null);

  const handleChartCreate = useCallback((chartConfig: ChartConfig) => {
    console.log('Creating chart with config:', chartConfig);
    
    // Convert chart config to drawing element
    const chartElement: DrawingElement = {
      id: chartConfig.id,
      type: 'chart',
      position: chartConfig.position,
      dimensions: chartConfig.dimensions,
      properties: {
        stroke: strokeProperties
      },
      data: chartConfig, // Store the entire chart config
      timestamp: Date.now()
    };
    
    console.log('Chart element created:', chartElement);
    onElementAdd(chartElement);
    onToggleChartModal();
  }, [strokeProperties, onElementAdd, onToggleChartModal]);

  const handleElementSelect = useCallback((elementId: string) => {
    if (onElementSelect) {
      onElementSelect(elementId);
      
      // Check if selected element is a chart
      const selectedElement = elements.find(el => el.id === elementId);
      if (selectedElement && selectedElement.type === 'chart' && selectedElement.data) {
        setSelectedChartConfig(selectedElement.data);
        setIsChartColorEditorOpen(true);
      } else {
        setIsChartColorEditorOpen(false);
      }
    }
  }, [onElementSelect, elements]);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<DrawingElement>) => {
    if (onElementUpdate) {
      onElementUpdate(elementId, updates);
    }
  }, [onElementUpdate]);

  const handleElementRemove = useCallback((elementId: string) => {
    if (onElementRemove) {
      onElementRemove(elementId);
    }
  }, [onElementRemove]);

  const handleChartUpdate = useCallback((updates: Partial<ChartConfig>) => {
    if (selectedElements.length > 0 && onElementUpdate) {
      const selectedElement = elements.find(el => el.id === selectedElements[0]);
      if (selectedElement && selectedElement.type === 'chart') {
        const updatedData = {
          ...selectedElement.data,
          ...updates
        };
        onElementUpdate(selectedElement.id, { data: updatedData });
        setSelectedChartConfig(updatedData);
      }
    }
  }, [selectedElements, elements, onElementUpdate]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent shortcuts when typing in text inputs or editing text
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        isTextEditing ||
        (e.target as HTMLElement)?.contentEditable === 'true') {
      return;
    }

    // Handle Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          break;
        case 'y':
          e.preventDefault();
          onRedo();
          break;
        default:
          // Don't prevent other Ctrl/Cmd shortcuts
          break;
      }
      return; // Exit early for Ctrl/Cmd combinations
    }

    // Handle tool shortcuts (only when not holding Ctrl/Cmd)
    switch (e.key.toLowerCase()) {
      case 'v':
        e.preventDefault();
        onToolSelect('select');
        break;
      case 'p':
        e.preventDefault();
        onToolSelect('pen');
        break;
      case 'r':
        e.preventDefault();
        onToolSelect('rectangle');
        break;
      case 'o':
        e.preventDefault();
        onToolSelect('circle');
        break;
      case 'a':
        e.preventDefault();
        onToolSelect('arrow');
        break;
      case 'l':
        e.preventDefault();
        onToolSelect('line');
        break;
      case 't':
        e.preventDefault();
        onToolSelect('text');
        break;
      case 'e':
        e.preventDefault();
        onToolSelect('eraser');
        break;
      case 'escape':
        e.preventDefault();
        // Clear selection or cancel current operation
        if (onElementSelect) {
          onElementSelect('');
        }
        // Close chart color editor if open
        if (isChartColorEditorOpen) {
          setIsChartColorEditorOpen(false);
        }
        break;
      case 'delete':
      case 'backspace':
        e.preventDefault();
        if (selectedElements.length > 0 && onElementRemove) {
          selectedElements.forEach(elementId => {
            onElementRemove(elementId);
          });
        }
        break;
    }
  }, [onUndo, onRedo, onToolSelect, onElementSelect, onElementRemove, isTextEditing, selectedElements, isChartColorEditorOpen]);

  // Setup keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative w-full h-full bg-white">
      {/* Main Toolbar */}
      <MainToolbar
        selectedTool={selectedTool}
        onToolSelect={onToolSelect}
        strokeProperties={strokeProperties}
        onStrokeChange={onStrokeChange}
        onChartModalOpen={onToggleChartModal}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      {/* Drawing Canvas */}
      <DrawingCanvas
        tool={selectedTool}
        strokeProperties={strokeProperties}
        onElementAdd={onElementAdd}
        onElementSelect={handleElementSelect}
        onElementUpdate={handleElementUpdate}
        onElementRemove={handleElementRemove}
        elements={elements}
        zoom={zoom}
        showGrid={showGrid}
        selectedElements={selectedElements}
        className="absolute inset-0"
        onTextEditingChange={setIsTextEditing}
      />

      {/* Chart Modal */}
      <ChartModal
        isOpen={isChartModalOpen}
        onClose={onToggleChartModal}
        onChartCreate={handleChartCreate}
      />

      {/* Chart Color Editor */}
      <ChartColorEditor
        isOpen={isChartColorEditorOpen}
        onClose={() => setIsChartColorEditorOpen(false)}
        chartConfig={selectedChartConfig}
        onUpdate={handleChartUpdate}
      />
    </div>
  );
}