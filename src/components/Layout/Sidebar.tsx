import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Upload, Users, Undo2, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
    { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/app/import', label: 'Importar Excel', icon: Upload },
    { to: '/app/clientes', label: 'Clientes', icon: Users },
    { to: '/app/devoluciones', label: 'Devoluciones', icon: Undo2 },
    { to: '/app/ajustes', label: 'Ajustes', icon: Settings },
];

export const Sidebar: FC = () => {
    return (
        <div className="flex h-screen flex-col bg-slate-900 text-white w-64 flex-shrink-0 transition-all duration-300">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight text-blue-400">AdminPanel</h1>
                <p className="text-xs text-slate-400">Gestión de Devoluciones</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )
                        }
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-slate-500">Solo Vista</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
