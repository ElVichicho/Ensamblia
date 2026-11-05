"use client";

import React, { useState } from "react";
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
  Copy, 
  Check, 
  MessageSquare, 
  Send, 
  Flame, 
  Wifi, 
  ChevronDown, 
  Briefcase, 
  Home, 
  Palette, 
  Code2, 
  Clock, 
  ThumbsUp,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { BuildQuote, BuilderFilters } from "@/types/pc-builder";

export default function HomePage() {
  // Filtros de usuario
  const [budget, setBudget] = useState<number>(800000);
  const [useCase, setUseCase] = useState<BuilderFilters["useCase"]>("office");
  const [cpuPref, setCpuPref] = useState<BuilderFilters["cpuPreference"]>("any");
  const [gpuPref, setGpuPref] = useState<BuilderFilters["gpuPreference"]>("any");

  const [storageCapacity, setStorageCapacity] = useState<BuilderFilters["storageCapacity"]>("1tb");
  const [storageType, setStorageType] = useState<BuilderFilters["storageType"]>("nvme");
  const [ramCapacity, setRamCapacity] = useState<BuilderFilters["ramCapacity"]>("16gb");
  const [wifiRequired, setWifiRequired] = useState<boolean>(true);
  const [coolingPreference, setCoolingPreference] = useState<BuilderFilters["coolingPreference"]>("air");
  const [caseSize, setCaseSize] = useState<BuilderFilters["caseSize"]>("standard");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Estado de generación
  const [loading, setLoading] = useState<boolean>(false);
  const [quote, setQuote] = useState<BuildQuote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("google/gemma-4-31b-it:free");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Estado de Chat consultivo
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "¡Hola! Soy tu Asesor Virtual de SoloTodo. Configura tus preferencias arriba y presiona 'Generar Cotización' para consultar a la IA."
    }
  ]);

  const generateQuote = async () => {
    setLoading(true);
    setErrorMessage(null);
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
        body: JSON.stringify({ filters })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Ocurrió un error al contactar con la API de OpenRouter.");
        setQuote(null);
        return;
      }

      if (data.quote) {
        setQuote(data.quote);
        setModelUsed(data.modelUsed || modelUsed);
        setErrorMessage(null);

        setMessages([
          {
            sender: "ai",
            text: `¡Listo! He diseñado una cotización personalizada para ${data.quote.buildName}. ¿Tienes alguna pregunta o te gustaría ajustar algún componente?`
          }
        ]);
      }
    } catch (err: any) {
      console.error("Error al generar cotización:", err);
      setErrorMessage(err.message || "Error inesperado de red al contactar al servidor.");
      setQuote(null);
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
          currentBuild: quote
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "ai", text: data.reply || data.error || "Sin respuesta del asistente." }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "ai", text: "Hubo un inconveniente al conectar con el asistente." }]);
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
    const text = `Cotización SoloTodo: ${quote.buildName}\nCosto Total: $${quote.actualCostCLP.toLocaleString('es-CL')} CLP\n\nComponentes recomendados:\n${quote.components.map(c => `- ${c.categoryLabel}: ${c.name} ($${c.priceCLP.toLocaleString('es-CL')} CLP en ${c.store})`).join('\n')}\n\nCompatibilidad: 100% Verificada`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const useCaseOptions = [
    {
      id: "office" as const,
      title: "Trabajo y Oficina",
      desc: "Ofimática fluida (Excel, Word), videollamadas, navegación rápida y multitarea sin trabas.",
      icon: <Briefcase className="w-5 h-5 text-orange-400" />
    },
    {
      id: "home_study" as const,
      title: "Hogar y Estudio",
      desc: "Clases online, tareas familiares, streaming de películas en 4K y navegación diaria confiable.",
      icon: <Home className="w-5 h-5 text-emerald-400" />
    },
    {
      id: "creative" as const,
      title: "Diseño y Creatividad",
      desc: "Edición de fotografía y video, diseño gráfico, arquitectura, AutoCAD y modelado 3D.",
      icon: <Palette className="w-5 h-5 text-purple-400" />
    },
    {
      id: "gaming" as const,
      title: "Videojuegos y Ocio",
      desc: "Experiencia gráfica fluida tanto para juegos casuales como títulos de alta exigencia.",
      icon: <Gamepad2 className="w-5 h-5 text-amber-400" />
    },
    {
      id: "dev_data" as const,
      title: "Programación e Ingeniería",
      desc: "Compilación de software, entornos virtuales, análisis de datos e inteligencia artificial.",
      icon: <Code2 className="w-5 h-5 text-cyan-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans">
      
      {/* Barra superior de navegación / Branding SoloTodo */}
      <header className="border-b border-orange-950/40 bg-[#0e121a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo SoloTodo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 border border-orange-400/40">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  Solo<span className="text-orange-500">Todo</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-400" /> Asesor IA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Asesoría de Hardware en Línea · Chile</p>
            </div>
          </div>

          {/* Información superior */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline text-slate-400">Modelo:</span>
              <span className="text-orange-400 font-semibold">{modelUsed.split('/').pop()?.replace(':free', '')}</span>
            </div>

            <div className="hidden lg:block text-[11px] text-slate-400 border-l border-slate-800 pl-3">
              TI2082 · ES3 Vicente Sampson
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner de Error Real si falla la API */}
        {errorMessage && (
          <div className="bg-red-950/40 border-2 border-red-500/50 rounded-2xl p-6 text-slate-100 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-shake">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-300">Respuesta de la API de OpenRouter</h3>
                <p className="text-xs text-red-200 mt-1 font-mono break-all bg-black/30 p-2.5 rounded-lg border border-red-500/20">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Si el error menciona "401" o "Authentication", revisa que tu clave en Vercel esté bien guardada. Si menciona "rate-limit" o "provider", puedes presionar reintentar.
                </p>
              </div>
            </div>
            <button
              onClick={generateQuote}
              className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        )}

        {/* Hero Banner Inclusivo */}
        <section className="bg-gradient-to-r from-orange-950/30 via-slate-900/40 to-slate-900/60 border border-orange-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-orange-950/10">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Asesoría clara, confiable y con precios reales en Chile
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Encuentra el computador perfecto para <span className="text-orange-500">lo que realmente necesitas</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Selecciona tu uso y presupuesto. Nuestro asistente con Inteligencia Artificial elegirá componentes 100% compatibles y verificados en tiendas chilenas asociadas a SoloTodo.
            </p>
          </div>
        </section>

        {/* Wizard Consultivo */}
        <section className="bg-[#0e121a] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-8">
          
          {/* PASO 1: PROPÓSITO DEL EQUIPO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/40">1</span>
                <h2 className="text-base font-bold text-white">¿Cuál será el uso principal del computador?</h2>
              </div>
              <span className="text-xs text-slate-400">Paso 1 de 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {useCaseOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setUseCase(opt.id)}
                  className={`cursor-pointer rounded-xl p-4 border transition flex flex-col justify-between space-y-2 select-none ${
                    useCase === opt.id
                      ? "bg-orange-500/10 border-orange-500 shadow-md shadow-orange-500/10"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      {opt.icon}
                    </div>
                    {useCase === opt.id && (
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{opt.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-tight">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PASO 2: PRESUPUESTO Y NIVEL DE CALIDAD */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/40">2</span>
                <h2 className="text-base font-bold text-white">¿Cuánto deseas invertir aproximadamente?</h2>
              </div>
              <span className="text-2xl font-black text-orange-400 tracking-tight">
                ${budget.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Slider */}
              <div className="lg:col-span-6 space-y-2">
                <input 
                  type="range" 
                  min={350000} 
                  max={3000000} 
                  step={25000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>$350.000 (Esencial)</span>
                  <span>$1.500.000 (Avanzado)</span>
                  <span>$3.000.000+ (Profesional)</span>
                </div>
              </div>

              {/* Botones de Calidad */}
              <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Esencial", val: 450000, desc: "Hogar y oficina" },
                  { label: "Equilibrado", val: 800000, desc: "Precio / Calidad" },
                  { label: "Avanzado", val: 1400000, desc: "Alta potencia" },
                  { label: "Profesional", val: 2200000, desc: "Máxima exigencia" }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setBudget(item.val)}
                    className={`text-left p-2.5 rounded-xl transition border flex flex-col justify-between ${
                      budget === item.val 
                        ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20" 
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:border-orange-500/40"
                    }`}
                  >
                    <span className="text-xs font-bold leading-none">{item.label}</span>
                    <span className={`text-[10px] mt-1 ${budget === item.val ? "text-orange-100" : "text-slate-400"}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* PASO 3: PREFERENCIAS CLAVE DE FUNCIONAMIENTO */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center border border-orange-500/40">3</span>
                <h2 className="text-base font-bold text-white">Preferencias de almacenamiento y conectividad</h2>
              </div>
              <span className="text-xs text-slate-400">Paso 3 de 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Almacenamiento Capacidad */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Espacio de Almacenamiento (Disco)
                </label>
                <select
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value as BuilderFilters["storageCapacity"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="1tb">1 TB (Recomendado para la mayoría)</option>
                  <option value="500gb">500 GB (Económico para documentos)</option>
                  <option value="2tb">2 TB (Espacio muy amplio para videos/proyectos)</option>
                  <option value="any">Ajustar automáticamente al presupuesto</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">1 TB equivale a ~1.000 GB de espacio.</p>
              </div>

              {/* Tipo de Disco */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Tecnología de Disco
                </label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as BuilderFilters["storageType"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="nvme">M.2 NVMe (Ultra rápido: enciende en 5 seg)</option>
                  <option value="sata">SATA SSD (Económico y confiable)</option>
                  <option value="any">La mejor opción según presupuesto</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Los discos NVMe se conectan directo a la placa.</p>
              </div>

              {/* Memoria RAM */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Memoria RAM (Fluidez multitarea)
                </label>
                <select
                  value={ramCapacity}
                  onChange={(e) => setRamCapacity(e.target.value as BuilderFilters["ramCapacity"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="16gb">16 GB (Recomendado para todo público)</option>
                  <option value="32gb">32 GB (Para diseño pesado, edición o juegos)</option>
                  <option value="64gb">64 GB (Proyectos de ingeniería / IA)</option>
                  <option value="any">Ajustar automáticamente</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Permite abrir muchas aplicaciones a la vez.</p>
              </div>

              {/* Conectividad WiFi */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Conexión Inalámbrica
                </label>
                <div 
                  onClick={() => setWifiRequired(!wifiRequired)}
                  className={`cursor-pointer w-full flex items-center justify-between bg-slate-900 border ${
                    wifiRequired ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800"
                  } rounded-xl px-3 py-2 text-xs text-slate-200 transition select-none`}
                >
                  <div>
                    <span className="font-semibold block">WiFi y Bluetooth</span>
                    <span className="text-[10px] text-slate-400">Sin necesidad de cables de red</span>
                  </div>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    wifiRequired ? "bg-emerald-500 border-emerald-400 text-white" : "border-slate-700"
                  }`}>
                    {wifiRequired && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

            </div>

            {/* Opciones técnicas opcionales */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 transition"
              >
                <span>{showAdvanced ? "Ocultar preferencias opcionales" : "+ Preferencias opcionales (Marcas, tamaño de chasis, refrigeración)"}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preferencia de Procesador</label>
                    <select
                      value={cpuPref}
                      onChange={(e) => setCpuPref(e.target.value as BuilderFilters["cpuPreference"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="any">Sin preferencia (Mejor costo/beneficio)</option>
                      <option value="amd">AMD Ryzen</option>
                      <option value="intel">Intel Core</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Preferencia de Gráficos</label>
                    <select
                      value={gpuPref}
                      onChange={(e) => setGpuPref(e.target.value as BuilderFilters["gpuPreference"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="any">Sin preferencia (La más conveniente)</option>
                      <option value="nvidia">NVIDIA GeForce</option>
                      <option value="amd">AMD Radeon</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tamaño de Chasis</label>
                    <select
                      value={caseSize}
                      onChange={(e) => setCaseSize(e.target.value as BuilderFilters["caseSize"])}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="standard">Estándar (Fácil ventilación)</option>
                      <option value="compact">Compacto (Para escritorios pequeños)</option>
                      <option value="any">Cualquiera compatible</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Comentario especial</label>
                    <input 
                      type="text"
                      placeholder="Ej: Priorizar que sea muy silencioso"
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
                    <span>Consultando con la Inteligencia Artificial...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>⚡ Generar Cotización Personalizada con IA</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* Estado 1: Pantalla de Bienvenida (Antes de cotizar) */}
        {!quote && !loading && !errorMessage && (
          <section className="bg-[#0e121a]/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-6">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-400">
                <ThumbsUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Asesoría de hardware transparente y a tu alcance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecciona tus necesidades arriba y haz clic en 
                <span className="text-orange-400 font-semibold"> "Generar Cotización Personalizada con IA"</span>. 
                Nuestra IA consultará el catálogo de tiendas chilenas y validará que todas las piezas encajen al 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-4 text-left">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-orange-400 mb-1">Para Todos los Perfiles</div>
                <p className="text-[11px] text-slate-400">Desde computadores para el hogar u oficina, hasta diseño profesional y juegos.</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 mb-1">100% Sin Errores</div>
                <p className="text-[11px] text-slate-400">Validación de zócalos, memorias compatibles y fuentes de poder con holgura segura.</p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-amber-400 mb-1">Precios Reales en Chile</div>
                <p className="text-[11px] text-slate-400">Comparativa con tiendas chilenas asociadas a SoloTodo para cotizar con el mayor ahorro.</p>
              </div>
            </div>
          </section>
        )}

        {/* Estado 2: Cargando */}
        {loading && (
          <section className="bg-[#0e121a] border border-orange-500/30 rounded-2xl p-12 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h3 className="text-lg font-bold text-white">Consultando con la Inteligencia Artificial de OpenRouter...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Analizando catálogo chileno y validando compatibilidad de zócalos, memorias y fuentes de poder en tiempo real.
            </p>
          </section>
        )}

        {/* Estado 3: Resultados de la Cotización */}
        {quote && !loading && (
          <section className="space-y-6">
            
            {/* Header de Cotización & Resumen */}
            <div className="bg-[#0e121a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Compatibilidad Total Verificada
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
                    <span>{copiedLink ? "¡Copiado!" : "Exportar Cotización"}</span>
                  </button>

                  <button 
                    onClick={() => setChatOpen(true)}
                    className="flex items-center gap-2 text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-orange-600/25"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Hacer Preguntas al Asesor</span>
                  </button>
                </div>
              </div>

              {/* Métricas Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                
                {/* Costo vs Presupuesto */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-orange-400" /> Inversión Total Estimada
                  </div>
                  <div className="text-xl font-bold text-white">
                    ${quote.actualCostCLP.toLocaleString("es-CL")} <span className="text-xs font-normal text-slate-400">CLP</span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-medium">
                    Ahorro o margen disponible: ${(quote.totalBudgetCLP - quote.actualCostCLP).toLocaleString("es-CL")} CLP
                  </div>
                </div>

                {/* Desempeño */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Fluidez y Desempeño
                  </div>
                  <div className="text-sm font-bold text-white leading-snug">
                    {quote.performanceSummary || "Excelente respuesta en multitarea y arranque veloz."}
                  </div>
                  {useCase === "gaming" && quote.estimatedFps1080p && (
                    <div className="text-[11px] text-slate-400 mt-1">
                      ~{quote.estimatedFps1080p} FPS en calidad alta
                    </div>
                  )}
                </div>

                {/* Consumo */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Consumo y Eficiencia
                  </div>
                  <div className="text-xl font-bold text-white">
                    {quote.totalTdpWatts}W <span className="text-xs font-normal text-slate-400">Consumo Estimado</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Fuente sugerida: {quote.recommendedPsuWatts}W (80 Plus)
                  </div>
                </div>

                {/* Validación Técnica */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Compatibilidad
                  </div>
                  <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 100% Compatible
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Verificado por OpenRouter AI
                  </div>
                </div>

              </div>

              {/* Justificación del Asesor */}
              <div className="mt-6 p-4 rounded-xl bg-orange-950/20 border border-orange-500/20 text-sm text-slate-200">
                <p className="font-semibold text-orange-400 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" /> Criterio del Asesor con IA:
                </p>
                <p className="leading-relaxed">{quote.executiveSummary}</p>
              </div>

              {/* Lista de Chequeos de Compatibilidad */}
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Verificaciones Técnicas Realizadas:
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

            {/* Grilla de Componentes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" /> Componentes Seleccionados ({quote.components.length})
                </h3>
                <span className="text-xs text-slate-400">Precios y tiendas verificadas en SoloTodo Chile</span>
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

                      {/* Especificación técnica */}
                      <p className="text-xs text-slate-400 mb-3 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                        {item.specs}
                      </p>

                      {/* Explicación amigable */}
                      <div className="space-y-1.5 text-xs mb-4">
                        <div className="text-slate-300">
                          <span className="text-orange-400 font-semibold">Beneficio clave: </span>
                          {item.aiReason}
                        </div>
                        <div className="text-emerald-400 text-[11px] flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{item.compatibilityNote}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón de compra / Clic a SoloTodo */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Disponible en: <span className="text-slate-200 font-semibold">{item.store}</span>
                      </span>
                      <a
                        href={item.affiliateUrl || "https://www.solotodo.cl"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-orange-500/10 hover:bg-orange-500 text-orange-300 hover:text-white px-3 py-1.5 rounded-lg border border-orange-500/30 transition shadow-sm"
                      >
                        <span>Ver oferta en {item.store}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Durabilidad a Futuro */}
            {quote.upgradePath && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2 text-orange-400">
                  <TrendingUp className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Durabilidad y Proyección Futura</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{quote.upgradePath}</p>
              </div>
            )}

          </section>
        )}

      </main>

      {/* Drawer de Chat Consultivo */}
      {chatOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-[#0e121a] border border-orange-500/30 rounded-2xl shadow-2xl flex flex-col h-[480px] overflow-hidden">
          
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
              <span className="text-xs font-bold text-white">Asesor Virtual SoloTodo (OpenRouter)</span>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

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

          <form onSubmit={handleSendChat} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input 
              type="text"
              placeholder="Haz una pregunta sobre tu computador..."
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

      {/* Botón flotante para abrir chat */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white p-3.5 rounded-full shadow-2xl shadow-orange-500/40 flex items-center gap-2 text-xs font-bold transition transform hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline">¿Dudas? Pregúntale al Asesor IA</span>
        </button>
      )}

      {/* Footer Académico */}
      <footer className="border-t border-slate-800/80 bg-[#07090e] py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SoloTodo AI Assistant</span>
            <span>·</span>
            <span>Plataforma Consultiva de Hardware</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Docente: Paul André Beltrand Urra</span>
            <span>·</span>
            <span>Estudiante: Vicente Sampson (TI2082)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
