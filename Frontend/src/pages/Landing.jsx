import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Landing.css';

const Landing = ({ onLoginClick }) => {
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [scrollWidth, setScrollWidth] = useState(0);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);
    const [navbarHide, setNavbarHide] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [submitStatus, setSubmitStatus] = useState('Submit Order');

    // Checkout State
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(1);
    const [lastOrder, setLastOrder] = useState(null);
    const [checkoutData, setCheckoutData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        location: '',
        model: '',
        quantity: 1
    });

    const PRODUCTS = {
        'Sana Homes Cargo Pro': { price: 12500, image: '/Images/download1.jpg' },
        'Sana Homes Passenger Deluxe': { price: 11800, image: '/Images/download2.jpg' },
        'Sana Homes Heavy Duty': { price: 15200, image: '/Images/1000198277-removebg-preview-1.webp' }
    };

    const cursorRef = useRef(null);
    const cursorFollowerRef = useRef(null);
    const orderFormRef = useRef(null);
    const heroBgRef = useRef(null);

    useEffect(() => {
        // Initial loading delay
        const timer = setTimeout(() => setLoading(false), 500);

        // Scroll listener
        const handleScroll = () => {
            const currentScroll = window.scrollY;

            // Navbar view
            if (currentScroll > lastScroll && currentScroll > 100) {
                setNavbarHide(true);
            } else {
                setNavbarHide(false);
            }
            setLastScroll(currentScroll);

            // Navbar background
            setScrolled(currentScroll > 50);

            // Scroll progress
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercentage = (currentScroll / scrollHeight) * 100;
            setScrollWidth(scrollPercentage);

            // Back to top
            setShowBackToTop(currentScroll > 500);

            // Active section
            const sections = ['home', 'products', 'features', 'gallery', 'testimonials', 'contact'];
            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 200 && rect.bottom >= 200) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }

            // Parallax
            if (heroBgRef.current) {
                heroBgRef.current.style.transform = `translateY(${currentScroll * 0.5}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Custom cursor logic
        const handleMouseMove = (e) => {
            if (cursorRef.current && cursorFollowerRef.current) {
                cursorRef.current.style.left = e.clientX + 'px';
                cursorRef.current.style.top = e.clientY + 'px';
                cursorRef.current.style.opacity = '1';

                cursorFollowerRef.current.style.left = e.clientX + 'px';
                cursorFollowerRef.current.style.top = e.clientY + 'px';
                cursorFollowerRef.current.style.opacity = '1';
            }
        };

        if (window.innerWidth > 768) {
            window.addEventListener('mousemove', handleMouseMove);
        }

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    if (entry.target.classList.contains('product-grid') ||
                        entry.target.classList.contains('features-grid') ||
                        entry.target.classList.contains('testimonials-grid') ||
                        entry.target.classList.contains('gallery-grid')) {
                        Array.from(entry.target.children).forEach((child, index) => {
                            setTimeout(() => child.classList.add('animate-in'), index * 100);
                        });
                    }
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        const animElements = document.querySelectorAll('.product-card, .feature-card, .testimonial-card, .gallery-item, .map-container, .order-form, .product-grid, .features-grid, .testimonials-grid, .gallery-grid');
        animElements.forEach(el => observer.observe(el));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('mousemove', handleMouseMove);
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [lastScroll]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // 1. Honeypot check (anti-bot)
        if (data.website) {
            console.warn('Bot detected via honeypot');
            return;
        }

        // 2. Basic Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email && !emailRegex.test(data.email)) {
            alert('Please enter a valid email address.');
            return;
        }

        setCheckoutData({
            ...checkoutData,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            model: data.model || 'Sana Homes Cargo Pro',
            quantity: 1
        });

        setCheckoutStep(1);
        setCheckoutOpen(true);
    };

    const handleCheckoutChange = (e) => {
        const { name, value } = e.target;
        setCheckoutData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        // Validation for each step
        if (checkoutStep === 1) {
            if (!checkoutData.quantity || checkoutData.quantity < 1) {
                alert('Please enter a valid quantity.');
                return;
            }
        }
        
        if (checkoutStep === 2) {
            if (!checkoutData.name.trim()) {
                alert('Please enter your full name.');
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!checkoutData.email.trim() || !emailRegex.test(checkoutData.email)) {
                alert('Please enter a valid email address.');
                return;
            }
            if (!checkoutData.phone.trim() || checkoutData.phone.length < 9) {
                alert('Please enter a valid phone number.');
                return;
            }
        }

        if (checkoutStep === 3) {
            if (!checkoutData.location.trim()) {
                alert('Please enter your city or region.');
                return;
            }
            if (!checkoutData.address.trim() || checkoutData.address.length < 5) {
                alert('Please provide a detailed delivery address.');
                return;
            }
        }

        setCheckoutStep(prev => Math.min(prev + 1, 4));
    };
    const prevStep = () => setCheckoutStep(prev => Math.max(prev - 1, 1));

    const processPayment = () => {
        const pk = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

        if (!pk || pk.includes('placeholder')) {
            console.error('Paystack Public Key is missing or invalid in .env');
            alert('Payment configuration error: Please check your Paystack Public Key.');
            return;
        }

        const selectedProduct = PRODUCTS[checkoutData.model] || PRODUCTS['Sana Homes Cargo Pro'];
        const price = selectedProduct?.price || 0;
        const qty = parseInt(checkoutData.quantity) || 1;
        const totalAmount = price * qty;

        if (totalAmount <= 0) {
            console.error('Invalid amount calculation:', { model: checkoutData.model, price, qty });
            alert('Invalid order total. Please check your quantity.');
            return;
        }

        console.log('Opening Paystack for:', checkoutData.email, 'Amount:', totalAmount);

        // Define fulfillment logic as a separate async function
        const fulfillOrder = async (response) => {
            setSubmitStatus('Verifying & Fulfilling...');
            try {
                const { data: verification, error: verifyError } = await supabase.functions.invoke('paystack-verify', {
                    body: {
                        reference: response.reference,
                        checkoutData: checkoutData
                    }
                });

                if (verifyError || !verification?.success) {
                    console.error('Verify error:', verifyError, verification);
                    alert('Payment verification failed. Ref: ' + response.reference);
                    setSubmitStatus('');
                    return;
                }

                setLastOrder(verification.orderId);
                setCheckoutStep(5);
                setSubmitStatus('');

                const message = `Payment confirmed for ${checkoutData.model}. Order ID: ${verification.orderId}.%0AName: ${checkoutData.name}%0APhone: ${checkoutData.phone}`;
                window.open(`https://wa.me/233301234567?text=${message}`, '_blank');
            } catch (err) {
                console.error('Fulfillment error:', err);
                alert('Fulfillment failed. Please contact support.');
                setSubmitStatus('');
            }
        };

        const handler = window.PaystackPop.setup({
            key: pk,
            email: checkoutData.email || 'customer@sana-homes.com',
            amount: Math.round(totalAmount * 100), // In kobo/pesewas
            currency: 'GHS',
            ref: 'SANA-' + Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
                full_name: checkoutData.name,
                phone: checkoutData.phone,
                location: checkoutData.location,
                address: checkoutData.address,
                model: checkoutData.model,
                quantity: checkoutData.quantity
            },
            callback: function (response) {
                // Call the bridge to async fulfillment
                fulfillOrder(response);
            },
            onClose: function () {
                console.log('Paystack window closed');
            }
        });
        handler.openIframe();
    };

    // completeOrder logic moved to backend edge function for security.
    const completeOrder = async (reference, amount) => {
        // Redundant - Logic now handled by paystack-verify function
    };

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
            setMobileMenuOpen(false);
        }
    };

    const openLightbox = (imgSrc) => {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;z-index:10000;cursor:pointer;backdrop-filter:blur(10px);';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,0.5);';

        lightbox.appendChild(img);
        document.body.appendChild(lightbox);

        lightbox.onclick = () => document.body.removeChild(lightbox);
    };

    return (
        <div className="landing-page">
            {/* Loading Animation */}
            <div className={`loading ${loading ? '' : 'hide'}`}>
                <div className="loader"></div>
            </div>

            {/* Custom Cursor */}
            <div className="cursor" ref={cursorRef}></div>
            <div className="cursor-follower" ref={cursorFollowerRef}></div>

            {/* Scroll Progress */}
            <div className="scroll-progress" style={{ width: `${scrollWidth}%` }}></div>

            {/* Back to Top */}
            <a href="#home" className={`back-to-top ${showBackToTop ? 'show' : ''}`} onClick={(e) => scrollToSection(e, 'home')}>
                <i className="fas fa-arrow-up"></i>
            </a>

            {/* Navbar */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${navbarHide ? 'hide' : ''}`}>
                <div className="container">
                    <div className="navbar-container">
                        <a href="#home" className="logo" onClick={(e) => scrollToSection(e, 'home')}>
                            <i className="fas fa-tricycle"></i>
                            Sana Homes
                        </a>
                        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
                            <li><a href="#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'home')}>Home</a></li>
                            <li><a href="#products" className={`nav-link ${activeSection === 'products' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'products')}>Products</a></li>
                            <li><a href="#features" className={`nav-link ${activeSection === 'features' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'features')}>Features</a></li>
                            <li><a href="#gallery" className={`nav-link ${activeSection === 'gallery' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'gallery')}>Gallery</a></li>
                            <li><a href="#testimonials" className={`nav-link ${activeSection === 'testimonials' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'testimonials')}>Reviews</a></li>
                            <li><a href="#contact" className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`} onClick={(e) => scrollToSection(e, 'contact')}>Contact</a></li>
                            <li><button className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', marginLeft: '1rem' }} onClick={onLoginClick}>Admin Login</button></li>
                        </ul>
                        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero" id="home">
                <div className="hero-bg" ref={heroBgRef}></div>
                <div className="hero-overlay"></div>
                <div className="floating-shape" style={{ top: '20%', left: '10%' }}></div>
                <div className="floating-shape" style={{ bottom: '20%', right: '10%', animationDelay: '-5s' }}></div>
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title" style={{ opacity: 1, transform: 'translateY(0)' }}>Welcome to Sana Homes of Tricyles</h1>
                        <p className="hero-subtitle" style={{ opacity: 1, transform: 'translateY(0)' }}>Durable, reliable, and designed to maximize your earnings. Our tricycles are engineered for the African market with unmatched quality and performance.</p>
                        <div className="hero-buttons" style={{ opacity: 1, transform: 'translateY(0)' }}>
                            <a href="#products" className="btn" onClick={(e) => scrollToSection(e, 'products')}>Explore Models</a>
                            <button className="btn btn-outline" onClick={() => { setCheckoutData({ ...checkoutData, model: 'Sana Homes Cargo Pro' }); setCheckoutStep(1); setCheckoutOpen(true); }}>Order Now</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section className="products" id="products">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Our Premium Models</h2>
                        <p className="section-subtitle">Choose from our range of high-quality tricycles designed for various business needs</p>
                    </div>
                    <div className="product-grid">
                        <div className="product-card">
                            <div className="product-image" style={{ backgroundImage: "url('/Images/download1.jpg')" }}></div>
                            <div className="product-info">
                                <h3 className="product-name">Sana Homes Cargo Pro</h3>
                                <div className="product-price">₵12,500</div>
                                <div className="product-specs">
                                    <div className="spec-item"><i className="fas fa-cube"></i><span>500kg Capacity</span></div>
                                    <div className="spec-item"><i className="fas fa-gas-pump"></i><span>25km/L</span></div>
                                </div>
                                <button className="btn" onClick={() => { setCheckoutData({ ...checkoutData, model: 'Sana Homes Cargo Pro' }); setCheckoutStep(1); setCheckoutOpen(true); }}>Order Now</button>
                            </div>
                        </div>
                        <div className="product-card">
                            <div className="product-image" style={{ backgroundImage: "url('/Images/download2.jpg')" }}></div>
                            <div className="product-info">
                                <h3 className="product-name">Sana Homes Passenger Deluxe</h3>
                                <div className="product-price">₵11,800</div>
                                <div className="product-specs">
                                    <div className="spec-item"><i className="fas fa-users"></i><span>6 Seats</span></div>
                                    <div className="spec-item"><i className="fas fa-gas-pump"></i><span>30km/L</span></div>
                                </div>
                                <button className="btn" onClick={() => { setCheckoutData({ ...checkoutData, model: 'Sana Homes Passenger Deluxe' }); setCheckoutStep(1); setCheckoutOpen(true); }}>Order Now</button>
                            </div>
                        </div>
                        <div className="product-card">
                            <div className="product-image" style={{ backgroundImage: "url('/Images/1000198277-removebg-preview-1.webp')" }}></div>
                            <div className="product-info">
                                <h3 className="product-name">Sana Homes Heavy Duty</h3>
                                <div className="product-price">₵15,200</div>
                                <div className="product-specs">
                                    <div className="spec-item"><i className="fas fa-cube"></i><span>800kg Capacity</span></div>
                                    <div className="spec-item"><i className="fas fa-gas-pump"></i><span>22km/L</span></div>
                                </div>
                                <button className="btn" onClick={() => { setCheckoutData({ ...checkoutData, model: 'Sana Homes Heavy Duty' }); setCheckoutStep(1); setCheckoutOpen(true); }}>Order Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose Sana Homes</h2>
                        <p className="section-subtitle">Our tricycles are built with quality materials and advanced engineering</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-shield-alt"></i></div>
                            <h3 className="feature-title">Durable Build</h3>
                            <p>Reinforced chassis and high-quality materials ensure longevity even in tough conditions</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-gas-pump"></i></div>
                            <h3 className="feature-title">Fuel Efficient</h3>
                            <p>Advanced engine technology delivers exceptional fuel economy to maximize your profits</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-tools"></i></div>
                            <h3 className="feature-title">Easy Maintenance</h3>
                            <p>Simple design with readily available parts makes maintenance quick and affordable</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><i className="fas fa-award"></i></div>
                            <h3 className="feature-title">Warranty</h3>
                            <p>Comprehensive warranty package with 2-year manufacturer guarantee</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="gallery" id="gallery">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Gallery</h2>
                        <p className="section-subtitle">See our tricycles in action</p>
                    </div>
                    <div className="gallery-grid">
                        {[
                            '/Images/download1.jpg',
                            '/Images/download2.jpg',
                            '/Images/1000198277-removebg-preview-1.webp',
                            '/Images/hero.png',
                            '/Images/login_bg.png',
                            '/Images/download1.jpg'
                        ].map((src, i) => (
                            <div key={i} className="gallery-item" onClick={() => openLightbox(src)}>
                                <img src={src} alt="Sana Homes Tricycle" className="gallery-image" />
                                <div className="gallery-overlay"><i className="fas fa-search-plus gallery-icon"></i></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials" id="testimonials">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">What Our Customers Say</h2>
                        <p className="section-subtitle">Real experiences from satisfied Sana Homes owners</p>
                    </div>
                    <div className="testimonials-grid">
                        {[
                            { name: 'Kwame Johnson', role: 'Delivery Owner', text: "My Sana Homes Cargo Pro has been a game-changer. It handles heavy loads effortlessly and the fuel efficiency is remarkable." },
                            { name: 'Adama Abdul', role: 'Transport Operator', text: "I've owned several tricycles, but none compare to Sana Homes. The Passenger Deluxe model is comfortable and reliable." },
                            { name: 'Nana Asante', role: 'Farm Owner', text: "The customer service is exceptional. They helped me choose the right model and the after-sales support is outstanding." }
                        ].map((t, i) => (
                            <div key={i} className="testimonial-card">
                                <div className="rating"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                                <p className="testimonial-content">"{t.text}"</p>
                                <div className="testimonial-author">
                                    <div className="author-avatar">{t.name.split(' ').map(n => n[0]).join('')}</div>
                                    <div className="author-info"><div className="author-name">{t.name}</div><div className="author-title">{t.role}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="map-section" id="contact">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Visit Our Location</h2>
                        <p className="section-subtitle">Come see our tricycles in person at our showroom</p>
                    </div>
                    <div className="map-container">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d31492.179718309017!2d-0.8819378!3d9.3754564!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfd43d477d21fe51%3A0x552eba873372e661!2sSana%20Homes!5e0!3m2!1sen!2sgh!4v1774481711617!5m2!1sen!2sgh" width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                    </div>
                </div>
            </section>

            {/* Order Section */}
            <section className="order" id="order">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Order Your Preferred Tricycle Today</h2>
                        <p className="section-subtitle">Fill in your details and we'll get back to you immediately</p>
                    </div>
                    <form className="order-form" ref={orderFormRef} onSubmit={handleSubmit}>
                        <div className="form-group" style={{ display: 'none' }}>
                            <label className="form-label">Website (Leave blank)</label>
                            <input type="text" name="website" tabIndex="-1" autoComplete="off" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input type="text" id="name" name="name" className="form-control" placeholder="Enter your full name" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input type="email" id="email" name="email" className="form-control" placeholder="Enter your email" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input type="tel" id="phone" name="phone" className="form-control" placeholder="Enter your phone number" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="location" className="form-label">Location</label>
                            <input type="text" id="location" name="location" className="form-control" placeholder="Enter your city/region" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="model" className="form-label">Preferred Model</label>
                            <select id="model" name="model" className="form-control" defaultValue="" required>
                                <option value="" disabled>Select a model</option>
                                <option value="Sana Homes Cargo Pro">Sana Homes Cargo Pro</option>
                                <option value="Sana Homes Passenger Deluxe">Sana Homes Passenger Deluxe</option>
                                <option value="Sana Homes Heavy Duty">Sana Homes Heavy Duty</option>
                            </select>
                        </div>
                        <button type="submit" className="btn" style={{ width: '100%' }}>{submitStatus || 'Submit Order'}</button>
                    </form>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div>
                            <a href="#home" className="footer-logo" onClick={(e) => scrollToSection(e, 'home')}>
                                <i className="fas fa-tricycle"></i> Sana Homes
                            </a>
                            <p className="footer-text">Premium tricycles built for business success. Quality, durability, and performance you can trust.</p>
                            <div className="social-links">
                                <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                            </div>
                        </div>
                        <div>
                            <h3 className="footer-title">Quick Links</h3>
                            <ul className="footer-links">
                                <li><a href="#home" className="footer-link" onClick={(e) => scrollToSection(e, 'home')}>Home</a></li>
                                <li><a href="#products" className="footer-link" onClick={(e) => scrollToSection(e, 'products')}>Products</a></li>
                                <li><a href="#contact" className="footer-link" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a></li>
                                <li><a href="#home" className="footer-link" onClick={onLoginClick}>Admin Login</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="footer-title">Contact Us</h3>
                            <p className="footer-text"><i className="fas fa-map-marker-alt"></i> Accra, Ghana</p>
                            <p className="footer-text"><i className="fas fa-phone"></i> +233 30 123 4567</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2023 Sana Homes Tricycles. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Button */}
            {/* Checkout Modal */}
            <div className={`checkout-overlay ${checkoutOpen ? 'active' : ''}`}>
                <div className="checkout-modal">
                    <div className="checkout-header">
                        <h2 className="checkout-title">
                            {checkoutStep === 5 ? 'Order Complete' : 'Secure Checkout'}
                        </h2>
                        <button className="checkout-close" onClick={() => setCheckoutOpen(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    {checkoutStep < 5 && (
                        <div className="checkout-progress">
                            {[1, 2, 3, 4].map(step => (
                                <div key={step} className={`progress-step ${checkoutStep >= step ? 'active' : ''} ${checkoutStep > step ? 'completed' : ''}`}></div>
                            ))}
                        </div>
                    )}

                    <div className="checkout-body">
                        {checkoutStep === 1 && (
                            <div className="step-content">
                                <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Confirm Product</h3>
                                <div className="product-summary" style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ width: '100px', height: '100px', backgroundSize: 'cover', borderRadius: '8px', backgroundImage: `url(${PRODUCTS[checkoutData.model]?.image})` }}></div>
                                    <div>
                                        <h4 style={{ color: 'var(--accent)' }}>{checkoutData.model}</h4>
                                        <p style={{ color: 'var(--text-secondary)' }}>Price: ₵{PRODUCTS[checkoutData.model]?.price.toLocaleString()}</p>
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <label style={{ color: 'white', fontSize: '0.9rem' }}>Qty:</label>
                                            <input type="number" min="1" name="quantity" value={checkoutData.quantity} onChange={handleCheckoutChange} style={{ width: '60px', padding: '0.3rem', background: 'var(--primary-dark)', border: '1px solid var(--border-color)', color: 'white' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {checkoutStep === 2 && (
                            <div className="step-content">
                                <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Personal Details</h3>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" name="name" value={checkoutData.name} onChange={handleCheckoutChange} className="form-control" placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Address (for receipt)</label>
                                    <input type="email" name="email" value={checkoutData.email} onChange={handleCheckoutChange} className="form-control" placeholder="john@example.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="tel" name="phone" value={checkoutData.phone} onChange={handleCheckoutChange} className="form-control" placeholder="024 XXX XXXX" />
                                </div>
                            </div>
                        )}

                        {checkoutStep === 3 && (
                            <div className="step-content">
                                <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Shipping Information</h3>
                                <div className="form-group">
                                    <label className="form-label">Region / City</label>
                                    <input type="text" name="location" value={checkoutData.location} onChange={handleCheckoutChange} className="form-control" placeholder="Greater Accra" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Detailed Delivery Address</label>
                                    <textarea name="address" value={checkoutData.address} onChange={handleCheckoutChange} className="form-control" rows="3" placeholder="House No, Street Name, Landmark..."></textarea>
                                </div>
                            </div>
                        )}

                        {checkoutStep === 4 && (
                            <div className="step-content">
                                <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Order Summary</h3>
                                <div className="summary-item"><span>Product</span><span>{checkoutData.model}</span></div>
                                <div className="summary-item"><span>Quantity</span><span>{checkoutData.quantity}</span></div>
                                <div className="summary-item"><span>Price per unit</span><span>₵{PRODUCTS[checkoutData.model]?.price.toLocaleString()}</span></div>
                                <div className="summary-total"><span>Total Amount</span><span>₵{(PRODUCTS[checkoutData.model]?.price * checkoutData.quantity).toLocaleString()}</span></div>

                                <div className="payment-badge">
                                    <i className="fas fa-lock"></i>
                                    Secure Payment via Paystack
                                </div>
                            </div>
                        )}

                        {checkoutStep === 5 && (
                            <div className="step-content" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div style={{ fontSize: '4rem', color: '#4CAF50', marginBottom: '1rem' }}>
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <h3 style={{ color: 'white', marginBottom: '1rem' }}>Order Confirmed! ID: {lastOrder}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    Thank you <strong style={{ color: 'white' }}>{checkoutData.name}</strong>, your payment was successful. We will contact you at <strong style={{ color: 'var(--accent)' }}>{checkoutData.phone}</strong> to arrange delivery.
                                </p>
                                <button className="btn" style={{ width: '100%' }} onClick={() => setCheckoutOpen(false)}>Close</button>
                            </div>
                        )}
                    </div>

                    {checkoutStep < 5 && (
                        <div className="checkout-footer">
                            {checkoutStep > 1 && (
                                <button className="btn btn-back" onClick={prevStep}>Back</button>
                            )}
                            {checkoutStep < 4 ? (
                                <button className="btn" style={{ flex: 1 }} onClick={nextStep}>Continue</button>
                            ) : (
                                <button
                                    className="btn btn-pay"
                                    style={{ flex: 1, position: 'relative', zIndex: 10, cursor: 'pointer' }}
                                    onClick={processPayment}
                                >
                                    Pay Now (₵{((PRODUCTS[checkoutData.model]?.price || 0) * (parseInt(checkoutData.quantity) || 1)).toLocaleString()})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Landing;
