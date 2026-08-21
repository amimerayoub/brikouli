/** Style: «دفتر الحيّ» — Arabic-first shell with quiet, adaptable editorial warmth. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ProtectedPlaceholder from "./pages/auth/ProtectedPlaceholder";
import Explore from "./pages/Explore";
import JobDetails from "./pages/JobDetails";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import "./styles/phase3.css";
import "./styles/phase3-overrides.css";
import "./styles/phase4.css";
import "./styles/phase4-overrides.css";

function Router() {
  const [location] = useLocation();
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] }}>
        <Switch>
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
          <Route path={"/employer"}>{() => <ProtectedPlaceholder label="منطقة صاحب العمل" />}</Route>
          <Route path={"/admin"}>{() => <ProtectedPlaceholder label="منطقة الإدارة" />}</Route>
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
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
