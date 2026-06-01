import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Form, Button, Card, Container, Row, Col, ToggleButton, ButtonGroup, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import quizLogo from '../assets/logo.png';

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('Student');
    const [showVerify, setShowVerify] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', level: '' });

    useEffect(() => {
        const existingUser = localStorage.getItem('user');
        if (existingUser) {
            try {
                const parsed = JSON.parse(existingUser);
                if (parsed?.role === 'Student') {
                    navigate('/student-dashboard', { replace: true });
                } else if (parsed?.role === 'Instructor') {
                    navigate('/instructor-dashboard', { replace: true });
                }
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, [navigate]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.email.endsWith('@fci.zu.edu.eg')) {
            setError("Please use your official university email (@fci.zu.edu.eg)");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const result = await authService.login(formData.email, formData.password);
                if (result.role === 'Student') navigate('/student-dashboard');
                else navigate('/instructor-dashboard');
            } else {
                const payload = {
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: role,
                    level: role === 'Student' ? parseInt(formData.level) : 0
                };
                await authService.register(payload);
                setShowVerify(true);
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || "Connection error with server"));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.verifyEmail(formData.email, verificationCode);
            alert("Account Activated! You can now sign in.");
            setIsLogin(true);
            setShowVerify(false);
       } catch (err) {
            const serverMessage = err.response?.data?.message || err.response?.data || "Connection error with server";
            setError(serverMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', padding: '40px 0' }} className="d-flex align-items-center">
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={5}>
                        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                            <Card className="border-0 shadow-lg p-4 position-relative" style={{ borderRadius: '30px', overflow: 'hidden' }}>
                                <div style={{ height: '6px', width: '100%', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)', position: 'absolute', top: 0, left: 0 }}></div>
                                <div className="text-center mb-4">
                                    <motion.img
                                        src={quizLogo} alt="Logo" width="80"
                                        animate={{ rotate: isLogin ? 0 : 360 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="mb-3"
                                    />
                                    <h3 className="fw-bold text-dark">{showVerify ? "Verify Account" : (isLogin ? "Welcome Back" : "Create Account")}</h3>
                                </div>

                                {error && <Alert variant="danger" className="py-2 small rounded-3 border-0 shadow-sm">{error}</Alert>}

                                <AnimatePresence mode="wait">
                                    {!showVerify ? (
                                        <motion.div key="auth-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <Form onSubmit={handleSubmit}>
                                                <div className="bg-light p-1 mb-4 d-flex" style={{ borderRadius: '15px' }}>
                                                    <Button variant={isLogin ? "white" : "light"} className={`w-50 border-0 shadow-${isLogin ? "sm" : "none"} rounded-3 fw-bold`} onClick={() => {setIsLogin(true); setError('');}}>Login</Button>
                                                    <Button variant={!isLogin ? "white" : "light"} className={`w-50 border-0 shadow-${!isLogin ? "sm" : "none"} rounded-3 fw-bold`} onClick={() => {setIsLogin(false); setError('');}}>Register</Button>
                                                </div>
                                                <div className="mb-3 text-center">
                                                    <ButtonGroup className="w-100 p-1 bg-light" style={{ borderRadius: '12px' }}>
                                                        <ToggleButton type="radio" variant={role === 'Student' ? 'primary' : 'light'} checked={role === 'Student'} onClick={() => setRole('Student')} className="border-0 rounded-3 fw-bold shadow-none" style={role === 'Student' ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' } : {}}>Student</ToggleButton>
                                                        <ToggleButton type="radio" variant={role === 'Instructor' ? 'primary' : 'light'} checked={role === 'Instructor'} onClick={() => setRole('Instructor')} className="border-0 rounded-3 fw-bold shadow-none" style={role === 'Instructor' ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' } : {}}>Instructor</ToggleButton>
                                                    </ButtonGroup>
                                                </div>
                                                {!isLogin && <Form.Control name="fullName" placeholder="Full Name" className="mb-3 py-2 px-3 bg-light border-0 rounded-3 shadow-none" onChange={handleInputChange} required />}
                                                <Form.Control name="email" type="email" placeholder={role === 'Student' ? 'code@fci.zu.edu.eg' : 'name@fci.zu.edu.eg'} className="mb-3 py-2 px-3 bg-light border-0 rounded-3 shadow-none" onChange={handleInputChange} required />
                                                {!isLogin && role === 'Student' && (
                                                    <Form.Select name="level" className="mb-3 py-2 px-3 bg-light border-0 rounded-3 shadow-none" onChange={handleInputChange} required>
                                                        <option value="">Select Academic Year...</option>
                                                        <option value="1">First Year</option><option value="2">Second Year</option>
                                                        <option value="3">Third Year</option><option value="4">Fourth Year</option>
                                                    </Form.Select>
                                                )}
                                                <Form.Control name="password" type="password" placeholder="Password" className="mb-4 py-2 px-3 bg-light border-0 rounded-3 shadow-none" onChange={handleInputChange} required />
                                                <Button
                                                    type="submit"
                                                    className="w-100 py-3 fw-bold shadow-sm border-0"
                                                    style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}
                                                    disabled={loading}
                                                >
                                                    {loading ? <Spinner size="sm" /> : (isLogin ? "Sign In" : "Create Account")}
                                                </Button>
                                            </Form>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="verify-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                            <p className="text-center text-muted small mb-4">Enter the code sent to your official email.</p>
                                            <Form onSubmit={handleVerify}>
                                                <Form.Control placeholder="0000" className="mb-4 py-3 text-center fw-bold fs-4 bg-light border-0 shadow-none" style={{ borderRadius: '15px', letterSpacing: '8px' }} onChange={(e) => setVerificationCode(e.target.value)} required />
                                                <Button variant="success" type="submit" className="w-100 py-3 fw-bold shadow-sm rounded-4" disabled={loading}>{loading ? <Spinner size="sm" /> : "Verify & Activate"}</Button>
                                                <Button variant="link" className="w-100 mt-2 text-secondary text-decoration-none small" onClick={() => setShowVerify(false)}>Edit Email</Button>
                                            </Form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AuthPage;
