import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Search, ArrowRight } from 'lucide-react';
import { parseExcel } from '../lib/excel-parser';
import { useData } from '../context/DataContext';
import type { ImportResult } from '../types';
import { cn } from '../lib/utils';

export const ImportPage: React.FC = () => {
    const navigate = useNavigate();
    const { setImportedData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [result, setResult] = useState<ImportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'errors' | 'preview'>('summary');
    const [errorSearch, setErrorSearch] = useState('');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await parseExcel(file);
            setResult(data);
            if (!data.ok || data.globalErrors.length > 0 || data.errors.length > 0) {
                setActiveTab('errors'); // Auto switch if errors
            } else {
                setActiveTab('summary');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        if (result && result.validData) {
            setImportedData(result.validData);
            navigate('/');
        }
    };

    const filteredErrors = result?.errors.filter(e =>
        e.message.toLowerCase().includes(errorSearch.toLowerCase()) ||
        e.sheet.toLowerCase().includes(errorSearch.toLowerCase()) ||
        String(e.rowNumber).includes(errorSearch)
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Importar Excel</h1>
                <p className="text-gray-500">Carga tu archivo de datos para actualizar el sistema.</p>
            </div>

            {/* Upload Section */}
            <div className="bg-white p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors text-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls"
                    className="hidden"
                />
                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <Upload size={32} />
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-900">Haz click para subir tu archivo Excel</p>
                        <p className="text-sm text-gray-500">Soporta .xlsx con hojas &quot;clientes&quot; y &quot;devoluciones&quot;</p>
                    </div>
                    {loading && <p className="text-blue-600 animate-pulse">Procesando archivo...</p>}
                </div>
            </div>

            {result && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={cn("px-6 py-3 text-sm font-medium", activeTab === 'summary' ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700")}
                        > Resumen </button>
                        <button
                            onClick={() => setActiveTab('errors')}
                            className={cn("px-6 py-3 text-sm font-medium flex items-center gap-2", activeTab === 'errors' ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700")}
                        >
                            Errores
                            {result.errors.length > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{result.errors.length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={cn("px-6 py-3 text-sm font-medium", activeTab === 'preview' ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700")}
                        > Vista Previa </button>
                    </div>

                    <div className="p-6">
                        {/* Global Errors */}
                        {result.globalErrors.length > 0 && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                                    <XCircle size={18} /> Errores Críticos
                                </h3>
                                <ul className="list-disc list-inside text-red-700 text-sm">
                                    {result.globalErrors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}

                        {activeTab === 'summary' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SheetSummaryCard title="Clientes" data={result.summary.clientes} />
                                <SheetSummaryCard title="Devoluciones" data={result.summary.devoluciones} />
                            </div>
                        )}

                        {activeTab === 'errors' && (
                            <div>
                                <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200 max-w-sm">
                                    <Search size={16} className="text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar error..."
                                        value={errorSearch}
                                        onChange={(e) => setErrorSearch(e.target.value)}
                                        className="bg-transparent text-sm outline-none w-full"
                                    />
                                </div>
                                {result.errors.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                                        <CheckCircle size={48} className="text-green-500 mb-2" />
                                        <p>No se encontraron errores en las filas.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-auto max-h-[400px]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                                <tr>
                                                    <th className="p-3">Hoja</th>
                                                    <th className="p-3">Fila</th>
                                                    <th className="p-3">Columna</th>
                                                    <th className="p-3">Mensaje</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredErrors?.map((err, i) => (
                                                    <tr key={i} className="hover:bg-red-50">
                                                        <td className="p-3 font-medium text-gray-900">{err.sheet}</td>
                                                        <td className="p-3 font-mono text-gray-600">#{err.rowNumber}</td>
                                                        <td className="p-3 text-gray-600">{err.column || '-'}</td>
                                                        <td className="p-3 text-red-600 font-medium">{err.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preview' && (
                            <div className="space-y-8">
                                <PreviewTable title="Clientes (Primeros 10)" rows={result.preview.clientes} />
                                <PreviewTable title="Devoluciones (Primeros 10)" rows={result.preview.devoluciones} />
                            </div>
                        )}

                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                        <button
                            onClick={handleImport}
                            disabled={result.globalErrors.length > 0 || (result.validData.clientes.length === 0 && result.validData.devoluciones.length === 0)}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                        >
                            Importar {result.validData.clientes.length + result.validData.devoluciones.length} Registros Válidos
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SheetSummaryCard = ({ title, data }: { title: string, data: any }) => (
    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} /> {title}
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                <p className="text-xl font-bold text-gray-900">{data.total}</p>
            </div>
            <div>
                <p className="text-xs text-green-600 uppercase font-bold">Válidos</p>
                <p className="text-xl font-bold text-green-600">{data.valid}</p>
            </div>
            <div>
                <p className="text-xs text-red-600 uppercase font-bold">Error</p>
                <p className="text-xl font-bold text-red-600">{data.invalid}</p>
            </div>
        </div>
    </div>
);

const PreviewTable = ({ title, rows }: { title: string, rows: any[] }) => (
    <div>
        <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{title}</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-xs text-left whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-600 font-semibold">
                    <tr>
                        {rows.length > 0 && Object.keys(rows[0]).map(key => (
                            <th key={key} className="p-2 border-b border-gray-200">{key}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {Object.values(row).map((val: any, j) => (
                                <td key={j} className="p-2">{String(val).substring(0, 50)}</td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && <tr><td className="p-4 text-center text-gray-400 italic">Sin datos para mostrar</td></tr>}
                </tbody>
            </table>
        </div>
    </div>
);

export default ImportPage;
