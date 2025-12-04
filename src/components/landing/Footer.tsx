import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, Linkedin, Twitter, Github, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const navigation = {
  product: [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Demo", href: "/demo" },
  ],
  company: [
    { name: "About Us", href: "#about" },
    { name: "Careers", href: "#careers" },
    { name: "Blog", href: "#blog" },
    { name: "Press", href: "#press" },
  ],
  resources: [
    { name: "Documentation", href: "#docs" },
    { name: "Help Center", href: "#help" },
    { name: "API Reference", href: "#api" },
    { name: "Status", href: "#status" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Cookie Policy", href: "#cookies" },
    { name: "GDPR", href: "#gdpr" },
  ],
};

const socialLinks = [
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Github, href: "#", label: "GitHub" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* CTA Section */}
      <div className="border-b border-background/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-display font-semibold mb-3">
                Ready to transform feedback?
              </h3>
              <p className="text-background/60 text-base max-w-xl">
                Join forward-thinking organizations using Spradley to build trust and drive meaningful change.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white font-medium px-6"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/demo/hr">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-background/20 text-background hover:bg-background/10 font-medium px-6"
                >
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand & Newsletter */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary opacity-90" />
              <span className="text-xl font-display font-semibold">Spradley</span>
            </div>
            <p className="text-background/60 mb-6 max-w-xs text-sm leading-relaxed">
              AI-powered conversations that transform employee feedback into actionable insights.
            </p>
            
            {/* Newsletter */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3 text-background/80">Subscribe to our newsletter</p>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-background/5 border-background/10 text-background placeholder:text-background/40 focus:border-primary/50 h-10"
                />
                <Button size="icon" className="bg-primary hover:bg-primary/90 text-white shrink-0 h-10 w-10">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-background/5 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-medium mb-4 text-background/90">Product</h4>
            <ul className="space-y-2.5">
              {navigation.product.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-background/60 hover:text-primary transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-background/90">Company</h4>
            <ul className="space-y-2.5">
              {navigation.company.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-background/60 hover:text-primary transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-background/90">Resources</h4>
            <ul className="space-y-2.5">
              {navigation.resources.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-background/60 hover:text-primary transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4 text-background/90">Legal</h4>
            <ul className="space-y-2.5">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-background/60 hover:text-primary transition-colors text-sm">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-background/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-background/50">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/70" />
                <span>Copenhagen, Denmark</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary/70" />
                <a href="mailto:hello@spradley.io" className="hover:text-primary transition-colors">
                  hello@spradley.io
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary/70" />
                <a href="tel:+4512345678" className="hover:text-primary transition-colors">
                  +45 12 34 56 78
                </a>
              </div>
            </div>
            <p className="text-sm text-background/40">
              © {new Date().getFullYear()} Spradley. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
