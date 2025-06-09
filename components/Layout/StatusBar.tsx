"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface StatusBarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  elementCount: number;
  selectedCount: number;
}

export function StatusBar({ 
  zoom, 
  onZoomIn, 
  onZoomOut, 
  onFitToScreen, 
  elementCount, 
  selectedCount 
}: StatusBarProps) {
  return (
    <div className="h-10 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <Badge variant="secondary" className="text-xs">
          {elementCount} element{elementCount !== 1 ? 's' : ''}
        </Badge>
        {selectedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {selectedCount} selected
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onFitToScreen}>
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}