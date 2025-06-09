"use client";

import { useRef, useEffect, useCallback } from 'react';
import { ChartType, ChartData, Dimensions, ChartConfig } from '@/types';

interface ChartRendererProps {
  type: ChartType;
  data: ChartData;
  title?: string;
  dimensions: Dimensions;
  styling?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
  onRender?: (canvas: HTMLCanvasElement) => void;
}

export function ChartRenderer({ 
  type, 
  data, 
  title, 
  dimensions, 
  styling = {},
  onRender 
}: ChartRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color palette for automatic color generation
  const colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1',
    '#14B8A6', '#F43F5E', '#8B5A2B', '#7C3AED', '#059669'
  ];

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  const drawBarChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length) return;

    const dataset = data.datasets[0];
    const barWidth = chartArea.width / data.labels.length;
    const maxValue = Math.max(...dataset.data, 1);

    // Draw bars
    dataset.data.forEach((value: number, index: number) => {
      const barHeight = (value / maxValue) * chartArea.height;
      const x = chartArea.x + index * barWidth + barWidth * 0.1;
      const y = chartArea.y + chartArea.height - barHeight;
      
      ctx.fillStyle = dataset.color || colorPalette[index % colorPalette.length];
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      
      // Draw value labels
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        value.toString(),
        x + (barWidth * 0.8) / 2,
        y - 5
      );
    });

    // Draw category labels
    data.labels.forEach((label: string, index: number) => {
      const x = chartArea.x + index * barWidth + barWidth * 0.5;
      const y = chartArea.y + chartArea.height + 15;
      
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y);
    });
  }, [data, styling, colorPalette]);

  const drawLineChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length) return;

    data.datasets.forEach((dataset, datasetIndex) => {
      const pointSpacing = chartArea.width / Math.max(dataset.data.length - 1, 1);
      const maxValue = Math.max(...data.datasets.flatMap(d => d.data), 1);
      
      const color = dataset.color || colorPalette[datasetIndex % colorPalette.length];
      
      // Draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      let firstPoint = true;
      dataset.data.forEach((value: number, index: number) => {
        const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw data points
      ctx.fillStyle = color;
      dataset.data.forEach((value: number, index: number) => {
        const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw value labels
        ctx.fillStyle = styling.textColor || '#374151';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), x, y - 10);
      });
    });

    // Draw category labels
    data.labels.forEach((label: string, index: number) => {
      const pointSpacing = chartArea.width / Math.max(data.labels.length - 1, 1);
      const x = chartArea.x + (data.labels.length === 1 ? chartArea.width / 2 : index * pointSpacing);
      const y = chartArea.y + chartArea.height + 15;
      
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y);
    });
  }, [data, styling, colorPalette]);

  const drawAreaChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length) return;

    data.datasets.forEach((dataset, datasetIndex) => {
      const pointSpacing = chartArea.width / Math.max(dataset.data.length - 1, 1);
      const maxValue = Math.max(...data.datasets.flatMap(d => d.data), 1);
      
      const color = dataset.color || colorPalette[datasetIndex % colorPalette.length];
      
      // Create area path
      ctx.beginPath();
      ctx.moveTo(chartArea.x, chartArea.y + chartArea.height);
      
      dataset.data.forEach((value: number, index: number) => {
        const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        ctx.lineTo(x, y);
      });
      
      ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height);
      ctx.closePath();
      
      // Fill area with transparency
      ctx.fillStyle = color + '40'; // Add transparency
      ctx.fill();
      
      // Draw line on top
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      let firstPoint = true;
      dataset.data.forEach((value: number, index: number) => {
        const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        
        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw data points
      ctx.fillStyle = color;
      dataset.data.forEach((value: number, index: number) => {
        const x = chartArea.x + (dataset.data.length === 1 ? chartArea.width / 2 : index * pointSpacing);
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });

    // Draw category labels
    data.labels.forEach((label: string, index: number) => {
      const pointSpacing = chartArea.width / Math.max(data.labels.length - 1, 1);
      const x = chartArea.x + (data.labels.length === 1 ? chartArea.width / 2 : index * pointSpacing);
      const y = chartArea.y + chartArea.height + 15;
      
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y);
    });
  }, [data, styling, colorPalette]);

  const drawPieChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length) return;

    const dataset = data.datasets[0];
    const centerX = chartArea.x + chartArea.width / 2;
    const centerY = chartArea.y + chartArea.height / 2;
    const radius = Math.min(chartArea.width, chartArea.height) / 2 - 40;
    
    const total = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw pie slices
    dataset.data.forEach((value: number, index: number) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = dataset.color || colorPalette[index % colorPalette.length];
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw slice border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw percentage labels
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

    // Draw legend
    const legendX = chartArea.x + chartArea.width + 20;
    const legendY = chartArea.y + 20;
    
    data.labels.forEach((label: string, index: number) => {
      const y = legendY + index * 20;
      const color = dataset.color || colorPalette[index % colorPalette.length];
      
      // Legend color box
      ctx.fillStyle = color;
      ctx.fillRect(legendX, y - 6, 12, 12);
      
      // Legend text
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, legendX + 18, y);
    });
  }, [data, styling, colorPalette]);

  const drawRadarChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length || !data.labels.length) return;

    const centerX = chartArea.x + chartArea.width / 2;
    const centerY = chartArea.y + chartArea.height / 2;
    const radius = Math.min(chartArea.width, chartArea.height) / 2 - 40;
    const angleStep = (2 * Math.PI) / data.labels.length;
    
    // Find max value across all datasets
    const maxValue = Math.max(...data.datasets.flatMap(d => d.data), 1);
    
    // Draw grid circles
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const gridRadius = (radius * i) / 5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, gridRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Draw axes and labels
    data.labels.forEach((label: string, index: number) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Draw axis line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Draw label
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, labelX, labelY);
    });
    
    // Draw data polygons
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || colorPalette[datasetIndex % colorPalette.length];
      
      // Draw filled polygon
      ctx.fillStyle = color + '30'; // Add transparency
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      dataset.data.forEach((value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = (value / maxValue) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw data points
      ctx.fillStyle = color;
      dataset.data.forEach((value: number, index: number) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = (value / maxValue) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }, [data, styling, colorPalette]);

  const drawScatterChart = useCallback((ctx: CanvasRenderingContext2D, chartArea: any) => {
    if (!data.datasets.length) return;

    const maxValue = Math.max(...data.datasets.flatMap(d => d.data), 1);
    
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.color || colorPalette[datasetIndex % colorPalette.length];
      ctx.fillStyle = color;
      
      dataset.data.forEach((value: number, index: number) => {
        // For scatter plot, use index as X and value as Y
        const x = chartArea.x + (index / Math.max(dataset.data.length - 1, 1)) * chartArea.width;
        const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add small border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    // Draw category labels
    data.labels.forEach((label: string, index: number) => {
      const x = chartArea.x + (index / Math.max(data.labels.length - 1, 1)) * chartArea.width;
      const y = chartArea.y + chartArea.height + 15;
      
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y);
    });
  }, [data, styling, colorPalette]);

  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = styling.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = styling.borderColor || '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw title
    if (title) {
      ctx.fillStyle = styling.textColor || '#374151';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 25);
    }

    // Calculate chart area
    const chartArea = {
      x: 40,
      y: title ? 50 : 30,
      width: canvas.width - (type === 'pie' ? 140 : 80), // Extra space for pie legend
      height: canvas.height - (title ? 90 : 70)
    };

    // Render specific chart type
    switch (type) {
      case 'bar':
        drawBarChart(ctx, chartArea);
        break;
      case 'line':
        drawLineChart(ctx, chartArea);
        break;
      case 'area':
        drawAreaChart(ctx, chartArea);
        break;
      case 'pie':
        drawPieChart(ctx, chartArea);
        break;
      case 'radar':
        drawRadarChart(ctx, chartArea);
        break;
      case 'scatter':
        drawScatterChart(ctx, chartArea);
        break;
    }

    // Call onRender callback if provided
    if (onRender) {
      onRender(canvas);
    }
  }, [type, data, title, dimensions, styling, getContext, drawBarChart, drawLineChart, drawAreaChart, drawPieChart, drawRadarChart, drawScatterChart, onRender]);

  // Render chart when props change
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="border border-gray-200 rounded"
    />
  );
}