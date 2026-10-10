import { SignUp as ClerkSignUp } from "@clerk/react";
import { LegalConsentLine } from "@/components/SiteFooter";

export default function SignUp() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 vanity-bg p-4">
      <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/onboarding" />
      <LegalConsentLine action="creating an account" />
    </div>
  );
}
