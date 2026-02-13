import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useInView } from "react-intersection-observer";
import "./App.css";
import Terminal from "./terminal";

import fitrealmImg from "./assets/projects/fitrealm.webp";
import kiranaImg from "./assets/projects/kirana.webp";
import tgbsImg from "./assets/projects/tgbs.webp";

import introVideo from './assets/video/intro.mp4';

import object1 from "./assets/object-1.png";
import object2 from "./assets/object-2.png";
const object4 = object1;



gsap.registerPlugin(ScrollTrigger);

const projectCards = [
  {
    img: fitrealmImg,   // import these at the top of file
    title: "FitRealm – AI Fitness Platform",
    desc: "AI-powered fitness platform with personalized workout plans, RAG-powered coaching, dashboards, and FitG real-time chatbot.",
    link: "https://thefitrealm.in"
  },
  {
    img: kiranaImg,
    title: "Kirana Friends – AI Retail Assistant",
    desc: "Mobile + web platform with GPT-4 powered chatbot, OCR modules, ML models, and intelligent shelf analytics.",
    link: "https://kiranafriends.com"
  },
  {
    img: tgbsImg,
    title: "TGBS Mumbai – Official Website",
    desc: "SSR Express.js website with CMS, brand UI, NGINX deployment, SSL, caching, and 90% faster load speed.",
    link: "https://tgbsmumbai.in"
  }
];


