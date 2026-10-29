import React, { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { sports } from "../../data/sports";

type Status = "idle" | "submitting" | "success";

const options = sports.filter((s) => s.status === "soon").map((s) => ({ value: s.id, label: s.name }));

export function NotifyForm() {
  const [email, setEmail] = useState("");
  const [sport, setSport] = useState("");
  const [errors, setErrors] = useState<{email?: string;sport?: string;}>({});
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: {email?: string;sport?: string;} = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Please enter a valid email address.";
    if (!sport) next.sport = "Please choose a sport.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus("submitting");
    // Replace with your list provider endpoint.
    await new Promise((r) => setTimeout(r, 700));
    setStatus("success");
  };

  if (status === "success") {
    const name = options.find((o) => o.value === sport)?.label ?? "your sport";
    return (
      <div role="status" className="rounded-lg border border-rule bg-surface p-6 md:p-8">
        <p className="font-display text-h3 text-fg">You're on the list.</p>
        <p className="mt-2 text-fg-muted">
          We'll email {email} when {name} goes live on LoveAll. No other mail.
        </p>
      </div>);

  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-lg border border-rule bg-surface p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-[1fr_220px_auto] md:items-start">
        <Field label="Email" name="notify-email" type="email" value={email} onChange={setEmail} error={errors.email} required autoComplete="email" />
        <Field label="Sport" name="notify-sport" as="select" options={options} placeholder="Choose a sport" value={sport} onChange={setSport} error={errors.sport} required />
        <Button type="submit" className="md:mt-[30px]" disabled={status === "submitting"}>
          {status === "submitting" && <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />}
          Notify me
        </Button>
      </div>
    </form>);

}