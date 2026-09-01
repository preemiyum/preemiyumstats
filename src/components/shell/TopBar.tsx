import { Link, useNavigate } from "react-router-dom";
import { useSport, ENABLED_SPORTS } from "../../state/SportContext";
import { useMembership } from "../../state/MembershipContext";
import { useCommandSearch } from "../../state/CommandSearchContext";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";
import type { Sport } from "../../data/players";

// Every sport the platform can ever show, in tab order. Sports not yet in
// ENABLED_SPORTS still render here — disabled, with a "SOON" badge — so the nav
// communicates what's coming instead of those tabs just not existing.
const ALL_SPORTS: Sport[] = ["AFL", "WNBA", "NBA", "NRL", "MLB"];

const NAV_LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: "/schedule", label: "Schedule", icon: "calendar" },
  { to: "/top-picks", label: "Top Picks", icon: "target" },
  { to: "/research", label: "Research", icon: "activity" },
];

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { sport, setSport } = useSport();
  const { isPro } = useMembership();
  const { toggle } = useCommandSearch();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-2 sm:gap-4 px-3 sm:px-5 shrink-0"
      style={{ height: "var(--topbar-h)", background: "var(--surface-card)", borderBottom: "1px solid var(--border-hairline)" }}
    >
      <button type="button" onClick={onMenuClick} className="md:hidden cursor-pointer shrink-0" style={{ color: "var(--ink-secondary)" }} aria-label="Open menu">
        <Icon name="menu" size={20} />
      </button>

      <Link to="/" className="flex items-center gap-2 font-extrabold text-base tracking-tight shrink-0" style={{ color: "var(--ink-primary)" }}>
        <img
          src="/logo-mark.png"
          alt="PropsLine"
          className="w-7 h-7 rounded-full shrink-0"
        />
        <span className="hidden sm:inline">
          Props<span style={{ color: "var(--series-1)" }}>Line</span>
        </span>
      </Link>

      <div className="hidden lg:flex items-center gap-1 rounded-full p-1.5" style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" }} role="group" aria-label="Sport">
        {ALL_SPORTS.map((s) => {
          const enabled = ENABLED_SPORTS.includes(s);
          if (enabled) {
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSport(s);
                  // Route to Top Picks rather than to a per-sport "landing player"
                  // (the old `/player/{sport}-p0` convention). Top Picks now reads
                  // `sport` from context directly (see the useSport() filter in
                  // TopPicks.tsx), so it's a real page that actually reflects the
                  // selected sport. The old convention pointed AFL at a stale
                  // synthetic mock id with no real Supabase data -- a permanent
                  // "No tracked props for this player yet" dead end -- while WNBA
                  // happened to still resolve; Top Picks can't go stale that way.
                  if (s !== sport) navigate("/schedule");
                }}
                aria-pressed={sport === s}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold cursor-pointer transition-colors"
                style={{ background: sport === s ? "var(--series-1)" : "transparent", color: sport === s ? "var(--surface-page)" : "var(--ink-secondary)" }}
              >
                <Icon name="activity" size={13} />
                {s}
              </button>
            );
          }
          // Not enabled yet: data layer already supports this sport (see players.ts),
          // but the UI isn't wired for it. Render it visibly rather than hiding it, so
          // people can see what's coming — but keep it inert: no onClick, aria-disabled,
          // and out of tab order so it doesn't read as a broken interactive control.
          return (
            <button
              key={s}
              type="button"
              aria-disabled="true"
              tabIndex={-1}
              title={`${s} — coming soon`}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold cursor-not-allowed select-none"
              style={{ color: "var(--ink-muted)", opacity: 0.5 }}
            >
              <Icon name="activity" size={13} />
              {s}
              <span
                className="text-[9px] font-bold px-1 rounded"
                style={{ background: "var(--surface-active)", color: "var(--ink-muted)" }}
              >
                SOON
              </span>
            </button>
          );
        })}
      </div>

      <nav className="hidden xl:flex items-center gap-1 shrink-0" aria-label="Explore">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold no-underline bg-[var(--surface-sunken)] text-[var(--ink-secondary)] hover:bg-[var(--surface-active)] hover:text-[var(--ink-primary)] transition-colors"
          >
            <Icon name={link.icon} size={13} />
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Command search trigger — the primary way users find a player or tool fast */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Search players and tools"
        className="hidden sm:flex flex-1 max-w-xs items-center gap-2 px-3 h-8 rounded-md text-xs cursor-pointer transition-colors"
        style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)", color: "var(--ink-muted)" }}
      >
        <Icon name="search" size={13} />
        <span className="flex-1 text-left">Search players & tools…</span>
        <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: "var(--surface-active)" }}>
          <Icon name="command" size={9} />K
        </kbd>
      </button>
      <button type="button" onClick={toggle} aria-label="Search" className="sm:hidden ml-auto cursor-pointer" style={{ color: "var(--ink-secondary)" }}>
        <Icon name="search" size={18} />
      </button>

      <div className="ml-auto sm:ml-0 flex items-center gap-2 sm:gap-3 shrink-0">
        {isPro ? (
          <Link
            to="/account"
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: "color-mix(in srgb, var(--status-good) 18%, var(--surface-card))", color: "var(--status-good)" }}
          >
            ✓ <span className="hidden sm:inline">Pro</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer"
            style={{ background: "var(--series-1)", color: "var(--surface-page)" }}
          >
            Go Pro
          </button>
        )}

        <Link to="/account" aria-label="Account" className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full" style={{ background: "var(--surface-sunken)", color: "var(--ink-secondary)" }}>
          <Icon name="user" size={15} />
        </Link>
      </div>
    </header>
  );
}
