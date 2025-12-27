import { Sparkles, Zap, Globe, Bot, Shield, BarChart3 } from "lucide-react";

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 to-cyan-400/10 blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-400/15 to-teal-400/10 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl animate-pulse-slow" />
      
      {/* Floating Icons */}
      <div className="absolute top-[15%] left-[10%] animate-float">
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <div className="absolute top-[25%] right-[15%] animate-float-delayed">
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <Bot className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
      
      <div className="absolute bottom-[30%] left-[8%] animate-float-slow">
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <Globe className="w-6 h-6 text-teal-400" />
        </div>
      </div>
      
      <div className="absolute bottom-[20%] right-[10%] animate-float" style={{ animationDelay: '1s' }}>
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <Shield className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <div className="absolute top-[60%] right-[25%] animate-float-delayed">
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <Zap className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
      
      <div className="absolute top-[40%] left-[20%] animate-float-slow">
        <div className="p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 shadow-lg">
          <BarChart3 className="w-6 h-6 text-teal-400" />
        </div>
      </div>

      {/* Geometric Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(190 100% 45%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(185 100% 55%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow" />
        <line x1="70%" y1="15%" x2="85%" y2="35%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <line x1="20%" y1="60%" x2="40%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <line x1="60%" y1="70%" x2="80%" y2="90%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </svg>

      {/* Orbiting Dots */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-[300px] h-[300px] animate-spin-slow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400/60" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400/60" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60" />
        </div>
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}

export function HeroOrbs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Main center orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent animate-pulse-glow" />
      
      {/* Top orbs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent blur-3xl animate-blob" />
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-bl from-teal-500/15 to-transparent blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
      
      {/* Bottom orbs */}
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary/15 to-transparent blur-3xl animate-blob" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-cyan-400/10 to-transparent blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
    </div>
  );
}
