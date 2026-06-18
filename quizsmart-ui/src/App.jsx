import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Spinner } from 'react-bootstrap';
import MyNavbar from './components/MyNavbar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ExamWindow from './components/student/ExamWindow';
import quizLogo from './assets/logo.png';
import { FaGraduationCap, FaClipboardCheck, FaChartLine, FaShieldAlt, FaRandom, FaBolt } from 'react-icons/fa';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#04030D' }}>
        <Spinner animation="border" style={{ color: '#818CF8', width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const Home = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <FaClipboardCheck size={28} />, title: "Smart Exam Builder", desc: "Create exams manually or use AI-powered random generation from your question bank." },
    { icon: <FaRandom size={28} />, title: "Random Generation", desc: "Randomize questions and answer options to ensure academic integrity." },
    { icon: <FaChartLine size={28} />, title: "Live Analytics", desc: "Track student performance with real-time dashboards and grade breakdowns." },
    { icon: <FaShieldAlt size={28} />, title: "Secure & Fair", desc: "Timed exams, anti-cheat measures and verified university email access." },
    { icon: <FaGraduationCap size={28} />, title: "Student Portal", desc: "Students view available exams, submit answers, and track their academic progress." },
    { icon: <FaBolt size={28} />, title: "Instant Results", desc: "MCQ exams are auto-graded instantly. Written answers support manual review." },
  ];

  const stats = [
    { value: "100+", label: "Active Exams" },
    { value: "500+", label: "Students Enrolled" },
    { value: "3000+", label: "Questions in Bank" },
    { value: "99%", label: "Uptime Guarantee" },
  ];

  return (
    <div style={{ backgroundColor: '#04030D', minHeight: '100vh', overflowX: 'hidden' }}>


      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>


        <div style={{
          position: 'absolute', top: '10%', left: '5%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)',
          filter: 'blur(60px)', borderRadius: '50%', animation: 'floatOrb 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '5%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)', borderRadius: '50%', animation: 'floatOrb 10s ease-in-out infinite reverse'
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '800px', height: '800px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 65%)',
          borderRadius: '50%'
        }} />


        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />


        <div className="container text-center position-relative" style={{ zIndex: 2, padding: '80px 20px' }}>


          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(129,140,248,0.2) 100%)',
              border: '1px solid rgba(129,140,248,0.4)',
              color: '#a5b4fc',
              padding: '6px 20px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '30px',
              backdropFilter: 'blur(10px)'
            }}>
              🎓 FCI Zagazig University — Official Exam Portal
            </span>
          </motion.div>


          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '48px' }}>

            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '230px', height: '230px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }} />
            <motion.img
              src={quizLogo}
              alt="QuizSmart"
              style={{
                width: '200px',
                position: 'relative',
                zIndex: 2,
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.45))'
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.2 },
                scale: { duration: 0.5, delay: 0.2 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
              }}
            />
          </div>


          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.8rem, 6vw, 5rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '24px',
              letterSpacing: '-1px'
            }}
          >
            Testing Becomes{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #C4B5FD 50%, #67E8F9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Simple.
            </span>
          </motion.h1>


          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'rgba(255,255,255,0.55)',
              maxWidth: '600px',
              margin: '0 auto 48px',
              lineHeight: 1.7,
              fontWeight: 400
            }}
          >
            The official smart examination platform for Faculty of Computers & Information,{' '}
            <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Zagazig University.</span>
          </motion.p>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="d-flex justify-content-center gap-3 flex-wrap"
          >
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: '#fff',
                border: 'none',
                padding: '16px 44px',
                borderRadius: '100px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 40px rgba(79,70,229,0.5)',
                transition: 'all 0.3s ease',
                fontFamily: "'Outfit', sans-serif"
              }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 0 60px rgba(79,70,229,0.7)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 0 40px rgba(79,70,229,0.5)'; }}
            >
              Get Started →
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: '16px 36px',
                borderRadius: '100px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                fontFamily: "'Outfit', sans-serif"
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(129,140,248,0.5)'; e.target.style.color = '#fff'; e.target.style.background = 'rgba(79,70,229,0.15)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.color = 'rgba(255,255,255,0.7)'; e.target.style.background = 'transparent'; }}
            >
              Sign In
            </button>
          </motion.div>
        </div>
      </div>


      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(129,140,248,0.08) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '60px 0'
        }}
      >
        <div className="container">
          <div className="row g-4 text-center">
            {stats.map((stat, i) => (
              <div className="col-6 col-md-3" key={i}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#818CF8', fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '8px', fontWeight: 500 }}>
                    {stat.label}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>


      <div style={{ padding: '100px 0' }} className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-5"
        >
          <span style={{
            display: 'inline-block', color: '#818CF8', fontWeight: 600,
            fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px'
          }}>
            Platform Features
          </span>
          <h2 style={{ color: '#fff', fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
            Everything you need to{' '}
            <span style={{ color: '#818CF8' }}>run great exams</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Built for instructors and students at FCI Zagazig University.
          </p>
        </motion.div>

        <div className="row g-4">
          {features.map((f, i) => (
            <div className="col-md-6 col-lg-4" key={i}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px',
                  padding: '32px',
                  height: '100%',
                  cursor: 'default',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{
                  y: -6,
                  borderColor: 'rgba(129,140,248,0.3)',
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(129,140,248,0.05) 100%)'
                }}
              >
                <div style={{
                  width: '56px', height: '56px',
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.3) 0%, rgba(129,140,248,0.2) 100%)',
                  border: '1px solid rgba(129,140,248,0.3)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#818CF8', marginBottom: '20px'
                }}>
                  {f.icon}
                </div>
                <h5 style={{ color: '#fff', fontWeight: 700, fontFamily: "'Outfit', sans-serif", marginBottom: '10px' }}>{f.title}</h5>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>


      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ padding: '80px 20px', textAlign: 'center' }}
      >
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(79,70,229,0.2) 0%, rgba(129,140,248,0.1) 100%)',
          border: '1px solid rgba(129,140,248,0.2)',
          borderRadius: '32px',
          padding: '60px 40px',
          backdropFilter: 'blur(20px)'
        }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '16px' }}>
            Ready to start your exam?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '36px', fontSize: '1.05rem' }}>
            Sign in with your university email to access the platform.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
              color: '#fff',
              border: 'none',
              padding: '16px 50px',
              borderRadius: '100px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 50px rgba(79,70,229,0.4)',
              transition: 'all 0.3s ease',
              fontFamily: "'Outfit', sans-serif"
            }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 0 70px rgba(79,70,229,0.7)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 0 50px rgba(79,70,229,0.4)'; }}
          >
            Enter the Portal →
          </button>
        </div>
      </motion.div>


      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '30px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.25)',
        fontSize: '0.85rem'
      }}>
        © 2026 QuizSmart — FCI Zagazig University. All rights reserved.
      </div>

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-main">
          <MyNavbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />

            <Route path="/instructor-dashboard" element={<ProtectedRoute><InstructorDashboard /></ProtectedRoute>} />

            <Route path="/exam/:examId" element={<ProtectedRoute><ExamWindow /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
