import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CookieNotice } from "../components/CookieNotice";
import { LoginModal } from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import gymLogo from "../assets/gym-logo.jpeg";
import topImage1 from "../assets/gym-gallery/top-1.jpeg";
import topImage2 from "../assets/gym-gallery/top-2.jpeg";
import topImage3 from "../assets/gym-gallery/top-3.jpeg";
import topImage4 from "../assets/gym-gallery/top-4.jpeg";
import topImage5 from "../assets/gym-gallery/top-5.jpeg";
import topImage6 from "../assets/gym-gallery/top-6.jpeg";
import topImage7 from "../assets/gym-gallery/top-7.jpeg";
import supplementImage1 from "../assets/supplements/supplement-1.jpg";
import supplementImage2 from "../assets/supplements/supplement-2.jpg";
import supplementImage3 from "../assets/supplements/supplement-3.jpg";
import supplementImage4 from "../assets/supplements/supplement-4.jpg";
import supplementImage5 from "../assets/supplements/supplement-5.jpg";
import supplementImage6 from "../assets/supplements/supplement-6.jpg";

const highlights = [
  {
    title: "Elite Strength Zone",
    text: "Power racks, Olympic bars, battle ropes, and a premium strength floor built for serious progression.",
  },
  {
    title: "Cardio Lab",
    text: "Performance treadmills, assault bikes, rowers, and interval stations designed for conditioning.",
  },
  {
    title: "Recovery & Coaching",
    text: "Guided plans, mobility work, trainer support, and structured scheduling for sustainable results.",
  },
];

const topGymGallery = [
  {
    src: topImage1,
    alt: "Old School Fitness Gym Haldwani athlete portrait",
    caption: "Power Pose",
  },
  {
    src: topImage2,
    alt: "Old School Fitness Gym Haldwani cable training session",
    caption: "Focused Training",
  },
  {
    src: topImage3,
    alt: "Old School Fitness Gym Haldwani back pose photo",
    caption: "Back Strength",
  },
  {
    src: topImage4,
    alt: "Old School Fitness Gym Haldwani flex pose",
    caption: "Muscle Control",
  },
  {
    src: topImage5,
    alt: "Old School Fitness Gym Haldwani mirror selfie in the gym",
    caption: "Gym Floor",
  },
  {
    src: topImage6,
    alt: "Old School Fitness Gym Haldwani motivation pose",
    caption: "No Excuses",
  },
  {
    src: topImage7,
    alt: "Old School Fitness Gym Haldwani athlete standing pose",
    caption: "Peak Shape",
  },
];

const gymGallery = [
  {
    src: gymLogo,
    alt: "Old School Fitness Gym Haldwani logo",
    caption: "Old School Fitness Gym",
  },
  {
    src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    alt: "Strength training area inspired by Old School Fitness Gym Haldwani",
    caption: "Strength Zone",
  },
  {
    src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    alt: "Workout floor inspired by Old School Fitness Gym Haldwani",
    caption: "Workout Floor",
  },
  {
    src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80",
    alt: "Cardio section inspired by Old School Fitness Gym Haldwani",
    caption: "Cardio Area",
  },
  {
    src: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=80",
    alt: "Gym interior inspired by Old School Fitness Gym Haldwani",
    caption: "Gym Interior",
  },
  {
    src: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?auto=format&fit=crop&w=900&q=80",
    alt: "Fitness training vibe inspired by Old School Fitness Gym Haldwani",
    caption: "Training Energy",
  },
];

const supplementGallery = [
  {
    src: supplementImage1,
    alt: "Whey protein supplement jar",
    caption: "Gold Standard Whey",
  },
  {
    src: supplementImage2,
    alt: "Vitamin D3 supplement bottle",
    caption: "Vitamin D3",
  },
  {
    src: supplementImage3,
    alt: "Glutamine supplement jar",
    caption: "Glutaking",
  },
  {
    src: supplementImage4,
    alt: "Daily vitamin bottles",
    caption: "Daily Vitamins",
  },
  {
    src: supplementImage5,
    alt: "Nitric oxide supplement bottle",
    caption: "Nitric Oxide",
  },
  {
    src: supplementImage6,
    alt: "Supplement stack collection",
    caption: "Complete Stack",
  },
];

const trainingFocusAreas = [
  "Strength and muscle building plans for visible progress",
  "Fat-loss focused routines with cardio and discipline",
  "Beginner-friendly coaching with form correction and support",
  "Performance-based programming for stamina and consistency",
];

