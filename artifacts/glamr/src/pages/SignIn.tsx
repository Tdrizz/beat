import { SignIn as ClerkSignIn } from "@clerk/react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center vanity-bg p-4">
      <ClerkSignIn routing="path" path="/sign-in" signUpUrl="/sign-up" forceRedirectUrl="/onboarding" />
    </div>
  );
}
