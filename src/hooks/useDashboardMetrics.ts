import { useMemo } from 'react';
import type { Cliente, Devolucion, DevolucionStatus, DevolucionMotivo } from '../types';
import { parseISO, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export interface DashboardFilters {
    dateRange: { from: string; to: string } | null;
    estado: DevolucionStatus | 'all';
    motivo: DevolucionMotivo | 'all';
    categoria: string; // 'all' or specific
    zona: string; // 'all' or specific
}

export const useDashboardMetrics = (
    clientes: Cliente[],
    devoluciones: Devolucion[],
    filters: DashboardFilters
) => {
    return useMemo(() => {
        // 1. Filter Data
        const filteredDevs = devoluciones.filter(dev => {
            // Date Range
            if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
                const date = parseISO(dev.fecha_solicitud);
                const start = startOfDay(parseISO(filters.dateRange.from));
                const end = endOfDay(parseISO(filters.dateRange.to));
                // simple check
                if (date < start || date > end) return false;
            }

            if (filters.estado !== 'all' && dev.estado !== filters.estado) return false;
            if (filters.motivo !== 'all' && dev.motivo !== filters.motivo) return false;
            if (filters.categoria !== 'all' && dev.categoria !== filters.categoria) return false;

            // Filter by Zone (requires joining with Client)
            if (filters.zona !== 'all') {
                const client = clientes.find(c => c.id_cliente === dev.id_cliente);
                if (client?.zona !== filters.zona) return false;
            }

            return true;
        });

        // 2. Compute KPIs
        const totalClientes = clientes.length;
        const totalDevoluciones = filteredDevs.length;
        const pending = filteredDevs.filter(d => d.estado === 'pendiente').length;
        const inProcess = filteredDevs.filter(d => d.estado === 'en_proceso').length;
        const resolved = filteredDevs.filter(d => d.estado === 'resuelto').length;

        const totalCost = filteredDevs.reduce((sum, d) => sum + d.costo, 0);
        const avgCost = totalDevoluciones > 0 ? totalCost / totalDevoluciones : 0;

        // Time to Resolution (only for resolved in the filtered set)
        const resolvedDevs = filteredDevs.filter(d => d.estado === 'resuelto' && d.fecha_cierre);
        const totalDays = resolvedDevs.reduce((sum, d) => {
            const start = parseISO(d.fecha_solicitud);
            const end = parseISO(d.fecha_cierre!);
            return sum + differenceInDays(end, start);
        }, 0);
        const avgResolutionTime = resolvedDevs.length > 0 ? totalDays / resolvedDevs.length : 0;

        // Risk Fidelization Proxy
        // a) Clients with 2+ returns (in filtered set? usually global, but let's stick to filtered context or global? 
        // "riesgo_fidelizacion_proxy" -> generic metric. I'll use filtered devs to identify problematic clients in this period)
        const returnsByClient: Record<string, number> = {};
        filteredDevs.forEach(d => {
            returnsByClient[d.id_cliente] = (returnsByClient[d.id_cliente] || 0) + 1;
        });
        const clientsWithMultipleReturns = Object.values(returnsByClient).filter(count => count >= 2).length;

        // b) Late resolutions (> 7 days)
        const lateResolutions = resolvedDevs.filter(d => {
            const start = parseISO(d.fecha_solicitud);
            const end = parseISO(d.fecha_cierre!);
            return differenceInDays(end, start) > 7;
        }).length;


        // 3. Charts Data

        // By Motivo
        const byMotivoMap: Record<string, number> = {};
        filteredDevs.forEach(d => { byMotivoMap[d.motivo] = (byMotivoMap[d.motivo] || 0) + 1; });
        const chartMotivo = Object.entries(byMotivoMap).map(([name, value]) => ({ name, value }));

        // By Estado
        const byEstadoMap: Record<string, number> = {};
        filteredDevs.forEach(d => { byEstadoMap[d.estado] = (byEstadoMap[d.estado] || 0) + 1; });
        const chartEstado = Object.entries(byEstadoMap).map(([name, value]) => ({ name, value }));

        // By Resolucion
        const byResolucionMap: Record<string, number> = {};
        resolvedDevs.forEach(d => {
            if (d.resolucion) byResolucionMap[d.resolucion] = (byResolucionMap[d.resolucion] || 0) + 1;
        });
        const chartResolucion = Object.entries(byResolucionMap).map(([name, value]) => ({ name, value }));

        // By Date (Line Chart)
        const byDateMap: Record<string, number> = {};
        filteredDevs.forEach(d => {
            const date = d.fecha_solicitud; // YYYY-MM-DD
            byDateMap[date] = (byDateMap[date] || 0) + 1;
        });
        const chartTimeline = Object.entries(byDateMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, count }));


        // 4. Top Clients Table
        const topClients = Object.entries(returnsByClient)
            .map(([id, count]) => {
                const client = clientes.find(c => c.id_cliente === id);
                return {
                    id,
                    nombres: client?.nombres || 'Desconocido',
                    count,
                    totalCost: filteredDevs.filter(d => d.id_cliente === id).reduce((s, x) => s + x.costo, 0)
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            kpis: {
                totalClientes, // global total or filtered? usually global context unless filtered by zone
                filteredTotalClientes: new Set(filteredDevs.map(d => d.id_cliente)).size, // clients involved in filtered returns
                totalDevoluciones,
                pending,
                inProcess,
                resolved,
                totalCost,
                avgCost,
                avgResolutionTime,
                clientsWithMultipleReturns,
                lateResolutions
            },
            charts: {
                motivo: chartMotivo,
                estado: chartEstado,
                resolucion: chartResolucion,
                timeline: chartTimeline
            },
            topClients
        };
    }, [clientes, devoluciones, filters]);
};
