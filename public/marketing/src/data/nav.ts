import type { NavItem } from "../types/content";

export const mainNav: NavItem[] = [
{ label: "Features", to: "/features" },
{ label: "Who it's for", to: "/roles" },
{ label: "Sports", to: "/sports" },
{ label: "Pricing", to: "/pricing" },
{ label: "About", to: "/about" }];


export const footerNav: {heading: string;links: NavItem[];}[] = [
{
  heading: "Product",
  links: [
  { label: "Features", to: "/features" },
  { label: "Who it's for", to: "/roles" },
  { label: "Sports", to: "/sports" },
  { label: "Pricing", to: "/pricing" }]

},
{
  heading: "Academy",
  links: [
  { label: "About LoveAll", to: "/about" },
  { label: "Request a demo", to: "/contact" },
  { label: "Log in", to: "/login" },
  { label: "Design system", to: "/style-guide" }]

}];