import { Link } from "react-router-dom";
import { useState } from "react";
import { 
  Sparkles, Mail, HeadphonesIcon, Share2, GraduationCap, 
  ArrowRight, CheckCircle2, Zap, Shield, BarChart3, 
  Users, MessageSquare, Clock, Star, Building2, School,
  Phone, MapPin, Facebook, Instagram, Linkedin, Twitter,
  ChevronDown, Play, Menu, X, ImagePlus, Palette, FileText,
  Calendar, Bot, Wand2, PenTool, Layers, Globe, Lock,
  RefreshCw, Upload, Crop, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useBranding } from "@/contexts/BrandingContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FloatingElements, HeroOrbs } from "@/components/landing/FloatingElements";
const features = [
  {
    icon: Mail,
    title: "Smart Secretary Agent",
    description: "Email & schedule automation. Convert voice notes to tasks, manage calendars, draft professional emails, and set smart reminders automatically.",
    color: "text-agent-secretary",
    bgColor: "bg-agent-secretary/10",
    learnMore: "#secretary",
    capabilities: ["Voice-to-task conversion", "Calendar management", "Email drafting", "Smart reminders"]
  },
  {
    icon: HeadphonesIcon,
    title: "Customer Support Agent",
    description: "AI-powered support with human fallback. Handle FAQs, manage tickets, analyze sentiment, and escalate complex issues intelligently.",
    color: "text-agent-support",
    bgColor: "bg-agent-support/10",
    learnMore: "#support",
    capabilities: ["Ticket management", "Sentiment analysis", "Knowledge base", "Smart escalation"]
  },
  {
    icon: Share2,
    title: "Social Media Agent",
    description: "AI flyer generation with dual comparison, image editing, content scheduling, and brand consistency across all platforms.",
    color: "text-agent-social",
    bgColor: "bg-agent-social/10",
    learnMore: "#social",
    capabilities: ["AI flyer generator", "Dual design comparison", "Image editor", "Content calendar"]
  },
  {
    icon: GraduationCap,
    title: "Lecturer Assistant Agent",
    description: "Auto quizzes from documents, student performance tracking, feedback generation, and comprehensive reporting.",
    color: "text-agent-lecturer",
    bgColor: "bg-agent-lecturer/10",
    learnMore: "#lecturer",
    capabilities: ["Auto quiz generation", "Performance tracking", "Document analysis", "Report generation"]
  },
];

// Comprehensive feature list for detailed section
const comprehensiveFeatures = {
  socialMedia: [
    { icon: ImagePlus, title: "AI Flyer Generator", description: "Generate professional marketing flyers with AI in seconds" },
    { icon: Layers, title: "Dual Design Comparison", description: "Get 2 flyer variations to choose the best design" },
    { icon: PenTool, title: "Built-in Image Editor", description: "Edit, crop, add text and shapes to customize flyers" },
    { icon: Palette, title: "Style & Color Presets", description: "8 design styles and color schemes to match your brand" },
    { icon: Upload, title: "Reference Image Upload", description: "Upload designs for AI to use as inspiration" },
    { icon: Calendar, title: "Content Calendar", description: "Schedule and manage posts across all platforms" },
    { icon: Globe, title: "Multi-Platform Support", description: "Instagram, Facebook, Twitter, LinkedIn support" },
    { icon: Wand2, title: "AI Content Generation", description: "Generate 300-word engaging posts automatically" },
  ],
  secretary: [
    { icon: MessageSquare, title: "Voice-to-Task", description: "Convert voice recordings into actionable tasks" },
    { icon: Calendar, title: "Calendar Management", description: "Smart scheduling with conflict detection" },
    { icon: Mail, title: "Email Drafting", description: "AI-generated professional email responses" },
    { icon: Clock, title: "Smart Reminders", description: "Context-aware reminder system" },
  ],
  support: [
    { icon: HeadphonesIcon, title: "Ticket Management", description: "Unified inbox for all support channels" },
    { icon: BarChart3, title: "Sentiment Analysis", description: "Real-time customer mood detection" },
    { icon: FileText, title: "Knowledge Base", description: "Self-learning FAQ system" },
    { icon: Users, title: "Smart Escalation", description: "Automatic routing to human agents" },
  ],
  lecturer: [
    { icon: FileText, title: "Document Analysis", description: "Extract content from PDFs and documents" },
    { icon: GraduationCap, title: "Auto Quiz Generation", description: "Create quizzes from lecture materials" },
    { icon: BarChart3, title: "Performance Tracking", description: "Real-time student analytics" },
    { icon: RefreshCw, title: "Report Generation", description: "Comprehensive progress reports" },
  ],
  platform: [
    { icon: Shield, title: "Enterprise Security", description: "SOC2 compliant with end-to-end encryption" },
    { icon: Lock, title: "Role-Based Access", description: "Granular permissions management" },
    { icon: Building2, title: "Multi-Organization", description: "Manage multiple brands/organizations" },
    { icon: Bot, title: "AI-Powered Analytics", description: "Insights and recommendations" },
  ],
};

