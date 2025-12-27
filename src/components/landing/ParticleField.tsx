import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const colors = [
      "rgba(0, 180, 216, ",  // cyan
      "rgba(72, 202, 228, ", // light cyan
      "rgba(0, 150, 199, ", // medium blue
      "rgba(144, 224, 239, ", // very light cyan
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticles = () => {
      const numParticles = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 15000);
      particles = [];

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const drawParticle = (p: Particle) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ")";
      ctx.fill();
    };

    const drawConnections = () => {
      const maxDistance = 120;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 180, 216, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const updateParticles = () => {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;

        // Keep particles in bounds
        p.x = Math.max(0, Math.min(canvas.offsetWidth, p.x));
        p.y = Math.max(0, Math.min(canvas.offsetHeight, p.y));
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      drawConnections();
      particles.forEach(drawParticle);
      updateParticles();

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

export function GlowingOrb({ 
  className, 
  size = 400, 
  color = "primary",
  delay = 0 
}: { 
  className?: string; 
  size?: number; 
  color?: "primary" | "cyan" | "teal";
  delay?: number;
}) {
  const colorClasses = {
    primary: "from-primary/30 to-primary/5",
    cyan: "from-cyan-400/25 to-cyan-400/5",
    teal: "from-teal-400/20 to-teal-400/5",
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-radial ${colorClasses[color]} blur-3xl animate-pulse-glow ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

export function FloatingGlobe() {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-30 pointer-events-none hidden lg:block">
      {/* Globe rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] h-[400px] rounded-full border border-primary/20 animate-spin-slow" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[300px] h-[300px] rounded-full border border-cyan-400/30 animate-spin-slow"
          style={{ animationDirection: "reverse", animationDuration: "25s" }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[500px] h-[500px] rounded-full border border-teal-400/15 animate-spin-slow"
          style={{ animationDuration: "30s" }}
        />
      </div>
      
      {/* Orbiting dots */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[400px] h-[400px] animate-spin-slow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative w-[300px] h-[300px] animate-spin-slow"
          style={{ animationDirection: "reverse", animationDuration: "18s" }}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal-400 shadow-lg shadow-teal-400/50" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
        </div>
      </div>

      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[200px] h-[200px] rounded-full bg-gradient-radial from-primary/20 via-primary/5 to-transparent animate-pulse-glow" />
      </div>
    </div>
  );
}
