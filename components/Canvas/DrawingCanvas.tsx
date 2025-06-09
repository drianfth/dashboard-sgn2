"use client";

import { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingTool, StrokeProperties, DrawingElement, Position, CanvasInteraction } from '@/types';
import { cn } from '@/lib/utils';

interface DrawingCanvasProps {
  tool: DrawingTool;
  strokeProperties: StrokeProperties;
  onElementAdd: (element: DrawingElement) => void;
  elements: DrawingElement[];
  zoom: number;
  showGrid: boolean;
  className?: string;
  onElementSelect?: (elementId: string) => void;
  onElementUpdate?: (elementId: string, updates: Partial<DrawingElement>) => void;
  onElementRemove?: (elementId: string) => void;
  selectedElements?: string[];
  onTextEditingChange?: (isEditing: boolean) => void;
}

export function DrawingCanvas({
  tool,
  strokeProperties,
  onElementAdd,
  elements,
  zoom,
  showGrid,
  className,
  onElementSelect,
  onElementUpdate,
  onElementRemove,
  selectedElements = [],
  onTextEditingChange
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const chartCanvasCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const [interaction, setInteraction] = useState<CanvasInteraction>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    previewElement: null
  });
  const [currentPath, setCurrentPath] = useState<Position[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Position>({ x: 0, y: 0 });
  const [eraserCursor, setEraserCursor] = useState<Position>({ x: 0, y: 0 });
  const [showEraserCursor, setShowEraserCursor] = useState(false);

  // Notify parent about text editing state
  useEffect(() => {
    if (onTextEditingChange) {
      onTextEditingChange(isEditingText);
    }
  }, [isEditingText, onTextEditingChange]);

  // Auto-focus text input when editing starts
  useEffect(() => {
    if (isEditingText && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [isEditingText]);

  // Get canvas context
  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Convert screen coordinates to canvas coordinates
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [zoom]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getContext]);

  // Draw grid
  const drawGrid = useCallback(() => {
    if (!showGrid) return;

    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;

    const gridSize = 20 * zoom;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.restore();
  }, [showGrid, zoom, getContext]);

  // Apply stroke properties to context
  const applyStrokeProperties = useCallback((ctx: CanvasRenderingContext2D, properties: StrokeProperties) => {
    ctx.strokeStyle = properties.color;
    ctx.lineWidth = properties.width * zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (properties.style === 'dashed') {
      ctx.setLineDash([5 * zoom, 5 * zoom]);
    } else if (properties.style === 'dotted') {
      ctx.setLineDash([2 * zoom, 3 * zoom]);
    } else {
      ctx.setLineDash([]);
    }
  }, [zoom]);

  // Check if point is inside element bounds
  const isPointInElement = useCallback((point: Position, element: DrawingElement): boolean => {
    const tolerance = 10 / zoom; // Adjust tolerance based on zoom

    switch (element.type) {
      case 'pen':
        if (element.points && element.points.length > 0) {
          // Check if point is near any part of the path
          for (let i = 0; i < element.points.length - 1; i++) {
            const p1 = element.points[i];
            const p2 = element.points[i + 1];
            const distance = distanceToLineSegment(point, p1, p2);
            if (distance <= tolerance) return true;
          }
        }
        return false;

      case 'line':
      case 'arrow':
        if (element.endPosition) {
          const distance = distanceToLineSegment(point, element.position, element.endPosition);
          return distance <= tolerance;
        }
        return false;

      case 'rectangle':
      case 'circle':
      case 'chart':
        if (element.dimensions) {
          const bounds = {
            x: element.position.x,
            y: element.position.y,
            width: element.dimensions.width,
            height: element.dimensions.height
          };
          return point.x >= bounds.x - tolerance &&
            point.x <= bounds.x + bounds.width + tolerance &&
            point.y >= bounds.y - tolerance &&
            point.y <= bounds.y + bounds.height + tolerance;
        }
        return false;

      case 'text':
        if (element.properties.text) {
          const fontSize = (element.properties.fontSize || 16);
          const textWidth = element.properties.text.length * fontSize * 0.6;
          const bounds = {
            x: element.position.x,
            y: element.position.y,
            width: textWidth,
            height: fontSize
          };
          return point.x >= bounds.x - tolerance &&
            point.x <= bounds.x + bounds.width + tolerance &&
            point.y >= bounds.y - tolerance &&
            point.y <= bounds.y + bounds.height + tolerance;
        }
        return false;

      default:
        return false;
    }
  }, [zoom]);

  // Calculate distance from point to line segment
  const distanceToLineSegment = useCallback((point: Position, lineStart: Position, lineEnd: Position): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) {
      // Line start and end are the same point
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get element bounds for selection handles
  const getElementBounds = useCallback((element: DrawingElement) => {
    let bounds = { x: element.position.x, y: element.position.y, width: 0, height: 0 };

    switch (element.type) {
      case 'rectangle':
      case 'circle':
      case 'chart':
        if (element.dimensions) {
          bounds.width = element.dimensions.width;
          bounds.height = element.dimensions.height;
        }
        break;

      case 'line':
      case 'arrow':
        if (element.endPosition) {
          bounds.x = Math.min(element.position.x, element.endPosition.x);
          bounds.y = Math.min(element.position.y, element.endPosition.y);
          bounds.width = Math.abs(element.endPosition.x - element.position.x);
          bounds.height = Math.abs(element.endPosition.y - element.position.y);
        }
        break;

      case 'pen':
        if (element.points && element.points.length > 0) {
          const xs = element.points.map(p => p.x);
          const ys = element.points.map(p => p.y);
          bounds.x = Math.min(...xs);
          bounds.y = Math.min(...ys);
          bounds.width = Math.max(...xs) - bounds.x;
          bounds.height = Math.max(...ys) - bounds.y;
        }
        break;

      case 'text':
        if (element.properties.text) {
          const fontSize = element.properties.fontSize || 16;
          bounds.width = element.properties.text.length * fontSize * 0.6;
          bounds.height = fontSize;
        }
        break;
    }

    // Add minimum bounds
    bounds.width = Math.max(bounds.width, 20);
    bounds.height = Math.max(bounds.height, 20);

    return bounds;
  }, []);

  // Constrain position to canvas bounds
  const constrainToCanvas = useCallback((position: Position): Position => {
    const canvas = canvasRef.current;
    if (!canvas) return position;

    return {
      x: Math.max(0, Math.min(canvas.width / zoom - 10, position.x)),
      y: Math.max(0, Math.min(canvas.height / zoom - 10, position.y))
    };
  }, [zoom]);

  // Move element by offset
  const moveElement = useCallback((element: DrawingElement, offset: Position): DrawingElement => {
    const newElement = { ...element };

    switch (element.type) {
      case 'pen':
        if (element.points) {
          newElement.points = element.points.map(point => ({
            x: point.x + offset.x,
            y: point.y + offset.y
          }));
          // Update position to first point
          newElement.position = newElement.points[0];
        }
        break;

      case 'line':
      case 'arrow':
        newElement.position = {
          x: element.position.x + offset.x,
          y: element.position.y + offset.y
        };
        if (element.endPosition) {
          newElement.endPosition = {
            x: element.endPosition.x + offset.x,
            y: element.endPosition.y + offset.y
          };
        }
        break;

      default:
        newElement.position = {
          x: element.position.x + offset.x,
          y: element.position.y + offset.y
        };
        break;
    }

    return newElement;
  }, []);

  // Create chart canvas for caching
  const createChartCanvas = useCallback((element: DrawingElement): HTMLCanvasElement | null => {
    if (element.type !== 'chart' || !element.data || !element.dimensions) return null;

    const canvas = document.createElement('canvas');
    canvas.width = element.dimensions.width;
    canvas.height = element.dimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Import ChartRenderer functionality directly
    const colorPalette = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
    ];

    const chartData = element.data.data;
    const styling = element.data.styling || {};

    // Clear and setup canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = styling.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = styling.borderColor || '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw title
    if (element.data.title) {
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(element.data.title, canvas.width / 2, 25);
    }

    // Calculate chart area
    const chartArea = {
      x: 40,
      y: element.data.title ? 50 : 30,
      width: canvas.width - (element.data.type === 'pie' ? 140 : 80),
      height: canvas.height - (element.data.title ? 90 : 70)
    };

    if (chartData && chartData.labels && chartData.datasets && chartData.datasets.length > 0) {
      const dataset = chartData.datasets[0];

      switch (element.data.type) {
        case 'bar':
          const barWidth = chartArea.width / dataset.data.length;
          const maxValue = Math.max(...dataset.data, 1);

          dataset.data.forEach((value: number, index: number) => {
            const barHeight = (value / maxValue) * chartArea.height;
            const x = chartArea.x + index * barWidth + barWidth * 0.1;
            const y = chartArea.y + chartArea.height - barHeight;

            ctx.fillStyle = dataset.color || colorPalette[index % colorPalette.length];
            ctx.fillRect(x, y, barWidth * 0.8, barHeight);

            // Value labels
            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + (barWidth * 0.8) / 2, y - 5);
          });

          // Category labels
          chartData.labels.forEach((label: string, index: number) => {
            const x = chartArea.x + index * barWidth + barWidth * 0.5;
            const y = chartArea.y + chartArea.height + 15;
            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y);
          });
          break;

        case 'line':
          const pointSpacing = chartArea.width / Math.max(dataset.data.length - 1, 1);
          const maxLineValue = Math.max(...dataset.data, 1);

          ctx.strokeStyle = dataset.color || '#3B82F6';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();

          let firstPoint = true;
          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
            const y = chartArea.y + chartArea.height - (value / maxLineValue) * chartArea.height;

            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();

          // Draw data points
          ctx.fillStyle = dataset.color || '#3B82F6';
          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
            const y = chartArea.y + chartArea.height - (value / maxLineValue) * chartArea.height;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
          });

          // Category labels
          chartData.labels.forEach((label: string, index: number) => {
            const pointSpacing = chartArea.width / Math.max(chartData.labels.length - 1, 1);
            const x = chartArea.x + (chartData.labels.length === 1 ? chartArea.width / 2 : index * pointSpacing);
            const y = chartArea.y + chartArea.height + 15;
            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y);
          });
          break;

        case 'area':
          const areaPointSpacing = chartArea.width / Math.max(dataset.data.length - 1, 1);
          const maxAreaValue = Math.max(...dataset.data, 1);

          // Create area path
          ctx.beginPath();
          ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);

          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * areaPointSpacing);
            const y = chartArea.y + chartArea.height - (value / maxAreaValue) * chartArea.height;
            ctx.lineTo(x, y);
          });

          ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
          ctx.closePath();

          // Fill area
          const color = dataset.color || '#3B82F6';
          ctx.fillStyle = color + '40';
          ctx.fill();

          // Draw line
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();

          let firstAreaPoint = true;
          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * areaPointSpacing);
            const y = chartArea.y + chartArea.height - (value / maxAreaValue) * chartArea.height;

            if (firstAreaPoint) {
              ctx.moveTo(x, y);
              firstAreaPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();

          // Draw points
          ctx.fillStyle = color;
          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * areaPointSpacing);
            const y = chartArea.y + chartArea.height - (value / maxAreaValue) * chartArea.height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          break;

        case 'pie':
          const centerX = chartArea.x + chartArea.width / 2;
          const centerY = chartArea.y + chartArea.height / 2;
          const radius = Math.min(chartArea.width, chartArea.height) / 2 - 40;

          const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
          let currentAngle = -Math.PI / 2;

          dataset.data.forEach((value: number, index: number) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            const sliceColor = colorPalette[index % colorPalette.length];

            ctx.fillStyle = sliceColor;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Percentage labels
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(labelAngle) * labelRadius;
            const labelY = centerY + Math.sin(labelAngle) * labelRadius;

            const percentage = ((value / total) * 100).toFixed(1);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, labelX, labelY);

            currentAngle += sliceAngle;
          });

          // Legend
          const legendX = chartArea.x + chartArea.width + 20;
          const legendY = chartArea.y + 20;

          chartData.labels.forEach((label: string, index: number) => {
            const y = legendY + index * 20;
            const legendColor = colorPalette[index % colorPalette.length];

            ctx.fillStyle = legendColor;
            ctx.fillRect(legendX, y - 6, 12, 12);

            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, legendX + 18, y);
          });
          break;

        case 'radar':
          const radarCenterX = chartArea.x + chartArea.width / 2;
          const radarCenterY = chartArea.y + chartArea.height / 2;
          const radarRadius = Math.min(chartArea.width, chartArea.height) / 2 - 40;
          const angleStep = (2 * Math.PI) / chartData.labels.length;
          const maxRadarValue = Math.max(...dataset.data, 1);

          // Grid circles
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
          for (let i = 1; i <= 5; i++) {
            const gridRadius = (radarRadius * i) / 5;
            ctx.beginPath();
            ctx.arc(radarCenterX, radarCenterY, gridRadius, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Axes and labels
          chartData.labels.forEach((label: string, index: number) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = radarCenterX + Math.cos(angle) * radarRadius;
            const y = radarCenterY + Math.sin(angle) * radarRadius;

            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(radarCenterX, radarCenterY);
            ctx.lineTo(x, y);
            ctx.stroke();

            const labelX = radarCenterX + Math.cos(angle) * (radarRadius + 15);
            const labelY = radarCenterY + Math.sin(angle) * (radarRadius + 15);

            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, labelX, labelY);
          });

          // Data polygon
          const radarColor = dataset.color || '#3B82F6';
          ctx.fillStyle = radarColor + '30';
          ctx.strokeStyle = radarColor;
          ctx.lineWidth = 2;
          ctx.beginPath();

          dataset.data.forEach((value: number, index: number) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (value / maxRadarValue) * radarRadius;
            const x = radarCenterX + Math.cos(angle) * distance;
            const y = radarCenterY + Math.sin(angle) * distance;

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });

          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Data points
          ctx.fillStyle = radarColor;
          dataset.data.forEach((value: number, index: number) => {
            const angle = index * angleStep - Math.PI / 2;
            const distance = (value / maxRadarValue) * radarRadius;
            const x = radarCenterX + Math.cos(angle) * distance;
            const y = radarCenterY + Math.sin(angle) * distance;

            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
          });
          break;

        case 'scatter':
          const scatterMaxValue = Math.max(...dataset.data, 1);
          const scatterColor = dataset.color || '#3B82F6';

          ctx.fillStyle = scatterColor;
          dataset.data.forEach((value: number, index: number) => {
            const x = chartArea.x + (index / Math.max(dataset.data.length - 1, 1)) * chartArea.width;
            const y = chartArea.y + chartArea.height - (value / scatterMaxValue) * chartArea.height;

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          });

          // Category labels
          chartData.labels.forEach((label: string, index: number) => {
            const x = chartArea.x + (index / Math.max(chartData.labels.length - 1, 1)) * chartArea.width;
            const y = chartArea.y + chartArea.height + 15;
            ctx.fillStyle = styling.textColor || '#374151';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, y);
          });
          break;
      }
    }

    return canvas;
  }, []);

  // Draw chart element
  const drawChart = useCallback((element: DrawingElement, isPreview = false) => {
    const ctx = getContext();
    if (!ctx || !element.data || !element.dimensions) return;

    ctx.save();

    if (isPreview) {
      ctx.globalAlpha = 0.7;
    }

    const scaledPos = {
      x: element.position.x * zoom,
      y: element.position.y * zoom
    };
    const scaledDims = {
      width: element.dimensions.width * zoom,
      height: element.dimensions.height * zoom
    };

    // Get or create cached chart canvas
    let chartCanvas = chartCanvasCache.current.get(element.id);
    if (!chartCanvas) {
      chartCanvas = createChartCanvas(element) ?? undefined;
      if (chartCanvas) {
        chartCanvasCache.current.set(element.id, chartCanvas);
      }
    }

    if (chartCanvas) {
      ctx.drawImage(chartCanvas, scaledPos.x, scaledPos.y, scaledDims.width, scaledDims.height);
    }

    ctx.restore();
  }, [getContext, zoom, createChartCanvas]);

  // Clear chart cache when element is updated
  useEffect(() => {
    // Clear cache for updated elements
    elements.forEach(element => {
      if (element.type === 'chart') {
        chartCanvasCache.current.delete(element.id);
      }
    });
  }, [elements]);

  // Draw a single element
  const drawElement = useCallback((element: DrawingElement, isPreview = false) => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.save();

    if (isPreview) {
      ctx.globalAlpha = 0.7;
    }

    // Handle chart elements separately
    if (element.type === 'chart') {
      drawChart(element, isPreview);
      if (selectedElements.includes(element.id)) {
        drawSelectionHandles(element);
      }
      ctx.restore();
      return;
    }

    applyStrokeProperties(ctx, element.properties.stroke);

    const scaledPos = {
      x: element.position.x * zoom,
      y: element.position.y * zoom
    };

    switch (element.type) {
      case 'pen':
        if (element.points && element.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(element.points[0].x * zoom, element.points[0].y * zoom);

          // Use quadratic curves for smoother lines
          for (let i = 1; i < element.points.length - 1; i++) {
            const currentPoint = element.points[i];
            const nextPoint = element.points[i + 1];
            const controlX = (currentPoint.x + nextPoint.x) / 2 * zoom;
            const controlY = (currentPoint.y + nextPoint.y) / 2 * zoom;

            ctx.quadraticCurveTo(
              currentPoint.x * zoom,
              currentPoint.y * zoom,
              controlX,
              controlY
            );
          }

          if (element.points.length > 1) {
            const lastPoint = element.points[element.points.length - 1];
            ctx.lineTo(lastPoint.x * zoom, lastPoint.y * zoom);
          }

          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (element.dimensions) {
          const width = element.dimensions.width * zoom;
          const height = element.dimensions.height * zoom;

          if (element.properties.fill?.color && element.properties.fill.color !== 'transparent') {
            ctx.fillStyle = element.properties.fill.color;
            ctx.globalAlpha = element.properties.fill.opacity || 1;
            ctx.fillRect(scaledPos.x, scaledPos.y, width, height);
            ctx.globalAlpha = 1;
          }

          ctx.strokeRect(scaledPos.x, scaledPos.y, width, height);
        }
        break;

      case 'circle':
        if (element.dimensions) {
          const radiusX = (element.dimensions.width / 2) * zoom;
          const radiusY = (element.dimensions.height / 2) * zoom;
          const centerX = scaledPos.x + radiusX;
          const centerY = scaledPos.y + radiusY;

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

          if (element.properties.fill?.color && element.properties.fill.color !== 'transparent') {
            ctx.fillStyle = element.properties.fill.color;
            ctx.globalAlpha = element.properties.fill.opacity || 1;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          ctx.stroke();
        }
        break;

      case 'line':
        if (element.endPosition) {
          const endPos = {
            x: element.endPosition.x * zoom,
            y: element.endPosition.y * zoom
          };

          ctx.beginPath();
          ctx.moveTo(scaledPos.x, scaledPos.y);
          ctx.lineTo(endPos.x, endPos.y);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (element.endPosition) {
          const endPos = {
            x: element.endPosition.x * zoom,
            y: element.endPosition.y * zoom
          };

          // Draw line
          ctx.beginPath();
          ctx.moveTo(scaledPos.x, scaledPos.y);
          ctx.lineTo(endPos.x, endPos.y);
          ctx.stroke();

          // Draw arrowhead
          const angle = Math.atan2(endPos.y - scaledPos.y, endPos.x - scaledPos.x);
          const arrowLength = 15 * zoom;
          const arrowAngle = Math.PI / 6;

          ctx.beginPath();
          ctx.moveTo(endPos.x, endPos.y);
          ctx.lineTo(
            endPos.x - arrowLength * Math.cos(angle - arrowAngle),
            endPos.y - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(endPos.x, endPos.y);
          ctx.lineTo(
            endPos.x - arrowLength * Math.cos(angle + arrowAngle),
            endPos.y - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        if (element.properties.text) {
          ctx.fillStyle = element.properties.stroke.color;
          ctx.font = `${(element.properties.fontSize || 16) * zoom}px ${element.properties.fontFamily || 'Arial'}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(element.properties.text, scaledPos.x, scaledPos.y);
        }
        break;
    }

    // Draw selection handles if selected
    if (selectedElements.includes(element.id)) {
      drawSelectionHandles(element);
    }

    ctx.restore();
  }, [getContext, applyStrokeProperties, zoom, selectedElements, drawChart]);

  // Draw selection handles
  const drawSelectionHandles = useCallback((element: DrawingElement) => {
    const ctx = getContext();
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const handleSize = 8;
    const bounds = getElementBounds(element);
    const scaledBounds = {
      x: bounds.x * zoom,
      y: bounds.y * zoom,
      width: bounds.width * zoom,
      height: bounds.height * zoom
    };

    // Draw corner handles
    const handles = [
      { x: scaledBounds.x - handleSize / 2, y: scaledBounds.y - handleSize / 2 },
      { x: scaledBounds.x + scaledBounds.width - handleSize / 2, y: scaledBounds.y - handleSize / 2 },
      { x: scaledBounds.x + scaledBounds.width - handleSize / 2, y: scaledBounds.y + scaledBounds.height - handleSize / 2 },
      { x: scaledBounds.x - handleSize / 2, y: scaledBounds.y + scaledBounds.height - handleSize / 2 }
    ];

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });

    // Draw selection border
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 1;
    ctx.strokeRect(scaledBounds.x, scaledBounds.y, scaledBounds.width, scaledBounds.height);

    ctx.restore();
  }, [getContext, zoom, getElementBounds]);

  // Draw eraser cursor
  const drawEraserCursor = useCallback(() => {
    if (tool !== 'eraser' || !showEraserCursor) return;

    const ctx = getContext();
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    const radius = strokeProperties.width * zoom * 3;
    ctx.beginPath();
    ctx.arc(eraserCursor.x * zoom, eraserCursor.y * zoom, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw crosshair
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((eraserCursor.x - 5) * zoom, eraserCursor.y * zoom);
    ctx.lineTo((eraserCursor.x + 5) * zoom, eraserCursor.y * zoom);
    ctx.moveTo(eraserCursor.x * zoom, (eraserCursor.y - 5) * zoom);
    ctx.lineTo(eraserCursor.x * zoom, (eraserCursor.y + 5) * zoom);
    ctx.stroke();

    ctx.restore();
  }, [tool, showEraserCursor, getContext, strokeProperties.width, zoom, eraserCursor]);

  // Redraw entire canvas
  const redrawCanvas = useCallback(() => {
    clearCanvas();
    drawGrid();

    // Draw all elements
    elements.forEach(element => {
      drawElement(element);
    });

    // Draw preview element
    if (interaction.previewElement) {
      drawElement(interaction.previewElement, true);
    }

    // Draw eraser cursor
    drawEraserCursor();
  }, [clearCanvas, drawGrid, elements, drawElement, interaction.previewElement, drawEraserCursor]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't handle mouse events when editing text
    if (isEditingText) return;

    const point = getCanvasCoordinates(e.clientX, e.clientY);
    const constrainedPoint = constrainToCanvas(point);

    if (tool === 'select') {
      // Check if clicking on an existing element (reverse order for top-most element)
      const clickedElement = [...elements].reverse().find(element => isPointInElement(constrainedPoint, element));

      if (clickedElement && onElementSelect) {
        onElementSelect(clickedElement.id);
        setIsDragging(true);
        setDraggedElement(clickedElement.id);

        // Calculate drag offset based on element type
        let offsetX = 0, offsetY = 0;

        switch (clickedElement.type) {
          case 'pen':
            if (clickedElement.points && clickedElement.points.length > 0) {
              offsetX = constrainedPoint.x - clickedElement.points[0].x;
              offsetY = constrainedPoint.y - clickedElement.points[0].y;
            }
            break;
          default:
            offsetX = constrainedPoint.x - clickedElement.position.x;
            offsetY = constrainedPoint.y - clickedElement.position.y;
            break;
        }

        setDragOffset({ x: offsetX, y: offsetY });
      } else {
        // Clear selection if clicking empty space
        if (onElementSelect) {
          onElementSelect('');
        }
      }
      return;
    }

    if (tool === 'text') {
      setIsEditingText(true);
      setTextPosition(constrainedPoint);
      setTextInput('');
      return;
    }

    if (tool === 'eraser') {
      // Find and remove elements at this position
      const elementsToRemove = elements.filter(element => isPointInElement(constrainedPoint, element));
      elementsToRemove.forEach(element => {
        if (onElementRemove) {
          onElementRemove(element.id);
        }
      });
      return;
    }

    setInteraction({
      isDrawing: true,
      startPoint: constrainedPoint,
      currentPoint: constrainedPoint,
      previewElement: null
    });

    if (tool === 'pen') {
      setCurrentPath([constrainedPoint]);
    }
  }, [tool, isEditingText, getCanvasCoordinates, constrainToCanvas, elements, isPointInElement, onElementSelect, onElementRemove]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const currentPoint = getCanvasCoordinates(e.clientX, e.clientY);
    const constrainedPoint = constrainToCanvas(currentPoint);

    // Update eraser cursor position
    if (tool === 'eraser') {
      setEraserCursor(constrainedPoint);
      setShowEraserCursor(true);
    } else {
      setShowEraserCursor(false);
    }

    // Handle dragging selected elements
    if (tool === 'select' && isDragging && draggedElement) {
      const selectedElement = elements.find(el => el.id === draggedElement);
      if (selectedElement && onElementUpdate) {
        // Calculate movement offset
        const moveOffset = {
          x: constrainedPoint.x - dragOffset.x - selectedElement.position.x,
          y: constrainedPoint.y - dragOffset.y - selectedElement.position.y
        };

        // Move the element
        const movedElement = moveElement(selectedElement, moveOffset);

        // Update the element
        onElementUpdate(selectedElement.id, movedElement);
      }
      return;
    }

    if (!interaction.isDrawing || !interaction.startPoint) return;

    if (tool === 'pen') {
      // Add point to current path for real-time drawing
      setCurrentPath(prev => [...prev, constrainedPoint]);

      // Create a preview element with current path
      const previewElement: DrawingElement = {
        id: 'preview_pen',
        type: 'pen',
        position: interaction.startPoint,
        properties: { stroke: strokeProperties },
        points: [...currentPath, constrainedPoint],
        timestamp: Date.now()
      };

      setInteraction(prev => ({
        ...prev,
        currentPoint: constrainedPoint,
        previewElement
      }));
    } else {
      // Create preview element for shapes
      const previewElement = createElementFromPoints(
        interaction.startPoint,
        constrainedPoint,
        tool,
        strokeProperties
      );

      setInteraction(prev => ({
        ...prev,
        currentPoint: constrainedPoint,
        previewElement
      }));
    }
  }, [tool, getCanvasCoordinates, constrainToCanvas, isDragging, draggedElement, elements, dragOffset, onElementUpdate, moveElement, interaction.isDrawing, interaction.startPoint, strokeProperties, currentPath]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (tool === 'select' && isDragging) {
      setIsDragging(false);
      setDraggedElement(null);
      return;
    }

    if (!interaction.isDrawing || !interaction.startPoint) return;

    if (tool === 'pen' && currentPath.length > 1) {
      const element: DrawingElement = {
        id: `pen_${Date.now()}`,
        type: 'pen',
        position: currentPath[0],
        properties: { stroke: strokeProperties },
        points: currentPath,
        timestamp: Date.now()
      };
      onElementAdd(element);
    } else if (interaction.currentPoint && tool !== 'pen') {
      const element = createElementFromPoints(
        interaction.startPoint,
        interaction.currentPoint,
        tool,
        strokeProperties
      );
      if (element) {
        onElementAdd(element);
      }
    }

    setInteraction({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      previewElement: null
    });
    setCurrentPath([]);
  }, [tool, isDragging, interaction, currentPath, strokeProperties, onElementAdd]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setShowEraserCursor(false);
    handleMouseUp();
  }, [handleMouseUp]);

  // Handle text input submission
  const handleTextSubmit = useCallback(() => {
    if (textInput.trim() && isEditingText) {
      const element: DrawingElement = {
        id: `text_${Date.now()}`,
        type: 'text',
        position: textPosition,
        properties: {
          stroke: strokeProperties,
          text: textInput.trim(),
          fontSize: 16,
          fontFamily: 'Arial'
        },
        timestamp: Date.now()
      };
      onElementAdd(element);
    }
    setIsEditingText(false);
    setTextInput('');
  }, [textInput, isEditingText, textPosition, strokeProperties, onElementAdd]);

  // Handle text input cancellation
  const handleTextCancel = useCallback(() => {
    setIsEditingText(false);
    setTextInput('');
  }, []);

  // Create element from two points
  const createElementFromPoints = useCallback((
    start: Position,
    end: Position,
    elementType: DrawingTool,
    properties: StrokeProperties
  ): DrawingElement | null => {
    const id = `${elementType}_${Date.now()}`;

    switch (elementType) {
      case 'rectangle':
        return {
          id,
          type: 'rectangle',
          position: {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y)
          },
          dimensions: {
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y)
          },
          properties: { stroke: properties },
          timestamp: Date.now()
        };

      case 'circle':
        return {
          id,
          type: 'circle',
          position: {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y)
          },
          dimensions: {
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y)
          },
          properties: { stroke: properties },
          timestamp: Date.now()
        };

      case 'line':
      case 'arrow':
        return {
          id,
          type: elementType,
          position: start,
          endPosition: end,
          properties: { stroke: properties },
          timestamp: Date.now()
        };

      default:
        return null;
    }
  }, []);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    redrawCanvas();
  }, [redrawCanvas]);

  // Setup canvas and event listeners
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Redraw when elements or zoom changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{
        cursor: tool === 'eraser' ? 'none' :
          tool === 'select' ? 'default' :
            tool === 'text' ? 'text' :
              'crosshair'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Text Input Overlay */}
      {isEditingText && (
        <div
          className="absolute bg-white border-2 border-blue-500 rounded-md px-3 py-2 shadow-lg z-50 min-w-[200px]"
          style={{
            left: Math.max(10, Math.min(textPosition.x * zoom, window.innerWidth - 220)),
            top: Math.max(10, Math.min(textPosition.y * zoom, window.innerHeight - 100)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              e.stopPropagation(); // Prevent keyboard shortcuts while typing
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleTextCancel();
              }
            }}
            className="outline-none bg-transparent text-sm w-full border-none focus:ring-0 text-gray-900"
            placeholder="Type text here..."
            autoFocus
            style={{ fontSize: '16px', fontFamily: 'Arial' }}
          />
          <div className="text-xs text-gray-500 mt-1">
            Press Enter to confirm, Esc to cancel
          </div>
        </div>
      )}
    </div>
  );
}