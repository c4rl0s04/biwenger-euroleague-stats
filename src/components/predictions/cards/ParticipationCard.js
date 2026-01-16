import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
};

export function ParticipationCard({ data }) {
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
    <Card title="Participación" icon={Users} color="blue" className="h-full">
      <div className="h-[250px] w-full mt-auto">
        <Bar options={options} data={chartData} />
      </div>
    </Card>
  );
}
