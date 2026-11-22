import Builder from "./builder";
import { quoteMode } from "@/lib/deployment-mode";

export default function HomePage() {
  return <Builder mode={quoteMode()}/>;
}
