"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, Cpu, Layers3, Check, ChevronRight, CircleAlert, LoaderCircle, Moon, RefreshCw, SlidersHorizontal, Sun } from "lucide-react";
import type { BuildQuote, BuilderFilters, ComponentCategory } from "@/types/pc-builder";

const money=(value:number)=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(value);
const uses=[["office","Oficina"],["home_study","Hogar y estudio"],["creative","Diseño y edición"],["gaming","Videojuegos"],["dev_data","Desarrollo y datos"]];
const rows: [ComponentCategory,string][]=[["cpu","Procesador"],["motherboard","Placa madre"],["ram","Memoria RAM"],["gpu","Tarjeta de video"],["storage","Almacenamiento"],["psu","Fuente de poder"],["case","Gabinete"],["cooler","Refrigeración"]];
const initial:BuilderFilters={
  budgetCLP:800000,useCase:"office",cpuPreference:"any",gpuPreference:"any",
  storageCapacity:"1tb",storageType:"nvme",ramCapacity:"16gb",wifiRequired:false,
  coolingPreference:"air",caseSize:"standard",customInstructions:"",consolidateStores:false,
};

type SavedCatalog = { token: string; updatedAt: string; count: number };
const catalogKey = "solotodo-catalog-v1";

export default function HomePage(){
  const [catalog,setCatalog]=useState<SavedCatalog|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const [catalogNotice,setCatalogNotice]=useState("");
  const [filters,setFilters]=useState(initial);
  const [quote,setQuote]=useState<BuildQuote|null>(null);
  const [submitted,setSubmitted]=useState<BuilderFilters|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  useEffect(()=>{
    try {
      const theme=localStorage.getItem("solotodo-theme");
      if(theme==="light"||theme==="dark") document.documentElement.dataset.theme=theme;
    } catch {}
  },[]);
  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      try {
        const saved: SavedCatalog|null=JSON.parse(localStorage.getItem(catalogKey) ?? "null");
        if(saved && typeof saved.token==="string" && typeof saved.updatedAt==="string") setCatalog(saved);
      } catch {}
    });
    return ()=>cancelAnimationFrame(frame);
  },[]);
  async function refreshCatalog(){
    setRefreshing(true);setCatalogNotice("");
    try {
      const response=await fetch("/api/catalog",{method:"POST"});
      const updated=await response.json();
      if(!response.ok || typeof updated.token!=="string") throw new Error(updated.error ?? "No se pudo actualizar el catálogo.");
      localStorage.setItem(catalogKey,JSON.stringify(updated));
      setCatalog(updated);setQuote(null);setSubmitted(null);setError("");
      setCatalogNotice("");
    } catch(error){
      setCatalogNotice(error instanceof Error && error.name!=="QuotaExceededError"
        ? error.message : "No se pudo guardar el catálogo en este navegador.");
    } finally {setRefreshing(false);}
  }
  function toggleTheme(){
    const root=document.documentElement;
    const dark=root.dataset.theme?root.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;
    const theme=dark?"light":"dark";
    root.dataset.theme=theme;
    try {localStorage.setItem("solotodo-theme",theme);} catch {}
  }
  function update<K extends keyof BuilderFilters>(key:K,value:BuilderFilters[K]){
    setFilters(current=>({...current,[key]:value}));
  }
  async function generate(){
    setLoading(true);setError("");setCopied(false);
    try {
      const response=await fetch("/api/quote",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filters,catalogToken:catalog?.token}),
      });
      const data=await response.json().catch(()=>({error:"El servidor no pudo completar la solicitud. Intenta nuevamente."}));
      if(!response.ok||!data.quote) throw new Error(data.error||"No se pudo preparar la cotización.");
      setQuote(data.quote);setSubmitted({...filters});
    } catch(e){setError(e instanceof Error?e.message:"No se pudo conectar con el servicio.");}
    finally {setLoading(false);}
  }
  async function copy(){
    if(!quote)return;
    try {
      await navigator.clipboard.writeText(`${quote.buildName}\n${quote.components.map(p=>`${p.quantity||1} × ${p.name}: ${money(p.priceCLP)} · ${p.store}`).join("\n")}\nTotal: ${money(quote.actualCostCLP)}\nPrecios de referencia. Revisar compatibilidad antes de comprar.`);
      setCopied(true);
    } catch {setError("El navegador no permitió copiar. Puedes imprimir la cotización.");}
  }
  const changed=Boolean(submitted&&JSON.stringify(filters)!==JSON.stringify(submitted));
  const storeCount = new Set(quote?.components.filter(item=>item.storeUrl).map(item=>item.store)).size;
  const missingOffers = quote?.components.filter(item=>!item.storeUrl).length ?? 0;
  return (
    <div className="site">
      <header className="topbar">
        <div className="topbar-inner">
          <a href="#cotizador" className="wordmark"><Layers3 size={26}/><span>ensamblia</span></a>
          <span className="header-divider"/>
          <span className="header-title">Cotizador para tu tienda</span>
          <div className="header-actions">
            <a href="https://www.solotodo.cl/" target="_blank" rel="noreferrer" className="catalog-link">Catálogo <ArrowUpRight size={14}/></a>
            <button type="button" className="catalog-refresh" disabled={loading||refreshing} onClick={()=>void refreshCatalog()}>
              <RefreshCw size={14} className={refreshing?"spinner":undefined}/>{refreshing?"Actualizando…":"Actualizar catálogo"}
            </button>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              <span className="theme-to-dark"><Moon size={17}/><span className="sr-only">Activar tema oscuro</span></span>
              <span className="theme-to-light"><Sun size={17}/><span className="sr-only">Activar tema claro</span></span>
            </button>
          </div>
        </div>
      </header>
      <div className="subnav"><div><span>Ensamblia</span> <ChevronRight size={12}/> Cotizador <span className="demo-source">Demo con catálogo SoloTodo</span></div></div>
      <main className="workspace" id="cotizador">
        <p className="catalog-status" role="status">
          {catalogNotice || (catalog ? `Catálogo guardado: ${catalog.count} productos · ${new Date(catalog.updatedAt).toLocaleString("es-CL")}`
            : "Usando precios de referencia. Actualiza el catálogo para consultar ofertas y tiendas.")}
        </p>
        <div className="page-heading">
          <div><p className="eyebrow">COTIZADOR DE PC</p>
            <h1>Tu próximo PC, <span>pieza por pieza.</span></h1>
            <p>Cuéntanos qué necesitas. Encuentra un armado para tu uso y presupuesto.</p>
          </div>
          <div className="heading-aside"><Cpu size={40} strokeWidth={1}/><span>La configuración empieza contigo.</span><small>Precios en pesos chilenos · CLP</small></div>
        </div>
        <div className="builder-layout">
          <aside className="filter-panel">
            <div className="panel-title"><SlidersHorizontal size={16}/><h2>Configura tu equipo</h2></div>
            <form onSubmit={e=>{e.preventDefault();void generate();}}>
              <fieldset disabled={loading||refreshing}>
                <label className="field-label" htmlFor="use">Uso principal</label>
                <select id="use" value={filters.useCase} onChange={e=>update("useCase",e.target.value as BuilderFilters["useCase"])}>{uses.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
                <label className="field-label budget-label" htmlFor="budget">Presupuesto máximo <span>CLP</span></label>
                <input id="budget" type="number" min={350000} max={3000000} step={25000} value={filters.budgetCLP} onChange={e=>update("budgetCLP",Number(e.target.value))} required/>
                <div className="budget-presets">{[500000,1000000,1400000,2200000].map(n=><button className={filters.budgetCLP===n?"selected":""} type="button" key={n} onClick={()=>update("budgetCLP",n)}>{n===2200000?"2,2 M":n===1400000?"1,4 M":n===1000000?"1 M":"500 mil"}</button>)}</div>
                <label className="field-label" htmlFor="store-preference">Preferencia de compra</label>
                <select id="store-preference" value={filters.consolidateStores?"few":"cheap"} onChange={e=>update("consolidateStores",e.target.value==="few")}>
                  <option value="cheap">Menor precio por pieza</option>
                  <option value="few">Menos tiendas dentro del presupuesto</option>
                </select>
                <p className="form-footnote">Se comparan ofertas para las piezas seleccionadas. El despacho se calcula en cada tienda.</p>
                <div className="filter-divider"/>
                <label className="field-label" htmlFor="ram">Memoria RAM mínima</label>
                <select id="ram" value={filters.ramCapacity} onChange={e=>update("ramCapacity",e.target.value as BuilderFilters["ramCapacity"])}>{["16gb","32gb","64gb","any"].map(v=><option key={v} value={v}>{v==="any"?"Sin preferencia":v.toUpperCase()}</option>)}</select>
                <label className="field-label" htmlFor="storage">Almacenamiento mínimo</label>
                <select id="storage" value={filters.storageCapacity} onChange={e=>update("storageCapacity",e.target.value as BuilderFilters["storageCapacity"])}>{["500gb","1tb","2tb","any"].map(v=><option key={v} value={v}>{v==="any"?"Sin preferencia":v.toUpperCase()}</option>)}</select>
                <details className="advanced"><summary>Más preferencias <span>+</span></summary>
                  <label className="field-label" htmlFor="cpu-brand">Procesador</label>
                  <select id="cpu-brand" value={filters.cpuPreference} onChange={e=>update("cpuPreference",e.target.value as BuilderFilters["cpuPreference"])}><option value="any">Sin preferencia</option><option value="amd">AMD</option><option value="intel">Intel</option></select>
                  <label className="field-label" htmlFor="gpu-brand">Tarjeta de video</label>
                  <select id="gpu-brand" value={filters.gpuPreference} onChange={e=>update("gpuPreference",e.target.value as BuilderFilters["gpuPreference"])}><option value="any">Sin preferencia</option><option value="amd">AMD Radeon</option><option value="nvidia">NVIDIA GeForce</option></select>
                  <label className="field-label" htmlFor="interface">Interfaz de almacenamiento</label>
                  <select id="interface" value={filters.storageType} onChange={e=>update("storageType",e.target.value as BuilderFilters["storageType"])}><option value="nvme">M.2 NVMe</option><option value="sata">SATA</option><option value="any">Sin preferencia</option></select>
                  <label className="field-label" htmlFor="cooling">Refrigeración</label>
                  <select id="cooling" value={filters.coolingPreference} onChange={e=>update("coolingPreference",e.target.value as BuilderFilters["coolingPreference"])}><option value="air">Aire</option><option value="liquid">Líquida</option><option value="any">Sin preferencia</option></select>
                  <label className="field-label" htmlFor="size">Gabinete</label>
                  <select id="size" value={filters.caseSize} onChange={e=>update("caseSize",e.target.value as BuilderFilters["caseSize"])}><option value="standard">Estándar</option><option value="compact">Compacto</option><option value="any">Sin preferencia</option></select>
                  <label className="checkbox-label"><input type="checkbox" checked={filters.wifiRequired} onChange={e=>update("wifiRequired",e.target.checked)}/>WiFi integrado en placa</label>
                </details>
                <label className="field-label" htmlFor="notes">Otros requisitos <span>Opcional</span></label>
                <textarea id="notes" rows={3} maxLength={1000} placeholder="Programas, juegos o necesidades de tu equipo…" value={filters.customInstructions} onChange={e=>update("customInstructions",e.target.value)}/>
                <button className="primary-button" type="submit">{loading?<><LoaderCircle className="spinner" size={16}/>Preparando cotización…</>:"Cotizar equipo"}</button>
                <p className="form-footnote">La selección usa IA. Revisa las observaciones antes de comprar.</p>
              </fieldset>
            </form>
          </aside>
          <section className="quote-area" aria-busy={loading}>
            {error&&<div role="alert" className="error-message"><CircleAlert size={18}/><div><strong>No pudimos completar la cotización</strong><p>{error}</p></div><button type="button" disabled={loading||refreshing} onClick={()=>void generate()}>Reintentar</button></div>}
            {changed&&<p className="changed-note">Cambiaste las preferencias. Vuelve a cotizar para actualizar las piezas.</p>}
            <div className="quote-sheet">
              <div className="sheet-heading"><div><span className="eyebrow">TU COTIZACIÓN</span><h2>{quote?.buildName||"Lista de componentes"}</h2></div><span className="item-count">{quote?`${quote.components.length} componentes`:"Sin generar"}</span></div>
              <div className="component-table">
                <div className="table-head"><span>Componente</span><span>Producto</span><span>Subtotal</span></div>
                {rows.map(([category,label],index)=>{
                  const item=quote?.components.find(p=>p.category===category);
                  return <div className="component-row" key={category}>
                    <div className="component-kind"><Cpu className="component-icon" size={17} strokeWidth={1.5}/><span className="row-number">{String(index+1).padStart(2,"0")}</span><span>{label}</span></div>
                    <div className="product-cell">{item?<><a href={item.affiliateUrl} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13}/></a><p>{item.quantity&&item.quantity>1?`${item.quantity} unidades · `:""}{item.aiReason}</p><p>{item.storeUrl ? <a href={item.storeUrl} target="_blank" rel="noreferrer">{item.store}<ArrowUpRight size={12}/></a> : "Sin oferta verificada · precio referencial"}</p></>:<span className="empty-product">{quote?"Sin pieza adicional":"Por seleccionar"}</span>}</div>
                    <div className="product-price">{item?money(item.priceCLP):"—"}</div>
                  </div>;
                })}
              </div>
              <div className="total-row"><div><span>Total estimado</span><small>{quote?"Precios de referencia. No incluye despacho.":"La cotización aparecerá al configurar tu equipo."}</small></div><strong>{quote?money(quote.actualCostCLP):"—"}</strong></div>
              {quote&&<div className="budget-row"><span>Presupuesto {money(quote.totalBudgetCLP)}</span><span>{quote.actualCostCLP > quote.totalBudgetCLP ? "Sobre el presupuesto" : "Disponible"} {money(Math.abs(quote.totalBudgetCLP-quote.actualCostCLP))}</span></div>}
            </div>
            {quote&&<p className="changed-note">{storeCount} {storeCount===1?"tienda con oferta":"tiendas con ofertas"}{missingOffers>0 ? ` · ${missingOffers} sin oferta verificada`:""}. Confirma stock, precio y despacho antes de comprar.</p>}
            {quote?<div className="quote-details">
              <div className="details-heading"><h3>Observaciones del armado</h3><button onClick={()=>void copy()} className="text-button" type="button">{copied?<Check size={15}/>:<ArrowDownToLine size={15}/>} {copied?"Copiado":"Copiar cotización"}</button></div>
              <p className="summary-text">{quote.executiveSummary}</p>
              <dl className="check-list">{quote.compatibilityChecks.map((check,i)=><div key={i}><dt>{check.status==="valid"?<Check size={14}/>:<CircleAlert size={14}/>} {check.title}</dt><dd>{check.detail}</dd></div>)}</dl>
              <div className="upgrade-note"><strong>Para más adelante</strong><p>{quote.upgradePath}</p></div>
            </div>:<div className="empty-note"><h3>Tu presupuesto, pieza por pieza.</h3><p>Indica el uso, el monto máximo y las capacidades que necesitas. Aquí podrás revisar productos, cantidades y costo total antes de visitar las tiendas.</p></div>}
            <div aria-live="polite" className="request-status">{loading?"Preparando la selección con el catálogo guardado. Puede tardar hasta 50 segundos.":""}</div>
          </section>
        </div>
      </main>
      <footer className="site-footer"><span><strong>ensamblia</strong> · Creado por Vicente Sampson</span><span>Precios y disponibilidad sujetos a cambios.</span></footer>
    </div>
  );
}

