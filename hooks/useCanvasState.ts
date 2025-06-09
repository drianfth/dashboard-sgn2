"use client";

import { useState, useCallback } from 'react';
import { CanvasState, DrawingElement, Position } from '@/types';

const initialCanvasState: CanvasState = {
  elements: [],
  selectedElements: [],
  clipboard: [],
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  panOffset: { x: 0, y: 0 }
};

export function useCanvasState() {
  const [canvasState, setCanvasState] = useState<CanvasState>(initialCanvasState);

  const addToHistory = useCallback((elements: DrawingElement[]) => {
    setCanvasState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push([...elements]);
      
      // Limit history size to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const addElement = useCallback((element: DrawingElement) => {
    console.log('Adding element to canvas state:', element);
    setCanvasState(prev => {
      const newElements = [...prev.elements, element];
      addToHistory(newElements);
      
      return {
        ...prev,
        elements: newElements
      };
    });
  }, [addToHistory]);

  const removeElement = useCallback((elementId: string) => {
    console.log('Removing element:', elementId);
    setCanvasState(prev => {
      const newElements = prev.elements.filter(el => el.id !== elementId);
      addToHistory(newElements);
      
      return {
        ...prev,
        elements: newElements,
        selectedElements: prev.selectedElements.filter(id => id !== elementId)
      };
    });
  }, [addToHistory]);

  const removeElements = useCallback((elementIds: string[]) => {
    console.log('Removing elements:', elementIds);
    setCanvasState(prev => {
      const newElements = prev.elements.filter(el => !elementIds.includes(el.id));
      addToHistory(newElements);
      
      return {
        ...prev,
        elements: newElements,
        selectedElements: prev.selectedElements.filter(id => !elementIds.includes(id))
      };
    });
  }, [addToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<DrawingElement>) => {
    console.log('Updating element:', elementId, updates);
    setCanvasState(prev => {
      const newElements = prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      );
      
      // Only add to history for significant changes (like position changes)
      if (updates.position || updates.dimensions || updates.data) {
        addToHistory(newElements);
      }
      
      return {
        ...prev,
        elements: newElements
      };
    });
  }, [addToHistory]);

  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    console.log('Selecting element:', elementId);
    setCanvasState(prev => {
      if (!elementId) {
        // Clear selection
        return {
          ...prev,
          selectedElements: []
        };
      }
      
      return {
        ...prev,
        selectedElements: multiSelect 
          ? prev.selectedElements.includes(elementId)
            ? prev.selectedElements.filter(id => id !== elementId)
            : [...prev.selectedElements, elementId]
          : [elementId]
      };
    });
  }, []);

  const selectElements = useCallback((elementIds: string[]) => {
    setCanvasState(prev => ({
      ...prev,
      selectedElements: elementIds
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setCanvasState(prev => ({
      ...prev,
      selectedElements: []
    }));
  }, []);

  const undo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          elements: [...prev.history[newIndex]],
          historyIndex: newIndex,
          selectedElements: []
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setCanvasState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          elements: [...prev.history[newIndex]],
          historyIndex: newIndex,
          selectedElements: []
        };
      }
      return prev;
    });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom))
    }));
  }, []);

  const setPanOffset = useCallback((offset: Position) => {
    setCanvasState(prev => ({
      ...prev,
      panOffset: offset
    }));
  }, []);

  const copyElements = useCallback((elementIds: string[]) => {
    setCanvasState(prev => {
      const elementsToCopy = prev.elements.filter(el => elementIds.includes(el.id));
      return {
        ...prev,
        clipboard: elementsToCopy.map(el => ({ ...el, id: `${el.id}_copy` }))
      };
    });
  }, []);

  const pasteElements = useCallback(() => {
    setCanvasState(prev => {
      if (prev.clipboard.length === 0) return prev;
      
      const pastedElements = prev.clipboard.map(el => ({
        ...el,
        id: `${el.type}_${Date.now()}_${Math.random()}`,
        position: {
          x: el.position.x + 20,
          y: el.position.y + 20
        },
        timestamp: Date.now()
      }));
      
      const newElements = [...prev.elements, ...pastedElements];
      addToHistory(newElements);
      
      return {
        ...prev,
        elements: newElements,
        selectedElements: pastedElements.map(el => el.id)
      };
    });
  }, [addToHistory]);

  const canUndo = canvasState.historyIndex > 0;
  const canRedo = canvasState.historyIndex < canvasState.history.length - 1;

  return {
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
  };
}