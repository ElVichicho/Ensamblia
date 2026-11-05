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
  Flame,
  Wifi,
  ChevronDown,
  MonitorPlay,
  RotateCcw
} from "lucide-react";
import { BuildQuote, BuilderFilters } from "@/types/pc-builder";

export default function HomePage() {
  // Estado de filtros principales
  const [budget, setBudget] = useState<number>(850000);
  const [useCase, setUseCase] = useState<BuilderFilters["useCase"]>("gaming_1080p");
  const [cpuPref, setCpuPref] = useState<BuilderFilters["cpuPreference"]>("any");
  const [gpuPref, setGpuPref] = useState<BuilderFilters["gpuPreference"]>("any");

  // Filtros avanzados de hardware
  const [storageCapacity, setStorageCapacity] = useState<BuilderFilters["storageCapacity"]>("1tb");
  const [storageType, setStorageType] = useState<BuilderFilters["storageType"]>("nvme");
  const [ramCapacity, setRamCapacity] = useState<BuilderFilters["ramCapacity"]>("16gb");
  const [wifiRequired, setWifiRequired] = useState<boolean>(true);
  const [coolingPreference, setCoolingPreference] = useState<BuilderFilters["coolingPreference"]>("air");
  const [caseSize, setCaseSize] = useState<BuilderFilters["caseSize"]>("standard");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Estado de cotización y carga
  const [loading, setLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<BuildQuote | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("google/gemma-4-31b-it:free");
  const [sourceUsed, setSourceUsed] = useState<string>("openrouter");
  const [isGlobalActive, setIsGlobalActive] = useState<boolean>(false);

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
      text: "¡Hola! Soy el Asistente IA de SoloTodo. Configura tus preferencias arriba y presiona 'Generar Cotización IA' para diseñar tu PC."
    }
  ]);

  // Recuperar key local si existe (pero NO generamos la cotización de inmediato)
  useEffect(() => {
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
        storageCapacity,
        storageType,
        ramCapacity,
        wifiRequired,
        coolingPreference,
        caseSize,
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
        if (data.isGlobalKeyActive) setIsGlobalActive(true);

        // Actualizar mensaje de bienvenida del chat con el nuevo armado
        setMessages([
          {
            sender: "ai",
            text: `¡He generado la cotización para tu ${data.quote.buildName}! ¿Tienes alguna duda de compatibilidad o quieres ajustar algún componente?`
          }
        ]);
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
      case "cpu": return <Cpu className="w-5 h-5 text-orange-400" />;
      case "motherboard": return <Layers className="w-5 h-5 text-amber-400" />;
      case "ram": return <Zap className="w-5 h-5 text-yellow-400" />;
      case "gpu": return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case "storage": return <HardDrive className="w-5 h-5 text-orange-300" />;
      case "psu": return <Zap className="w-5 h-5 text-amber-500" />;
      case "case": return <Box className="w-5 h-5 text-orange-500" />;
      case "cooler": return <Wind className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-orange-400" />;
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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      
      {/* Barra superior de navegación / Branding SoloTodo Naranja */}
      <header className="border-b border-orange-950/40 bg-[#0e121a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Oficial SoloTodo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/40">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  Solo<span className="text-orange-500">Todo</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" /> AI PC Builder
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Cotizador y Asesor Consultivo de Hardware · Chile</p>
            </div>
          </div>

          {/* Badges y Controles superiores */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${sourceUsed === "openrouter" || isGlobalActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
              <span>Modelo: <span className="text-orange-400 font-semibold">{modelUsed.split('/').pop()?.replace(':free', '')}</span></span>
              {sourceUsed === "openrouter" || isGlobalActive ? (
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20">En la Nube (Activo)</span>
              ) : (
                <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/20">Modo Local</span>
              )}
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-orange-500/20 hover:border-orange-500/50 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 transition shadow-sm"
              title="Configurar clave API OpenRouter"
            >
              <Settings className="w-3.5 h-3.5 text-orange-400" />
              <span>Configuración IA</span>
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
        <section className="bg-gradient-to-r from-orange-950/40 via-amber-950/20 to-slate-900/60 border border-orange-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-orange-950/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Compatibilidad Garantizada · Precios de Tiendas Chilenas
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              Arma tu computador ideal con <span className="text-orange-500">Inteligencia Artificial</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Personaliza tu presupuesto, almacenamiento y preferencias abajo. Nuestra IA validará zócalos, consumo térmico, fuentes de poder y compatibilidad física para presentarte la mejor cotización disponible.
            </p>
          </div>
        </section>

        {/* Formulario / Wizard Consultivo Completo */}
        <section className="bg-[#0e121a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Parámetros de Cotización</h2>
            </div>
            <span className="text-xs text-slate-400">Paso 1: Configura tus preferencias</span>
          </div>

          <div className="space-y-6">
            
            {/* Fila 1: Presupuesto y Propósito */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Control de Presupuesto */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-semibold text-slate-200">Presupuesto Máximo</label>
                  <span className="text-2xl font-black text-orange-400 tracking-tight">
                    ${budget.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
                  </span>
                </div>

                <input 
                  type="range" 
                  min={350000} 
                  max={3000000} 
                  step={25000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />

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
                          ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20" 
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-orange-500/40"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caso de Uso */}
              <div className="lg:col-span-6 space-y-3">
                <label className="text-sm font-semibold text-slate-200">Uso Principal</label>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value as BuilderFilters["useCase"])}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="gaming_1080p">🎮 Gaming eSports (1080p competitivo: CS2, Valorant, LoL)</option>
                  <option value="gaming_1440p">🕹️ Gaming AAA (1440p en Ultra / Ray Tracing / Cyberpunk)</option>
                  <option value="streaming_editing">🎬 Creación de Contenido, Edición 4K y Streaming</option>
                  <option value="ai_dev">🧠 Inteligencia Artificial, CUDA y Modelos Locales</option>
                  <option value="office_school">💼 Universidad, Ofimática y Multitarea Rápida</option>
                </select>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preferencia CPU</label>
                    <select
                      value={cpuPref}
                      onChange={(e) => setCpuPref(e.target.value as BuilderFilters["cpuPreference"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
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
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="any">Cualquiera</option>
                      <option value="nvidia">NVIDIA GeForce</option>
                      <option value="amd">AMD Radeon</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Fila 2: Almacenamiento, RAM y Extras */}
            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Almacenamiento: Capacidad */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-orange-400" /> Capacidad SSD
                </label>
                <select
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value as BuilderFilters["storageCapacity"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="1tb">1 TB (Recomendado estándar)</option>
                  <option value="500gb">500 GB (Económico)</option>
                  <option value="2tb">2 TB (Amplio espacio para juegos/edición)</option>
                  <option value="any">Dejar que la IA decida</option>
                </select>
              </div>

              {/* Almacenamiento: Formato M.2 vs SATA */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-400" /> Formato de Almacenamiento
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as BuilderFilters["storageType"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="nvme">M.2 NVMe PCIe (Ultra Rápido 3500-7000 MB/s)</option>
                  <option value="sata">SATA SSD 2.5" (Económico estándar)</option>
                  <option value="any">Cualquiera compatible</option>
                </select>
              </div>

              {/* Memoria RAM */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" /> Memoria RAM
                </label>
                <select
                  value={ramCapacity}
                  onChange={(e) => setRamCapacity(e.target.value as BuilderFilters["ramCapacity"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="16gb">16 GB (2x8GB Dual Channel - Gamer)</option>
                  <option value="32gb">32 GB (2x16GB - AAA / Streaming / Edición)</option>
                  <option value="64gb">64 GB (IA / Renderizado Pesado)</option>
                  <option value="any">Ajustar a presupuesto</option>
                </select>
              </div>

              {/* Conectividad WiFi */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-400" /> Conectividad Inalámbrica
                </label>
                <div 
                  onClick={() => setWifiRequired(!wifiRequired)}
                  className={`cursor-pointer w-full flex items-center justify-between bg-slate-900 border ${
                    wifiRequired ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800"
                  } rounded-xl px-3 py-2 text-xs text-slate-200 transition select-none`}
                >
                  <span>WiFi y Bluetooth Integrados</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    wifiRequired ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-700"
                  }`}>
                    {wifiRequired && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>

            </div>

            {/* Opciones Avanzadas Desplegables (Refrigeración, Chasis, Prompt Libre) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition"
              >
                <span>{showAdvanced ? "Ocultar opciones adicionales" : "+ Mostrar opciones de chasis, refrigeración e instrucciones"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tipo de Refrigeración</label>
                    <select
                      value={coolingPreference}
                      onChange={(e) => setCoolingPreference(e.target.value as BuilderFilters["coolingPreference"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="air">Disipador por Aire (Confiable y silencioso)</option>
                      <option value="liquid">Refrigeración Líquida (AIO)</option>
                      <option value="any">Mejor opción según TDP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tamaño de Gabinete</label>
                    <select
                      value={caseSize}
                      onChange={(e) => setCaseSize(e.target.value as BuilderFilters["caseSize"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="standard">Estándar Mid-Tower (Mayor ventilación)</option>
                      <option value="compact">Compacto Micro-ATX (Escritorio pequeño)</option>
                      <option value="any">Cualquiera compatible</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Instrucciones Especiales (Prompt)</label>
                    <input 
                      type="text"
                      placeholder="Ej: Gabinete blanco con luces ARGB"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botón Principal Generar */}
            <div className="pt-2">
              <button
                onClick={generateQuote}
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-black text-base rounded-xl shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 transition disabled:opacity-50 transform active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Consultando Hardware y Validando Compatibilidad...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>⚡ Generar Cotización IA con Precios Reales</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* Estado 1: Pantalla de Espera (Antes de que el usuario cotice) */}
        {!quote && !loading && (
          <section className="bg-[#0e121a]/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-6">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">¿Listo para armar tu equipo?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ajusta tu presupuesto y las opciones de almacenamiento arriba. Cuando hagas clic en 
                <span className="text-orange-400 font-semibold"> "Generar Cotización IA"</span>, nuestro asesor analizará las piezas con stock y precios en tiendas chilenas para armar tu configuración 100% compatible.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 text-left">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 mb-1">1. Filtros a Tu Medida</div>
                <p className="text-[11px] text-slate-400">Tú decides el presupuesto, cantidad de RAM, tipo de SSD (M.2 NVMe o SATA) y WiFi.</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-1">2. Validación de IA</div>
                <p className="text-[11px] text-slate-400">Se evalúan sockets (AM4, AM5, LGA1700), consumos energéticos y cuellos de botella.</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-amber-400 mb-1">3. Precios y Tiendas</div>
                <p className="text-[11px] text-slate-400">Visualiza el desglose con enlaces directos a las tiendas asociadas de SoloTodo.</p>
              </div>
            </div>
          </section>
        )}

        {/* Estado 2: Cargando (Animación de Auditoría) */}
        {loading && (
          <section className="bg-[#0e121a] border border-orange-500/30 rounded-2xl p-12 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-lg font-bold text-white">Diseñando tu configuración óptima...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Verificando compatibilidad de zócalos, memorias DDR4/DDR5, holgura de fuente de poder y precios en tiendas chilenas.
            </p>
          </section>
        )}

        {/* Estado 3: Resultados de la Cotización (Aparece únicamente cuando se genera) */}
        {quote && !loading && (
          <section className="space-y-6">
            
            {/* Header de Cotización & Resumen */}
            <div className="bg-[#0e121a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
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
                    className="flex items-center gap-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-orange-600/25"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Consultar al Asesor</span>
                  </button>
                </div>
              </div>

              {/* Métricas Clave (KPIs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                
                {/* Costo vs Presupuesto */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-orange-400" /> Costo Total Estimado
                  </div>
                  <div className="text-xl font-bold text-white">
                    ${quote.actualCostCLP.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                    Ahorro disponible: ${(quote.totalBudgetCLP - quote.actualCostCLP).toLocaleString("es-CL")} CLP
                  </div>
                </div>

                {/* Rendimiento FPS */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
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
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
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
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Auditoría de Hardware
                  </div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Validado
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    0 incompatibilidades detectadas
                  </div>
                </div>

              </div>

              {/* Resumen Ejecutivo de la IA */}
              <div className="mt-6 p-4 rounded-xl bg-orange-950/20 border border-orange-500/20 text-sm text-slate-200">
                <p className="font-semibold text-orange-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" /> Criterio del Asesor Consultivo SoloTodo:
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
                  <Layers className="w-5 h-5 text-orange-400" /> Desglose de Componentes ({quote.components.length})
                </h3>
                <span className="text-xs text-slate-400">Precios y disponibilidad verificados en tiendas chilenas asociadas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quote.components.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-[#0e121a] border border-slate-800 hover:border-orange-500/50 rounded-xl p-5 transition flex flex-col justify-between shadow-md group"
                  >
                    <div>
                      {/* Cabecera del componente */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                              {item.categoryLabel}
                            </span>
                            <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition">
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
                          <span className="text-orange-400 font-semibold">Criterio IA: </span>
                          {item.aiReason}
                        </div>
                        <div className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{item.compatibilityNote}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de compra / Clic de Afiliado (Modelo de Negocio SoloTodo) */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Mejor oferta: <span className="text-slate-200 font-semibold">{item.store}</span>
                      </span>
                      <a
                        href={item.affiliateUrl || "https://www.solotodo.cl"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-500/10 hover:bg-orange-500 text-orange-300 hover:text-white px-3 py-1.5 rounded-lg border border-orange-500/30 transition shadow-sm"
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
                <div className="flex items-center gap-2 mb-2 text-orange-400">
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
          <div className="bg-[#0e121a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold">
                <Settings className="w-5 h-5 text-orange-400" />
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
              {isGlobalActive 
                ? "✅ La IA en la nube ya está activa globalmente para todos los visitantes gracias a la configuración del servidor en Vercel."
                : "La IA responderá con los modelos gratuitos de OpenRouter configurados en el servidor o con tu clave personal."}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Clave de API Personal (Opcional si ya está en Vercel)</label>
                <input 
                  type="password"
                  placeholder="sk-or-v1-xxxxxxxx..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Modelo de Lenguaje en OpenRouter</label>
                <select 
                  value={modelUsed}
                  onChange={(e) => setModelUsed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                >
                  <option value="google/gemma-4-31b-it:free">Google: Gemma 4 31B (Gratis - Recomendado)</option>
                  <option value="nvidia/nemotron-3.5-lightning:free">NVIDIA: Nemotron 3.5 Lightning (Gratis - Rápido)</option>
                  <option value="cohere/north-mini-code:free">Cohere: North Mini Code (Gratis - Precisión JSON)</option>
                  <option value="google/gemma-4-26b-a4b-it:free">Google: Gemma 4 26B A4B (Gratis)</option>
                  <option value="google/gemini-2.0-flash-001">Google: Gemini 2.0 Flash</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta: Llama 3.3 70B Instruct</option>
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
                className="px-4 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-md"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Ventana de Chat Consultivo con la IA */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#0e121a] border border-orange-500/30 rounded-2xl shadow-2xl flex flex-col h-[480px] overflow-hidden">
          
          {/* Header del Chat */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
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
                      ? "bg-orange-600 text-white rounded-br-none"
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
                  <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
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
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition disabled:opacity-50"
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
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white p-3.5 rounded-full shadow-2xl shadow-orange-500/40 flex items-center gap-2 text-xs font-bold transition transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline">¿Dudas con tu armado? Asesor IA</span>
        </button>
      )}

      {/* Footer con información académica de la ES3 */}
      <footer className="border-t border-slate-800/80 bg-[#07090e] py-6 text-xs text-slate-500">
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
