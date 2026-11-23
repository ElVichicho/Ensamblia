import Link from "next/link";
import { ArrowRight, Check, Cpu, ShoppingBag } from "lucide-react";
import SiteHeader from "./site-header";
import CompanyCarousel from "./company-carousel";
import PcIllustration from "./pc-illustration";
import { getDailyCatalog } from "@/lib/daily-catalog";
import { catalogCompanies } from "@/lib/companies";
import { connection } from "next/server";
import { Suspense } from "react";

async function CompanyList() {
  await connection();
  const {snapshot,status}=await getDailyCatalog();
  const companies=catalogCompanies(snapshot);
  return companies.length?<CompanyCarousel companies={companies}/>:<p className="companies-empty">El catálogo de tiendas está {status==="unconfigured"?"pendiente de configuración":"temporalmente no disponible"}. Puedes explorar el cotizador con precios de referencia.</p>;
}

export default function HomePage() {
  return <div className="site pulso-home"><SiteHeader/><main><section className="pulso-hero"><div className="pulso-copy"><p className="small-intro"><i/>De la primera pieza al equipo completo.</p><h1>Tu próximo PC.<br/>Todo encaja.</h1><p>Ensamblia reúne componentes de distintas tiendas y te ayuda a elegir un equipo compatible con tu presupuesto.</p><Link className="pulso-cta" href="/cotizador">Empezar mi cotización <ArrowRight size={19}/></Link><span className="hero-note"><Check size={14}/>Una tienda o varias. Tú eliges.</span></div><div className="product-stage"><PcIllustration/><div className="product-label"><span>Un equipo pensado para ti</span><span>Procesador. Gráfica. Memoria. Todo.</span></div><div className="product-detail detail-one"><Cpu size={18}/><span>Las piezas correctas</span></div><div className="product-detail detail-two"><ShoppingBag size={18}/><span>Las tiendas, a tu elección</span></div></div></section><section className="pulso-companies" id="empresas"><div><h2>Las tiendas, conectadas.</h2><p>Explora sus componentes desde un mismo lugar.</p><small>Catálogos de tiendas disponibles a través de SoloTodo; no implica una alianza comercial.</small></div><Suspense fallback={<div className="company-placeholders" aria-hidden="true"><span/><span/><span/></div>}><CompanyList/></Suspense></section><section className="pulso-bottom"><p>Menos pestañas abiertas.<br/>Más claridad para elegir.</p><Link href="/cotizador">Preparar mi equipo <ArrowRight size={17}/></Link></section></main><footer className="pulso-footer"><span>Ensamblia. Tu próximo PC, bien pensado.</span><span>Creado por Vicente Sampson</span></footer></div>;
}
