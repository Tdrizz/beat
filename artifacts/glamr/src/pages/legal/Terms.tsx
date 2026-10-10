import { LegalPage } from "./LegalPage";
import { TERMS_SECTIONS } from "@/lib/legalContent";

export default function Terms() {
  return <LegalPage title="Terms of Service" sections={TERMS_SECTIONS} />;
}
