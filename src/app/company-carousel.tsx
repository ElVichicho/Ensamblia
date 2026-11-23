"use client";
import Link from "next/link";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Company } from "@/lib/companies";
export default function CompanyCarousel({companies}:{companies:Company[]}){
 const [paused,setPaused]=useState(false);
 if(!companies.length)return null;
 const items=Array.from({length:Math.max(2,Math.ceil(8/companies.length))},()=>companies).flat();
 return <div className="company-carousel" data-paused={paused}><div className="carousel-controls"><span>{companies.length} tiendas en un mismo lugar</span><button type="button" onClick={()=>setPaused(!paused)} aria-label={paused?"Reanudar movimiento de tiendas":"Pausar movimiento de tiendas"}>{paused?<Play size={13}/>:<Pause size={13}/>}</button></div><div className="marquee-window"><div className="marquee-track">{[0,1].map(group=><div className="marquee-group" key={group} aria-hidden={group===1?true:undefined}>{items.map((company,i)=>{const copy=group===1||i>=companies.length;return <Link href={`/catalogo?tienda=${encodeURIComponent(company.id)}`} key={`${group}-${i}`} className="company-brand marquee-company" aria-hidden={copy?true:undefined} tabIndex={copy?-1:undefined} data-copy={copy||undefined}><span className="company-monogram" aria-hidden="true">{company.name.slice(0,1)}</span><span><b>{company.name}</b><small>{company.products} productos disponibles</small></span></Link>;})}</div>)}</div></div></div>;
}
