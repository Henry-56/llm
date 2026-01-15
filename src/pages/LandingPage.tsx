import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, ShieldCheck, Zap, Upload } from 'lucide-react';
import { Chatbot } from '../components/Chatbot';

export const LandingPage: FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap size={20} className="text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            AdminPanel AI
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Características</a>
                        <a href="#demo" className="hover:text-white transition-colors">Demo</a>
                        <button
                            onClick={() => navigate('/app')}
                            className="bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors font-semibold"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-6 border border-blue-500/20">
                            Potenciado con Gemini AI ✨
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                            Gestión de Devoluciones <br />
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                Inteligente y Robusta
                            </span>
                        </h1>
                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Simplifica tu flujo de trabajo con nuestra plataforma de análisis de datos.
                            Importa tus Excel, visualiza métricas clave y deja que nuestra AI te asista.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/app')}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                            >
                                Entrar a la App <ArrowRight size={20} />
                            </motion.button>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="#features"
                                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-lg border border-slate-700 transition-all"
                            >
                                Ver Más
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Upload className="text-blue-500" />}
                            title="Importación Rápida"
                            desc="Arrastra y suelta tus archivos Excel. Validación automática de estructura y datos al instante."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="text-purple-500" />}
                            title="Dashboard Interactivo"
                            desc="KPIs en tiempo real, gráficos de evolución y análisis detallado de devoluciones."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-green-500" />}
                            title="Datos Seguros"
                            desc="Procesamiento local en tu navegador. Tus datos nunca salen de tu dispositivo sin tu permiso."
                        />
                    </div>
                </div>
            </section>

            {/* Chatbot Integration */}
            <Chatbot />
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
    >
        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-slate-400 leading-relaxed">
            {desc}
        </p>
    </motion.div>
);
