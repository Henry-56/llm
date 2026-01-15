const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('sample-data.xlsx');
const sheetClientes = workbook.Sheets['clientes'];
const sheetDevs = workbook.Sheets['devoluciones'];

const rawClientes = XLSX.utils.sheet_to_json(sheetClientes);
const rawDevs = XLSX.utils.sheet_to_json(sheetDevs);

// We need to format dates as strings to match what the app expects after parsing? 
// Actually the app expects Date objects in state? 
// Let's check validators.ts. 
// state: Cliente[] where fecha_registro is string (ISO YYYY-MM-DD)?
// types/index.ts: fecha_registro: string;
// validators.ts: parseDate returns string 'yyyy-MM-dd'.
// So yes, strings. XLSX sheet_to_json with raw:false might help, or we manually process.
// But wait, the app imports data using `parseExcel` which calls `validateClientes` which calls `parseDate`.
// `parseDate` handles serial numbers (numbers) and returns YYYY-MM-DD string.
// `sheet_to_json` by default tries to parse.

// Let's emulate the 'validate' logic lightly or just assume sample-data.xlsx is good 
// and just format the dates to YYYY-MM-DD strings if they are numbers.

function excelDateToJSDate(serial) {
    if (typeof serial === 'string') return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
}

const clientes = rawClientes.map(c => ({
    ...c,
    fecha_registro: typeof c.fecha_registro === 'number' ? excelDateToJSDate(c.fecha_registro) : c.fecha_registro
}));

const devoluciones = rawDevs.map(d => ({
    ...d,
    fecha_solicitud: typeof d.fecha_solicitud === 'number' ? excelDateToJSDate(d.fecha_solicitud) : d.fecha_solicitud,
    fecha_cierre: d.fecha_cierre && typeof d.fecha_cierre === 'number' ? excelDateToJSDate(d.fecha_cierre) : d.fecha_cierre
}));

console.log(JSON.stringify({ clientes, devoluciones }));
