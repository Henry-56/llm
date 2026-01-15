const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const clientes = [];
const devoluciones = [];

const zonas = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
const motivos = ['defecto', 'daño', 'arrepentimiento', 'otro'];
const estados = ['pendiente', 'en_proceso', 'resuelto'];
const resoluciones = ['reparación', 'cambio', 'reembolso', 'cupón'];
const categorias = ['Electrónica', 'Hogar', 'Ropa', 'Deportes'];

// Generate 20 Clients
for (let i = 1; i <= 20; i++) {
    const id = `C-${String(i).padStart(3, '0')}`;
    clientes.push({
        id_cliente: id,
        nombres: `Cliente ${i}`,
        celular: `999000${String(i).padStart(3, '0')}`,
        email: `cliente${i}@example.com`,
        zona: zonas[Math.floor(Math.random() * zonas.length)],
        fecha_registro: '2023-01-15'
    });
}

// Generate 30 Devoluciones
for (let i = 1; i <= 30; i++) {
    const clientId = `C-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`;
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const esResuelto = estado === 'resuelto';

    devoluciones.push({
        id_devolucion: `D-${String(i).padStart(3, '0')}`,
        id_cliente: clientId,
        producto: `Producto ${String(String.fromCharCode(65 + i % 26))}`,
        categoria: categorias[Math.floor(Math.random() * categorias.length)],
        motivo: motivos[Math.floor(Math.random() * motivos.length)],
        estado: estado,
        fecha_solicitud: '2023-02-01',
        fecha_cierre: esResuelto ? '2023-02-05' : null,
        costo: Math.floor(Math.random() * 500) + 50,
        resolucion: esResuelto ? resoluciones[Math.floor(Math.random() * resoluciones.length)] : null
    });
}

const wb = XLSX.utils.book_new();
const wsClientes = XLSX.utils.json_to_sheet(clientes);
const wsDevoluciones = XLSX.utils.json_to_sheet(devoluciones);

XLSX.utils.book_append_sheet(wb, wsClientes, "clientes");
XLSX.utils.book_append_sheet(wb, wsDevoluciones, "devoluciones");

const outFile = path.join(__dirname, 'sample-data.xlsx');
XLSX.writeFile(wb, outFile);
console.log(`Created ${outFile}`);
