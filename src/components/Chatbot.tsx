import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

interface Message {
    id: string;
    role: 'user' | 'bot';
    text: string;
}

export const Chatbot: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'bot', text: 'Hola, soy tu asistente AI. ¿En qué puedo ayudarte con tus devoluciones hoy?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { devoluciones, clientes } = useData(); // Access context to give AI context!

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getClientName = (id: string) => clientes.find(c => c.id_cliente === id)?.nombres || id;

    // simplistic RAG: Retrieve relevant items based on keyword match
    const retrieveContext = (query: string): string => {
        const lowerQuery = query.toLowerCase();

        // simple keyword scoring
        const scoredDocs = devoluciones.map(dev => {
            let score = 0;
            const clientName = getClientName(dev.id_cliente).toLowerCase();
            const searchableText = `${dev.id_devolucion} ${dev.id_cliente} ${clientName} ${dev.producto} ${dev.motivo} ${dev.estado} ${dev.resolucion || ''}`.toLowerCase();

            if (searchableText.includes(lowerQuery)) score += 10;
            // Split query into words for partial matches
            const words = lowerQuery.split(/\s+/);
            words.forEach(word => {
                if (word.length > 3 && searchableText.includes(word)) score += 2;
            });

            return { dev, score, clientName };
        });

        // Filter and sort by score
        let topDocs = scoredDocs
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // FALLBACK: If query is general (no specific matches), provide the latest 20 records
        // This allows questions like "dame los nombres de los clientes" to work.
        if (topDocs.length === 0) {
            topDocs = scoredDocs
                .slice(0, 20) // Take first 20 (assuming natural order is meaningful or arbitrary is fine for "list")
                .map(d => ({ ...d, score: 1 }));
        }

        if (topDocs.length === 0) return "";

        return topDocs.map(d =>
            `- ID: ${d.dev.id_devolucion}, Cliente: ${d.clientName} (${d.dev.id_cliente}), Producto: ${d.dev.producto}, Motivo: ${d.dev.motivo}, Estado: ${d.dev.estado}, Fecha: ${d.dev.fecha_solicitud}${d.dev.estado === 'resuelto' ? `, Resolución: ${d.dev.resolucion}` : ''}`
        ).join('\n');
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        if (!API_KEY) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: input }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { id: 'error', role: 'bot', text: 'Error: API Key no configurada. Por favor reinicia el servidor de desarrollo para cargar las variables de entorno.' }]);
            }, 500);
            setInput('');
            return;
        }

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Using gemini-2.5-flash-lite as validated
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

            // Prepare context for the AI
            const context = retrieveContext(userMsg.text);

            const contextPrompt = `
Eres un asistente experto en un sistema de gestión de devoluciones.

CONTEXTO DE DATOS ENCONTRADOS (Top 10 coincidencias):
${context || "- No se encontraron coincidencias exactas en la base de datos para esta consulta."}

Resumen General del Sistema:
- Total Devoluciones: ${devoluciones.length}
- Total Clientes: ${clientes.length}

Usuario pregunta: "${userMsg.text}"

Instrucciones:
1. Usa la información de "CONTEXTO DE DATOS ENCONTRADOS" para responder preguntas sobre casos específicos (nombres, IDs, productos).
2. Si la información está en el contexto, úsala. Si no, responde con la información general o indica amablemente qué no encuentras el dato.
3. Responde de manera concisa, útil y profesional en Español.
            `;

            const result = await model.generateContent(contextPrompt);
            const response = result.response;
            const text = response.text();

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text }]);
        } catch (error: any) {
            console.error('Error calling Gemini:', error);
            const errorMessage = error.message || 'Error desconocido';
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: `Error: ${errorMessage}. (Verifica API Key y Modelo)` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white z-50 transition-transform",
                    isOpen && "hidden"
                )}
            >
                <MessageSquare size={26} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Asistente AI</h3>
                                    <p className="text-xs text-blue-100 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                                        Online - Gemini 2.5 Lite
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-blue-600 text-white rounded-tr-none"
                                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                                        )}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu consulta..."
                                    className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <div className="text-center mt-2">
                                <p className="text-[10px] text-gray-400">Powered by Gemini AI • Puede cometer errores.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
