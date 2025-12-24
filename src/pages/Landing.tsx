import { Link } from "react-router-dom";
import { 
  Sparkles, Mail, HeadphonesIcon, Share2, GraduationCap, 
  ArrowRight, CheckCircle2, Zap, Shield, BarChart3, 
  Users, MessageSquare, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Mail,
    title: "AI Smart Secretary",
    description: "Automate emails, schedule meetings, and convert voice notes to actionable tasks. Your 24/7 personal assistant.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: HeadphonesIcon,
    title: "AI Customer Support",
    description: "Answer FAQs, handle tickets, and intelligently escalate complex issues. Multi-channel support made easy.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: Share2,
    title: "AI Social Media Agent",
    description: "Generate posts, manage content calendars, and engage with your audience automatically with brand-consistent messaging.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: GraduationCap,
    title: "AI Lecturer Assistant",
    description: "Generate quizzes from lecture notes, auto-grade tests, and track student performance with AI-powered insights.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const benefits = [
  { icon: Zap, title: "10x Productivity", description: "Automate repetitive tasks and focus on what matters" },
  { icon: Clock, title: "24/7 Availability", description: "Your AI workforce never sleeps" },
  { icon: Shield, title: "Enterprise Security", description: "SOC2 compliant with end-to-end encryption" },
  { icon: BarChart3, title: "Smart Analytics", description: "Data-driven insights to optimize performance" },
  { icon: Users, title: "Team Collaboration", description: "Multi-user support with role-based access" },
  { icon: MessageSquare, title: "Multi-Channel", description: "Unified inbox across all channels" },
];

const testimonials = [
  {
    quote: "AI Work Assistant reduced our customer response time by 80%. It's like having a full support team working 24/7.",
    author: "Sarah Chen",
    role: "Head of Support, TechFlow Inc",
    avatar: "SC",
  },
  {
    quote: "The lecturer assistant saved me hours every week on quiz creation and grading. My students love the instant feedback.",
    author: "Dr. Michael Roberts",
    role: "Professor, State University",
    avatar: "MR",
  },
  {
    quote: "Our social media engagement increased 150% after implementing the AI Social Media Agent. Game changer!",
    author: "Jessica Martinez",
    role: "Marketing Director, BrandCo",
    avatar: "JM",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">AI Work Assistant</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started Free</Button>
              </Link>
            </div>
            <div className="md:hidden">
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your AI-Powered
            <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Work Assistant
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Automate your work with 4 specialized AI agents: Smart Secretary, Customer Support, 
            Social Media Manager, and Lecturer Assistant. One platform, endless possibilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8">
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required · Free 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              4 AI Agents, One Powerful Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each agent is specialized for specific tasks, working together to transform your productivity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="glass border-0 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Teams Choose AI Work Assistant
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for modern teams that demand efficiency, security, and scalability.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how AI Work Assistant is transforming productivity for businesses of all sizes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="glass border-0">
                <CardContent className="p-6">
                  <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of teams already using AI Work Assistant to automate their work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8">
                Compare Plans
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">AI Work Assistant</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 AI Work Assistant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
