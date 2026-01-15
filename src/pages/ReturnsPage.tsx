import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ReturnsAIChat } from '../components/ReturnsAIChat';
import { Search, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import type { DevolucionStatus, DevolucionResolucion } from '../types';

export const ReturnsPage: React.FC = () => {
    const { devoluciones, clientes, updateDevolucion } = useData();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DevolucionStatus>('all');

    // Modal State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [resolveForm, setResolveForm] = useState<{ date: string; resolution: DevolucionResolucion | '' }>({ date: '', resolution: '' });

    const getClientName = (id: string) => clientes.find(c => c.id_cliente === id)?.nombres || id;

    const filtered = useMemo(() => {
        return devoluciones.filter(d => {
            const matchSearch =
                d.id_devolucion.toLowerCase().includes(search.toLowerCase()) ||
                d.id_cliente.toLowerCase().includes(search.toLowerCase()) ||
                getClientName(d.id_cliente).toLowerCase().includes(search.toLowerCase()) ||
                d.producto.toLowerCase().includes(search.toLowerCase());

            const matchStatus = statusFilter === 'all' || d.estado === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [devoluciones, search, statusFilter, clientes]);

    const handleStatusChange = (id: string, newStatus: DevolucionStatus) => {
        if (newStatus === 'resuelto') {
            setSelectedId(id);
            setResolveForm({ date: format(new Date(), 'yyyy-MM-dd'), resolution: 'reembolso' }); // default
        } else {
            updateDevolucion(id, { estado: newStatus });
        }
    };

    const submitResolution = () => {
        if (selectedId && resolveForm.date && resolveForm.resolution) {
            updateDevolucion(selectedId, {
                estado: 'resuelto',
                fecha_cierre: resolveForm.date,
                resolucion: resolveForm.resolution as DevolucionResolucion
            });
            setSelectedId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Devoluciones</h1>
                <div className="flex items-center gap-4">
                    {/* Filters */}
                    <div className="flex rounded-lg bg-white border border-gray-200 p-1">
                        {['all', 'pendiente', 'en_proceso', 'resuelto'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s as any)}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors",
                                    statusFilter === s ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar devolución..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Producto / Motivo</th>
                                <th className="px-6 py-3">Solicitud</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(dev => (
                                <tr key={dev.id_devolucion} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-gray-600">{dev.id_devolucion}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{getClientName(dev.id_cliente)}</p>
                                        <p className="text-xs text-gray-400">{dev.id_cliente}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-900 font-medium">{dev.producto}</p>
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
                                            dev.motivo === 'defecto' ? "bg-red-100 text-red-700" :
                                                dev.motivo === 'daño' ? "bg-orange-100 text-orange-700" :
                                                    "bg-gray-100 text-gray-700"
                                        )}>
                                            {dev.motivo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {format(parseISO(dev.fecha_solicitud), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={dev.estado} />
                                        {dev.estado === 'resuelto' && (
                                            <div className="text-xs text-green-600 mt-1">
                                                {dev.resolucion} • {dev.fecha_cierre}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {dev.estado === 'pendiente' && (
                                                <button
                                                    onClick={() => handleStatusChange(dev.id_devolucion, 'en_proceso')}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                                                >
                                                    Procesar
                                                </button>
                                            )}
                                            {dev.estado === 'en_proceso' && (
                                                <button
                                                    onClick={() => handleStatusChange(dev.id_devolucion, 'resuelto')}
                                                    className="px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs font-medium"
                                                >
                                                    Resolver
                                                </button>
                                            )}
                                            {dev.estado === 'resuelto' && (
                                                <span className="text-xs text-gray-400">Completado</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron devoluciones.</div>}
                </div>
            </div>

            {/* Resolution Modal */}
            {selectedId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Resolver Devolución</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resolución</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={resolveForm.resolution}
                                    onChange={e => setResolveForm({ ...resolveForm, resolution: e.target.value as DevolucionResolucion })}
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    <option value="reparación">Reparación</option>
                                    <option value="cambio">Cambio</option>
                                    <option value="reembolso">Reembolso</option>
                                    <option value="cupón">Cupón</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Cierre</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={resolveForm.date}
                                    onChange={e => setResolveForm({ ...resolveForm, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setSelectedId(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitResolution}
                                disabled={!resolveForm.resolution || !resolveForm.date}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                            >
                                Confirmar Resolución
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ReturnsAIChat devoluciones={devoluciones} clientes={clientes} />
        </div>
    );
};

const StatusBadge = ({ status }: { status: DevolucionStatus }) => {
    switch (status) {
        case 'pendiente':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} /> Pendiente</span>;
        case 'en_proceso':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><ArrowRight size={12} /> En Proceso</span>;
        case 'resuelto':
            return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} /> Resuelto</span>;
        default:
            return null;
    }
}

export default ReturnsPage;