const personalTrainingBenefits = [
  "One-to-one exercise guidance with proper technique focus",
  "Goal-based planning for muscle gain, fat loss, and fitness",
  "Workout accountability to keep members disciplined and regular",
  "Safer progression through better posture, form, and recovery",
];

function renderStars(value) {
  const filledStars = Math.round(Number(value) || 0);

  return Array.from({ length: 5 }, (_, index) => (index < filledStars ? "★" : "☆")).join("");
}

export function LandingPage() {
  const feedbackPerPage = 5;
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState({
    averageRating: 0,
    totalFeedback: 0,
  });
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [timelineMessage, setTimelineMessage] = useState("");

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    navigate(user.role === "admin" ? "/admin" : "/client", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    async function loadFeedback() {
      try {
        const [data, timelineData] = await Promise.all([
          api.get("/feedback"),
          api.get("/feedback/timeline"),
        ]);

        setFeedback(data.feedback || []);
        setFeedbackSummary(data.summary || { averageRating: 0, totalFeedback: 0 });
        setTimelineMessage(timelineData.timeline?.content || "");
      } catch (error) {
        setFeedbackError(error.message);
      }
    }

    loadFeedback();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(feedback.length / feedbackPerPage));
    setFeedbackPage((current) => Math.min(current, totalPages));
  }, [feedback.length]);

  const totalFeedbackPages = Math.max(1, Math.ceil(feedback.length / feedbackPerPage));
  const paginatedFeedback = feedback.slice(
    (feedbackPage - 1) * feedbackPerPage,
    feedbackPage * feedbackPerPage
  );

  return (
    <>
      <div className="landing-page">
        <header className="hero-nav">
          <a href="#home" className="brand-mark">
            <img src={gymLogo} alt="Old School Fitness Gym logo" className="brand-logo" />
            <span>OLD SCHOOL FITNESS GYM</span>
          </a>
          <button
            type="button"
            className="hero-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="landing-navigation"
            onClick={() => setMenuOpen((current) => !current)}
          >
            Menu
          </button>
          <nav id="landing-navigation" className={menuOpen ? "open" : ""}>
            <a href="#programs" onClick={() => setMenuOpen(false)}>
              Programs
            </a>
            <a href="#about" onClick={() => setMenuOpen(false)}>
              About
            </a>
            <a href="#training" onClick={() => setMenuOpen(false)}>
              Training
            </a>
            <a href="#supplements" onClick={() => setMenuOpen(false)}>
              Supplement
            </a>
            <a href="#privacy" onClick={() => setMenuOpen(false)}>
              Privacy
            </a>
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setDocsOpen(true);
                setMenuOpen(false);
              }}
            >
              Documentation
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setLoginOpen(true);
                setMenuOpen(false);
              }}
            >
              Login / Join
            </button>
          </nav>
        </header>

        {timelineMessage ? (
          <section className="site-timeline-banner" aria-label="Gym timeline news">
            <div className="site-timeline-track">
              {[0, 1].map((copy) => (
                <div className="site-timeline-group" key={copy}>
                  <span className="site-timeline-pill">Latest Update</span>
                  <strong>{timelineMessage}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="feedback-summary-banner">
          <div>
            <span className="eyebrow">Client Rating</span>
            <h3>{feedbackSummary.averageRating ? `${feedbackSummary.averageRating}/5 Rated` : "Waiting For First Rating"}</h3>
            <p>
              {feedbackSummary.totalFeedback
                ? `${feedbackSummary.totalFeedback} client feedback message(s) shared with the gym.`
                : "Client feedback will appear here once members start sharing their experience."}
            </p>
          </div>
          <div className="feedback-summary-actions">
            <div className="feedback-stars-display" aria-label={`Average rating ${feedbackSummary.averageRating} out of 5`}>
              {renderStars(feedbackSummary.averageRating)}
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setFeedbackPage(1);
                setFeedbackOpen(true);
              }}
            >
              View Feedback
            </button>
          </div>
        </section>

        <section className="top-gallery-section" aria-label="Old School Fitness Gym featured photos">
          <div className="top-gallery-copy">
            <span className="eyebrow">Gym Highlights</span>
            <h2>Real moments from Old School Fitness Gym Haldwani.</h2>
          </div>
          <div className="gym-carousel top-gym-carousel">
            <div className="gym-carousel-track">
              {[...topGymGallery, ...topGymGallery].map((image, index) => (
                <article
                  key={`top-${image.caption}-${index}`}
                  className="gym-carousel-card top-gym-carousel-card"
                  aria-hidden={index >= topGymGallery.length ? "true" : undefined}
                >
                  <img src={image.src} alt={image.alt} />
                  <div className="gym-carousel-overlay">
                    <span>{image.caption}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="home" className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Train Hard. Track Smart.</span>
            <h1>Push harder than yesterday if you want a different tomorrow.</h1>
            <p>
              Built for modern gyms—empower your members, streamline your
              operations, and control everything from one intelligent system.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => setLoginOpen(true)}>
                Enter Portal
              </button>
              <button type="button" className="ghost-button" onClick={() => setDocsOpen(true)}>
                How It Works
              </button>
              <a className="secondary-button" href="#programs">
                View Facilities
              </a>
            </div>
            <div className="hero-metrics">
              <div>
                <strong>24/7</strong>
                <span>Access-ready member experience</span>
              </div>
              <div>
                <strong>2-step</strong>
                <span>Password reset verification flow</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Role-based dashboard routing</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-frame">
              <div className="visual-badge">Premium Gym Theme</div>
              <div className="visual-grid">
                <div className="visual-panel panel-tall">
                  <img
                    src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80"
                    alt="Athlete lifting weights in a gym"
                  />
                </div>
                <div className="visual-panel">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80"
                    alt="Modern gym with training equipment"
                  />
                </div>
                <div className="visual-panel">
                  <img
                    src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80"
                    alt="Gym cardio area with treadmills"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section reel-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Gym Reels</span>
              <h2>Watch the energy of OLD SCHOOL FITNESS GYM.</h2>
            </div>
          </div>
          <div className="reel-grid">
            <div className="reel-embed-card">
              <iframe
                title="Old School Fitness Gym Instagram Reel 1"
                src="https://www.instagram.com/reel/DLeQ6h4vzT5/embed"
                allowTransparency="true"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
              />
            </div>
            <div className="reel-embed-card">
              <iframe
                title="Old School Fitness Gym Instagram Reel 2"
                src="https://www.instagram.com/reel/DLMJvI7vRaJ/embed"
                allowTransparency="true"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
              />
            </div>
            <div className="reel-embed-card">
              <iframe
                title="Old School Fitness Gym Instagram Reel 3"
                src="https://www.instagram.com/reel/DMiHZkrPigQ/embed"
                allowTransparency="true"
                allowFullScreen
                frameBorder="0"
                scrolling="no"
              />
            </div>
          </div>
          <div className="gallery-heading">
            <div>
              <span className="eyebrow">Gym Gallery</span>
              <h3>Old School Fitness Gym Haldwani in motion.</h3>
            </div>
            <p>Photos move automatically from right to left so the section feels alive after the reels.</p>
          </div>
          <div className="gym-carousel" aria-label="Old School Fitness Gym Haldwani photo carousel">
            <div className="gym-carousel-track">
              {[...gymGallery, ...gymGallery].map((image, index) => (
                <article
                  key={`${image.caption}-${index}`}
                  className="gym-carousel-card"
                  aria-hidden={index >= gymGallery.length ? "true" : undefined}
                >
                  <img src={image.src} alt={image.alt} />
                  <div className="gym-carousel-overlay">
                    <span>{image.caption}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="programs" className="content-section dark-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Training Spaces</span>
              <h2>Built around energy, movement, and measurable progress.</h2>
            </div>
          </div>
          <div className="highlight-grid">
            {highlights.map((item) => (
              <article key={item.title} className="highlight-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="content-section split-section">
          <div>
            <span className="eyebrow">About</span>
            <h2>OLD SCHOOL FITNESS GYM is built for serious training, strong discipline, and lasting results.</h2>
            <p>
              Address: The Old School Fitness Gym, Rampur Rd, opposite S.K.M School,
              Dahariya, Haldwani, Dewarchaur Kham, Uttarakhand 263139
            </p>
            <p>Phone: 082736 72577</p>
            <p>Hours: Open · Closes 10 pm</p>
            <a
              className="secondary-button map-link-button"
              href="https://www.google.com/maps/search/?api=1&query=The%20Old%20School%20Fitness%20Gym%2C%20Rampur%20Rd%2C%20opposite%20S.K.M%20School%2C%20Dahariya%2C%20Haldwani%2C%20Dewarchaur%20Kham%2C%20Uttarakhand%20263139"
              target="_blank"
              rel="noreferrer"
            >
              View Gym Location
            </a>
          </div>
          <div className="feature-stack">
            <div className="feature-card">
              <h3>Gym Atmosphere</h3>
              <p>Train in a focused old-school environment with strength equipment, cardio stations, and a high-energy workout floor.</p>
            </div>
            <div className="feature-card">
              <h3>Coaching Support</h3>
              <p>Members get structured plan tracking, schedule support, and a gym setup designed to help beginners and advanced lifters improve.</p>
            </div>
            <div className="feature-card">
              <h3>Member Experience</h3>
              <p>From joining to renewal, the gym keeps member details, plans, and progress organized in one simple system.</p>
            </div>
          </div>
        </section>

        <section id="training" className="content-section dark-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Training</span>
              <h2>Structured coaching for strength, fitness, discipline, and long-term progress.</h2>
            </div>
          </div>
          <div className="training-showcase">
            <article className="training-feature-card training-main-card">
              <span className="trainer-highlight">Daily Gym Training</span>
              <h3>Serious training built for people who want real change.</h3>
              <p>
                Our training environment is designed for members who want more than
                casual workouts. The focus is on discipline, progressive overload,
                better exercise execution, and a routine that produces visible results
                over time. Whether the goal is muscle gain, fat loss, strength, or
                full-body fitness, members train in a motivating space that supports
                regular effort and long-term consistency.
              </p>
              <div className="training-badges">
                <span>Strength</span>
                <span>Fat Loss</span>
                <span>Muscle Gain</span>
                <span>Endurance</span>
              </div>
              <div className="training-points-grid">
                {trainingFocusAreas.map((item) => (
                  <div key={item} className="training-point-card">
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="training-feature-card personal-training-card">
              <span className="trainer-highlight">Personal Training</span>
              <h3>Focused coaching with personal attention from Hritik Anand.</h3>
              <p>
                Personal training is built for members who want expert guidance, closer
                monitoring, and faster improvement through a structured plan. Every
                session gives attention to form, exercise selection, workout intensity,
                and consistency so members can train with more confidence and waste less effort.
              </p>
              <div className="personal-training-meta">
                <div>
                  <strong>1-to-1 Guidance</strong>
                  <span>Direct correction, motivation, and progress tracking</span>
                </div>
                <div>
                  <strong>Goal Specific</strong>
                  <span>Programs shaped around body transformation and performance</span>
                </div>
              </div>
              <div className="training-benefit-list">
                {personalTrainingBenefits.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section id="supplements" className="content-section supplement-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Supplement Zone</span>
              <h2>Right support for recovery, strength, energy, and daily performance.</h2>
            </div>
          </div>
          <div className="supplement-copy-card">
            <p>
              Good supplements can support your training routine when they are paired
              with disciplined workouts, proper sleep, and a balanced diet.
            </p>
            <p>
              Protein helps with muscle recovery, vitamins support daily wellness,
              and performance formulas can improve workout consistency and energy.
            </p>
            <p>
              At Old School Fitness Gym, supplements are presented as support tools,
              not shortcuts, so members can stay focused on smart and steady progress.
            </p>
            <p>
              Choosing the right product for your goal makes recovery better, training
              more efficient, and long-term fitness results easier to maintain.
            </p>
          </div>
          <div className="gym-carousel supplement-carousel" aria-label="Supplement product carousel">
            <div className="gym-carousel-track supplement-carousel-track">
              {[...supplementGallery, ...supplementGallery].map((item, index) => (
                <article
                  key={`${item.caption}-${index}`}
                  className="gym-carousel-card supplement-carousel-card"
                  aria-hidden={index >= supplementGallery.length ? "true" : undefined}
                >
                  <img src={item.src} alt={item.alt} />
                  <div className="gym-carousel-overlay">
                    <span>{item.caption}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacy" className="content-section privacy-panel">
          <span className="eyebrow">Privacy & Consent</span>
          <h2>Your gym details stay safe, simple, and member-friendly.</h2>
          <p>
            We collect only the details needed to manage your membership, workout plans,
            and account access. Your information is handled with care so members can focus
            on training, staying consistent, and reaching their fitness goals with confidence.
          </p>
        </section>

        <footer className="landing-footer">
          <div className="footer-brand-block">
            <a href="#home" className="brand-mark footer-brand">
              <img src={gymLogo} alt="Old School Fitness Gym logo" className="brand-logo" />
              <span>OLD SCHOOL FITNESS GYM</span>
            </a>
            <p>
              Old-school intensity, disciplined training, and a smarter member experience for
              Haldwani.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <span className="eyebrow">Explore</span>
              <a href="#programs">Programs</a>
              <a href="#about">About</a>
              <a href="#training">Training</a>
              <a href="#supplements">Supplement</a>
              <a href="#privacy">Privacy</a>
            </div>
            <div>
              <span className="eyebrow">Visit</span>
              <p>Rampur Rd, opposite S.K.M School, Dahariya, Haldwani</p>
              <p>082736 72577</p>
              <p>Open till 10 pm</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>Copyright © Abhishek Jeena</p>
            <p>Built for Old School Fitness Gym Haldwani.</p>
          </div>
        </footer>
      </div>
      <CookieNotice />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {feedbackOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card feedback-modal">
            <button className="modal-close" onClick={() => setFeedbackOpen(false)} type="button">
              x
            </button>
            <span className="eyebrow">Client Feedback</span>
            <h3>What members are saying</h3>
            {feedbackError ? <p className="form-error">{feedbackError}</p> : null}
            <div className="feedback-list">
              {feedback.length ? (
                paginatedFeedback.map((item) => (
                  <article className="feedback-card" key={item.id}>
                    <div className="feedback-card-head">
                      <div>
                        <strong>{item.full_name}</strong>
                        <p>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.created_at))}</p>
                      </div>
                      <div className="feedback-card-rating">{renderStars(item.rating)}</div>
                    </div>
                    <p>{item.comment}</p>
                  </article>
                ))
              ) : (
                <p className="feedback-empty">No client feedback has been shared yet.</p>
              )}
            </div>
            {feedback.length > feedbackPerPage ? (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setFeedbackPage((current) => Math.max(1, current - 1))}
                  disabled={feedbackPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-label">
                  Page {feedbackPage} of {totalFeedbackPages}
                </span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setFeedbackPage((current) => Math.min(totalFeedbackPages, current + 1))
                  }
                  disabled={feedbackPage === totalFeedbackPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {docsOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card docs-modal">
            <button className="modal-close" onClick={() => setDocsOpen(false)} type="button">
              x
            </button>
            <span className="eyebrow">Documentation</span>
            <h3>How to use the website</h3>

            <div className="docs-section">
              <h4>What is available on this website</h4>
              <p>
                This website is made for OLD SCHOOL FITNESS GYM to manage members,
                training details, supplements, privacy, feedback, and daily gym operations from one place.
              </p>
              <p>
                Visitors can explore gym photos, reels, training details, supplement highlights,
                privacy details, location information, and client feedback from the landing page.
                Members can join or log in, and admins can manage the full client list and landing updates.
              </p>
            </div>

            <div className="docs-section">
              <h4>How members use it</h4>
              <p>
                Members can register with their basic details, choose a membership plan,
                and set their joining date.
              </p>
              <p>
                After login, members can update their profile, check their membership
                start date, finish date, and plan type, manage their workout schedule,
                and submit feedback that appears on the landing page.
              </p>
              <p>
                When a membership is close to ending, a renewal popup appears on login
                to remind the member to take a new subscription.
              </p>
            </div>

            <div className="docs-section">
              <h4>How admins use it</h4>
              <p>
                Admins can add new clients, update client records, delete clients, and
                open each member profile to view important details like plan, join date,
                and plan end date.
              </p>
              <p>
                Admins can also check plan alerts to quickly see which memberships are
                expired or close to expiry, and they can manage the landing page timeline
                message that scrolls across the public website.
              </p>
            </div>

            <div className="docs-section">
              <h4>Main features</h4>
              <p>
                The website includes member registration, secure login, role-based
                dashboard access, profile editing, password reset, membership plan
                tracking, training information, gym location details, privacy information,
                client feedback, a featured gym gallery, a supplement carousel, and an
                expanded personal training showcase.
              </p>
            </div>

            <div className="docs-section">
              <h4>Landing page highlights</h4>
              <p>
                The landing page includes a top photo carousel, a client rating summary,
                Instagram reels, a moving gym gallery, a detailed training section, and
                a supplement section with real uploaded product images.
              </p>
              <p>
                The Training area explains gym training focus, member goals, and personal
                training benefits, making it one of the most important sections for new visitors.
              </p>
            </div>

            <div className="docs-section">
              <h4>Quick steps</h4>
              <p>1. Open the landing page and explore gym details, training, and supplements.</p>
              <p>2. Click Login / Join to create a member account or sign in.</p>
              <p>3. Members manage their profile, schedules, and feedback from the client dashboard.</p>
              <p>4. Admins manage all clients, plan activity, and timeline updates from the admin dashboard.</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
