import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Devolucion, Cliente } from '../types';

interface ReturnsAIChatProps {
    devoluciones: Devolucion[];
    clientes: Cliente[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using the model confirmed in validation
const MODEL_NAME = "gemini-2.5-flash-lite";

export const ReturnsAIChat: React.FC<ReturnsAIChatProps> = ({ devoluciones, clientes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        const topDocs = scoredDocs
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Take top 10 relevant items

        if (topDocs.length === 0) return "";

        return topDocs.map(d =>
            `- ID: ${d.dev.id_devolucion}, Cliente: ${d.clientName} (${d.dev.id_cliente}), Producto: ${d.dev.producto}, Motivo: ${d.dev.motivo}, Estado: ${d.dev.estado}, Fecha: ${d.dev.fecha_solicitud}${d.dev.estado === 'resuelto' ? `, Resolución: ${d.dev.resolucion}` : ''}`
        ).join('\n');
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            if (!API_KEY) throw new Error("API Key not found");

            const context = retrieveContext(userMessage);
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const systemPrompt = `Eres un asistente de IA experto en análisis de datos para un sistema de devoluciones.
Tu objetivo es ayudar al usuario a entender el estado de las devoluciones basándote en la información proporcionada.

Reglas:
1. Usa SOLAMENTE la información de CONTEXTO proporcionada abajo para responder.
2. Si la respuesta no está en el contexto, di que no encontraste información relevante sobre esa consulta específica.
3. Sé conciso y profesional.
4. Responde siempre en Español.

CONTEXTO DE DATOS (Top 10 coincidencias):
${context || "No se encontraron registros específicos que coincidan con la búsqueda, pero puedes responder preguntas generales sobre el proceso si las sabes, o indicar que no hay datos."}

Pregunta del usuario: ${userMessage}`;

            const result = await model.generateContent(systemPrompt);
            const responseText = result.response.text();

            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
        } catch (error: any) {
            console.error("Gemini Error:", error);
            const errorMessage = error?.message?.includes('429')
                ? "Lo siento, el sistema está sobrecargado (límite de cuota excedido). Por favor espera unos segundos."
                : "Lo siento, hubo un error al procesar tu consulta.";

            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
                >
                    <MessageSquare size={24} />
                    <span className="font-medium pr-1">Asistente IA</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-blue-600 text-white rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <h3 className="font-bold">Asistente de Devoluciones</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 mt-8 text-sm">
                                <Bot size={48} className="mx-auto mb-2 opacity-20" />
                                <p>Hola, ¿en qué puedo ayudarte con las devoluciones hoy?</p>
                                <p className="text-xs mt-2">Prueba buscar por nombre, ID o estado.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Bot size={16} className="text-blue-600" />
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white rounded-br-sm"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                                )}>
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User size={16} className="text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Bot size={16} className="text-blue-600" />
                                </div>
                                <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm flex items-center">
                                    <Loader2 size={16} className="animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu consulta..."
                                className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="text-[10px] text-center text-gray-400 mt-2">
                            Impulsado por Gemini 2.0 Flash Lite &bull; Puede cometer errores
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
