import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

export const Navbar = () => {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      <button
        onClick={() => {
          scrollToSection("how-it-works");
          onLinkClick?.();
        }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 md:py-0"
      >
        How It Works
      </button>
      <button
        onClick={() => {
          scrollToSection("features");
          onLinkClick?.();
        }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 md:py-0"
      >
        Features
      </button>
      <button
        onClick={() => {
          scrollToSection("security");
          onLinkClick?.();
        }}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 md:py-0"
      >
        Security
      </button>
    </>
  );

  return (
    <nav className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b transition-all duration-300 ${
      hasScrolled ? "border-border shadow-sm" : "border-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] opacity-90 group-hover:opacity-100 transition-opacity" />
            <span className="text-xl font-display font-semibold text-foreground">Spradley</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            <NavLinks />
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/demo/hr">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View Demo
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="font-medium">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 mt-6">
                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <button
                        onClick={() => scrollToSection("how-it-works")}
                        className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                      >
                        How It Works
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => scrollToSection("features")}
                        className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                      >
                        Features
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => scrollToSection("security")}
                        className="text-left text-base font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                      >
                        Security
                      </button>
                    </SheetClose>
                  </div>

                  {/* Mobile CTAs */}
                  <div className="flex flex-col gap-3 mt-4">
                    <SheetClose asChild>
                      <Link to="/demo/hr" className="w-full">
                        <Button variant="outline" className="w-full">
                          View Demo
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/auth" className="w-full">
                        <Button className="w-full font-medium">
                          Get Started
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
