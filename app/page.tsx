"use client";

import { useState, useEffect } from 'react';
import { useCanvasState } from '@/hooks/useCanvasState';
import { useUIState } from '@/hooks/useUIState';
import { MainLayout } from '@/components/Layout/MainLayout';
import { CanvasContainer } from '@/components/Canvas/CanvasContainer';

export default function Home() {
  const {
    canvasState,
    addElement,
    removeElement,
    removeElements,
    updateElement,
    selectElement,
    selectElements,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
    setZoom,
    setPanOffset,
    copyElements,
    pasteElements
  } = useCanvasState();

  const {
    uiState,
    setSelectedTool,
    setStrokeProperties,
    setFillProperties,
    toggleChartModal,
    toggleSidebar,
    togglePropertiesPanel
  } = useUIState();

  const handleZoomIn = () => setZoom(canvasState.zoom * 1.2);
  const handleZoomOut = () => setZoom(canvasState.zoom / 1.2);
  const handleFitToScreen = () => setZoom(1);

  const handleExport = () => {
    // Create export functionality
    const dataStr = JSON.stringify({
      elements: canvasState.elements,
      zoom: canvasState.zoom,
      panOffset: canvasState.panOffset
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.elements) {
            // Clear current elements and load imported ones
            data.elements.forEach((element: any) => {
              addElement(element);
            });
          }
        } catch (error) {
          console.error('Error importing file:', error);
          alert('Error importing file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleElementSelect = (elementId: string) => {
    selectElement(elementId);
  };

  const handleElementRemove = (elementId: string) => {
    removeElement(elementId);
  };

  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Prevent shortcuts when typing in text inputs
    if (e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.contentEditable === 'true') {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          if (canvasState.selectedElements.length > 0) {
            copyElements(canvasState.selectedElements);
          }
          break;
        case 'v':
          e.preventDefault();
          pasteElements();
          break;
        case 'a':
          e.preventDefault();
          selectElements(canvasState.elements.map(el => el.id));
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
      }
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (canvasState.selectedElements.length > 0) {
        removeElements(canvasState.selectedElements);
      }
    }
  };

  // Setup keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [canvasState.selectedElements, copyElements, pasteElements, selectElements, undo, redo, removeElements]);

  return (
    <MainLayout
      onMenuClick={toggleSidebar}
      onExport={handleExport}
      onImport={handleImport}
      zoom={canvasState.zoom}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFitToScreen={handleFitToScreen}
      elementCount={canvasState.elements.length}
      selectedCount={canvasState.selectedElements.length}
    >
      <CanvasContainer
        selectedTool={uiState.selectedTool}
        onToolSelect={setSelectedTool}
        strokeProperties={uiState.strokeProperties}
        onStrokeChange={setStrokeProperties}
        elements={canvasState.elements}
        onElementAdd={addElement}
        onElementSelect={handleElementSelect}
        onElementUpdate={updateElement}
        onElementRemove={handleElementRemove}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        zoom={canvasState.zoom}
        isChartModalOpen={uiState.isChartModalOpen}
        onToggleChartModal={toggleChartModal}
        selectedElements={canvasState.selectedElements}
      />
    </MainLayout>
  );
}