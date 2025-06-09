export type DrawingTool = 
  | 'select'
  | 'pen'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'text'
  | 'eraser';

export type ChartType = 
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'radar';

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface StrokeProperties {
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface FillProperties {
  color: string;
  opacity: number;
}

export interface ElementProperties {
  stroke: StrokeProperties;
  fill?: FillProperties;
  fontSize?: number;
  fontFamily?: string;
  text?: string;
}

export interface DrawingElement {
  id: string;
  type: DrawingTool | 'chart';
  position: Position;
  endPosition?: Position; // For lines, arrows
  dimensions?: Dimensions;
  properties: ElementProperties;
  data?: any; // For charts or complex data
  timestamp: number;
  points?: Position[]; // For free-hand drawing
  selected?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: {
    name: string;
    data: number[];
    color?: string;
  }[];
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  data: ChartData;
  position: Position;
  dimensions: Dimensions;
  title?: string;
  styling: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface CanvasState {
  elements: DrawingElement[];
  selectedElements: string[];
  clipboard: DrawingElement[];
  history: DrawingElement[][];
  historyIndex: number;
  zoom: number;
  panOffset: Position;
}

export interface UIState {
  selectedTool: DrawingTool;
  strokeProperties: StrokeProperties;
  fillProperties: FillProperties;
  isChartModalOpen: boolean;
  isSidebarOpen: boolean;
  isPropertiesPanelOpen: boolean;
}

export interface CanvasInteraction {
  isDrawing: boolean;
  startPoint: Position | null;
  currentPoint: Position | null;
  previewElement: DrawingElement | null;
}