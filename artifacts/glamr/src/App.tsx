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
import Nutrition from "@/pages/Nutrition";
import SocialLinksSettings from "@/pages/SocialLinksSettings";
import Friends from "@/pages/Friends";
import Juicing from "@/pages/Juicing";
import SlayBible from "@/pages/SlayBible";
import Teapot from "@/pages/Teapot";
import EstheticianHub from "@/pages/EstheticianHub";
import PeriodTracker from "@/pages/PeriodTracker";
import PostDetail from "@/pages/PostDetail";
import Tutorials from "@/pages/Tutorials";
import TutorialDetail from "@/pages/TutorialDetail";
import TutorialSubmit from "@/pages/TutorialSubmit";
import MySubmittedTutorials from "@/pages/MySubmittedTutorials";
import TutorialModeration from "@/pages/TutorialModeration";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import HostClass from "@/pages/HostClass";
import Premium from "@/pages/Premium";
import { SplashPositivity } from "@/components/SplashPositivity";

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

      <Route path="/settings/social"><AuthedRoute><SocialLinksSettings /></AuthedRoute></Route>
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
          <Router />
          <MobileTabBar />
          <SplashPositivity />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
