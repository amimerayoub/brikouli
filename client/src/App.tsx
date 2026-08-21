/** Style: «دفتر الحيّ» — Arabic-first shell with quiet, adaptable editorial warmth. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ProtectedPlaceholder from "./pages/auth/ProtectedPlaceholder";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/verify-otp"} component={VerifyOtp} />
      <Route path={"/dashboard"}>{() => <ProtectedPlaceholder label="لوحة الفرص" />}</Route>
      <Route path={"/profile"}>{() => <ProtectedPlaceholder label="الملف الشخصي" />}</Route>
      <Route path={"/messages"}>{() => <ProtectedPlaceholder label="الرسائل" />}</Route>
      <Route path={"/employer"}>{() => <ProtectedPlaceholder label="منطقة صاحب العمل" />}</Route>
      <Route path={"/admin"}>{() => <ProtectedPlaceholder label="منطقة الإدارة" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
