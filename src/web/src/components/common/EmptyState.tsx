interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export function EmptyState({
  message = "Hech narsa topilmadi",
  icon = "📭",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
