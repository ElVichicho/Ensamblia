import { Box } from "lucide-react";
import SiteHeader from "./site-header";
export function LoadingHint({label="Preparando tu espacio"}:{label?:string}){
 return <div className="loading-hint" role="status"><Box size={18}/><span>{label}</span><span className="loading-dots" aria-hidden="true"><i/><i/><i/></span></div>;
}
export function CompanyLoading(){return <div className="company-loading"><LoadingHint label="Conectando las tiendas"/><div className="company-placeholders" aria-hidden="true"><span/><span/><span/></div></div>;}
export default function RouteLoading({view="home"}:{view?:"home"|"builder"|"catalogue"}){
 return <div className="site route-loading"><SiteHeader builder={view!=="home"} catalogue={view==="catalogue"}/><div className="loading-progress" aria-hidden="true"/><main className="workspace" aria-busy="true"><LoadingHint label={view==="builder"?"Preparando tu cotizador":view==="catalogue"?"Reuniendo productos y tiendas":"Preparando contenido"}/><div className="loading-title skeleton" aria-hidden="true"/><div className="loading-subtitle skeleton" aria-hidden="true"/><div className={`loading-layout loading-${view}`} aria-hidden="true"><div className="loading-sidebar">{Array.from({length:5},(_,i)=><div className="loading-field" key={i}><span className="skeleton"/><div className="skeleton"/></div>)}</div><div className="loading-content">{Array.from({length:view==="catalogue"?6:7},(_,i)=><div className="loading-row" key={i}><span className="skeleton"/><div><b className="skeleton"/><small className="skeleton"/></div><i className="skeleton"/></div>)}</div></div></main></div>;
}
