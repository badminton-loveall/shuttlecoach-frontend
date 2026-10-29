import { SectionHeading } from "../ui/SectionHeading";
import { Eyebrow } from "../ui/Eyebrow";
import { MockScreen } from "../mocks/MockScreen";
import { Reveal } from "../layout/Reveal";
import { productTour } from "../../data/productTour";
import { cn } from "../../utils/cn";

export function ProductTour() {
  return (
    <section aria-labelledby="tour-title" className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          id="tour-title"
          eyebrow="Product tour"
          title="A closer look, court by court."
          align="center" />
        
        <div className="mt-16 space-y-20 md:space-y-28">
          {productTour.map((row, i) => {
            const flip = i % 2 === 1;
            return (
              <article key={row.id} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                <div className={cn("min-w-0 lg:col-span-5", flip && "lg:order-2")}>
                  <Eyebrow>{row.eyebrow}</Eyebrow>
                  <h3 className="mt-3 text-[28px] leading-[1.2] text-fg md:text-h2">{row.title}</h3>
                  <p className="mt-4 text-lead text-fg-muted">{row.body}</p>
                  <ul className="mt-6 divide-y divide-rule border-y border-rule">
                    {row.points.map((p) =>
                    <li key={p} className="flex items-center gap-3 py-2.5 text-[15px] text-fg">
                        <span className="h-px w-4 bg-accent" aria-hidden="true" />
                        {p}
                      </li>
                    )}
                  </ul>
                </div>
                <Reveal className={cn("min-w-0 lg:col-span-7", flip && "lg:order-1")}>
                  <MockScreen mock={row.mock} />
                </Reveal>
              </article>);

          })}
        </div>
      </div>
    </section>);

}