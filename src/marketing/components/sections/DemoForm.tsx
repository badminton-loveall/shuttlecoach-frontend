import { useState } from "react";
import { LoaderCircleIcon, MessageCircleIcon } from "lucide-react";
import { Field } from "../ui/Field";
import { Button } from "../ui/Button";
import { Crest } from "../brand/Crest";
import { CONTACT_EMAIL, whatsappUrl } from "../../data/site";
import { submitLead } from "../../utils/leads";
import { Honeypot } from "../ui/Honeypot";

type Status = "idle" | "submitting" | "success" | "error";

interface FormState {
  name: string;
  email: string;
  phone: string;
  academy: string;
  city: string;
  role: string;
  size: string;
  message: string;
}

const initial: FormState = { name: "", email: "", phone: "", academy: "", city: "", role: "", size: "", message: "" };

const roleOptions = [
{ value: "owner", label: "Academy owner" },
{ value: "head-coach", label: "Head coach" },
{ value: "assistant-coach", label: "Assistant coach" },
{ value: "parent", label: "Parent or student" }];


const sizeOptions = [
{ value: "1-50", label: "Up to 50 players" },
{ value: "51-150", label: "51–150 players" },
{ value: "151-400", label: "151–400 players" },
{ value: "400+", label: "More than 400 players" }];


/** The visitor's details, pre-typed into a WhatsApp message to LoveAll. */
function demoWhatsAppText(form: FormState): string {
  const role = roleOptions.find((o) => o.value === form.role)?.label;
  const size = sizeOptions.find((o) => o.value === form.size)?.label;
  return [
  `Hi LoveAll, I've just requested a demo.`,
  `Name: ${form.name.trim()}`,
  `Academy: ${form.academy.trim()}`,
  form.city.trim() && `City: ${form.city.trim()}`,
  form.phone.trim() && `Phone: ${form.phone.trim()}`,
  `Email: ${form.email.trim()}`,
  role && `Role: ${role}`,
  size && `Academy size: ${size}`,
  form.message.trim() && `Would like to see: ${form.message.trim()}`].
  filter(Boolean).join("\n");
}

export function DemoForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [honeypot, setHoneypot] = useState("");

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Please enter a valid email address.";
    if (form.phone && !/^[+\d\s-]{8,16}$/.test(form.phone)) next.phone = "Please enter a valid phone number.";
    if (!form.academy.trim()) next.academy = "Please enter your academy's name.";
    if (!form.role) next.role = "Please choose your role.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      await submitLead({
        kind: "DEMO_REQUEST",
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        academy: form.academy.trim(),
        city: form.city.trim(),
        role: form.role,
        size: form.size,
        message: form.message.trim(),
        website: honeypot
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div role="status" className="flex flex-col items-start rounded-lg border border-rule bg-surface p-8 md:p-10">
        <Crest size={56} className="text-fg" />
        <h2 className="mt-6 text-h3 text-fg">Request received. Game on.</h2>
        <p className="mt-3 text-fg-muted">
          Thank you, {form.name.split(" ")[0]}. We've emailed a confirmation to {form.email} and will write within two working
          days to fix a time for your demo.
        </p>
        <Button href={whatsappUrl(demoWhatsAppText(form))} target="_blank" rel="noreferrer" variant="secondary" className="mt-6">
          <MessageCircleIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Send these details on WhatsApp too
        </Button>
        <Button
          variant="tertiary"
          className="mt-6"
          onClick={() => {
            setForm(initial);
            setStatus("idle");
          }}>
          
          Send another request
        </Button>
      </div>);

  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative rounded-lg border border-rule bg-surface p-6 md:p-10">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" value={form.name} onChange={set("name")} required error={errors.name} autoComplete="name" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={set("email")} required error={errors.email} autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} hint="Optional. We'll only call to schedule." autoComplete="tel" />
        <Field label="Academy name" name="academy" value={form.academy} onChange={set("academy")} required error={errors.academy} autoComplete="organization" />
        <Field label="City" name="city" value={form.city} onChange={set("city")} autoComplete="address-level2" />
        <Field label="Your role" name="role" as="select" options={roleOptions} placeholder="Choose a role" value={form.role} onChange={set("role")} required error={errors.role} />
        <Field label="Academy size" name="size" as="select" options={sizeOptions} placeholder="Number of players" value={form.size} onChange={set("size")} className="sm:col-span-2" />
        <Field label="What would you like to see?" name="message" as="textarea" value={form.message} onChange={set("message")} placeholder="e.g. how assessments work for our U-13 batches" className="sm:col-span-2" />
      </div>

      {status === "error" &&
      <p role="alert" className="mt-6 rounded-md bg-danger-bg px-4 py-3 text-[15px] text-danger">
          We couldn't send your request. Please try again, or email us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      }

      <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-fg-subtle">We use your details only to arrange your demo.</p>
        <Button type="submit" size="lg" disabled={status === "submitting"}>
          {status === "submitting" && <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />}
          {status === "submitting" ? "Sending…" : "Request a demo"}
        </Button>
      </div>
    </form>);

}