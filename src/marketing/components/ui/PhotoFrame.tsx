import { cn } from "../../utils/cn";

interface PhotoFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/** Photograph with warm duotone treatment, film grain and a fine border. */
export function PhotoFrame({ src, alt, width, height, caption, className, imgClassName, priority }: PhotoFrameProps) {
  return (
    <figure className={cn("flex flex-col", className)}>
      <div className="grain overflow-hidden rounded-md border border-rule-strong bg-surface-alt">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn("duotone h-full w-full object-cover", imgClassName)} />
        
      </div>
      {caption &&
      <figcaption className="mt-3 font-display text-[14px] italic text-fg-subtle">{caption}</figcaption>
      }
    </figure>);

}