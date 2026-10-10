import { LegalPage } from "./LegalPage";
import { PRIVACY_SECTIONS } from "@/lib/legalContent";

export default function Privacy() {
  return <LegalPage title="Privacy Policy" sections={PRIVACY_SECTIONS} />;
}
