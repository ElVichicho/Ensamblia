import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { getDailyCatalog } from "@/lib/daily-catalog";
import { quoteMode } from "@/lib/deployment-mode";
import { getFreeOpenRouterModel, requestBuildFromOpenRouter } from "@/lib/openrouter";
import { createProfileIndex } from "@/lib/catalog-profiles";
import { attachStoreOffers } from "@/lib/store-offers";
import { QuoteError } from "@/lib/quote-selection";
import { rebuildSelection, withAlternatives } from "@/lib/component-alternatives";
import { createDemoQuote } from "@/lib/demo-quote";

export const maxDuration = 180;
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
  try {
    const mode = quoteMode();
    if (mode === "ai" && !process.env.OPENROUTER_API_KEY?.trim()) {
      return NextResponse.json({error:"Configura OPENROUTER_API_KEY en Preview para probar IA."},{status:503});
    }
    const { snapshot, status } = await getDailyCatalog();
    const catalog = { updatedAt: snapshot.updatedAt, count: snapshot.products.length, status,
      profiles: Object.fromEntries(Object.entries(createProfileIndex(snapshot.products)).map(([useCase,ids])=>[useCase,ids.length])),
    };
    if (body.selection !== undefined) {
      if (body.catalogUpdatedAt !== snapshot.updatedAt) return NextResponse.json({error:"El catálogo cambió. Cotiza nuevamente antes de cambiar piezas."},{status:409});
      const quote=attachStoreOffers(rebuildSelection(body.selection,filters,snapshot.products),filters.consolidateStores ?? false,snapshot.offers);
      return NextResponse.json({mode,catalog,quote:{...withAlternatives(quote,filters,snapshot.products,snapshot.offers),generationMode:mode}});
    }
    const generated = mode === "ai"
      ? (await requestBuildFromOpenRouter(filters, process.env.OPENROUTER_API_KEY, getFreeOpenRouterModel(), snapshot.products)).quote
      : createDemoQuote(filters,snapshot.products);
    const quote=attachStoreOffers(generated,filters.consolidateStores ?? false,snapshot.offers);
    return NextResponse.json({mode,catalog,quote:{...withAlternatives(quote,filters,snapshot.products,snapshot.offers),generationMode:mode}});
  } catch (error) {
    console.error("Cotización:",error);
    return NextResponse.json({error:error instanceof QuoteError?error.message:"Ocurrió un error al preparar la cotización."},
      {status:error instanceof QuoteError?error.status:500});
  }
}
