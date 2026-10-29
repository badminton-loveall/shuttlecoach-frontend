import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MenuIcon, XIcon } from "lucide-react";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { mainNav } from "../../data/nav";
import { cn } from "../../utils/cn";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const { isAuthenticated, role } = useAuth();
  const dashboardPath = role === "STUDENT" ? "/student-dashboard" : role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-canvas">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link to="/" aria-label="LoveAll, home" className="rounded-sm">
          <Logo size="sm" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {mainNav.map((item) =>
            <li key={item.to}>
                <NavLink
                to={item.to}
                className={({ isActive }) =>
                cn(
                  "border-b py-1.5 text-[15px] font-medium transition-[color,border-color] duration-150",
                  isActive ? "border-accent text-fg" : "border-transparent text-fg-muted hover:text-fg"
                )
                }>
                
                  {item.label}
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button size="sm" to={dashboardPath} className="hidden sm:inline-flex">
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="tertiary" to="/login" className="hidden md:inline-flex">
                Log in
              </Button>
              <Button size="sm" to="/contact" className="hidden sm:inline-flex">
                Request a demo
              </Button>
            </>
          )}
          <button
            ref={toggleRef}
            type="button"
            className="flex size-10 items-center justify-center rounded-md text-fg hover:bg-surface-alt lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}>
            
            {open ? <XIcon className="size-5" strokeWidth={1.5} /> : <MenuIcon className="size-5" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open &&
        <motion.div
          id="mobile-menu"
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-rule bg-canvas lg:hidden">
          
            <nav aria-label="Mobile" className="container-page py-6">
              <ul className="divide-y divide-rule border-y border-rule">
                {[{ label: "Home", to: "/" }, ...mainNav].map((item, i) =>
              <li key={item.to}>
                    <NavLink
                  ref={i === 0 ? firstLinkRef : undefined}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                  cn("flex items-center justify-between py-4 font-display text-[22px]", isActive ? "text-primary" : "text-fg")
                  }>
                  
                      {item.label}
                    </NavLink>
                  </li>
              )}
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                {isAuthenticated ? (
                  <Button to={dashboardPath} size="lg">
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button to="/contact" size="lg">
                      Request a demo
                    </Button>
                    <Button to="/login" variant="secondary" size="lg">
                      Log in
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

}