export default function App() {

  const [showIntro, setShowIntro] = useState(true);

  // [ADD THIS] Lock body scroll while intro is playing
  useEffect(() => {
    if (showIntro) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showIntro]);

  // Smooth scroll helpers
  const scrollToAbout = () => {
    const about = document.querySelector(".about-section");
    if (about) about.scrollIntoView({ behavior: "smooth" });
  };


  const handleNavClick = (target) => {
    const sectionMap = {
      About: ".about-section",
      "Tech Stack": ".techstack-section",
      Projects: ".projects-section",
      Contact: ".contact-section",
      Terminal: ".terminal-section"
    };

    const selector = sectionMap[target];

    if (!selector) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const section = document.querySelector(selector);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };


  // --- GSAP ANIMATIONS ---
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });
  const { ref: aboutRef, inView: aboutInView } = useInView({ threshold: 0.2 });


  // Mouse parallax for objects
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    gsap.to(".object-1", { x: x * 1.2, y: y * 1.2, duration: 0.6, ease: "expo.out" });
    gsap.to(".object-2", { x: x * 1.6, y: y * 1.6, duration: 0.6, ease: "expo.out" });
    gsap.to(".object-4", { x: x * 1.1, y: y * 1.1, duration: 0.6, ease: "expo.out" });
  });

  // --- ABOUT SECTION SCROLL ANIMATIONS ---
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".about-section",
        start: "top bottom",    // Starts when section enters bottom
        end: "bottom top",      // Ends when section leaves top
        scrub: 1,
      }
    });

    tl.fromTo(
      ".about-content, .object-4",
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, ease: "none" }
    );

    tl.to(
      ".about-content, .object-4",
      { y: -100, opacity: 0, ease: "none" }
    );

    return () => tl.kill();
  }, []);

  // --- HERO SCROLL-AWAY ANIMATION ---
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom+=150 top",
        scrub: 1,
      }
    });

    tl.to(
      ".hero-content, .navbar, .tagline, .hero-smalltext, .scroll-btn",
      {
        y: -80,
        opacity: 0,
        ease: "power2.out",
        stagger: 0.05,
      }
    );

    tl.to(".object-1, .object-2", {
      opacity: 0,
      y: -60,
      ease: "power2.out"
    }, "<");


    return () => tl.kill();
  }, []);


  // Floating animation for objects (slow, infinite)
  const floatConfigs = [
    { selector: ".object-1", duration: 7, y: 8, rot: 14 },
    { selector: ".object-2", duration: 8, y: -6, rot: -12 },
    { selector: ".object-4", duration: 6.0, y: -6, rot: -14 },
  ];

  floatConfigs.forEach((cfg) => {
    gsap.to(cfg.selector, {
      y: cfg.y,
      rotation: cfg.rot,
      duration: cfg.duration,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  });

  // Mouse parallax for background overlay
  const moveBg = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    gsap.to(".overlay-bg", {
      backgroundPosition: `${50 + x}% ${50 + y}%`,
      duration: 0.6,
      ease: "expo.out"
    });
  };

  window.addEventListener("mousemove", moveBg);

  // Gyro

  useEffect(() => {

    const handleGyro = (event) => {
      const { beta, gamma } = event;

      if (beta === null || gamma === null) return;

      const x = (gamma / 90) * 20;
      const y = (beta / 180) * 20;

      gsap.to(".object-1", { x: x * 1.2, y: y * 1.2, duration: 0.4, ease: "expo.out" });
      gsap.to(".object-2", { x: x * 1.6, y: y * 1.6, duration: 0.4, ease: "expo.out" });
      gsap.to(".object-4", { x: x * 1.1, y: y * 1.1, duration: 0.4, ease: "expo.out" });

      gsap.to(".overlay-bg", {
        backgroundPosition: `${50 + x * 0.4}% ${50 + y * 0.4}%`,
        duration: 0.4,
        ease: "expo.out",
      });
    };

    const enableGyro = () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then((response) => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handleGyro);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientation", handleGyro);
      }
    };
    window.addEventListener("click", enableGyro, { once: true });
    return () => {
      window.removeEventListener("deviceorientation", handleGyro);
    };
  }, []);

  // Tech Stack

  const techStack = [
    {
      title: "Frameworks & Languages",
      items: [
        "Python",
        "JavaScript",
        "TypeScript",
        "Go",
        "SQL",
        "React",
        "React Native",
        "Node.js",
        "Express",
        "Flask",
        "FastAPI"
      ]
    },

    {
      title: "AI / ML",
      items: [
        "LLMs",
        "Computer Vision",
        "OCR",
        "Model Training",
        "LLAVA",
        "Azure Cognitive Services",
        "OpenAI",
        "Azure OpenAI",
        "Gemini",
        "LangChain",
        "RAG",
        "FAISS"
      ]
    },

    {
      title: "DevOps",
      items: [
        "NGINX",
        "Docker",
        "Git",
        "CI/CD",
        "Vercel",
        "REST",
        "WebSockets",
        "SSR",
        "Microservices",
        "SEO",
        "Caching",
        "Performance Optimization"
      ]
    },

    {
      title: "Data",
      items: [
        "Power BI",
        "Tableau",
        "Retool",
        "Google Analytics",
        "Dashboards",
        "MySQL",
        "PostgreSQL",
        "MongoDB"
      ]
    }
  ];

  const [activeTechIndex, setActiveTechIndex] = useState(0);
  // 1. Create the ref
  const techStackRef = useRef(null);

  // 2. TECH STACK SECTION SCROLL ANIMATION (Parallax/Scrub effect)
  useEffect(() => {
    const el = techStackRef.current;

    // Create a timeline that spans the entire scroll duration of the section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom", // Start when top of section hits bottom of viewport
        end: "bottom top",   // End when bottom of section hits top of viewport
        scrub: 1,            // Smooth scrubbing linked to scrollbar
      }
    });

    // Animate IN (Entry)
    tl.fromTo(
      ".techstack-wrapper .techstack-title-col, .techstack-wrapper .techstack-list",
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, ease: "power2.out", stagger: 0.1 }
    );

    // Animate OUT (Exit) - Optional: add a hold phase or immediate exit
    tl.to(
      ".techstack-wrapper .techstack-title-col, .techstack-wrapper .techstack-list",
      { y: -100, opacity: 0, ease: "power2.in", stagger: 0.1 }
    );

    return () => tl.kill();
  }, []);

  // 3. TECH CARD ANIMATION (Replaces CSS Animation)
  useEffect(() => {
    // Kill existing animations to prevent conflicts
    gsap.killTweensOf(".tech-card");

    gsap.fromTo(
      ".tech-card",
      {
        y: 20,
        opacity: 0,
        scale: 0.9
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.05, // Cascading effect
        ease: "back.out(1.7)", // Subtle "pop" effect
        overwrite: "auto"
      }
    );
  }, [activeTechIndex]);

  // Projects Carousel
  const carouselRef = useRef(null);
  const projectsRef = useRef(null);

  // --- AUTO SCROLL EVERY 5 SECONDS ---
  useEffect(() => {
    const slider = carouselRef.current;
    if (!slider) return;

    const scrollAmount = slider.clientWidth; // Scroll one card width

    const interval = setInterval(() => {
      slider.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });

      // Loop back to start when reaching the end
      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 50) {
        setTimeout(() => {
          slider.scrollTo({ left: 0, behavior: "smooth" });
        }, 600);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // --- [ADD THIS] PROJECTS SECTION SCROLL ANIMATION ---
  useEffect(() => {
    const el = projectsRef.current;

    // Timeline linked to scroll position
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom", // Start animating when section enters viewport
        end: "bottom top",   // End animating when section leaves viewport
        scrub: 1,            // Smooth scrubbing
      }
    });

    // Animate IN (Entry)
    tl.fromTo(
      ".projects-content",
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, ease: "power2.out" }
    );

    // Animate OUT (Exit)
    tl.to(
      ".projects-content",
      { y: -100, opacity: 0, ease: "power2.in" }
    );

    return () => tl.kill();
  }, []);

  // Terminal and Contact Animations

  const terminalRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      }
    });

    tl.fromTo(
      ".terminal-section",
      { y: 120, opacity: 0 },
      { y: 0, opacity: 1, ease: "power2.out" }
    );

    tl.to(
      ".terminal-section",
      { y: -120, opacity: 0, ease: "power2.in" }
    );

    return () => tl.kill();
  }, []);


  useEffect(() => {
    const el = contactRef.current;
    if (!el) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      }
    });

    tl.fromTo(
      ".contact-title-col, .contact-content",
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, ease: "power2.out", stagger: 0.12 }
    );

    tl.to(
      ".contact-title-col, .contact-content",
      { y: -100, opacity: 0, ease: "power2.in", stagger: 0.12 }
    );

    return () => tl.kill();
  }, []);




  return (
    <div className="app-container" id="style-1">
      {showIntro && (
        <div
          className="intro-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: "#000", // Background color in case video loads slowly
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <video
            src={introVideo}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onEnded={() => {
              // Optional: Fade out effect with GSAP before removing
              gsap.to(".intro-overlay", {
                opacity: 0,
                duration: 0.8,
                onComplete: () => setShowIntro(false)
              });
            }}
          />
        </div>
      )}
      <div className="overlay-bg">
        <section className="hero-section" ref={heroRef}>
          <img className="object object-1" src={object1} alt="floating object 1" />
          <img className="object object-2" src={object2} alt="floating object 2" />

          <nav className="navbar" aria-label="Main navigation">
            <a onClick={() => handleNavClick("About")}>About</a>
            <a onClick={() => handleNavClick("Tech Stack")}>Tech Stack</a>
            <a onClick={() => handleNavClick("Projects")}>Projects</a>
            <a onClick={() => handleNavClick("Contact")}>Contact</a>
          </nav>


          <div className="hero-content" role="banner">
            <h1>
              Hi, I'm <span>Sahil</span>
            </h1>
            <p className="tagline">Full Stack AI Developer</p>
          </div>


          <div className="hero-smalltext">
            Building fast, intelligent, and scalable products.
          </div>

          <button
            className="scroll-btn"
            aria-label="Scroll to About"
            onClick={scrollToAbout}
          >
            <span className="arrow">→</span>
          </button>
        </section>

        <section className="about-section" ref={aboutRef}>
          <img className="object object-4" src={object4} alt="floating object 4" />


          <div className="about-content">
            <h2>Who am I?</h2>
            <p>
              I'm Sahil, a Full-Stack AI engineer who builds fast, intuitive, and
              intelligent digital experiences. I don't write code for the sake of
              code. I write systems that think. Websites that respond. Apps that
              guide. Dashboards that tell stories.
            </p>
          </div>
        </section>
      </div>

      <section className="projects-section" ref={projectsRef}>
        <div className="projects-container">
          <div className="projects-content">
            <div className="projects-header">
              <h2 className="vertical-text">Projects</h2>
            </div>

            <div className="projects-carousel-container">
              <div className="projects-carousel" ref={carouselRef} >
                {projectCards.map((p, index) => (
                  <div className="project-card" key={index}>
                    <img src={p.img} alt={p.title} className="project-img" />
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <a className="project-btn" href={p.link} target="_blank" rel="noopener noreferrer">
                      <span class="arrow">→</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </section>

      <section className="techstack-section">
        <div className="techstack-wrapper" ref={techStackRef}>
          <div className="techstack-layout">
            {/* Left Side: Vertical Title */}
            <div className="techstack-title-col">
              <h2 className="vertical-text">TechStack</h2>
            </div>

            {/* Right Side: Categories List */}
            <div className="techstack-list">
              {techStack.map((stack, index) => (
                <div
                  key={index}
                  className={`tech-category ${index === activeTechIndex ? "active" : ""}`}
                  onMouseEnter={() => setActiveTechIndex(index)}
                >
                  <span className="category-name">{stack.title}</span>
                  <span className="arrow-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </span>
                </div>
              ))}
              <div className="tech-grid-container">

                <div className="tech-grid">
                  {techStack[activeTechIndex].items.map((item, i) => (
                    <div key={i} className="tech-card">
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="terminal-section" ref={terminalRef}>
        <Terminal />
      </section>

      <section className="contact-section" ref={contactRef}>
        <div className="contact-wrapper">
          <div className="contact-title-col">
            <h2 className="vertical-text">Contact Me</h2>
          </div>
          <div className="contact-content">
            <h2>Let's Connect!</h2>
            <p>
              I'm always open to discussing new projects, creative ideas, or
              opportunities to be part of your visions. Feel free to reach out!
            </p>
            <hr className="contact-divider" />
            <div className="contact-container">
              <div className="contact-links">
                <a href="tel:+919082056583" className="contact-link">
                  <img src="/assets/icons/phone.webp" alt="Phone Icon" />
                </a>
                <a href="mailto:sahilsawant182@gmail.com" className="contact-link">
                  <img src="/assets/icons/mail.webp" alt="Email Icon" />
                </a>
                <a href="https://www.linkedin.com/in/sahilsawant182/" target="_blank" rel="noopener noreferrer" className="contact-link">
                  <img src="/assets/icons/linkedin.webp" alt="LinkedIn Icon" />
                </a>
                <a href="https://www.instagram.com/just.sahil_/" target="_blank" rel="noopener noreferrer" className="contact-link">
                  <img src="/assets/icons/insta.webp" alt="Instagram Icon" />
                </a>
              </div>


              <form action="https://formspree.io/f/mayvlvza" method="POST" className="contact-form">
                <input type="text" name="name" placeholder="Your Name" required />
                <input type="email" name="email" placeholder="Your Email" required />
                <textarea name="message" rows="5" placeholder="Your Message" required></textarea>
                <button type="submit" className="submit-btn">
                  <span className="arrow">→</span>
                </button>
              </form>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
};