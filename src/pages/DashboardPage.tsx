import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useDashboardMetrics, type DashboardFilters } from '../hooks/useDashboardMetrics';
import { MotivoChart, EstadoChart, ResolucionChart, TimelineChart } from '../components/Dashboard/DashboardCharts';
import { Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';

const KPICard = ({ title, value, subtext, icon: Icon, trend }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", trend === 'bad' ? "bg-red-50 text-red-600" : trend === 'good' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600")}>
            <Icon size={20} />
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { clientes, devoluciones } = useData();

    // State for filters
    const [filters, setFilters] = useState<DashboardFilters>({
        dateRange: null,
        estado: 'all',
        motivo: 'all',
        categoria: 'all',
        zona: 'all'
    });

    const { kpis, charts, topClients } = useDashboardMetrics(clientes, devoluciones, filters);

    // Derive unique categories and zones for selectors
    const categories = Array.from(new Set(devoluciones.map(d => d.categoria))).sort();
    const zones = Array.from(new Set(clientes.map(c => c.zona))).sort();

    if (clientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Package size={64} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">No hay datos importados</h2>
                <p className="text-gray-500 max-w-sm mt-2">Sube un archivo Excel para ver el dashboard.</p>
                <Link to="/app/import" className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Ir a Importar
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header & Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        className="p-2 border rounded-md text-sm"
                        value={filters.estado}
                        onChange={e => setFilters({ ...filters, estado: e.target.value as any })}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="resuelto">Resuelto</option>
                    </select>
                    <select
                        className="p-2 border rounded-md text-sm"
                        value={filters.motivo}
                        onChange={e => setFilters({ ...filters, motivo: e.target.value as any })}
                    >
                        <option value="all">Todos los Motivos</option>
                        <option value="defecto">Defecto</option>
                        <option value="daño">Daño</option>
                        <option value="arrepentimiento">Arrepentimiento</option>
                        <option value="otro">Otro</option>
                    </select>
                    <select
                        className="p-2 border rounded-md text-sm"
                        value={filters.categoria}
                        onChange={e => setFilters({ ...filters, categoria: e.target.value })}
                    >
                        <option value="all">Todas las Categorías</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        className="p-2 border rounded-md text-sm"
                        value={filters.zona}
                        onChange={e => setFilters({ ...filters, zona: e.target.value })}
                    >
                        <option value="all">Todas las Zonas</option>
                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    {/* Simple Date Override for demo usage, real date picker is complex */}
                    <input
                        type="date"
                        className="p-2 border rounded-md text-sm"
                        onChange={e => {
                            const val = e.target.value;
                            if (!val) setFilters({ ...filters, dateRange: null });
                            else setFilters({ ...filters, dateRange: { from: val, to: val } }); // Simple single date filter for demo, or enhance logic
                        }}
                    />
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Devoluciones"
                    value={kpis.totalDevoluciones}
                    subtext={`De ${kpis.filteredTotalClientes} clientes afectados`}
                    icon={Package}
                />
                <KPICard
                    title="Costo Total"
                    value={`$${kpis.totalCost.toLocaleString()}`}
                    subtext={`Promedio: $${kpis.avgCost.toFixed(1)}`}
                    icon={DollarSign}
                />
                <KPICard
                    title="Tiempo Prom. Resolución"
                    value={`${kpis.avgResolutionTime.toFixed(1)} días`}
                    subtext="Solo casos resueltos"
                    icon={Clock}
                    trend={kpis.avgResolutionTime > 7 ? 'bad' : 'good'}
                />
                <KPICard
                    title="Casos Críticos"
                    value={kpis.lateResolutions}
                    subtext="Resueltos en >7 días"
                    icon={AlertTriangle}
                    trend={kpis.lateResolutions > 0 ? 'bad' : 'neutral'}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimelineChart data={charts.timeline} />
                <div className="grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-2 gap-6">
                        <EstadoChart data={charts.estado} />
                        <PieChartStats data={kpis} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MotivoChart data={charts.motivo} />
                <ResolucionChart data={charts.resolucion} />
            </div>

            {/* Top Clients Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">Top 10 Clientes con Más Devoluciones</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">ID Cliente</th>
                                <th className="px-6 py-3">Nombres</th>
                                <th className="px-6 py-3 text-center"># Devoluciones</th>
                                <th className="px-6 py-3 text-right">Costo Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topClients.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 font-medium">{client.id}</td>
                                    <td className="px-6 py-3">{client.nombres}</td>
                                    <td className="px-6 py-3 text-center">
                                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{client.count}</span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono">${client.totalCost.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Mini component for stats side-by-side with Pie
const PieChartStats = ({ data }: any) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center gap-4">
        <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{data.pending}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600">{data.inProcess}</p>
        </div>
        <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">Resueltos</p>
            <p className="text-2xl font-bold text-green-600">{data.resolved}</p>
        </div>
    </div>
);

export default DashboardPage;
