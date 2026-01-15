import type { FC } from 'react';
import { Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';

const SettingsPage: FC = () => {
    const { resetData } = useData();

    const downloadTemplate = () => {
        const clientsHeader = [
            { id_cliente: "C-001", nombres: "Juan Perez", celular: "999888777", email: "juan@example.com", zona: "Norte", fecha_registro: "2023-01-15" }
        ];
        const devolucionesHeader = [
            { id_devolucion: "D-001", id_cliente: "C-001", producto: "Laptop", categoria: "Tecnología", motivo: "defecto", estado: "pendiente", fecha_solicitud: "2023-01-20", fecha_cierre: null, costo: 1200, resolucion: null }
        ];

        const wb = XLSX.utils.book_new();
        const wsClientes = XLSX.utils.json_to_sheet(clientsHeader);
        const wsDevoluciones = XLSX.utils.json_to_sheet(devolucionesHeader);

        XLSX.utils.book_append_sheet(wb, wsClientes, "clientes");
        XLSX.utils.book_append_sheet(wb, wsDevoluciones, "devoluciones");

        XLSX.writeFile(wb, "template_importacion.xlsx");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Herramientas</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div>
                            <h4 className="font-medium text-blue-900">Plantilla Excel</h4>
                            <p className="text-sm text-blue-700">Descarga el archivo base con las columnas requeridas para importar datos.</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            <Download size={18} /> Descargar
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                        <div>
                            <h4 className="font-medium text-red-900">Resetear Aplicación</h4>
                            <p className="text-sm text-red-700">Elimina todos los datos y configuraciones locales.</p>
                        </div>
                        <button
                            onClick={resetData}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                        >
                            <Trash2 size={18} /> Reset Completo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
