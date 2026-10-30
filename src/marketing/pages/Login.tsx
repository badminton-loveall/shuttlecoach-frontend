import { ArrowUpRightIcon } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Crest } from "../components/brand/Crest";
import { CourtLines } from "../components/brand/CourtLines";
import { Button } from "../components/ui/Button";
import { APP_URL } from "../data/site";

export function LoginPage() {
  usePageMeta({
    title: "Log in",
    description: "Log in to the LoveAll app for head coaches, assistant coaches, students and parents.",
    path: "/login"
  });

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <CourtLines className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[920px] -translate-x-1/2 -translate-y-1/2 text-rule opacity-80" />
      <div className="container-page relative">
        <div className="mx-auto max-w-md rounded-lg border border-rule-strong bg-surface p-8 text-center shadow-soft-1 md:p-10">
          <Crest size={64} className="mx-auto text-fg" />
          <h1 className="mt-6 text-[32px] leading-[1.15] text-fg">Log in to LoveAll</h1>
          <p className="mt-3 text-fg-muted">
            LoveAll runs in your browser. Continue to the app to sign in with your academy account.
          </p>
          <Button href={APP_URL} size="lg" className="mt-8 w-full">
            Continue to loveall.co.in
            <ArrowUpRightIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </Button>
          <p className="mt-6 border-t border-rule pt-6 text-[15px] text-fg-muted">
            Coaches, students and parents: use the login details your academy shared with you.
          </p>
          <p className="mt-4 text-[15px] text-fg-muted">
            New academy?{" "}
            <Button to="/contact" variant="tertiary">
              Request a demo
            </Button>
          </p>
        </div>
      </div>
    </section>);

}