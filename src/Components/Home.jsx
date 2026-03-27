import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

// --- Shared Components ---

const SectionHeading = ({ children, subtitle, centered = true }) => (
  <div className={`mb-16 ${centered ? 'text-center' : 'text-left'}`}>
    {subtitle && (
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-block py-1 px-3 rounded-full bg-emerald-100/80 text-emerald-800 text-sm font-semibold tracking-wider mb-4 border border-emerald-200"
      >
        {subtitle}
      </motion.span>
    )}
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight"
    >
      {children}
    </motion.h2>
  </div>
);

const GlassCard = ({ children, className = '', hoverEffect = true }) => (
  <motion.div
    whileHover={hoverEffect ? { y: -5, boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.15)" } : {}}
    className={`bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-xl shadow-slate-200/50 ${className}`}
  >
    {children}
  </motion.div>
);

// --- Sections ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Technology', href: '#technology' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md py-4 shadow-lg shadow-emerald-900/5' : 'bg-transparent py-6'
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-3xl filter drop-shadow-sm group-hover:rotate-12 transition-transform duration-300">🌱</span>
          <span className={`text-2xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-900 md:text-white'} transition-colors`}>
            Farm2<span className="text-emerald-500">Consumer</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-sm font-medium hover:text-emerald-400 transition-colors ${scrolled ? 'text-slate-600' : 'text-white/90 hover:text-white'}`}
            >
              {link.name}
            </a>
          ))}
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${scrolled
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700'
                : 'bg-white text-emerald-900 hover:bg-emerald-50'
                }`}
            >
              Get Started
            </motion.button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-600 text-lg font-medium"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div id="home" className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-emerald-900/40 z-10" />
        <img
          src="back6.jpg"
          alt="Farm Background"
          className="w-full h-full object-cover scale-110"
        />
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opacity-80" />
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block py-2 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 font-semibold tracking-wide mb-6">
            Revolutionizing Agriculture
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-8 drop-shadow-2xl">
            Fresh from <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Farm to Table
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto mb-10 font-light leading-relaxed">
            Empowering local farmers with blockchain transparency.
            Connect directly, eat freshly, and profit fairly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all border border-emerald-400/50"
              >
                Start Your Journey
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-lg transition-all border border-white/30"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};

