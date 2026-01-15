import type { Cliente, Devolucion, RowError, DevolucionMotivo, DevolucionStatus, DevolucionResolucion } from '../types';
import { isValid, format, parseISO } from 'date-fns';

// Helper: Normalize strings
export const normalizeString = (str: any): string => {
    if (typeof str !== 'string') return '';
    return str.trim();
};

export const normalizeEnum = (str: any): string => {
    if (!str) return '';
    return String(str).trim().toLowerCase().replace(/\s+/g, '_');
};

// Helper: Parse Date (Excel or String)
export const parseDate = (val: any): string | null => {
    if (!val) return null;

    // If it's an Excel serial date (number)
    if (typeof val === 'number') {
        // Excel base date is usually 1899-12-30. 
        // Roughly: new Date(Math.round((val - 25569)*86400*1000))
        // But exact conversion is better handled or simple approximation.
        // simpler: (val - 25569) * 86400000
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (isValid(date)) return format(date, 'yyyy-MM-dd');
    }

    // If string
    if (typeof val === 'string') {
        // Try ISO
        let date = parseISO(val);
        if (isValid(date)) return format(date, 'yyyy-MM-dd');

        // Try other formats if needed, or stick to simple ISO
        // The prompt says "YYYY-MM-DD"
        // Just returning the string if it matches regex could work too
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }

    return null;
};

// Validation Sets
const VALID_MOTIVOS = ['defecto', 'daño', 'dano', 'arrepentimiento', 'otro'];
const VALID_ESTADOS = ['pendiente', 'en_proceso', 'resuelto'];
const VALID_RESOLUCIONES = ['reparación', 'reparacion', 'cambio', 'reembolso', 'cupón', 'cupon'];

export function validateClientes(rows: any[]): { valid: Cliente[]; errors: RowError[] } {
    const valid: Cliente[] = [];
    const errors: RowError[] = [];
    const viewedIds = new Set<string>();
    const viewedEmails = new Set<string>();
    const viewedPhones = new Set<string>();

    rows.forEach((row, index) => {
        const rowNum = index + 2; // +1 for 0-index, +1 for header
        let hasError = false;

        // Extract raw values
        const id_cliente = normalizeString(row['id_cliente']);
        const nombres = normalizeString(row['nombres']);
        const celular = normalizeString(row['celular']);
        const email = normalizeString(row['email']);
        const zona = normalizeString(row['zona']);
        const fecha_registro_raw = row['fecha_registro'];

        // Validations
        if (!id_cliente) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'id_cliente', message: 'Falta ID Cliente' });
            hasError = true;
        } else if (viewedIds.has(id_cliente)) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'id_cliente', message: 'ID Cliente duplicado' });
            hasError = true;
        }

        if (!nombres) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'nombres', message: 'Falta Nombres' });
            hasError = true;
        }

        // Celular: 9-15 chars, allow +
        if (!celular) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'celular', message: 'Falta Celular' });
            hasError = true;
        } else if (!/^[+]?[\d\s-]{9,15}$/.test(celular)) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'celular', message: 'Celular inválido' });
            hasError = true;
        } else if (viewedPhones.has(celular)) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'celular', message: 'Celular duplicado' });
            hasError = true;
        }

        // Email
        if (!email) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'email', message: 'Falta Email' });
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'email', message: 'Email inválido' });
            hasError = true;
        } else if (viewedEmails.has(email)) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'email', message: 'Email duplicado' });
            hasError = true;
        }

        if (!zona) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'zona', message: 'Falta Zona' });
            hasError = true;
        }

        const fecha_registro = parseDate(fecha_registro_raw);
        if (!fecha_registro) {
            errors.push({ sheet: 'clientes', rowNumber: rowNum, column: 'fecha_registro', message: 'Fecha Registro inválida' });
            hasError = true;
        }

        if (!hasError && id_cliente && fecha_registro) {
            viewedIds.add(id_cliente);
            viewedEmails.add(email);
            viewedPhones.add(celular);
            valid.push({
                id_cliente,
                nombres,
                celular,
                email,
                zona,
                fecha_registro
            });
        }
    });

    return { valid, errors };
}

