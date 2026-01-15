import { useState } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Topbar: FC = () => {
    const { resetData } = useData();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    const handleReset = () => {
        if (confirmInput === 'RESET') {
            resetData();
            setShowConfirm(false);
            setConfirmInput('');
            navigate('/app'); // Redirect to main app home
        }
    };

    return (
        <>
            <header className="h-16 border-b border-gray-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-lg font-semibold text-gray-700">Panel de Administración</h2>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                    <Trash2 size={16} />
                    Reset Demo
                </button>
            </header>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Estás seguro?</h3>
                        <p className="text-gray-500 mb-6">
                            Esta acción borrará todos los datos importados y limpiará el almacenamiento local.
                            Para confirmar, escribe <strong>RESET</strong> abajo.
                        </p>
                        <input
                            type="text"
                            value={confirmInput}
                            onChange={(e) => setConfirmInput(e.target.value)}
                            placeholder="Escribe RESET"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowConfirm(false); setConfirmInput(''); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={confirmInput !== 'RESET'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Confirmar Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
