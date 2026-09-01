// src/App.tsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./state/AuthContext";
import { SportProvider } from "./state/SportContext";
import { MembershipProvider } from "./state/MembershipContext";
import { FavoritesProvider } from "./state/FavoritesContext";
import { RecentlyViewedProvider } from "./state/RecentlyViewedContext";
import { SavedFiltersProvider } from "./state/SavedFiltersContext";
import { CommandSearchProvider } from "./state/CommandSearchContext";
import { UpgradeModalProvider } from "./state/UpgradeModalContext";
import { AppShell } from "./components/shell/AppShell";
import { UpgradeModal } from "./components/ui/UpgradeModal";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Every route below used to be a static top-level import, so a first-time
// visitor's initial bundle included every page in the app — all 4 auth
// screens, the SGM builder, schedule, saved filters, account settings, and
// every "coming soon" stub — regardless of which single page they actually
// landed on. Route-level code splitting means each page's code downloads
// only when its route is visited. The Suspense fallback below covers the
// brief gap while a chunk loads (invisible on fast connections, a beat on
// slow ones — never a blank screen).
const SignIn = lazy(() => import("./pages/SignIn").then((m) => ({ default: m.SignIn })));
const SignUp = lazy(() => import("./pages/SignUp").then((m) => ({ default: m.SignUp })));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword").then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })));
const AuthCallback = lazy(() => import("./pages/AuthCallback").then((m) => ({ default: m.AuthCallback })));
const Account = lazy(() => import("./pages/Account").then((m) => ({ default: m.Account })));
const Subscribe = lazy(() => import("./pages/Subscribe").then((m) => ({ default: m.Subscribe })));
const BillingSuccess = lazy(() => import("./pages/BillingSuccess").then((m) => ({ default: m.BillingSuccess })));
const BillingCancel = lazy(() => import("./pages/BillingCancel").then((m) => ({ default: m.BillingCancel })));
const PlayerIntelligence = lazy(() => import("./pages/PlayerIntelligence").then((m) => ({ default: m.PlayerIntelligence })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const TopPicks = lazy(() => import("./pages/TopPicks").then((m) => ({ default: m.TopPicks })));
const Schedule = lazy(() => import("./pages/Schedule").then((m) => ({ default: m.Schedule })));
const GameDetail = lazy(() => import("./pages/GameDetail").then((m) => ({ default: m.GameDetail })));
const ResearchBoard = lazy(() => import("./pages/ResearchBoard").then((m) => ({ default: m.ResearchBoard })));

// Minimal full-viewport fallback — mirrors the app's dark surface so a
// mid-navigation chunk load never flashes an unstyled white screen.
function RouteFallback() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "60vh", color: "var(--ink-muted)" }} role="status" aria-label="Loading">
      <div className="skeleton" style={{ width: 120, height: 12, borderRadius: "var(--radius-sm)" }} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SportProvider>
        <MembershipProvider>
          <FavoritesProvider>
            <RecentlyViewedProvider>
              <SavedFiltersProvider>
                <CommandSearchProvider>
                  <UpgradeModalProvider>
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                        <Route path="/" element={<Navigate to="/schedule" replace />} />
                          <Route path="/player/:playerId" element={<PlayerIntelligence />} />
                          <Route
                            path="/account"
                            element={
                              <ProtectedRoute>
                                <Account />
                              </ProtectedRoute>
                            }
                          />
                          {/* Plan selection and post-Checkout landing pages. Signed-in only —
                              Stripe Checkout Sessions are created for an authenticated user (see
                              create-checkout-session), so nobody should reach these signed out. */}
                          <Route
                            path="/subscribe"
                            element={
                              <ProtectedRoute>
                                <Subscribe />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/billing/success"
                            element={
                              <ProtectedRoute>
                                <BillingSuccess />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/billing/cancel"
                            element={
                              <ProtectedRoute>
                                <BillingCancel />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/admin"
                            element={
                              <ProtectedRoute>
                                <Admin />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                        {/* Informational-only pages: nav links from TopBar. These live in their
                            own AppShell group (rather than the ProtectedRoute-wrapped one above)
                            because they're just static content — no reason to require sign-in
                            to read them. */}
                        <Route element={<AppShell />}>
                          <Route path="/top-picks" element={<TopPicks />} />
                          <Route path="/schedule" element={<Schedule />} />
                          <Route path="/game/:gameId" element={<GameDetail />} />
                          <Route path="/research" element={<ResearchBoard />} />
                        </Route>
                      </Routes>
                    </Suspense>
                    <UpgradeModal />
                  </UpgradeModalProvider>
                </CommandSearchProvider>
              </SavedFiltersProvider>
            </RecentlyViewedProvider>
          </FavoritesProvider>
        </MembershipProvider>
      </SportProvider>
    </AuthProvider>
  );
}
