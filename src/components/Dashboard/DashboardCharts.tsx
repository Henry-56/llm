import type { FC } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartProps {
    data: any[];
}

export const MotivoChart: FC<ChartProps> = ({ data }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Devoluciones por Motivo</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export const EstadoChart: FC<ChartProps> = ({ data }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Estado de Solicitudes</h3>
        <ResponsiveContainer width="100%" height="90%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

export const ResolucionChart: FC<ChartProps> = ({ data }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Resoluciones (Cerradas)</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export const TimelineChart: FC<ChartProps> = ({ data }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-80">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Evolución Diaria</h3>
        <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} padding={{ left: 10, right: 10 }} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);
