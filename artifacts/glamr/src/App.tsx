import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthedRoute } from "@/components/AuthedRoute";
import { MobileTabBar } from "@/components/MobileTabBar";
import { TopNav } from "@/components/TopNav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { SplashPositivity } from "@/components/SplashPositivity";
import { SiteFooter } from "@/components/SiteFooter";
import { FaceConsentGate } from "@/components/FaceConsentGate";

// Route pages load on demand so the first paint only downloads the shell
// and the Home page. Home stays eager because it is the landing page.
const LookDetail = lazy(() => import("@/pages/LookDetail"));
const LookProcess = lazy(() => import("@/pages/LookProcess"));
const TryOn = lazy(() => import("@/pages/TryOn"));
const LookMatch = lazy(() => import("@/pages/LookMatch"));
const Skincare = lazy(() => import("@/pages/Skincare"));
const SkinDiary = lazy(() => import("@/pages/SkinDiary"));
const SpecialProducts = lazy(() => import("@/pages/SpecialProducts"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const ProfileSetup = lazy(() => import("@/pages/ProfileSetup"));
const Feed = lazy(() => import("@/pages/Feed"));
const Upload = lazy(() => import("@/pages/Upload"));
const Messages = lazy(() => import("@/pages/Messages"));
const MessageThread = lazy(() => import("@/pages/MessageThread"));
const Brands = lazy(() => import("@/pages/Brands"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const AffiliateStats = lazy(() => import("@/pages/AffiliateStats"));
const Archetype = lazy(() => import("@/pages/Archetype"));
const AskIola = lazy(() => import("@/pages/AskIola"));
const Tools = lazy(() => import("@/pages/Tools"));
const Nutrition = lazy(() => import("@/pages/Nutrition"));
const SocialLinksSettings = lazy(() => import("@/pages/SocialLinksSettings"));
const EmailPreferencesSettings = lazy(() => import("@/pages/EmailPreferencesSettings"));
const Friends = lazy(() => import("@/pages/Friends"));
const Juicing = lazy(() => import("@/pages/Juicing"));
const SlayBible = lazy(() => import("@/pages/SlayBible"));
const Teapot = lazy(() => import("@/pages/Teapot"));
const EstheticianHub = lazy(() => import("@/pages/EstheticianHub"));
const PeriodTracker = lazy(() => import("@/pages/PeriodTracker"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const Tutorials = lazy(() => import("@/pages/Tutorials"));
const TutorialDetail = lazy(() => import("@/pages/TutorialDetail"));
const TutorialSubmit = lazy(() => import("@/pages/TutorialSubmit"));
const MySubmittedTutorials = lazy(() => import("@/pages/MySubmittedTutorials"));
const TutorialModeration = lazy(() => import("@/pages/TutorialModeration"));
const Classes = lazy(() => import("@/pages/Classes"));
const ClassDetail = lazy(() => import("@/pages/ClassDetail"));
const HostClass = lazy(() => import("@/pages/HostClass"));
const Premium = lazy(() => import("@/pages/Premium"));
const Wigs = lazy(() => import("@/pages/Wigs"));
const WigDetail = lazy(() => import("@/pages/WigDetail"));
const MyWigs = lazy(() => import("@/pages/MyWigs"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const BlockedAccounts = lazy(() => import("@/pages/BlockedAccounts"));
const AdminReports = lazy(() => import("@/pages/AdminReports"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));

const queryClient = new QueryClient();

function PageLoading() {
  return <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-in/:rest*" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/sign-up/:rest*" component={SignUp} />
      <Route path="/onboarding" component={ProfileSetup} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

      <Route path="/" component={Home} />
      <Route path="/match"><FaceConsentGate><LookMatch /></FaceConsentGate></Route>
      <Route path="/looks/:lookId/process" component={LookProcess} />
      <Route path="/looks/:lookId" component={LookDetail} />
      <Route path="/try-on/:lookId">
        <AuthedRoute>
          <FaceConsentGate>
            <TryOn />
          </FaceConsentGate>
        </AuthedRoute>
      </Route>
      <Route path="/skincare" component={Skincare} />
      <Route path="/diary" component={SkinDiary} />
      <Route path="/special-products" component={SpecialProducts} />
      <Route path="/ask" component={AskIola} />
      <Route path="/archetype" component={Archetype} />
      <Route path="/tools" component={Tools} />
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/juicing" component={Juicing} />
      <Route path="/slay-bible" component={SlayBible} />
      <Route path="/teapot" component={Teapot} />
      <Route path="/esthetician-hub" component={EstheticianHub} />
      <Route path="/cycle" component={PeriodTracker} />
      <Route path="/tutorials" component={Tutorials} />
      {/* Specific tutorial subpaths must come before the catch-all
          `/tutorials/:id` route, otherwise "submit" / "mine" / "moderation"
          would be treated as tutorial ids. */}
      <Route path="/tutorials/submit" component={TutorialSubmit} />
      <Route path="/tutorials/submit/:id" component={TutorialSubmit} />
      <Route path="/tutorials/mine" component={MySubmittedTutorials} />
      <Route path="/tutorials/moderation" component={TutorialModeration} />
      <Route path="/tutorials/:id" component={TutorialDetail} />

      <Route path="/classes" component={Classes} />
      <Route path="/classes/:id" component={ClassDetail} />
      <Route path="/host-class" component={HostClass} />
      <Route path="/premium" component={Premium} />

      <Route path="/wigs" component={Wigs} />
      <Route path="/wigs/:wigId" component={WigDetail} />
      <Route path="/my-wigs"><AuthedRoute><MyWigs /></AuthedRoute></Route>

      <Route path="/settings/social"><AuthedRoute><SocialLinksSettings /></AuthedRoute></Route>
      <Route path="/settings/email"><AuthedRoute><EmailPreferencesSettings /></AuthedRoute></Route>
      <Route path="/settings/account"><AuthedRoute><AccountSettings /></AuthedRoute></Route>
      <Route path="/settings/blocked"><AuthedRoute><BlockedAccounts /></AuthedRoute></Route>
      <Route path="/admin/reports"><AuthedRoute><AdminReports /></AuthedRoute></Route>
      <Route path="/feed"><AuthedRoute><Feed /></AuthedRoute></Route>
      <Route path="/posts/:id"><AuthedRoute><PostDetail /></AuthedRoute></Route>
      <Route path="/upload"><AuthedRoute><Upload /></AuthedRoute></Route>
      <Route path="/messages"><AuthedRoute><Messages /></AuthedRoute></Route>
      <Route path="/messages/:handle"><AuthedRoute><MessageThread /></AuthedRoute></Route>
      <Route path="/brands"><AuthedRoute><Brands /></AuthedRoute></Route>
      <Route path="/u/:handle"><AuthedRoute><UserProfile /></AuthedRoute></Route>
      <Route path="/friends"><AuthedRoute><Friends /></AuthedRoute></Route>
      <Route path="/affiliate"><AuthedRoute><AffiliateStats /></AuthedRoute></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          {/* Global chrome: TopNav (sticky, with hamburger on mobile and
              primary pills on desktop) renders above every route, so the
              menu is always one tap away. The component self-hides on
              the auth + onboarding routes. */}
          <TopNav />
          <Suspense fallback={<PageLoading />}>
            <Router />
          </Suspense>
          <SiteFooter />
          <MobileTabBar />
          <SplashPositivity />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
