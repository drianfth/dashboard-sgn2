"use client";

import { useState, useCallback } from 'react';
import { UIState, DrawingTool, StrokeProperties, FillProperties } from '@/types';

const initialUIState: UIState = {
  selectedTool: 'select',
  strokeProperties: {
    color: '#000000',
    width: 2,
    style: 'solid'
  },
  fillProperties: {
    color: 'transparent',
    opacity: 1
  },
  isChartModalOpen: false,
  isSidebarOpen: true,
  isPropertiesPanelOpen: true
};

export function useUIState() {
  const [uiState, setUIState] = useState<UIState>(initialUIState);

  const setSelectedTool = useCallback((tool: DrawingTool) => {
    setUIState(prev => ({
      ...prev,
      selectedTool: tool
    }));
  }, []);

  const setStrokeProperties = useCallback((properties: Partial<StrokeProperties>) => {
    setUIState(prev => ({
      ...prev,
      strokeProperties: {
        ...prev.strokeProperties,
        ...properties
      }
    }));
  }, []);

  const setFillProperties = useCallback((properties: Partial<FillProperties>) => {
    setUIState(prev => ({
      ...prev,
      fillProperties: {
        ...prev.fillProperties,
        ...properties
      }
    }));
  }, []);

  const toggleChartModal = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isChartModalOpen: !prev.isChartModalOpen
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isSidebarOpen: !prev.isSidebarOpen
    }));
  }, []);

  const togglePropertiesPanel = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      isPropertiesPanelOpen: !prev.isPropertiesPanelOpen
    }));
  }, []);

  return {
    uiState,
    setSelectedTool,
    setStrokeProperties,
    setFillProperties,
    toggleChartModal,
    toggleSidebar,
    togglePropertiesPanel
  };
}