import { Button, Input, Panel, StatusDot } from "@/components/ui/ui";

function ListItem({ children }: { children: React.ReactNode }) {
  return <Panel className="space-y-2 py-2.5">{children}</Panel>;
}

function EnabledStatus({ enabled }: { enabled: boolean }) {
  return (
    <StatusDot tone={enabled ? "ok" : "idle"}>{enabled ? "● enabled" : "○ disabled"}</StatusDot>
  );
}

/** One toggleable, deletable resource. Both settings lists are this shape. */
export function ResourceRow({
  title,
  meta,
  enabled,
  pending,
  onToggle,
  onDelete,
  children,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  enabled: boolean;
  pending: boolean;
  onToggle: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}) {
  return (
    <ListItem>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-medium text-sm">{title}</p>
          <div className="flex items-center gap-2">
            <EnabledStatus enabled={enabled} />
            {meta}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="xs" variant="outline" disabled={pending} onClick={onToggle}>
            {enabled ? "disable" : "enable"}
          </Button>
          <Button size="xs" variant="ghost" disabled={pending} onClick={onDelete}>
            delete
          </Button>
        </div>
      </div>
      {children}
    </ListItem>
  );
}

export function ResourceList({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 border-border border-t pt-3">{children}</div>;
}

/** `onSubmit` is the parent's async action, which clears the field itself
 *  once the write succeeds. */
export function AddResourceForm({
  id,
  label,
  placeholder,
  submitLabel,
  value,
  onValueChange,
  onSubmit,
  pending,
  disabled,
  inputType = "text",
  hint,
}: {
  id: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  disabled: boolean;
  inputType?: React.HTMLInputTypeAttribute;
  hint?: React.ReactNode;
}) {
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />
      {hint}
      <Button type="submit" isLoading={pending} loadingText="adding..." disabled={disabled}>
        {submitLabel}
      </Button>
    </form>
  );
}
