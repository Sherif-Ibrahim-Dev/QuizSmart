import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import quizLogo from '../assets/logo.png';

const MyNavbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (pathname.startsWith('/exam/')) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Navbar
      bg="white"
      expand="lg"
      className="py-1 sticky-top border-bottom transition-all glass shadow-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        zIndex: 1050
      }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2 border-0 text-decoration-none">
          <motion.img
            src={quizLogo}
            alt="QuizSmart"
            style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          />
          <span
            className="fw-bold text-dark d-none d-md-inline"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.6rem',
              letterSpacing: '-0.5px',
              lineHeight: 1
            }}
          >
            Quiz<span style={{ color: '#4F46E5' }}>Smart</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-4 mt-2 mt-lg-0">
            <Nav.Link as={Link} to="/" className="fw-semibold text-secondary hover-lift">Home</Nav.Link>

            {user && user.fullName ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="white" className="border-0 p-0 d-flex align-items-center gap-2 shadow-none">
                  <img
                    src={`https://ui-avatars.com/api/?name=${user.fullName}&background=4F46E5&color=fff`}
                    alt="Profile"
                    className="rounded-circle shadow-sm border border-2 border-primary-subtle"
                    width="35"
                    height="35"
                  />
                  <span className="fw-bold text-dark d-none d-md-inline">
                    {user.fullName.split(' ')[0]}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="border-0 shadow-lg rounded-4 p-2 mt-2">
                  <Dropdown.Item as={Link} to={user.role === 'Student' ? '/student-dashboard' : '/instructor-dashboard'} className="rounded-3 py-2 fw-semibold">
                    Dashboard
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="rounded-3 py-2 fw-semibold text-danger">
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="rounded-pill px-4 py-2 fw-bold border-0 shadow-sm"
                style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
              >
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MyNavbar;