const useCases = [
  {
    icon: Building2,
    title: "For Businesses",
    description: "Streamline operations and boost productivity",
    points: [
      "Automate customer support 24/7",
      "Reduce response times by 80%",
      "Scale without hiring more staff"
    ]
  },
  {
    icon: School,
    title: "For Schools & Educators",
    description: "Transform teaching and assessment",
    points: [
      "Auto-generate quizzes from lecture notes",
      "Track student performance in real-time",
      "Provide instant feedback on assessments"
    ]
  },
  {
    icon: HeadphonesIcon,
    title: "For Support Teams",
    description: "Deliver exceptional customer service",
    points: [
      "AI handles routine inquiries",
      "Smart escalation to human agents",
      "Multi-channel unified inbox"
    ]
  }
];

const testimonials = [
  {
    quote: "AI Smart Work Assistant reduced our customer response time by 80%. It's like having a full support team working 24/7.",
    author: "Sarah Chen",
    role: "Head of Support",
    company: "TechFlow Inc",
    avatar: "SC",
    rating: 5
  },
  {
    quote: "The lecturer assistant saved me hours every week on quiz creation and grading. My students love the instant feedback.",
    author: "Dr. Michael Roberts",
    role: "Professor",
    company: "State University",
    avatar: "MR",
    rating: 5
  },
  {
    quote: "Our social media engagement increased 150% after implementing the AI Social Media Agent. Game changer!",
    author: "Jessica Martinez",
    role: "Marketing Director",
    company: "BrandCo",
    avatar: "JM",
    rating: 5
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for trying out",
    features: [
      "1 AI agent",
      "100 messages/month",
      "Basic support",
      "1 team member"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Basic",
    price: 29,
    description: "For small teams",
    features: [
      "2 AI agents",
      "1,000 messages/month",
      "Email support",
      "5 team members"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Pro",
    price: 79,
    description: "For growing businesses",
    features: [
      "All 4 AI agents",
      "10,000 messages/month",
      "Priority support",
      "Unlimited team members",
      "Advanced analytics"
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: null,
    description: "For large organizations",
    features: [
      "Unlimited AI agents",
      "Unlimited messages",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const faqs = [
  {
    question: "Is my data secure with AI Smart Work Assistant?",
    answer: "Absolutely. We use end-to-end encryption, are SOC2 compliant, and never share your data with third parties. All data is stored in secure, enterprise-grade infrastructure with daily backups."
  },
  {
    question: "How accurate is the AI? What about human fallback?",
    answer: "Our AI achieves 95%+ accuracy on routine tasks. For complex queries, the system automatically escalates to human agents, ensuring nothing falls through the cracks."
  },
  {
    question: "What are the pricing and plan limits?",
    answer: "We offer flexible plans from Free to Enterprise. Each plan includes different message limits and agent access. You can upgrade anytime, and we'll notify you before reaching limits."
  },
  {
    question: "What integrations are available?",
    answer: "We integrate with WhatsApp, Gmail, social media platforms (Facebook, Instagram, LinkedIn, Twitter), calendar apps, and more. API access is available on Pro and Enterprise plans."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes! You can cancel anytime. When you cancel, you'll continue to have access until the end of your billing period. No hidden fees or cancellation penalties."
  },
  {
    question: "Do you offer discounts for nonprofits or education?",
    answer: "Yes! We offer special pricing for nonprofit organizations and educational institutions. Contact our sales team for more information about our discount programs."
  },
  {
    question: "How long is the free trial?",
    answer: "All paid plans include a 14-day free trial with full access to features. No credit card required to start your trial."
  }
];

const companyLogos = [
  "TechFlow", "BrandCo", "EduPlus", "StartupXYZ", "GlobalCorp", "InnovateCo"
];

const team = [
  {
    name: "Alex Johnson",
    role: "CEO & Co-Founder",
    avatar: "AJ"
  },
  {
    name: "Maria Garcia",
    role: "CTO & Co-Founder",
    avatar: "MG"
  },
  {
    name: "David Lee",
    role: "Head of AI",
    avatar: "DL"
  }
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { branding } = useBranding();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <>
                  {/* Desktop Logo */}
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.platformName} 
                    className="hidden sm:block w-10 h-10 rounded-xl object-contain"
                  />
                  {/* Mobile Logo - Smaller */}
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.platformName} 
                    className="sm:hidden w-8 h-8 rounded-lg object-contain"
                  />
                </>
              ) : (
                <>
                  {/* Desktop Fallback */}
                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-primary/20 items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  {/* Mobile Fallback */}
                  <div className="sm:hidden w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                </>
              )}
              {/* Desktop: Full name, Mobile: Abbreviated */}
              <span className="hidden sm:inline text-xl font-bold text-foreground">{branding.platformName}</span>
              <span className="sm:hidden text-lg font-bold text-foreground">
                {branding.platformName.split(' ').map(w => w[0]).join('').slice(0, 4)}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </button>
              <ThemeToggle />
              <Link to="/auth">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started Free</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Link to="/auth">
                <Button size="sm">Get Started</Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-3">
                <button onClick={() => scrollToSection('features')} className="text-left text-muted-foreground hover:text-foreground transition-colors py-2">
                  Features
                </button>
                <button onClick={() => scrollToSection('pricing')} className="text-left text-muted-foreground hover:text-foreground transition-colors py-2">
                  Pricing
                </button>
                <button onClick={() => scrollToSection('testimonials')} className="text-left text-muted-foreground hover:text-foreground transition-colors py-2">
                  Testimonials
                </button>
                <button onClick={() => scrollToSection('faq')} className="text-left text-muted-foreground hover:text-foreground transition-colors py-2">
                  FAQ
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-left text-muted-foreground hover:text-foreground transition-colors py-2">
                  Contact
                </button>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 1️⃣ Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Futuristic Floating Elements */}
        <FloatingElements />
        <HeroOrbs />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-slide-up">
            4 AI Agents.
            <br />
            <span className="gradient-text-hero">
              One Smart Work Platform.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {branding.tagline || "Save time, automate work, and manage your business smarter with AI-powered assistants for secretarial tasks, customer support, social media, and education."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8 text-lg glow-primary">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 text-lg gap-2 backdrop-blur-sm">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            No credit card required · Free 14-day trial · Cancel anytime
          </p>
        </div>
      </section>

      {/* 2️⃣ Features / Solutions Section */}
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
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="glass border-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  
                  {/* Capability Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {feature.capabilities?.map((cap, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {cap}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => scrollToSection(feature.learnMore.replace('#', ''))}
                    className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Features Breakdown */}
      <section id="all-features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the full range of features powering each AI agent
            </p>
          </div>

          {/* Social Media Agent Features - Highlighted */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-agent-social/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-agent-social" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Social Media Agent</h3>
                <p className="text-muted-foreground">AI-Powered Content Creation & Management</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comprehensiveFeatures.socialMedia.map((item, idx) => (
                <Card key={idx} className="glass border-0 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-agent-social/10 flex items-center justify-center mb-3">
                      <item.icon className="w-5 h-5 text-agent-social" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Other Agent Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Secretary Features */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-agent-secretary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-agent-secretary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Secretary Agent</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comprehensiveFeatures.secretary.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <item.icon className="w-5 h-5 text-agent-secretary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Features */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-agent-support/10 flex items-center justify-center">
                  <HeadphonesIcon className="w-5 h-5 text-agent-support" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Support Agent</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comprehensiveFeatures.support.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <item.icon className="w-5 h-5 text-agent-support flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lecturer Features */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-agent-lecturer/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-agent-lecturer" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Lecturer Agent</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comprehensiveFeatures.lecturer.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <item.icon className="w-5 h-5 text-agent-lecturer flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Features */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Platform Features</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {comprehensiveFeatures.platform.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <item.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3️⃣ Use Cases / Audience Section */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for Every Industry
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how AI Smart Work Assistant solves challenges across different sectors.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase) => (
              <Card key={useCase.title} className="glass border-0 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <useCase.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-4">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4️⃣ Testimonials / Social Proof Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Loved by Teams Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how AI Smart Work Assistant is transforming productivity for businesses of all sizes.
            </p>
          </div>

          {/* Company Logos */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {companyLogos.map((logo) => (
              <div 
                key={logo} 
                className="px-6 py-3 bg-background/50 rounded-lg text-muted-foreground font-semibold"
              >
                {logo}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="glass border-0">
                <CardContent className="p-6">
                  {/* Star Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5️⃣ Pricing / Plans Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your team. All plans include a 14-day free trial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary shadow-xl scale-105' : 'glass border-0'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            All prices in USD. Yearly billing available with 17% discount.{" "}
            <Link to="/pricing" className="text-primary hover:underline">View full comparison →</Link>
          </p>
        </div>
      </section>

      {/* 6️⃣ CTA / Signup Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Start using AI Smart Work Assistant today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of teams already automating their work with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-6">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            No credit card required · Setup in 2 minutes
          </p>
          
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

      {/* 7️⃣ FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 8️⃣ About / Company Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe everyone deserves access to powerful AI tools that enhance productivity without complexity. 
                Our mission is to democratize AI for businesses of all sizes, making automation accessible, 
                affordable, and easy to use.
              </p>
              <p className="text-muted-foreground mb-8">
                Founded in 2024, AI Smart Work Assistant has helped thousands of teams automate their workflows, 
                save countless hours, and focus on what truly matters — growing their business and serving their customers.
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">5M+</div>
                  <div className="text-sm text-muted-foreground">Messages Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6">Leadership Team</h3>
              <div className="grid grid-cols-3 gap-6">
                {team.map((member) => (
                  <div key={member.name} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg mx-auto mb-3">
                      {member.avatar}
                    </div>
                    <p className="font-semibold text-foreground text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9️⃣ Footer Section */}
      <footer id="contact" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                {branding.logoUrl ? (
                  <img 
                    src={branding.logoUrl} 
                    alt={branding.platformName} 
                    className="w-10 h-10 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                )}
                <span className="text-xl font-bold text-foreground">{branding.platformName}</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                {branding.tagline || "Your AI-powered work assistant platform. Automate tasks, boost productivity, and grow your business smarter."}
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Pricing
                  </button>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>support@aismartwork.com</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>123 AI Street, Tech City, TC 12345</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Mon-Fri: 9AM - 6PM EST</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {branding.platformName}. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
