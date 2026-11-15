import { NextRequest, NextResponse } from "next/server";
import { BuilderFilters } from "@/types/pc-builder";
import { getFreeOpenRouterModel, requestBuildFromOpenRouter } from "@/lib/openrouter";
import { attachStoreOffers } from "@/lib/store-offers";
import { QuoteError } from "@/lib/quote-selection";

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
  try {
    const result = await requestBuildFromOpenRouter(filters,process.env.OPENROUTER_API_KEY,getFreeOpenRouterModel());
    return NextResponse.json({...result, quote:await attachStoreOffers(result.quote, filters.consolidateStores ?? false)});
  } catch (error) {
    console.error("Cotización:",error);
    return NextResponse.json({error:error instanceof QuoteError?error.message:"Ocurrió un error al preparar la cotización."},
      {status:error instanceof QuoteError?error.status:500});
  }
}
