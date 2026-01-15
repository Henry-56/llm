import { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import type { Cliente, Devolucion } from '../types';

interface DataState {
    clientes: Cliente[];
    devoluciones: Devolucion[];
}

interface DataContextType extends DataState {
    setImportedData: (data: DataState) => void;
    updateDevolucion: (id: string, updates: Partial<Devolucion>) => void;
    resetData: () => void;
    isLoaded: boolean; // to prevent flash if loading from localstorage
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_CLIENTES = 'app_clientes';
const STORAGE_KEY_DEVOLUCIONES = 'app_devoluciones';

export const DataProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const storedClientes = localStorage.getItem(STORAGE_KEY_CLIENTES);
        const storedDevoluciones = localStorage.getItem(STORAGE_KEY_DEVOLUCIONES);

        if (storedClientes) {
            try {
                setClientes(JSON.parse(storedClientes));
            } catch (e) {
                console.error("Error parsing stored clientes", e);
            }
        }

        if (storedDevoluciones) {
            try {
                setDevoluciones(JSON.parse(storedDevoluciones));
            } catch (e) {
                console.error("Error parsing stored devoluciones", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Persistence Helper
    const persist = (newClientes: Cliente[], newDevoluciones: Devolucion[]) => {
        localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(newClientes));
        localStorage.setItem(STORAGE_KEY_DEVOLUCIONES, JSON.stringify(newDevoluciones));
    };

    const setImportedData = (data: DataState) => {
        setClientes(data.clientes);
        setDevoluciones(data.devoluciones);
        persist(data.clientes, data.devoluciones);
    };

    const updateDevolucion = (id: string, updates: Partial<Devolucion>) => {
        setDevoluciones(prev => {
            const updated = prev.map(d => d.id_devolucion === id ? { ...d, ...updates } : d);
            persist(clientes, updated); // Persist immediately
            return updated;
        });
    };

    const resetData = () => {
        setClientes([]);
        setDevoluciones([]);
        localStorage.removeItem(STORAGE_KEY_CLIENTES);
        localStorage.removeItem(STORAGE_KEY_DEVOLUCIONES);
    };

    return (
        <DataContext.Provider value={{
            clientes,
            devoluciones,
            setImportedData,
            updateDevolucion,
            resetData,
            isLoaded
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
