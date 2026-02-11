export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
      <p className="animate-pulse text-sm font-medium text-muted-foreground">
        Cargando estadísticas...
      </p>
    </div>
  );
}
