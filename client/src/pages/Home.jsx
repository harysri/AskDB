import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const features = [
    {
      icon: "translate",
      title: "Natural Language → SQL",
      description:
        "Complex joins and business logic without hallucination. Specialized Indigo-Core engine.",
    },
    {
      icon: "verified_user",
      title: "Read-Only Sandbox",
      description:
        "Execution is strictly read-only. Your data stays in your environment; only metadata is indexed for query mapping.",
    },
    {
      icon: "hub",
      title: "LangGraph Intelligence",
      description:
        "Multi-agent systems working in consensus to verify schema accuracy before any query executes.",
    },
    {
      icon: "sync",
      title: "Live Schema Sync",
      description:
        "Automatic synchronization with your evolving data models. No manual re-indexing required for new columns.",
    },
  ];

  const architectureSteps = [
    {
      num: "01",
      title: "Frontend Prism UI",
      description:
        "Built on React with high-precision streaming. Real-time tokenization feedback.",
    },
    {
      num: "02",
      title: "Cognitive Layer",
      description:
        "Agentic workflows via LangGraph. Intelligent cross-reference and schema mapping.",
    },
    {
      num: "03",
      title: "Hybrid Connector",
      description:
        "Polyglot support for Postgres, MongoDB, and BigQuery via secure FastAPI tunnels.",
    },
  ];

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden selection:bg-primary-container selection:text-white">
      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 noise-bg z-[100] pointer-events-none opacity-[0.03]"></div>

      {/* TopNavBar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-[60] glass-card rounded-full border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center h-14 px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-background text-xl font-bold">
                database
              </span>
            </div>
            <span className="font-headline-md text-xl font-bold tracking-tighter text-on-surface">
              AskDB
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Architecture
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Security
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors duration-300"
            >
              Pricing
            </a>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="bg-primary text-background px-5 py-1.5 rounded-full text-sm font-bold hover:scale-105 active:scale-95 hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
        {/* Immersive Layered Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background"></div>
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse-slow"
            style={{ animationDelay: "1.5s" }}
          ></div>
        </div>

        <div
          className="max-w-6xl mx-auto px-4 md:px-10 relative z-10 text-center reveal active"
          ref={addToRefs}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/20 text-primary mb-8 animate-fade-in hover:border-primary/50 transition-colors cursor-default">
            <span className="material-symbols-outlined text-sm animate-pulse">
              auto_awesome
            </span>
            <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] font-bold">
              v2.0 Enterprise Intelligence
            </span>
          </div>
          <h1 className="font-display-lg text-6xl md:text-8xl mb-8 headline-tracking max-w-5xl mx-auto leading-[0.95] text-on-surface">
            Query Databases in{" "}
            <span className="text-primary italic">Plain English</span>
          </h1>
          <p className="font-body-md text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 leading-relaxed">
            Transform natural language into{" "}
            <span className="text-primary font-semibold">read-only SQL</span>.
            Secure, scalable orchestration for modern data teams.
          </p>
          <div className="glass-card p-4 rounded-3xl inline-flex flex-col sm:flex-row items-center gap-4 border-white/5">
            <button
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto bg-primary text-background px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:-translate-y-1 hover:brightness-110 active:scale-95 transition-all duration-300"
            >
              Start Modernizing
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </header>

      {/* Feature Grid */}
      <section className="py-32 relative bg-background" id="features">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div
            className="flex flex-col lg:flex-row items-end justify-between mb-20 reveal"
            ref={addToRefs}
          >
            <div className="max-w-2xl">
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                Core Engine
              </span>
              <h2 className="font-headline-lg text-5xl headline-tracking text-on-surface">
                Next-Gen Data Interaction
              </h2>
            </div>
            <p className="text-on-surface-variant text-lg max-w-sm mt-6 lg:mt-0">
              Proprietary LLM orchestration for enterprise-grade precision and
              security.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 rounded-[2rem] reveal glow-border group"
                ref={addToRefs}
              >
                <div className="w-14 h-14 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-8 border border-primary/20 group-hover:scale-110 group-hover:bg-primary-container/40 transition-all duration-500">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-surface group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed opacity-80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Illustration Heroic Section */}
      <section className="py-24 relative overflow-hidden bg-surface-container-low">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div
            className="relative w-full rounded-[3rem] overflow-hidden glass-card border-white/10 shadow-2xl reveal"
            ref={addToRefs}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 lg:gap-12">
              <div className="p-12 md:p-20 relative z-10">
                <div className="inline-flex px-3 py-1 rounded-md bg-primary-container/20 border border-primary/20 mb-6">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-widest">
                    Enterprise Visualization
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl headline-tracking font-bold text-on-surface mb-8">
                  Bridging the Gap Between{" "}
                  <span className="text-primary italic">Human & Data</span>
                </h2>
                <p className="text-on-surface-variant text-lg mb-10 leading-relaxed max-w-lg">
                  Experience the future of data access where every employee
                  becomes a data analyst. Our intelligent translation layer
                  handles the complexity, leaving you with pure insights.
                </p>
                <button
                  onClick={() => navigate("/chat")}
                  className="bg-primary text-background px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 hover:-translate-y-1 transition-all shadow-xl shadow-primary/10"
                >
                  Explore Capabilities{" "}
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="relative h-[400px] lg:h-[700px] w-full overflow-hidden bg-surface-container-lowest flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
                <div className="relative z-10 text-center p-8">
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-6xl">
                      query_stats
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface mb-2">
                    Real-time Analytics
                  </h3>
                  <p className="text-on-surface-variant max-w-xs mx-auto">
                    Watch your data transform into actionable insights instantly
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-transparent hidden lg:block"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent lg:hidden"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section
        className="py-32 relative bg-background overflow-hidden"
        id="architecture"
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#c3c0ff 1px, transparent 1px), linear-gradient(90deg, #c3c0ff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="text-center mb-24 reveal" ref={addToRefs}>
            <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] mb-4 block">
              The Command Center
            </span>
            <h2 className="font-headline-lg text-5xl headline-tracking text-on-surface">
              High-Fidelity Architecture
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-4 space-y-8 reveal" ref={addToRefs}>
              {architectureSteps.map((step, index) => (
                <div
                  key={index}
                  className="glass-card p-6 rounded-2xl border-l-4 border-l-primary/50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-primary text-xs opacity-50 mt-1">
                      {step.num}
                    </span>
                    <div>
                      <h4 className="font-bold text-lg text-on-surface mb-2 group-hover:text-primary transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-8 reveal" ref={addToRefs}>
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 blur-[100px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                <div className="glass-card p-4 rounded-[3rem] border-white/5 relative z-10 overflow-hidden">
                  <div className="w-full h-auto rounded-[2rem] bg-surface-container-lowest p-8 min-h-[400px] flex items-center justify-center">
                    <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                      <div className="col-span-3 glass-card p-6 rounded-2xl text-center border-primary/20">
                        <span className="material-symbols-outlined text-primary text-3xl mb-2">
                          chat
                        </span>
                        <p className="text-sm font-bold text-on-surface">
                          User Query
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded-xl text-center">
                        <span className="material-symbols-outlined text-secondary text-2xl">
                          psychology
                        </span>
                        <p className="text-xs font-bold text-on-surface mt-1">
                          Planner
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded-xl text-center">
                        <span className="material-symbols-outlined text-tertiary text-2xl">
                          code
                        </span>
                        <p className="text-xs font-bold text-on-surface mt-1">
                          SQL Gen
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded-xl text-center">
                        <span className="material-symbols-outlined text-primary text-2xl">
                          check_circle
                        </span>
                        <p className="text-xs font-bold text-on-surface mt-1">
                          Validator
                        </p>
                      </div>
                      <div className="col-span-3 glass-card p-6 rounded-2xl text-center border-primary/20">
                        <span className="material-symbols-outlined text-emerald-400 text-3xl mb-2">
                          database
                        </span>
                        <p className="text-sm font-bold text-on-surface">
                          Secure Database Connection
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section
        className="py-32 relative bg-surface-container-low border-y border-white/5"
        id="security"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal" ref={addToRefs}>
              <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                Enterprise Security
              </span>
              <h2 className="font-headline-lg text-5xl headline-tracking text-on-surface mb-8">
                Your Data Never Leaves Your Control
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: "lock",
                    title: "Read-Only Execution",
                    desc: "All generated queries are strictly read-only. No INSERT, UPDATE, or DELETE operations are permitted.",
                  },
                  {
                    icon: "shield",
                    title: "TLS 1.3 Encryption",
                    desc: "Every connection is encrypted end-to-end with the latest transport layer security standards.",
                  },
                  {
                    icon: "vpn_key",
                    title: "Credential Isolation",
                    desc: "Database credentials are stored in isolated secure vaults, never in application logs or memory dumps.",
                  },
                  {
                    icon: "verified",
                    title: "SOC2 Type II Compliant",
                    desc: "Our infrastructure and processes are audited and certified for enterprise security standards.",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-container/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/20">
                      <span className="material-symbols-outlined text-primary">
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal" ref={addToRefs}>
              <div className="glass-card p-8 rounded-[2rem] border-white/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400">
                        check_circle
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        Query Validation
                      </span>
                    </div>
                    <span className="text-label-mono text-[10px] text-emerald-400 uppercase">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400">
                        check_circle
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        Schema Sandboxing
                      </span>
                    </div>
                    <span className="text-label-mono text-[10px] text-emerald-400 uppercase">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400">
                        check_circle
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        Audit Logging
                      </span>
                    </div>
                    <span className="text-label-mono text-[10px] text-emerald-400 uppercase">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400">
                        check_circle
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        Session Encryption
                      </span>
                    </div>
                    <span className="text-label-mono text-[10px] text-emerald-400 uppercase">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-40 relative overflow-hidden bg-surface-container-low border-t border-white/5"
        id="pricing"
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#c3c0ff 1px, transparent 1px), linear-gradient(90deg, #c3c0ff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div
          className="max-w-4xl mx-auto px-4 md:px-10 text-center relative z-10 reveal"
          ref={addToRefs}
        >
          <h2 className="text-5xl md:text-7xl headline-tracking font-bold text-on-surface mb-8">
            Ignite Your Data Culture
          </h2>
          <p className="text-on-surface-variant text-xl max-w-xl mx-auto mb-12 leading-relaxed">
            Join 500+ forward-thinking enterprises unlocking the power of
            self-serve intelligence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
              onClick={() => navigate("/chat")}
              className="bg-primary text-background px-12 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300"
            >
              Start Trial Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest pt-16 pb-8 relative overflow-hidden border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-background text-2xl font-bold">
                    database
                  </span>
                </div>
                <span className="font-headline-md text-2xl font-bold tracking-tighter text-on-surface">
                  AskDB
                </span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-sm">
                Defining the next standard of enterprise data intelligence
                through multi-agent orchestration.
              </p>
              <div className="flex gap-4">
                {/* GitHub */}
                <a
                  href="#"
                  className="w-10 h-10 rounded-full glass-card border-white/10 flex items-center justify-center hover:bg-primary hover:text-background hover:-translate-y-1 transition-all cursor-pointer"
                  aria-label="GitHub"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>

                {/* Documentation */}
                <a
                  href="#"
                  className="w-10 h-10 rounded-full glass-card border-white/10 flex items-center justify-center hover:bg-primary hover:text-background hover:-translate-y-1 transition-all cursor-pointer"
                  aria-label="Documentation"
                >
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                </a>

                {/* Twitter/X */}
                <a
                  href="#"
                  className="w-10 h-10 rounded-full glass-card border-white/10 flex items-center justify-center hover:bg-primary hover:text-background hover:-translate-y-1 transition-all cursor-pointer"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Section */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Quick Links */}
              <div className="space-y-6">
                <h5 className="text-primary font-bold text-xs uppercase tracking-widest">
                  Quick Links
                </h5>
                <ul className="space-y-4 text-on-surface-variant text-sm font-medium">
                  <li>
                    <a
                      href="/login"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      Login
                    </a>
                  </li>
                  <li>
                    <a
                      href="/signup"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      Sign Up
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-6">
                <h5 className="text-primary font-bold text-xs uppercase tracking-widest">
                  Resources
                </h5>
                <ul className="space-y-4 text-on-surface-variant text-sm font-medium">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors duration-300"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-on-surface-variant/50">
              © 2026 AskDB AI. Synthesized Intelligence for the next generation.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/70">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
