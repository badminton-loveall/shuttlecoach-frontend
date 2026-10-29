import React from "react";
import { MailIcon } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { PageHeader } from "../components/sections/PageHeader";
import { DemoForm } from "../components/sections/DemoForm";
import { CONTACT_EMAIL } from "../data/site";

const steps = [
{ title: "We reply", body: "Within two working days, by email, to fix a time that suits your training schedule." },
{ title: "A 30-minute walkthrough", body: "We show LoveAll using batches and routines like yours, and answer every question." },
{ title: "Setup together", body: "If it's a fit, we guide you through setting up your academy and coaches." }];


export function ContactPage() {
  usePageMeta({
    title: "Request a demo",
    description: "Request a LoveAll demo for your badminton academy. We'll walk you through players, training plans, assessments, attendance and fees.",
    path: "/contact"
  });

  return (
    <>
      <PageHeader
        eyebrow="Request a demo"
        title="Let's get you on court."
        lead="Tell us a little about your academy, and we'll set up a walkthrough built around it." />
      
      <section aria-label="Demo request" className="py-16 md:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <DemoForm />
          </div>
          <aside className="lg:col-span-4">
            <h2 className="text-h3 text-fg">What happens next</h2>
            <ol className="mt-6 space-y-6">
              {steps.map((s, i) =>
              <li key={s.title} className="grid grid-cols-[40px_1fr] gap-4">
                  <span className="flex size-10 items-center justify-center rounded-full border border-rule-strong font-display text-[15px] text-fg">
                    <span className="numerals">{["I", "II", "III"][i]}</span>
                  </span>
                  <div>
                    <p className="font-semibold text-fg">{s.title}</p>
                    <p className="mt-1 text-[15px] text-fg-muted">{s.body}</p>
                  </div>
                </li>
              )}
            </ol>
            <div className="rule-double mt-10 pt-6">
              <p className="text-[15px] text-fg-muted">Prefer email?</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-1 inline-flex items-center gap-2 font-semibold text-fg underline decoration-accent underline-offset-[6px] hover:text-primary">
                
                <MailIcon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>);

}