/** Style: «دفتر الحيّ» — Arabic-first shell with quiet, adaptable editorial warmth. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ProtectedPlaceholder from "./pages/auth/ProtectedPlaceholder";
import JobDetails from "./pages/JobDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import Ratings from "./pages/Ratings";
import SafetySettings from "./pages/SafetySettings";
import Applications from "./pages/Applications";
import SavedGigs from "./pages/SavedGigs";
import Notifications from "./pages/Notifications";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerGigWizard from "./pages/EmployerGigWizard";
import EmployerGigs from "./pages/EmployerGigs";
import EmployerGigEditor from "./pages/EmployerGigEditor";
import EmployerApplicants from "./pages/EmployerApplicants";
import EmployerApplicantsOverview from "./pages/EmployerApplicantsOverview";
import EmployerProfile from "./pages/EmployerProfile";
import EmployerNotifications from "./pages/EmployerNotifications";
import Settings from "./pages/Settings";
import "./styles/phase3.css";
import "./styles/phase3-overrides.css";
import "./styles/phase4.css";
import "./styles/phase4-overrides.css";
import "./styles/phase5.css";
import "./styles/map-render-fix.css";
import "./styles/jobseeker-mobile-nav.css";
import "./styles/job-seeker.css";
import "./styles/job-seeker-overrides.css";
import "./styles/job-seeker-details.css";
import "./styles/job-seeker-activity.css";
import "./styles/job-seeker-profile.css";
import "./styles/job-seeker-notifications.css";
import "./styles/phase10.css";
import "./styles/employer.css";
import "./styles/employer-applicants-overview.css";
import "./styles/messaging.css";
import "./styles/messaging-desktop.css";
import "./styles/trust.css";
import "./styles/admin.css";
import "./styles/admin-data.css";

const Explore = lazy(() => import("./pages/Explore"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminGigs = lazy(() => import("./pages/admin/AdminGigs"));
const AdminModeration = lazy(() => import("./pages/admin/AdminModeration"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSponsored = lazy(() => import("./pages/admin/AdminSponsored"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity"));

function Router() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}>
        <Suspense fallback={<main className="route-loading" aria-live="polite">جارٍ تجهيز الصفحة…</main>}><Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/explore"} component={Explore} />
          <Route path={"/jobs/:jobId"} component={JobDetails} />
          <Route path={"/login"} component={Login} />
          <Route path={"/register"} component={Register} />
          <Route path={"/forgot-password"} component={ForgotPassword} />
          <Route path={"/verify-otp"} component={VerifyOtp} />
          <Route path={"/dashboard"}>{() => <ProtectedPlaceholder label="لوحة الفرص" />}</Route>
          <Route path={"/profile"} component={Profile} />
          <Route path={"/messages"} component={Messages} />
          <Route path={"/messages/:conversationId"} component={Conversation} />
          <Route path={"/ratings"} component={Ratings} />
          <Route path={"/safety"} component={SafetySettings} />
          <Route path={"/applications"} component={Applications} />
          <Route path={"/saved"} component={SavedGigs} />
          <Route path={"/notifications"} component={Notifications} />
          <Route path={"/settings"} component={Settings} />
          <Route path={"/employer/new"} component={EmployerGigWizard} />
          <Route path={"/employer/gigs/:gigId/applicants"} component={EmployerApplicants} />
          <Route path={"/employer/applicants"} component={EmployerApplicantsOverview} />
          <Route path={"/employer/gigs/:gigId/edit"} component={EmployerGigEditor} />
          <Route path={"/employer/gigs"} component={EmployerGigs} />
          <Route path={"/employer/profile"} component={EmployerProfile} />
          <Route path={"/employer/notifications"} component={EmployerNotifications} />
          <Route path={"/employer"} component={EmployerDashboard} />
          <Route path={"/admin/users"} component={AdminUsers} />
          <Route path={"/admin/gigs"} component={AdminGigs} />
          <Route path={"/admin/reports"} component={AdminReports} />
          <Route path={"/admin/moderation"} component={AdminModeration} />
          <Route path={"/admin/sponsored"} component={AdminSponsored} />
          <Route path={"/admin/analytics"} component={AdminAnalytics} />
          <Route path={"/admin/audit-logs"} component={AdminAuditLogs} />
          <Route path={"/admin/security"} component={AdminSecurity} />
          <Route path={"/admin"} component={AdminDashboard} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch></Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
