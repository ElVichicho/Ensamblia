"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Box, Moon, Sun, ArrowRight } from "lucide-react";
export default function SiteHeader({builder=false,catalogue=false}:{builder?:boolean;catalogue?:boolean}) {
  useEffect(()=>{
    try { const saved=localStorage.getItem("ensamblia-theme") ?? localStorage.getItem("solotodo-theme"); if(saved==="light"||saved==="dark")document.documentElement.dataset.theme=saved; } catch {}
  },[]);
  function toggle(){
    const root=document.documentElement;
    const dark=root.dataset.theme?root.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;
    const theme=dark?"light":"dark";root.dataset.theme=theme;
    try{localStorage.setItem("ensamblia-theme",theme);}catch{}
  }
  return <header className="pulso-header"><Link href="/" className="pulso-brand" aria-label="Ensamblia, inicio"><Box size={31} strokeWidth={1.7}/><span>ensamblia</span></Link><nav aria-label="Navegación principal"><Link href="/" aria-current={!builder&&!catalogue?"page":undefined}>Inicio</Link><Link href="/catalogo" aria-current={catalogue?"page":undefined}>Empresas integradas</Link><Link href="/cotizador" aria-current={builder&&!catalogue?"page":undefined}>Cotizador</Link></nav><div className="pulso-header-actions"><button className="theme-toggle" type="button" onClick={toggle}><span className="theme-to-dark"><Moon size={17}/><span className="sr-only">Activar tema oscuro</span></span><span className="theme-to-light"><Sun size={17}/><span className="sr-only">Activar tema claro</span></span></button>{!builder&&<Link className="pulso-cta header-cta" href="/cotizador">Cotizar mi PC <ArrowRight size={15}/></Link>}</div></header>;
}
