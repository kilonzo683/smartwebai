import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/landing" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">AI Work Assistant</span>
            </Link>
            <Link to="/landing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground">Last updated: December 2024</p>
            </div>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using AI Work Assistant ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                AI Work Assistant provides AI-powered productivity tools including a Smart Secretary, Customer Support Agent, Social Media Agent, and Lecturer Assistant. The Service automates tasks, generates content, and provides intelligent assistance for business and educational purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  You must create an account to use certain features. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete registration information</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Generate content that is misleading, fraudulent, or harmful</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. AI-Generated Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                The AI agents generate content based on your inputs and training data. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You are responsible for reviewing and verifying any content before use. We do not guarantee the accuracy, completeness, or suitability of AI-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Subscription and Billing</h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="leading-relaxed">
                  Paid plans are billed in advance on a monthly or annual basis. By subscribing, you authorize us to charge your payment method.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                  <li>No refunds are provided for partial billing periods</li>
                  <li>We may change pricing with 30 days notice</li>
                  <li>You can cancel your subscription at any time through account settings</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service, including its original content, features, and functionality, is owned by AI Work Assistant and is protected by copyright, trademark, and other intellectual property laws. You retain ownership of content you create using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is subject to our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which describes how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, AI Work Assistant shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">14. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-foreground font-medium">AI Work Assistant</p>
                <p className="text-muted-foreground">Email: legal@aiworkassistant.com</p>
                <p className="text-muted-foreground">Address: 123 Innovation Drive, Tech City, TC 12345</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 AI Work Assistant. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}