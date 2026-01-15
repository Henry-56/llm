import * as XLSX from 'xlsx';
import type { ImportResult } from '../types';
import { validateClientes, validateDevoluciones } from './validators';

const REQUIRED_SHEETS = ['clientes', 'devoluciones'];

const REQUIRED_COLS_CLIENTES = [
    'id_cliente', 'nombres', 'celular', 'email', 'zona', 'fecha_registro'
];

const REQUIRED_COLS_DEVOLUCIONES = [
    'id_devolucion', 'id_cliente', 'producto', 'categoria', 'motivo',
    'estado', 'fecha_solicitud', 'fecha_cierre', 'costo', 'resolucion'
];

function checkColumns(sheet: XLSX.WorkSheet, required: string[], sheetName: string): string[] {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const headers: string[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        if (cell && cell.v) headers.push(String(cell.v).trim());
    }

    const missing = required.filter(col => !headers.includes(col));
    return missing.map(col => `Hoja "${sheetName}" falta columna: ${col}`);
}

export async function parseExcel(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

                const globalErrors: string[] = [];

                // 1. Validate Sheets
                REQUIRED_SHEETS.forEach(name => {
                    if (!workbook.SheetNames.includes(name)) {
                        globalErrors.push(`Falta hoja requerida: "${name}"`);
                    }
                });

                if (globalErrors.length > 0) {
                    return resolve({
                        ok: false,
                        summary: {
                            clientes: { total: 0, valid: 0, invalid: 0 },
                            devoluciones: { total: 0, valid: 0, invalid: 0 }
                        },
                        preview: { clientes: [], devoluciones: [] },
                        validData: { clientes: [], devoluciones: [] },
                        errors: [],
                        globalErrors
                    });
                }

                // 2. Validate Structure (Columns)
                const sheetClientes = workbook.Sheets['clientes'];
                const sheetDevs = workbook.Sheets['devoluciones'];

                const missingColsClientes = checkColumns(sheetClientes, REQUIRED_COLS_CLIENTES, 'clientes');
                const missingColsDevs = checkColumns(sheetDevs, REQUIRED_COLS_DEVOLUCIONES, 'devoluciones');

                if (missingColsClientes.length > 0 || missingColsDevs.length > 0) {
                    return resolve({
                        ok: false,
                        summary: {
                            clientes: { total: 0, valid: 0, invalid: 0 },
                            devoluciones: { total: 0, valid: 0, invalid: 0 }
                        },
                        preview: { clientes: [], devoluciones: [] },
                        validData: { clientes: [], devoluciones: [] },
                        errors: [],
                        globalErrors: [...missingColsClientes, ...missingColsDevs]
                    });
                }

                // 3. Parse Rows
                const rawClientes = XLSX.utils.sheet_to_json(sheetClientes);
                const rawDevs = XLSX.utils.sheet_to_json(sheetDevs);

                // 4. Validate Logic
                const resClientes = validateClientes(rawClientes);
                const resDevs = validateDevoluciones(rawDevs, resClientes.valid); // Pass valid clients for ID check

                const allErrors = [...resClientes.errors, ...resDevs.errors];

                resolve({
                    ok: allErrors.length === 0 && globalErrors.length === 0, // Or maybe we allow partial import? 
                    // Prompt says: "Validaciones por fila (no bloquean import total; se importan filas válidas)"
                    // So 'ok' is basically validData.length > 0? Or always true if no global errors?
                    // I'll set 'ok' to true if NO global errors, but user explicitely triggers import of valid only.
                    // BUT prompt "Botón Importar válidos: Disabled si existen globalErrors".
                    // So 'ok' in ImportResult can just mean "Parse successful", but let's stick to true.

                    summary: {
                        clientes: {
                            total: rawClientes.length,
                            valid: resClientes.valid.length,
                            invalid: resClientes.errors.length
                        },
                        devoluciones: {
                            total: rawDevs.length,
                            valid: resDevs.valid.length,
                            invalid: resDevs.errors.length
                        }
                    },
                    preview: {
                        clientes: rawClientes.slice(0, 10),
                        devoluciones: rawDevs.slice(0, 10)
                    },
                    validData: {
                        clientes: resClientes.valid,
                        devoluciones: resDevs.valid
                    },
                    errors: allErrors,
                    globalErrors: []
                });

            } catch (err) {
                resolve({
                    ok: false,
                    summary: {
                        clientes: { total: 0, valid: 0, invalid: 0 },
                        devoluciones: { total: 0, valid: 0, invalid: 0 }
                    },
                    preview: { clientes: [], devoluciones: [] },
                    validData: { clientes: [], devoluciones: [] },
                    errors: [],
                    globalErrors: ['Error crítico al leer el archivo. Asegúrese de que es un Excel válido.']
                });
            }
        };

        reader.onerror = () => {
            resolve({
                ok: false,
                summary: {
                    clientes: { total: 0, valid: 0, invalid: 0 },
                    devoluciones: { total: 0, valid: 0, invalid: 0 }
                },
                preview: { clientes: [], devoluciones: [] },
                validData: { clientes: [], devoluciones: [] },
                errors: [],
                globalErrors: ['Error de lectura de archivo.']
            });
        }

        reader.readAsBinaryString(file);
    });
}
