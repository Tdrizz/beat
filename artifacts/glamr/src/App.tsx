import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthedRoute } from "@/components/AuthedRoute";
import { MobileTabBar } from "@/components/MobileTabBar";
import { TopNav } from "@/components/TopNav";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import LookDetail from "@/pages/LookDetail";
import TryOn from "@/pages/TryOn";
import LookMatch from "@/pages/LookMatch";
import Skincare from "@/pages/Skincare";
import SkinDiary from "@/pages/SkinDiary";
import SpecialProducts from "@/pages/SpecialProducts";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ProfileSetup from "@/pages/ProfileSetup";
import Feed from "@/pages/Feed";
import Upload from "@/pages/Upload";
import Messages from "@/pages/Messages";
import MessageThread from "@/pages/MessageThread";
import Brands from "@/pages/Brands";
import UserProfile from "@/pages/UserProfile";
import AffiliateStats from "@/pages/AffiliateStats";
import Archetype from "@/pages/Archetype";
import Tools from "@/pages/Tools";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/sign-in/:rest*" component={SignIn} />
      <Route path="/sign-up" component={SignUp} />
      <Route path="/sign-up/:rest*" component={SignUp} />
      <Route path="/onboarding" component={ProfileSetup} />

      <Route path="/" component={Home} />
      <Route path="/match" component={LookMatch} />
      <Route path="/looks/:lookId" component={LookDetail} />
      <Route path="/try-on/:lookId">
        <AuthedRoute>
          <TryOn />
        </AuthedRoute>
      </Route>
      <Route path="/skincare" component={Skincare} />
      <Route path="/diary" component={SkinDiary} />
      <Route path="/special-products" component={SpecialProducts} />
      <Route path="/archetype" component={Archetype} />
      <Route path="/tools" component={Tools} />

      <Route path="/feed"><AuthedRoute><Feed /></AuthedRoute></Route>
      <Route path="/upload"><AuthedRoute><Upload /></AuthedRoute></Route>
      <Route path="/messages"><AuthedRoute><Messages /></AuthedRoute></Route>
      <Route path="/messages/:handle"><AuthedRoute><MessageThread /></AuthedRoute></Route>
      <Route path="/brands"><AuthedRoute><Brands /></AuthedRoute></Route>
      <Route path="/u/:handle"><AuthedRoute><UserProfile /></AuthedRoute></Route>
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
          <Router />
          <MobileTabBar />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
