import { Link } from "react-router-dom";
import { Logo } from "../brand/Logo";
import { footerNav } from "../../data/nav";
import { CONTACT_EMAIL, nameLine, socialLinks, whatsappUrl } from "../../data/site";

export function Footer() {
  return (
    <footer className="rule-double mt-0 bg-surface-alt">
      <div className="container-page py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo size="md" />
            <p className="mt-5 max-w-sm font-display text-[17px] italic leading-relaxed text-fg-muted">{nameLine}</p>
          </div>

          {footerNav.map((group) =>
          <nav key={group.heading} aria-label={group.heading} className="md:col-span-2">
              <h2 className="eyebrow font-sans text-fg-subtle">{group.heading}</h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) =>
              <li key={link.to}>
                    <Link to={link.to} className="text-[15px] text-fg-muted transition-colors duration-150 hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
              )}
              </ul>
            </nav>
          )}

          <div className="md:col-span-3">
            <h2 className="eyebrow font-sans text-fg-subtle">Contact</h2>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-fg-muted hover:text-fg">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg">
                  WhatsApp
                </a>
              </li>
              <li className="text-fg-muted">Made in India</li>
              {socialLinks.map((s) =>
              <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="text-fg-muted hover:text-fg">
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-rule pt-6 text-[13px] text-fg-subtle md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} LoveAll · loveall.co.in</p>
          <p className="font-display text-[14px] italic">Made for the love of the game.</p>
        </div>
      </div>
    </footer>);

}