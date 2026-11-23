import Builder from "../builder";
import RouteLoading from "../route-loading";
import { quoteMode } from "@/lib/deployment-mode";
import { getDailyCatalog } from "@/lib/daily-catalog";
import { catalogCompanies } from "@/lib/companies";
import { connection } from "next/server";
import { Suspense } from "react";
type Props={searchParams:Promise<{empresa?:string}>};
async function QuoteContent({searchParams}:Props) {
  await connection();
  const {snapshot,status}=await getDailyCatalog();
  const companies=catalogCompanies(snapshot);
  const {empresa}=await searchParams;
  return <Builder mode={quoteMode()} companies={companies} initialCompany={companies.some(c=>c.id===empresa)?empresa:undefined} initialCatalog={{updatedAt:snapshot.updatedAt,count:snapshot.products.length,status}}/>;
}
export default function QuotePage(props:Props){return <Suspense fallback={<RouteLoading view="builder"/>}><QuoteContent {...props}/></Suspense>;}
