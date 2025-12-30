import { Trophy, TrendingUp, Users } from 'lucide-react';

const HeroHeader = () => {
  return (
    <header className="relative overflow-hidden hero-gradient border-b border-border/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full" />

      <div className="container relative z-10 py-12 md:py-16 mx-auto">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 animate-fade-in">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Season 2024-25</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight animate-slide-up">
            <span className="text-foreground">FANTASY </span>
            <span className="text-gradient">EUROLEAGUE</span>
          </h1>

          <p
            className="text-muted-foreground text-lg max-w-xl animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Track your league standings, player performances, and weekly matchups.
          </p>

          <div
            className="flex flex-wrap justify-center gap-8 mt-4 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">12 Teams</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Round 18</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Playoffs in 4 weeks</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroHeader;
