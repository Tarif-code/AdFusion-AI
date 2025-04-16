
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Wand2, Speaker, Image, Video } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { data } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data?.user) {
      window.location.href = '/dashboard';
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-6">
            Transform Your Ads with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create compelling ad content across all formats in minutes, not hours. Powered by advanced AI to deliver results that convert.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="animate-pulse hover:animate-none">
                Get Started Free <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          {[
            { icon: Wand2, title: "AI Copywriting", desc: "Engaging text ads that convert" },
            { icon: Speaker, title: "Audio Generation", desc: "Professional voice-overs instantly" },
            { icon: Image, title: "Visual Creation", desc: "Eye-catching image ads" },
            { icon: Video, title: "Video Production", desc: "Stunning video content" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-xl bg-card/50 backdrop-blur border border-border hover:border-primary/50 transition-all"
            >
              <feature.icon className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-8">Trusted by Digital Marketing Professionals</h2>
            <div className="flex flex-wrap justify-center gap-8 items-center text-muted-foreground">
              <span className="text-xl font-semibold">Agency One</span>
              <span className="text-xl font-semibold">DigitalPro</span>
              <span className="text-xl font-semibold">AdMasters</span>
              <span className="text-xl font-semibold">MarketLeaders</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
