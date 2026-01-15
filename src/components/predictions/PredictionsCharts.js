'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useMemo } from 'react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 8,
        usePointStyle: true,
        padding: 20,
        color: '#94a3b8', // text-muted-foreground (approx)
        font: {
          family: "'Barlow', sans-serif",
          size: 11,
        },
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.9)', // bg-slate-900
      titleColor: '#f8fafc', // text-foreground
      bodyColor: '#cbd5e1', // text-muted-foreground
      borderColor: 'rgba(51, 65, 85, 0.5)', // border-slate-700
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: "'Barlow', sans-serif", size: 13, weight: 'bold' },
      bodyFont: { family: "'Barlow', sans-serif", size: 12 },
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(51, 65, 85, 0.3)', borderDash: [4, 4] }, // border-slate-700
      ticks: { color: '#64748b', font: { size: 10 } }, // text-slate-500
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10 } },
      border: { display: false },
    },
  },
  elements: {
    line: { tension: 0.4 },
    point: { radius: 0, hoverRadius: 6 },
  },
};

export function PerformanceChart({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    const rounds = [...new Set(data.map((d) => d.jornada))];
    // Sort rounds naturally (assuming format "Jornada X")
    rounds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const users = [...new Set(data.map((d) => d.usuario))];

    // Neo/Cyber color palette
    const userColors = [
      '#3b82f6', // blue-500
      '#ef4444', // red-500
      '#10b981', // emerald-500
      '#f59e0b', // amber-500
      '#8b5cf6', // violet-500
      '#ec4899', // pink-500
      '#06b6d4', // cyan-500
      '#f97316', // orange-500
    ];

    const datasets = users.map((user, index) => {
      const userData = rounds.map((round) => {
        const entry = data.find((d) => d.usuario === user && d.jornada === round);
        return entry ? entry.aciertos : null;
      });

      const color = userColors[index % userColors.length];

      return {
        label: user,
        data: userData,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        pointBackgroundColor: '#0f172a', // bg-slate-900
        pointBorderColor: color,
        pointBorderWidth: 2,
        spanGaps: true,
      };
    });

    return { labels: rounds, datasets };
  }, [data]);

  const options = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        min: 0,
        max: 10,
        title: { display: true, text: 'Aciertos', color: '#64748b', font: { size: 10 } },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const minWidth = Math.max(100, chartData.labels.length * 50);

  return (
    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      <div className="h-[350px] relative" style={{ minWidth: `${minWidth}px` }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export function ParticipationChart({ data }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    const sortedData = [...data].sort((a, b) => {
      const numA = parseInt(a.jornada.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.jornada.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return {
      labels: sortedData.map((d) => d.jornada),
      datasets: [
        {
          label: 'Participantes',
          data: sortedData.map((d) => d.count),
          backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500 with opacity
          hoverBackgroundColor: '#3b82f6',
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 20,
        },
      ],
    };
  }, [data]);

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      legend: { display: false },
    },
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#64748b' },
      },
      x: {
        ...commonOptions.scales.x,
        grid: { display: false },
      },
    },
  };

  return (
    <div className="h-[250px] w-full">
      <Bar options={options} data={chartData} />
    </div>
  );
}
