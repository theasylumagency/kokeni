import type { HomeDirectionGroup } from "@/lib/catalog/types";
import type { Dictionary } from "@/utils/getDictionary";

type BlueprintProps = {
  dict: Dictionary;
  directions: HomeDirectionGroup[];
};

type FallbackCategory = {
  title: string;
  items: string[];
};

export default function Blueprint({ dict, directions }: BlueprintProps) {
  const fallbackCategories: FallbackCategory[] = [
    {
      title: dict.blueprint.cat1,
      items: [dict.blueprint.item1_1, dict.blueprint.item1_2, dict.blueprint.item1_3],
    },
    {
      title: dict.blueprint.cat2,
      items: [dict.blueprint.item2_1, dict.blueprint.item2_2, dict.blueprint.item2_3],
    },
    {
      title: dict.blueprint.cat3,
      items: [dict.blueprint.item3_1, dict.blueprint.item3_2, dict.blueprint.item3_3],
    },
  ];

  const renderedCategories =
    directions.length > 0
      ? directions.map((direction) => ({
          key: direction.id,
          title: `${direction.orderLabel}. ${direction.name}`,
          items: direction.categories.map((category) => category.name),
        }))
      : fallbackCategories.map((category, index) => ({
          key: `${category.title}-${index}`,
          title: category.title,
          items: category.items,
        }));

  return (
    <section className="relative flex w-full flex-col overflow-hidden border-t border-text-heavy bg-background-light px-10 py-20 lg:px-16 lg:py-32">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 lg:flex-row lg:gap-32">
        <div className="text-left lg:w-1/3">
          <h2 className="mb-6 font-bold text-3xl uppercase tracking-tighter leading-tight text-text-heavy lg:text-5xl">
            {dict.blueprint.title}
          </h2>
          <p className="max-w-xs font-mono text-sm text-text-main/80">
            {dict.blueprint.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-12 font-mono text-sm uppercase lg:w-2/3">
          {renderedCategories.map((category) => (
            <div key={category.key} className="flex flex-col gap-4">
              <h3 className="border-b border-text-heavy pb-2 font-bold text-text-heavy">
                {category.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {category.items.map((item, index) => (
                  <li
                    key={`${category.key}-${item}-${index}`}
                    className="flex items-end justify-between"
                  >
                    <span>{item}</span>
                    <div className="mx-4 mb-1 flex-grow border-b border-dotted border-text-main/40" />
                    <span className="text-text-main/60">{dict.blueprint.view}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
