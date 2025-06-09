"use client";

import { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';

interface ToolGroupProps {
  children: ReactNode;
  showSeparator?: boolean;
}

export function ToolGroup({ children, showSeparator = true }: ToolGroupProps) {
  return (
    <div className="flex items-center space-x-1">
      {children}
      {showSeparator && <Separator orientation="vertical" className="h-6 mx-2" />}
    </div>
  );
}