import SettingsItem from "@/components/settings/settings-item";
import type { TransformedRow } from "@/lib/types";

export function SettingsList({
  items,
  apiPath,
  getLabel,
  getDescription,
}: {
  items: TransformedRow[];
  apiPath: "sources" | "notifications";
  getLabel: (item: TransformedRow) => string;
  getDescription?: (item: TransformedRow) => string;
}) {
  if (items.length === 0)
    return <p className="text-xs text-muted-foreground text-center py-4">no {apiPath}</p>;
  return (
    <>
      {items.map((item) => (
        <SettingsItem
          key={item.id}
          item={item}
          apiPath={apiPath}
          label={getLabel(item)}
          {...(getDescription?.(item) !== undefined && { description: getDescription(item) })}
        />
      ))}
    </>
  );
}
