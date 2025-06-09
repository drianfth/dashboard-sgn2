"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
}

export function ToolButton({ 
  icon: Icon, 
  label, 
  isActive = false, 
  onClick, 
  shortcut 
}: ToolButtonProps) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-10 w-10 p-0 relative group",
        isActive && "bg-blue-600 hover:bg-blue-700 text-white"
      )}
      title={shortcut ? `${label} (${shortcut})` : label}
    >
      <Icon className="h-4 w-4" />
      {shortcut && (
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {shortcut}
        </span>
      )}
    </Button>
  );
}