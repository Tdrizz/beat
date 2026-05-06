import { SignUp as ClerkSignUp } from "@clerk/react";

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center vanity-bg p-4">
      <ClerkSignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/onboarding" />
    </div>
  );
}