const Features = () => {
  const features = [
    { icon: '🌿', title: 'Organic Farming', desc: '100% Pesticide-free produce guaranteed directly from certified farms.' },
    { icon: '🚜', title: 'Direct Sourcing', desc: 'Cut out the middlemen. Get fresh produce straight from the harvest.' },
    { icon: '⛓️', title: 'Blockchain Secured', desc: 'Every step of the journey is recorded on the blockchain for total transparency.' },
    { icon: '🛒', title: 'Seamless Shopping', desc: 'AI-powered marketplace adapting to your habits and seasonal availability.' },
  ];

  return (
    <section id="services" className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeading subtitle="Why Choose Us">
          Redefining the <span className="text-emerald-600">Food Supply Chain</span>
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <GlassCard key={i} className="h-full">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-4xl mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const SectionAbout = () => (
  <section id="about" className="py-32 bg-white relative">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-emerald-600 rounded-3xl rotate-3 opacity-10" />
          <img
            src="https://media.istockphoto.com/id/543212762/photo/tractor-cultivating-field-at-spring.jpg?s=612x612&w=0&k=20&c=uJDy7MECNZeHDKfUrLNeQuT7A1IqQe89lmLREhjIJYU="
            alt="Farming"
            className="rounded-3xl shadow-2xl relative z-10 w-full object-cover h-[500px]"
          />
          <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-2xl shadow-xl z-20 max-w-xs border border-emerald-100 hidden lg:block">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-bold text-slate-800">Live Impact</span>
            </div>
            <p className="text-slate-600 text-sm">Supporting over 5,000 local farmers and counting.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm">About Farm2Consumer</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-8 leading-tight">
            Connecting Earth's Keepers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">You.</span>
          </h2>
          <p className="text-lg text-slate-600 mb-6 leading-relaxed">
            We are revolutionizing the agricultural landscape by bridging the gap between farmers and consumers using cutting-edge blockchain technology.
          </p>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Our mission is simple: Fair pay for farmers, fresh food for families, and a sustainable future for our planet. We eliminate the inefficiencies of traditional supply chains.
          </p>
          <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg">
            Read Our Story
          </button>
        </motion.div>
      </div>
    </div>
  </section>
);

const Technology = () => {
  const techs = [
    { title: 'Smart Contracts', desc: 'Ensuring instant payments and contract enforcement.', color: 'bg-blue-500' },
    { title: 'IoT Sensors', desc: 'Real-time monitoring of crop health and soil quality.', color: 'bg-green-500' },
    { title: 'AI Analytics', desc: 'Predictive market trends for smarter harvesting.', color: 'bg-purple-500' },
    { title: 'Supply Chain', desc: 'End-to-end traceability from seed to delivery.', color: 'bg-orange-500' },
  ];

  return (
    <section id="technology" className="py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grain-texture.png')] opacity-5"></div>

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeading subtitle="Innovation" centered>
          <span className="text-white">Powered by</span> <span className="text-emerald-400">Advanced Tech</span>
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {techs.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all cursor-crosshair group"
            >
              <div className={`w-2 h-2 rounded-full ${t.color} mb-6 group-hover:scale-150 transition-transform`} />
              <h3 className="text-2xl font-bold mb-4">{t.title}</h3>
              <p className="text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AppHighlights = () => (
  <section className="py-24 bg-white relative overflow-hidden">
    <div className="container mx-auto px-6">
      <SectionHeading subtitle="Smart Features" centered>
        Technology that <span className="text-emerald-600">Understands You</span>
      </SectionHeading>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        {[
          { title: "Voice Commerce", icon: "🎙️", desc: "From command to checkout in seconds. Experience hands-free shopping." },
          { title: "Multi-Language", icon: "🌐", desc: "Your words, your way. The platform adapts to your preferred local language." },
          { title: "AI Market Trends", icon: "📈", desc: "Smart crop recommendations and price forecasting for maximum profit." }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="p-8 rounded-3xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 transition-all group"
          >
            <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Contact = () => (
  <section id="contact" className="py-32 bg-emerald-50 relative">
    <div className="container mx-auto px-6 max-w-4xl">
      <GlassCard className="text-center !p-12 md:!p-20">
        <SectionHeading subtitle="Get in Touch" centered>
          Let's Grow <span className="text-emerald-600">Together</span>
        </SectionHeading>

        <form className="max-w-xl mx-auto space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
            />
          </div>
          <textarea
            rows="4"
            placeholder="How can we help?"
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          <button className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.01] transition-all">
            Send Message
          </button>
        </form>
      </GlassCard>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <span className="text-3xl">🌱</span>
            <span className="text-2xl font-bold text-white">
              Farm2<span className="text-emerald-500">Consumer</span>
            </span>
          </Link>
          <p className="text-lg max-w-md leading-relaxed">
            Building the future of sustainable agriculture, one connection at a time. Join our community of mindful consumers and dedicated farmers.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Platform</h4>
          <ul className="space-y-4">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Browse Products</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Start Selling</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Technology</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
          <ul className="space-y-4">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-900 gap-4">
        <p>© 2025 Farm2Consumer. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-2xl hover:text-white transition-colors">🐦</a>
          <a href="#" className="text-2xl hover:text-white transition-colors">📘</a>
          <a href="#" className="text-2xl hover:text-white transition-colors">📸</a>
        </div>
      </div>
    </div>
  </footer>
);

const Home = () => {
  return (
    <div className="font-sans selection:bg-emerald-500/30">
      <Navbar />
      <Hero />
      <Features />
      <SectionAbout />
      <Technology />
      <AppHighlights />
      <Contact />
      <Footer />
    </div>
  );
};

export default Home;