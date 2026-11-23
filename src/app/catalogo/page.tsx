import { Suspense } from "react";
import { connection } from "next/server";
import { getDailyCatalog } from "@/lib/daily-catalog";
import { catalogCompanies } from "@/lib/companies";
import { catalogueProducts } from "@/lib/catalogue";
import CatalogueView from "./catalogue-view";
import RouteLoading from "../route-loading";

export const metadata={title:"Catálogo de componentes | Ensamblia"};
type Props={searchParams:Promise<{tienda?:string;categoria?:string;q?:string}>};
async function CatalogueContent({searchParams}:Props){
 await connection();
 const [{snapshot,status},params]=await Promise.all([getDailyCatalog(),searchParams]);
 return <CatalogueView key={JSON.stringify(params)} products={catalogueProducts(snapshot)} companies={catalogCompanies(snapshot)} updatedLabel={new Intl.DateTimeFormat("es-CL",{dateStyle:"medium",timeStyle:"short",timeZone:"America/Santiago"}).format(new Date(snapshot.updatedAt))} status={status} initial={params}/>;
}
export default function CataloguePage(props:Props){return <Suspense fallback={<RouteLoading view="catalogue"/>}><CatalogueContent {...props}/></Suspense>;}
