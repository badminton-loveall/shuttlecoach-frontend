import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "tertiary" | "inverse";
type Size = "sm" | "md" | "lg";
type DemoState = "hover" | "focus" | "active";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Style-guide only: render a state statically. */
  demoState?: DemoState;
  className?: string;
  children: React.ReactNode;
}

type AsButton = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & {to?: undefined;href?: undefined;};
type AsRouterLink = CommonProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {to: string;href?: undefined;};
type AsAnchor = CommonProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & {href: string;to?: undefined;};

export type ButtonProps = AsButton | AsRouterLink | AsAnchor;

const baseClasses =
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans font-semibold transition-[background-color,border-color,color,text-decoration-color,transform] duration-150 ease-classic active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variantClasses: Record<Variant, string> = {
  primary: "border border-primary bg-primary text-on-primary hover:border-primary-hover hover:bg-primary-hover",
  secondary: "border border-rule-strong bg-transparent text-fg hover:border-fg hover:bg-surface",
  tertiary:
  "rounded-sm text-fg underline decoration-accent decoration-1 underline-offset-[6px] hover:text-primary hover:decoration-2",
  inverse: "border border-on-court bg-on-court text-court hover:bg-transparent hover:text-on-court"
};

const demoClasses: Record<Variant, Record<DemoState, string>> = {
  primary: {
    hover: "border-primary-hover bg-primary-hover",
    focus: "outline-2 outline-offset-[3px] outline-focus outline-solid",
    active: "translate-y-px bg-primary-hover"
  },
  secondary: {
    hover: "border-fg bg-surface",
    focus: "outline-2 outline-offset-[3px] outline-focus outline-solid",
    active: "translate-y-px border-fg bg-surface-alt"
  },
  tertiary: {
    hover: "text-primary decoration-2",
    focus: "outline-2 outline-offset-[3px] outline-focus outline-solid",
    active: "translate-y-px text-primary"
  },
  inverse: {
    hover: "bg-transparent text-on-court",
    focus: "outline-2 outline-offset-[3px] outline-lime outline-solid",
    active: "translate-y-px"
  }
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-base"
};

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", demoState, className, children } = props;
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    variant === "tertiary" ? "h-auto px-0 text-[15px]" : sizeClasses[size],
    demoState && demoClasses[variant][demoState],
    className
  );

  if (props.to !== undefined) {
    const { variant: _v, size: _s, demoState: _d, className: _c, children: _ch, to, ...rest } = props;
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>);

  }
  if (props.href !== undefined) {
    const { variant: _v, size: _s, demoState: _d, className: _c, children: _ch, href, ...rest } = props as AsAnchor;
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>);

  }
  const { variant: _v, size: _s, demoState: _d, className: _c, children: _ch, type, ...rest } = props as AsButton;
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>);

}