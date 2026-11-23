import { NextResponse } from "next/server";
import { getDailyCatalog } from "@/lib/daily-catalog";
import { catalogCompanies } from "@/lib/companies";
import { connection } from "next/server";
export async function GET() {
  await connection();
  const {snapshot,status}=await getDailyCatalog();
  return NextResponse.json({updatedAt:snapshot.updatedAt,count:snapshot.products.length,status,companies:catalogCompanies(snapshot)}, {headers:{"Cache-Control":"no-store"}});
}
