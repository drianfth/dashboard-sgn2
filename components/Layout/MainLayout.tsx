"use client";

import { ReactNode } from 'react';
import { Header } from './Header';
import { StatusBar } from './StatusBar';

interface MainLayoutProps {
  children: ReactNode;
  onMenuClick: () => void;
  onExport: () => void;
  onImport: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  elementCount: number;
  selectedCount: number;
}

export function MainLayout({
  children,
  onMenuClick,
  onExport,
  onImport,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  elementCount,
  selectedCount
}: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        onMenuClick={onMenuClick}
        onExport={onExport}
        onImport={onImport}
      />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <StatusBar
        zoom={zoom}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitToScreen={onFitToScreen}
        elementCount={elementCount}
        selectedCount={selectedCount}
      />
    </div>
  );
}