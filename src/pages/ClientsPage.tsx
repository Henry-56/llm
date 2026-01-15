import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ClientsPage: React.FC = () => {
    const { clientes, devoluciones } = useData();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        return clientes.filter(c =>
            c.nombres.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.id_cliente.toLowerCase().includes(search.toLowerCase()) ||
            c.zona.toLowerCase().includes(search.toLowerCase())
        );
    }, [clientes, search]);

    const getReturnCount = (id: string) => devoluciones.filter(d => d.id_cliente === id).length;

    if (clientes.length === 0) return <div className="p-8 text-center text-gray-500">No hay clientes importados.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Listado de Clientes</h1>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Información Personal</th>
                                <th className="px-6 py-3">Contacto</th>
                                <th className="px-6 py-3">Ubicación</th>
                                <th className="px-6 py-3">Registro</th>
                                <th className="px-6 py-3 text-center">Devoluciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(client => (
                                <tr key={client.id_cliente} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-600">{client.id_cliente}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{client.nombres}</p>
                                    </td>
                                    <td className="px-6 py-4 space-y-1">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Mail size={14} /> {client.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Phone size={14} /> {client.celular}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <MapPin size={14} />
                                            <span className="capitalize">{client.zona}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span title={client.fecha_registro}>{format(parseISO(client.fecha_registro), 'dd MMM yyyy')}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold">
                                            {getReturnCount(client.id_cliente)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron resultados para "{search}"</div>}
                </div>
            </div>
        </div>
    );
};
export default ClientsPage;
