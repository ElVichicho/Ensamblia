import { jsonrepair } from "jsonrepair";
import { QuoteError } from "./quote-selection";

export type AiSelection={option:number;buildName:string;summary:string;upgradePath:string;reasons:Record<string,string>};
const invalid=()=>new QuoteError("La IA devolvió una selección incompleta o no válida. Intenta nuevamente.",502);

// Repairs syntax only. The selected option must still exist in the server's
// prevalidated configurations; model output can never supply products or prices.
export function parseAiSelection(content:string,allowedOptions:number[]):AiSelection {
 if(content.length>20000)throw invalid();
 const json=content.match(/\{[\s\S]*\}/)?.[0];
 if(!json)throw invalid();
 let value:unknown;
 try {value=JSON.parse(json);} catch {
  try {value=JSON.parse(jsonrepair(json));} catch {throw invalid();}
 }
 if(!value||typeof value!=="object"||Array.isArray(value))throw invalid();
 const result=value as Record<string,unknown>;
 if(typeof result.option!=="number"||!Number.isInteger(result.option)||!allowedOptions.includes(result.option))throw invalid();
 function text(key:string,max:number){
  const value=result[key];
  if(typeof value!=="string"||!value.trim()||value.length>max)throw invalid();
  return value.trim();
 }
 const reasons:Record<string,string>={};
 if(result.reasons&&typeof result.reasons==="object"&&!Array.isArray(result.reasons)){
  for(const category of ["cpu","motherboard","ram","gpu","storage","psu","case","cooler"]){
   const reason=(result.reasons as Record<string,unknown>)[category];
   if(typeof reason==="string"&&reason.trim()&&reason.length<=500)reasons[category]=reason.trim();
  }
 }
 return {option:result.option,buildName:text("buildName",150),summary:text("summary",1500),upgradePath:text("upgradePath",1000),reasons};
}
