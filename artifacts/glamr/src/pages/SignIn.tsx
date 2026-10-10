import { SignIn as ClerkSignIn } from "@clerk/react";
import { LegalConsentLine } from "@/components/SiteFooter";

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 vanity-bg p-4">
      <ClerkSignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/onboarding" />
      <LegalConsentLine action="signing in" />
    </div>
  );
}
