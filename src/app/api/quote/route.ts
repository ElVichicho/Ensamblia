import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { catalogSigningKey, decodeSnapshot, maxSnapshotLength } from "@/lib/catalog-snapshot";
import { attachStoreOffers } from "@/lib/store-offers";
import { products, QuoteError } from "@/lib/quote-selection";
import { rebuildSelection, withAlternatives } from "@/lib/component-alternatives";
import { createDemoQuote } from "@/lib/demo-quote";

export const maxDuration = 60;
export async function POST(req: NextRequest) {
  let body;
  try { body=await req.json(); }
  catch { return NextResponse.json({error:"La solicitud debe contener JSON válido."},{status:400}); }
  const filters: BuilderFilters=body?.filters;
  const options: Record<string, string[]> = {
    useCase:["office","home_study","creative","gaming","dev_data"], cpuPreference:["any","amd","intel"],
    gpuPreference:["any","nvidia","amd"], storageCapacity:["500gb","1tb","2tb","any"],
    storageType:["nvme","sata","any"], ramCapacity:["16gb","32gb","64gb","any"],
    coolingPreference:["air","liquid","any"], caseSize:["compact","standard","any"],
  };
  if (!filters || !Number.isFinite(filters.budgetCLP) || filters.budgetCLP<350000 || filters.budgetCLP>3000000 ||
      Object.entries(options).some(([key,values])=>!values.includes(filters[key as keyof BuilderFilters] as string)) ||
      typeof filters.wifiRequired!=="boolean" ||
      (filters.consolidateStores!==undefined && typeof filters.consolidateStores!=="boolean") ||
      (filters.customInstructions!==undefined && (typeof filters.customInstructions!=="string"||filters.customInstructions.length>1000))) {
    return NextResponse.json({error:"Revisa el presupuesto y las preferencias de la cotización."},{status:400});
  }
  const key = catalogSigningKey();
  let snapshot;
  if (body.catalogToken !== undefined) {
    try {
      if (!key || typeof body.catalogToken !== "string" || body.catalogToken.length > maxSnapshotLength) throw new Error();
      snapshot = decodeSnapshot(body.catalogToken,key);
    } catch {
      return NextResponse.json({error:"La copia guardada ya no es válida. Pulsa Actualizar catálogo."},{status:400});
    }
  }
  try {
    if (body.selection !== undefined) {
      const quote=attachStoreOffers(rebuildSelection(body.selection,filters,snapshot?.products ?? products),filters.consolidateStores ?? false,snapshot?.offers);
      return NextResponse.json({mode:"demo",quote:{...withAlternatives(quote,filters,snapshot?.products ?? products,snapshot?.offers),generationMode:"demo"}});
    }
    const quote=attachStoreOffers(createDemoQuote(filters,snapshot?.products ?? products),filters.consolidateStores ?? false,snapshot?.offers);
    return NextResponse.json({mode:"demo",quote:withAlternatives(quote,filters,snapshot?.products ?? products,snapshot?.offers)});
  } catch (error) {
    console.error("Cotización:",error);
    return NextResponse.json({error:error instanceof QuoteError?error.message:"Ocurrió un error al preparar la cotización."},
      {status:error instanceof QuoteError?error.status:500});
  }
}
