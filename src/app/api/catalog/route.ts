import { NextResponse } from "next/server";
import { catalogSigningKey, encodeSnapshot, refreshSnapshot } from "@/lib/catalog-snapshot";
import { createProfileIndex } from "@/lib/catalog-profiles";

export const maxDuration = 60;
export async function POST() {
  const key = catalogSigningKey();
  if (!key) return NextResponse.json({error:"Configura CATALOG_SIGNING_SECRET en el servidor para actualizar el catálogo."},{status:503});
  try {
    const snapshot = await refreshSnapshot();
    return NextResponse.json({
      token:encodeSnapshot(snapshot,key),updatedAt:snapshot.updatedAt,count:snapshot.products.length,
      profiles:Object.fromEntries(Object.entries(createProfileIndex(snapshot.products)).map(([useCase,ids])=>[useCase,ids.length])),
    });
  } catch (error) {
    console.warn("Actualización de catálogo:",error);
    return NextResponse.json({error:"No se pudo actualizar el catálogo. Puedes seguir usando la copia guardada."},{status:503});
  }
}
