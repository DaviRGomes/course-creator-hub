import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  icon: LucideIcon;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, message = "Nenhum item encontrado.", actionLabel, onAction }: Props) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <Icon className="h-12 w-12 mb-4 opacity-40" />
    <p className="text-sm mb-4">{message}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm">
        <Plus className="h-4 w-4" /> {actionLabel}
      </Button>
    )}
  </div>
);
