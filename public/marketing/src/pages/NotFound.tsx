import React from "react";
import { usePageMeta } from "../hooks/usePageMeta";
import { Button } from "../components/ui/Button";
import { ScoreTile } from "../components/ui/ScoreTile";

export function NotFoundPage() {
  usePageMeta({ title: "Page not found", description: "This page is out of court.", path: "/404" });
  return (
    <section className="py-24 md:py-32">
      <div className="container-page grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow text-accent-ink">Error 404</p>
          <h1 className="mt-3 text-[40px] leading-[1.1] text-fg md:text-h1">That one landed out of court.</h1>
          <p className="mt-4 text-lead text-fg-muted">The page you were looking for doesn't exist or has moved.</p>
          <Button to="/" className="mt-8">
            Back to the home page
          </Button>
        </div>
        <ScoreTile label="Line call" value="404" caption="Out. Replay the point from the home page." className="w-full max-w-sm md:justify-self-end" />
      </div>
    </section>);

}