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
    const { devoluciones } = useData(); // Access context to give AI context!

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            // Reverting to gemini-1.5-flash as 2.0-flash-lite failed with Quota Exceeded (Limit 0).
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // Prepare context for the AI
            // We'll give it a summary of the current data state
            const contextPrompt = `
Eres un asistente experto en un sistema de gestión de devoluciones.
Contexto Actual del Sistema:
- Total Devoluciones en base de datos: ${devoluciones.length}
- Estado de los datos: ${devoluciones.length > 0 ? 'Datos cargados' : 'Sin datos o vacío'}

Usuario pregunta: "${userMsg.text}"

Responde de manera concisa, útil y profesional. Si te preguntan por datos específicos que no tienes, explica que solo ves resúmenes generales o guíalos a la sección correcta del dashboard.
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
                                        Online - Gemini 1.5
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
