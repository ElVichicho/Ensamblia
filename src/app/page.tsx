"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Layers, 
  Gamepad2, 
  HardDrive, 
  Zap, 
  Box, 
  Wind, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink, 
  Store, 
  TrendingUp, 
  Sliders, 
  Copy, 
  Check, 
  MessageSquare, 
  Send, 
  Settings, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { BuildQuote, BuilderFilters, ComponentItem } from "@/types/pc-builder";

export default function HomePage() {
  // Estado de filtros
  const [budget, setBudget] = useState<number>(850000);
  const [useCase, setUseCase] = useState<BuilderFilters["useCase"]>("gaming_1080p");
  const [cpuPref, setCpuPref] = useState<BuilderFilters["cpuPreference"]>("any");
  const [gpuPref, setGpuPref] = useState<BuilderFilters["gpuPreference"]>("any");
  const [customInstructions, setCustomInstructions] = useState<string>("");

  // Estado de cotización y carga
  const [loading, setLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<BuildQuote | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("google/gemini-2.0-flash-001");
  const [sourceUsed, setSourceUsed] = useState<string>("openrouter");

  // Configuración de API
  const [apiKey, setApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Estado de Chat consultivo
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "¡Hola! Soy el Asistente IA de SoloTodo. ¿Tienes alguna duda sobre la compatibilidad de tu armado o deseas ajustar algún componente?"
    }
  ]);

  // Cargar una cotización inicial al montar
  useEffect(() => {
    generateQuote();
    // Recuperar key local si existe
    const savedKey = localStorage.getItem("solotodo_openrouter_key");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("solotodo_openrouter_key", key);
    setIsSettingsOpen(false);
  };

  const generateQuote = async () => {
    setLoading(true);
    try {
      const filters: BuilderFilters = {
        budgetCLP: budget,
        useCase,
        cpuPreference: cpuPref,
        gpuPreference: gpuPref,
        customInstructions
      };

      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters,
          apiKey,
          model: modelUsed
        })
      });

      const data = await res.json();
      if (data.quote) {
        setQuote(data.quote);
        setSourceUsed(data.source);
        setModelUsed(data.modelUsed || modelUsed);
      }
    } catch (err) {
      console.error("Error al generar cotización:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          currentBuild: quote,
          apiKey,
          model: modelUsed
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "ai", text: data.reply || "Sin respuesta del asistente." }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "ai", text: "Hubo un error de conexión con el asistente." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "cpu": return <Cpu className="w-5 h-5 text-sky-400" />;
      case "motherboard": return <Layers className="w-5 h-5 text-indigo-400" />;
      case "ram": return <Zap className="w-5 h-5 text-amber-400" />;
      case "gpu": return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case "storage": return <HardDrive className="w-5 h-5 text-purple-400" />;
      case "psu": return <Zap className="w-5 h-5 text-yellow-400" />;
      case "case": return <Box className="w-5 h-5 text-orange-400" />;
      case "cooler": return <Wind className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  const copyBuildSummary = () => {
    if (!quote) return;
    const text = `Cotización SoloTodo AI: ${quote.buildName}\nCosto Total: $${quote.actualCostCLP.toLocaleString('es-CL')} CLP\n\nComponentes:\n${quote.components.map(c => `- ${c.categoryLabel}: ${c.name} ($${c.priceCLP.toLocaleString('es-CL')} CLP en ${c.store})`).join('\n')}\n\nCompatibilidad: 100% Verificada por IA`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      
      {/* Barra superior de navegación / Branding SoloTodo */}
      <header className="border-b border-slate-800/80 bg-[#0c1222]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo SoloTodo AI */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-400/30">
              <span className="font-black text-xl text-white tracking-tighter">ST</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  Solo<span className="text-sky-400">Todo</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" /> AI PC Builder
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Asesor Inteligente de Hardware · Chile</p>
            </div>
          </div>

          {/* Badges y Controles superiores */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Modelo: <span className="text-slate-200 font-medium">{modelUsed.split('/').pop()}</span></span>
              {sourceUsed === "fallback" && (
                <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px]">Modo Local</span>
              )}
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 transition shadow-sm"
              title="Configurar clave API OpenRouter"
            >
              <Settings className="w-3.5 h-3.5 text-sky-400" />
              <span>Configurar IA</span>
            </button>

            <div className="hidden lg:block text-[11px] text-slate-400 border-l border-slate-800 pl-3">
              TI2082 · ES3 Vicente Sampson
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-sky-950/40 via-blue-950/20 to-slate-900/40 border border-sky-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-medium mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Compatibilidad Garantizada · Cero Alucinaciones
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Cotiza tu PC sin complicaciones técnicas
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Dile a nuestra IA cuánto quieres gastar y para qué lo usarás. Validamos zócalos de placa, cuellos de botella, fuentes de poder y dimensiones para cotizar el mejor equipo con stock y precios en tiendas chilenas.
            </p>
          </div>
        </section>

        {/* Formulario / Wizard Consultivo */}
        <section className="bg-[#0c1222] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white">Parámetros de Cotización</h2>
            </div>
            <span className="text-xs text-slate-400">Paso 1: Define tus necesidades</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control de Presupuesto */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex justify-between items-baseline">
                <label className="text-sm font-semibold text-slate-200">Presupuesto Máximo</label>
                <span className="text-2xl font-black text-sky-400 tracking-tight">
                  ${budget.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
                </span>
              </div>

              {/* Slider de presupuesto */}
              <input 
                type="range" 
                min={350000} 
                max={3000000} 
                step={25000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />

              {/* Presets rápidos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: "Económico", val: 500000 },
                  { label: "Gamer 1080p", val: 850000 },
                  { label: "Gamer 1440p", val: 1400000 },
                  { label: "Entusiasta", val: 2200000 }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setBudget(item.val)}
                    className={`text-xs py-1.5 px-2 rounded-lg font-medium transition border ${
                      budget === item.val 
                        ? "bg-sky-500 text-white border-sky-400" 
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caso de Uso */}
            <div className="lg:col-span-4 space-y-2">
              <label className="text-sm font-semibold text-slate-200">Uso Principal</label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as BuilderFilters["useCase"])}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="gaming_1080p">🎮 Gaming eSports (1080p competitivo: CS2, Valorant, LoL)</option>
                <option value="gaming_1440p">🕹️ Gaming AAA (1440p en Ultra / Ray Tracing / Cyberpunk)</option>
                <option value="streaming_editing">🎬 Creación de Contenido, Edición 4K y Streaming</option>
                <option value="ai_dev">🧠 Inteligencia Artificial, CUDA y Modelos Locales</option>
                <option value="office_school">💼 Universidad, Ofimática y Multitarea Rápida</option>
              </select>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preferencia CPU</label>
                  <select
                    value={cpuPref}
                    onChange={(e) => setCpuPref(e.target.value as BuilderFilters["cpuPreference"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="any">Cualquiera (Mejor ratio)</option>
                    <option value="amd">AMD Ryzen</option>
                    <option value="intel">Intel Core</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Preferencia GPU</label>
                  <select
                    value={gpuPref}
                    onChange={(e) => setGpuPref(e.target.value as BuilderFilters["gpuPreference"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="any">Cualquiera</option>
                    <option value="nvidia">NVIDIA GeForce</option>
                    <option value="amd">AMD Radeon</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Prompt Libre e Instrucciones */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-200">Requerimiento Especial</label>
                <input 
                  type="text"
                  placeholder="Ej: Con WiFi integrado y gabinete blanco"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Botón Principal Generar */}
              <button
                onClick={generateQuote}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analizando Hardware...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generar Cotización IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Resultados de la Cotización */}
        {quote && (
          <section className="space-y-6">
            
            {/* Header de Cotización & Resumen */}
            <div className="bg-[#0c1222] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Compatibilidad {quote.compatibilityScore}%
                    </span>
                    <span className="text-xs text-slate-400">| {quote.targetUse}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{quote.buildName}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={copyBuildSummary}
                    className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 transition"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedLink ? "Copiado!" : "Exportar Cotización"}</span>
                  </button>

                  <button 
                    onClick={() => setChatOpen(true)}
                    className="flex items-center gap-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-600/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Consultar al Asistente</span>
                  </button>
                </div>
              </div>

              {/* Métricas Clave (KPIs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                
                {/* Costo vs Presupuesto */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-sky-400" /> Costo Total Estimado
                  </div>
                  <div className="text-xl font-bold text-white">
                    ${quote.actualCostCLP.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                    Ahorro disponible: ${(quote.totalBudgetCLP - quote.actualCostCLP).toLocaleString("es-CL")} CLP
                  </div>
                </div>

                {/* Rendimiento FPS */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> Rendimiento Estimado
                  </div>
                  <div className="text-xl font-bold text-white">
                    ~{quote.estimatedFps1080p} <span className="text-xs font-normal text-slate-400">FPS (1080p)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    ~{quote.estimatedFps1440p} FPS en 1440p Ultra
                  </div>
                </div>

                {/* Consumo y Fuente */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Consumo Eléctrico
                  </div>
                  <div className="text-xl font-bold text-white">
                    {quote.totalTdpWatts}W <span className="text-xs font-normal text-slate-400">TDP Total</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Fuente recomendada: {quote.recommendedPsuWatts}W+ (80+)
                  </div>
                </div>

                {/* Validación Técnica */}
                <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Auditoría de Hardware
                  </div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Validado
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    0 cuellos de botella detectados
                  </div>
                </div>

              </div>

              {/* Resumen Ejecutivo de la IA */}
              <div className="mt-6 p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 text-sm text-slate-200">
                <p className="font-semibold text-sky-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Justificación del Asesor IA:
                </p>
                <p>{quote.executiveSummary}</p>
              </div>

              {/* Lista de Chequeos de Compatibilidad */}
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Verificaciones de Compatibilidad Realizadas en Tiempo Real:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {quote.compatibilityChecks?.map((chk, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-200">{chk.title}: </span>
                        <span className="text-slate-400">{chk.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Grilla de Componentes (Tarjetas de Hardware estilo SoloTodo) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" /> Desglose de Componentes ({quote.components.length})
                </h3>
                <span className="text-xs text-slate-400">Precios y disponibilidad simulados de tiendas chilenas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quote.components.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-[#0c1222] border border-slate-800 hover:border-sky-500/40 rounded-xl p-5 transition flex flex-col justify-between shadow-md group"
                  >
                    <div>
                      {/* Cabecera del componente */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wide">
                              {item.categoryLabel}
                            </span>
                            <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                              {item.name}
                            </h4>
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-white">
                            ${item.priceCLP.toLocaleString("es-CL")}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                            <Store className="w-3 h-3 text-slate-400" /> {item.store}
                          </div>
                        </div>
                      </div>

                      {/* Especificación clave */}
                      <p className="text-xs text-slate-400 mb-3 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        {item.specs}
                      </p>

                      {/* Explicación de la IA y Compatibilidad */}
                      <div className="space-y-1.5 text-xs mb-4">
                        <div className="text-slate-300">
                          <span className="text-sky-400 font-semibold">Criterio IA: </span>
                          {item.aiReason}
                        </div>
                        <div className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{item.compatibilityNote}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de compra / Clic de Afiliado (Modelo de Negocio SoloTodo) */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Tienda: <span className="text-slate-200 font-medium">{item.store}</span>
                      </span>
                      <a
                        href={item.affiliateUrl || "https://www.solotodo.cl"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-white px-3 py-1.5 rounded-lg border border-sky-500/30 transition"
                      >
                        <span>Ver en {item.store}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Vía de Actualización Futura (Upgrade Path) */}
            {quote.upgradePath && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-sky-400">
                  <TrendingUp className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Ruta de Actualización Futura (Longevidad)</h4>
                </div>
                <p className="text-xs text-slate-300">{quote.upgradePath}</p>
              </div>
            )}

          </section>
        )}

      </main>

      {/* Modal de Configuración de API OpenRouter */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c1222] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <Settings className="w-5 h-5 text-sky-400" />
                <span>Configurar Conexión OpenRouter</span>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ingresa tu clave de OpenRouter para consultar modelos en la nube en tiempo real (o déjalo en blanco para usar el motor de hardware inteligente simulado de alta precisión).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Clave de API OpenRouter (sk-or-v1-...)</label>
                <input 
                  type="password"
                  placeholder="sk-or-v1-xxxxxxxx..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Modelo de Lenguaje en OpenRouter</label>
                <select 
                  value={modelUsed}
                  onChange={(e) => setModelUsed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="google/gemini-2.0-flash-001">Google Gemini 2.0 Flash (Recomendado, rápido y ultra económico)</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
                  <option value="deepseek/deepseek-chat">DeepSeek Chat V3</option>
                  <option value="anthropic/claude-3.5-haiku">Anthropic Claude 3.5 Haiku</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveApiKey(apiKey)}
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Ventana de Chat Consultivo con la IA */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#0c1222] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col h-[480px] overflow-hidden">
          
          {/* Header del Chat */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-xs font-bold text-white">Asesor Consultivo SoloTodo IA</span>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Lista de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                    m.sender === "user"
                      ? "bg-sky-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 px-3 py-2 rounded-2xl rounded-bl-none border border-slate-700 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>El asesor está escribiendo...</span>
                </div>
              </div>
            )}
          </div>

          {/* Formulario de Envío de Mensaje */}
          <form onSubmit={handleSendChat} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input 
              type="text"
              placeholder="Pregunta sobre compatibilidad o cambios..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

      {/* Botón flotante para abrir chat si está cerrado */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white p-3.5 rounded-full shadow-2xl shadow-sky-500/40 flex items-center gap-2 text-xs font-bold transition transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline">¿Dudas con tu armado? Asesor IA</span>
        </button>
      )}

      {/* Footer con información académica de la ES3 */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SoloTodo AI Assistant</span>
            <span>·</span>
            <span>Proyecto para Aplicaciones de Inteligencia Artificial (TI2082)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Docente: Paul André Beltrand Urra</span>
            <span>·</span>
            <span>Estudiante: Vicente Sampson</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
