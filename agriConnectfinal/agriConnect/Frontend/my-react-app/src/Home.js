import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo.png';
import heroImage from './images/banner.jpg';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  
  // Handle navigation scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Animation on scroll
  useEffect(() => {
    const fadeElements = document.querySelectorAll('.home-fade-in');
    
    const handleScrollAnimation = () => {
      fadeElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top <= window.innerHeight * 0.85;
        
        if (isVisible) {
          el.classList.add('visible');
        }
      });
    };
    
    window.addEventListener('scroll', handleScrollAnimation);
    // Run once on load
    setTimeout(handleScrollAnimation, 100);
    
    return () => window.removeEventListener('scroll', handleScrollAnimation);
  }, []);
  
  // Parallax effect for agricultural elements
  useEffect(() => {
    if (!heroRef.current) return;
    
    const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
    
    const handleParallax = () => {
      const scrollTop = window.scrollY;
      
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax-speed') || 0);
        const yPos = scrollTop * speed;
        el.style.transform = `translateY(${yPos}px)`;
      });
    };
    
    window.addEventListener('scroll', handleParallax);
    return () => window.removeEventListener('scroll', handleParallax);
  }, []);
  
  // Animated counter for stats section
  useEffect(() => {
    const countElements = document.querySelectorAll('[data-count-target]');
    
    const animateCounter = (el, target) => {
      const count = parseInt(el.innerText) || 0;
      const increment = target / 50;
      
      if (count < target) {
        el.innerText = Math.ceil(count + increment);
        setTimeout(() => animateCounter(el, target), 30);
      } else {
        el.innerText = target;
      }
    };
    
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countElements.forEach(el => {
            const target = parseInt(el.getAttribute('data-count-target'));
            animateCounter(el, target);
          });
        }
      });
    };
    
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5
    });
    
    const statsSection = document.querySelector('.home-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const handleSignUp = () => {
    navigate('/signup');
  };
  
  const handleLogin = () => {
    navigate('/login');
  };
  
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };
  
  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className={`home-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="home-nav-container">
          <div className="home-logo-container">
            <img src={logo} alt="AgriConnect Logo" className="home-logo" />
            <span className="home-brand">AgriConnect</span>
          </div>
          
          <div className="home-nav-links">
            <a href="#features" className="home-nav-link" onClick={(e) => {e.preventDefault(); scrollToSection('features');}}>Features</a>
            <a href="#about" className="home-nav-link" onClick={(e) => {e.preventDefault(); scrollToSection('about');}}>About</a>
            <a href="#testimonials" className="home-nav-link" onClick={(e) => {e.preventDefault(); scrollToSection('testimonials');}}>Testimonials</a>
          </div>
          
          <div className="home-nav-actions">
            <button className="home-btn-outline" onClick={handleLogin}>Login</button>
            <button className="home-btn-primary" onClick={handleSignUp}>Sign Up</button>
          </div>
          
          <button className="home-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            ☰
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      <div className={`home-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <div className={`home-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="home-mobile-menu-header">
          <div className="home-logo-container">
            <img src={logo} alt="AgriConnect Logo" className="home-logo" />
            <span className="home-brand">AgriConnect</span>
          </div>
          <button className="home-mobile-close" onClick={() => setMobileMenuOpen(false)}>×</button>
        </div>
        
        <div className="home-mobile-links">
          <a href="#features" className="home-mobile-link" onClick={(e) => {e.preventDefault(); scrollToSection('features');}}>Features</a>
          <a href="#about" className="home-mobile-link" onClick={(e) => {e.preventDefault(); scrollToSection('about');}}>About</a>
          <a href="#testimonials" className="home-mobile-link" onClick={(e) => {e.preventDefault(); scrollToSection('testimonials');}}>Testimonials</a>
        </div>
        
        <div className="home-mobile-actions">
          <button className="home-btn-outline" onClick={handleLogin} style={{width: '100%'}}>Login</button>
          <button className="home-btn-primary" onClick={handleSignUp} style={{width: '100%'}}>Sign Up</button>
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="home-hero" ref={heroRef}>
        <div className="home-hero-overlay"></div>
        
        {/* Agricultural animated elements */}
        <div className="home-agri-elements">
          <div className="home-agri-element home-wheat home-wheat-1" data-parallax-speed="0.1"></div>
          <div className="home-agri-element home-wheat home-wheat-2" data-parallax-speed="0.15"></div>
          <div className="home-agri-element home-wheat home-wheat-3" data-parallax-speed="0.12"></div>
          <div className="home-agri-element home-leaf home-leaf-1" data-parallax-speed="0.05"></div>
          <div className="home-agri-element home-leaf home-leaf-2" data-parallax-speed="0.08"></div>
          <div className="home-agri-element home-seed home-seed-1"></div>
          <div className="home-agri-element home-seed home-seed-2"></div>
          <div className="home-agri-element home-seed home-seed-3"></div>
          <div className="home-agri-element home-sprout home-sprout-1" data-parallax-speed="0.07"></div>
          <div className="home-agri-element home-sprout home-sprout-2" data-parallax-speed="0.09"></div>
        </div>
        
        <div className="home-hero-content">
          <div className="home-hero-text-container">
            <h1 className="home-hero-title">Connecting Farmers and Vendors Across Africa</h1>
            <p className="home-hero-subtitle">
              AgriConnect revolutionizes agricultural commerce by creating direct connections between producers and buyers. 
              Join our platform to access quality produce, boost productivity, and strengthen Africa's agricultural economy.
            </p>
            <div className="home-hero-actions">
              <button className="home-hero-btn home-hero-primary-btn" onClick={handleSignUp}>
                Get Started <span className="home-arrow">→</span>
              </button>
              <button className="home-hero-btn home-hero-secondary-btn" onClick={() => scrollToSection('features')}>
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="home-features">
        <div className="home-container">
          <div className="home-section-header home-fade-in">
            <span className="home-section-tag">Why Choose Us</span>
            <h2 className="home-section-title">Why Choose AgriConnect?</h2>
            <p className="home-section-subtitle">Empowering agricultural communities with innovative solutions</p>
          </div>
          
          <div className="home-features-grid">
            {[
              {
                title: "Streamlined Trading",
                description: "Our intuitive platform makes buying and selling agricultural products seamless and efficient.",
                icon: "🌾"
              },
              {
                title: "Quality Assurance",
                description: "Access verified vendors and premium quality produce with our certification system.",
                icon: "✅"
              },
              {
                title: "Smart Logistics",
                description: "Schedule and track deliveries with our intelligent logistics and distribution network.",
                icon: "🚚"
              },
              {
                title: "Market Insights",
                description: "Access real-time pricing data and market trends to make informed decisions.",
                icon: "📊"
              },
              {
                title: "Secure Payments",
                description: "Enjoy safe and transparent transactions with our secure payment system.",
                icon: "💳"
              },
              {
                title: "Community Support",
                description: "Connect with fellow farmers and experts to share knowledge and best practices.",
                icon: "👨‍🌾"
              }
            ].map((feature, index) => (
              <div key={index} className="home-feature-card home-fade-in" style={{transitionDelay: `${index * 0.1}s`}}>
                <div className="home-feature-icon">{feature.icon}</div>
                <h3 className="home-feature-title">{feature.title}</h3>
                <p className="home-feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="home-stats">
        <div className="home-stats-overlay"></div>
        <div className="home-stats-content">
          <div className="home-stat-item">
            <div className="home-stat-number" data-count-target="2500">0</div>
            <div className="home-stat-plus">+</div>
            <div className="home-stat-label">Farmers</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-number" data-count-target="1200">0</div>
            <div className="home-stat-plus">+</div>
            <div className="home-stat-label">Vendors</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-number" data-count-target="12">0</div>
            <div className="home-stat-label">Countries</div>
          </div>
          <div className="home-stat-item">
            <div className="home-stat-prefix">$</div>
            <div className="home-stat-number" data-count-target="3">0</div>
            <div className="home-stat-plus">.2M</div>
            <div className="home-stat-label">Monthly Trade</div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="home-about">
        <div className="home-container">
          <div className="home-about-grid">
            <div className="home-about-content home-fade-in">
              <span className="home-section-tag">Our Story</span>
              <h2 className="home-about-title">About Us</h2>
              <p className="home-about-text">
                At <span className="home-highlight">AgriConnect</span>, we're passionate about transforming agricultural commerce across Africa. 
                Our platform bridges the gap between farmers and vendors, making it easier to buy, sell, and schedule deliveries seamlessly.
              </p>
              <p className="home-about-text">
                We're committed to ensuring access to quality produce, enhancing productivity, and strengthening Africa's agricultural supply chain
                through innovative technology and community building.
              </p>
              <div className="home-about-values">
                <div className="home-value">
                  <div className="home-value-icon">🌱</div>
                  <div className="home-value-text">Sustainability</div>
                </div>
                <div className="home-value">
                  <div className="home-value-icon">🤝</div>
                  <div className="home-value-text">Partnership</div>
                </div>
                <div className="home-value">
                  <div className="home-value-icon">💡</div>
                  <div className="home-value-text">Innovation</div>
                </div>
              </div>
            </div>
            <div className="home-about-image home-fade-in">
              <img src={heroImage} alt="Farmers working in field" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="home-testimonials">
        <div className="home-container">
          <div className="home-section-header home-fade-in">
            <span className="home-section-tag">Success Stories</span>
            <h2 className="home-section-title">What Our Users Say</h2>
            <p className="home-section-subtitle">Hear from our growing community of farmers and vendors</p>
          </div>
          
          <div className="home-testimonials-grid">
            {[
              {
                name: "James Moyo",
                role: "Maize Farmer, Zimbabwe",
                text: "AgriConnect has transformed my business. I now sell directly to vendors and get better prices for my produce.",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg"
              },
              {
                name: "Sarah Kimani",
                role: "Produce Vendor, Kenya",
                text: "Finding quality produce used to be challenging. Now I have access to verified farmers and consistent supply.",
                avatar: "https://randomuser.me/api/portraits/women/44.jpg"
              },
              {
                name: "Emmanuel Osei",
                role: "Logistics Partner, Ghana",
                text: "The platform has streamlined our delivery process and helped us expand our transport business significantly.",
                avatar: "https://randomuser.me/api/portraits/men/68.jpg"
              }
            ].map((testimonial, index) => (
              <div key={index} className="home-testimonial-card home-fade-in" style={{transitionDelay: `${index * 0.1}s`}}>
                <div className="home-testimonial-content">
                  <div className="home-quote">"</div>
                  <p className="home-testimonial-text">{testimonial.text}</p>
                </div>
                <div className="home-testimonial-author">
                  <img src={testimonial.avatar} alt={testimonial.name} className="home-author-avatar" />
                  <div className="home-author-info">
                    <div className="home-author-name">{testimonial.name}</div>
                    <div className="home-author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="home-cta">
        <div className="home-container">
          <div className="home-cta-card home-fade-in">
            <h2 className="home-cta-title">Ready to Transform Your Agricultural Business?</h2>
            <p className="home-cta-text">
              Join thousands of farmers and vendors already benefiting from our platform.
              Sign up now and start growing your agricultural business with AgriConnect!
            </p>
            <button className="home-cta-btn" onClick={handleSignUp}>
              Join AgriConnect Today
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-top">
            <div className="home-footer-info">
              <div className="home-footer-brand">
                <img src={logo} alt="AgriConnect Logo" className="home-footer-logo" />
                <span className="home-footer-brand-name">AgriConnect</span>
              </div>
              <p className="home-footer-description">
                AgriConnect is the premier platform for agricultural commerce across Africa, connecting farmers and vendors for a more efficient supply chain.
              </p>
              <div className="home-social-icons">
                <a href="https://facebook.com" className="home-social-icon" aria-label="Facebook">f</a>
                <a href="https://twitter.com" className="home-social-icon" aria-label="Twitter">t</a>
                <a href="https://instagram.com" className="home-social-icon" aria-label="Instagram">i</a>
                <a href="https://linkedin.com" className="home-social-icon" aria-label="LinkedIn">in</a>
              </div>
            </div>
            
            <div className="home-footer-links">
              <div className="home-footer-col">
                <h3 className="home-footer-title">Quick Links</h3>
                <ul className="home-footer-menu">
                  <li><a href="#about" className="home-footer-link" onClick={(e) => {e.preventDefault(); scrollToSection('about');}}>About Us</a></li>
                  <li><a href="#features" className="home-footer-link" onClick={(e) => {e.preventDefault(); scrollToSection('features');}}>Features</a></li>
                  <li><a href="#testimonials" className="home-footer-link" onClick={(e) => {e.preventDefault(); scrollToSection('testimonials');}}>Testimonials</a></li>
                  <li><a href="/pricing" className="home-footer-link">Pricing</a></li>
                </ul>
              </div>
              
              <div className="home-footer-col">
                <h3 className="home-footer-title">Connect</h3>
                <ul className="home-footer-menu">
                  <li><a href="/blog" className="home-footer-link">Blog</a></li>
                  <li><a href="/contact" className="home-footer-link">Contact</a></li>
                  <li><a href="/partner" className="home-footer-link">Become a Partner</a></li>
                  <li><a href="/faq" className="home-footer-link">FAQ</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="home-footer-bottom">
            <div className="home-contact-info">
              <div className="home-contact-item">
                <span className="home-contact-icon">📞</span>
                <span className="home-contact-text">+263 776 606 310</span>
              </div>
              
              <div className="home-contact-item">
                <span className="home-contact-icon">✉️</span>
                <span className="home-contact-text">agriconnect23@gmail.com</span>
              </div>
              
              <div className="home-contact-item">
                <span className="home-contact-icon">📍</span>
                <span className="home-contact-text">Harare, Zimbabwe</span>
              </div>
            </div>
            
            <div className="home-copyright">
              © 2025 AgriConnect. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;