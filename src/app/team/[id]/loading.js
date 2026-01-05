export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-full"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>
  );
}
