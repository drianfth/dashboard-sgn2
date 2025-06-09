"use client";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  FileText, 
  Download, 
  Upload, 
  Share2, 
  Users,
  Settings
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function Header({ onMenuClick, onExport, onImport }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onMenuClick}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">DASHBOARD SGN</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="ghost" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="ghost" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Collaborate
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}