export function validateDevoluciones(rows: any[], validClientes: Cliente[]): { valid: Devolucion[]; errors: RowError[] } {
    const valid: Devolucion[] = [];
    const errors: RowError[] = [];
    const viewedIds = new Set<string>();
    const clienteIds = new Set(validClientes.map(c => c.id_cliente));

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        let hasError = false;

        const id_devolucion = normalizeString(row['id_devolucion']);
        const id_cliente = normalizeString(row['id_cliente']);
        const producto = normalizeString(row['producto']);
        const categoria = normalizeString(row['categoria']);

        let motivo = normalizeEnum(row['motivo']);
        // Normalize variants
        if (motivo === 'dano') motivo = 'daño';

        const estado = normalizeEnum(row['estado']);

        const fecha_solicitud = parseDate(row['fecha_solicitud']);
        const fecha_cierre = parseDate(row['fecha_cierre']);

        const costo = Number(row['costo']);

        let resolucion = normalizeEnum(row['resolucion']);
        if (resolucion === 'reparacion') resolucion = 'reparación';
        if (resolucion === 'cupon') resolucion = 'cupón';

        // Validations
        if (!id_devolucion) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'id_devolucion', message: 'Falta ID Devolución' });
            hasError = true;
        } else if (viewedIds.has(id_devolucion)) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'id_devolucion', message: 'ID Devolución duplicado' });
            hasError = true;
        }

        if (!id_cliente) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'id_cliente', message: 'Falta ID Cliente' });
            hasError = true;
        } else if (!clienteIds.has(id_cliente)) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'id_cliente', message: `Cliente ${id_cliente} no existe` });
            hasError = true;
        }

        if (!producto) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'producto', message: 'Falta Producto' });
            hasError = true;
        }
        if (!categoria) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'categoria', message: 'Falta Categoria' });
            hasError = true;
        }

        if (!VALID_MOTIVOS.includes(motivo)) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'motivo', message: `Motivo inválido: ${motivo}` });
            hasError = true;
        }

        if (!VALID_ESTADOS.includes(estado)) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'estado', message: `Estado inválido: ${estado}` });
            hasError = true;
        }

        if (!fecha_solicitud) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'fecha_solicitud', message: 'Fecha Solicitud inválida' });
            hasError = true;
        }

        if (isNaN(costo) || costo < 0) {
            errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'costo', message: 'Costo inválido' });
            hasError = true;
        }

        // Rules for Resuelto
        if (estado === 'resuelto') {
            if (!fecha_cierre) {
                errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'fecha_cierre', message: 'Fecha cierre obligatoria si resuelto' });
                hasError = true;
            }
            if (!VALID_RESOLUCIONES.includes(resolucion)) {
                errors.push({ sheet: 'devoluciones', rowNumber: rowNum, column: 'resolucion', message: 'Resolución inválida' });
                hasError = true;
            }
        } else {
            // Not resuelto
            if (fecha_cierre) {
                // Optionally warn or just ignore? Prompt says "fecha_cierre debe quedar null"
                // Logic: we force it to null in safe object
            }
        }

        if (!hasError && id_devolucion && fecha_solicitud) {
            viewedIds.add(id_devolucion);
            valid.push({
                id_devolucion,
                id_cliente,
                producto,
                categoria,
                motivo: motivo as DevolucionMotivo,
                estado: estado as DevolucionStatus,
                fecha_solicitud,
                fecha_cierre: estado === 'resuelto' ? fecha_cierre : null,
                costo,
                resolucion: estado === 'resuelto' ? (resolucion as DevolucionResolucion) : undefined
            });
        }
    });

    return { valid, errors };
}
