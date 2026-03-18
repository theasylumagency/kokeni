export default function Blueprint({ dict }: { dict: any }) {
  return (
    <section className="relative flex flex-col w-full border-t border-text-heavy px-10 py-20 lg:px-16 lg:py-32 bg-background-light overflow-hidden">
      {/* Background Grid handled globally, but we can add specific layer if needed */}
      
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 lg:gap-32">
        <div className="lg:w-1/3 text-left">
          <h2 className="font-bold text-3xl lg:text-5xl uppercase tracking-tighter leading-tight text-text-heavy mb-6">
            {dict.blueprint.title}
          </h2>
          <p className="font-mono text-sm max-w-xs text-text-main/80">
            {dict.blueprint.subtitle}
          </p>
        </div>

        <div className="lg:w-2/3 flex flex-col gap-12 font-mono text-sm uppercase">
          {/* Category 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-text-heavy border-b border-text-heavy pb-2">{dict.blueprint.cat1}</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item1_1}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item1_2}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item1_3}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
            </ul>
          </div>

          {/* Category 2 */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-text-heavy border-b border-text-heavy pb-2">{dict.blueprint.cat2}</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item2_1}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item2_2}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item2_3}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
            </ul>
          </div>
          
          {/* Category 3 */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-text-heavy border-b border-text-heavy pb-2">{dict.blueprint.cat3}</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item3_1}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item3_2}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
              <li className="flex justify-between items-end group cursor-pointer">
                <span>{dict.blueprint.item3_3}</span>
                <div className="flex-grow border-b border-dotted border-text-main/40 mx-4 mb-1 group-hover:border-primary transition-colors"></div>
                <span className="text-text-main/60 group-hover:text-primary transition-colors">{dict.blueprint.view}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
