import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Form, Button, Card, Container, Row, Col, ToggleButton, ButtonGroup, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaArrowLeft, FaLock, FaEnvelope, FaKey, FaCheckCircle } from 'react-icons/fa';
import authService from '../services/authService';
import quizLogo from '../assets/logo.png';

// Password input with toggle (defined outside AuthPage to prevent re-creation and focus loss)
const PasswordField = ({ name, placeholder, value, onChange, show, onToggle, className = "mb-3" }) => (
    <InputGroup className={className}>
        <Form.Control
            name={name}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            className="py-2 px-3 bg-light border-0 rounded-start-3 shadow-none"
            onChange={onChange}
            required
            style={{ borderRight: 'none' }}
        />
        <Button
            variant="light"
            className="bg-light border-0 rounded-end-3 d-flex align-items-center px-3"
            onClick={onToggle}
            type="button"
            tabIndex={-1}
            style={{ borderLeft: '1px solid #e9ecef' }}
        >
            {show ? <FaEye className="text-secondary" /> : <FaEyeSlash className="text-secondary" />}
        </Button>
    </InputGroup>
);

const AuthPage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('Student');
    const [showVerify, setShowVerify] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', level: '' });

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    // Forgot password state
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=OTP, 3=new password
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotCode, setForgotCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

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

        const trimmedEmail = formData.email.trim();

        if (!trimmedEmail.toLowerCase().endsWith('@fci.zu.edu.eg')) {
            setError("Please use your official university email (@fci.zu.edu.eg)");
            setLoading(false);
            return;
        }

        const emailPrefix = trimmedEmail.split('@')[0];
        const isNumericEmail = /^\d+$/.test(emailPrefix);

        if (role === 'Student' && !isNumericEmail) {
            setError("Staff/Instructor emails cannot be used to log in or register as a student.");
            setLoading(false);
            return;
        }
        if (role === 'Instructor' && isNumericEmail) {
            setError("Student numeric emails cannot be used to log in or register as an instructor.");
            setLoading(false);
            return;
        }

        // Confirm password validation for registration
        if (!isLogin && formData.password !== confirmPassword) {
            setError("Passwords do not match. Please make sure both passwords are identical.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const result = await authService.login(trimmedEmail, formData.password);
                if (result.role === 'Student') navigate('/student-dashboard');
                else navigate('/instructor-dashboard');
            } else {
                const payload = {
                    fullName: formData.fullName,
                    email: trimmedEmail,
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
            const sanitizedCode = verificationCode.replace(/\s+/g, '');
            await authService.verifyEmail(formData.email, sanitizedCode);
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

    // Forgot password handlers
    const handleForgotSubmitEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const trimmedEmail = forgotEmail.trim();
            await authService.forgotPassword(trimmedEmail);
            setForgotEmail(trimmedEmail);
            setForgotStep(2);
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || "Failed to send reset code."));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const sanitizedCode = forgotCode.replace(/\s+/g, '');
            const trimmedEmail = forgotEmail.trim();
            await authService.verifyResetCode(trimmedEmail, sanitizedCode);
            setForgotEmail(trimmedEmail);
            setForgotCode(sanitizedCode);
            setForgotStep(3);
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || "Invalid code."));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const sanitizedCode = forgotCode.replace(/\s+/g, '');
            const trimmedEmail = forgotEmail.trim();
            await authService.resetPassword(trimmedEmail, sanitizedCode, newPassword);
            setForgotSuccess(true);
        } catch (err) {
            setError(typeof err === 'string' ? err : (err.message || "Failed to reset password."));
        } finally {
            setLoading(false);
        }
    };

    const exitForgotMode = () => {
        setForgotMode(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setForgotSuccess(false);
        setError('');
    };

    const getTitle = () => {
        if (forgotMode) {
            if (forgotSuccess) return "Password Reset Successful!";
            if (forgotStep === 1) return "Reset Your Password";
            if (forgotStep === 2) return "Verify Reset Code";
            if (forgotStep === 3) return "Set New Password";
        }
        if (showVerify) return "Verify Account";
        return isLogin ? "Welcome Back" : "Create Account";
    };

    const getSubtitle = () => {
        if (forgotMode) {
            if (forgotSuccess) return null;
            if (forgotStep === 1) return "Enter your university email to receive a reset code.";
            if (forgotStep === 2) return `Enter the code sent to ${forgotEmail}`;
            if (forgotStep === 3) return "Choose a strong new password for your account.";
        }
        return null;
    };

    // Password input with toggle (now defined outside)

    return (
        <div style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', padding: '40px 0' }} className="d-flex align-items-center">
            <Container>
                <Row className="justify-content-center">
                    <Col md={8} lg={5}>
                        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                            <Card className="border-0 shadow-lg p-4 position-relative" style={{ borderRadius: '30px', overflow: 'hidden' }}>
                                <div style={{ height: '6px', width: '100%', background: forgotMode ? 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' : 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)', position: 'absolute', top: 0, left: 0 }}></div>
                                <div className="text-center mb-4">
                                    <motion.img
                                        src={quizLogo} alt="Logo" width="80"
                                        animate={{ rotate: isLogin ? 0 : 360 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="mb-3"
                                    />
                                    <h3 className="fw-bold text-dark">{getTitle()}</h3>
                                    {getSubtitle() && <p className="text-muted small mb-0 mt-1">{getSubtitle()}</p>}
                                </div>

                                {error && <Alert variant="danger" className="py-2 small rounded-3 border-0 shadow-sm">{error}</Alert>}

                                <AnimatePresence mode="wait">

                                    {/* ========== FORGOT PASSWORD FLOW ========== */}
                                    {forgotMode ? (
                                        <motion.div key="forgot-flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                                            {forgotSuccess ? (
                                                <div className="text-center py-3">
                                                    <div className="bg-success text-white rounded-circle mx-auto d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '64px', height: '64px', fontSize: '26px' }}>
                                                        <FaCheckCircle />
                                                    </div>
                                                    <p className="text-secondary mb-4">Your password has been reset successfully. You can now sign in with your new password.</p>
                                                    <Button
                                                        className="w-100 py-3 fw-bold shadow-sm border-0"
                                                        style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}
                                                        onClick={exitForgotMode}
                                                    >
                                                        Back to Sign In
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Step indicator */}
                                                    <div className="d-flex justify-content-center gap-2 mb-4">
                                                        {[1, 2, 3].map(step => (
                                                            <div
                                                                key={step}
                                                                style={{
                                                                    width: step === forgotStep ? '32px' : '10px',
                                                                    height: '10px',
                                                                    borderRadius: '10px',
                                                                    backgroundColor: step <= forgotStep ? '#F59E0B' : '#E5E7EB',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>

                                                    {forgotStep === 1 && (
                                                        <Form onSubmit={handleForgotSubmitEmail}>
                                                            <InputGroup className="mb-4">
                                                                <InputGroup.Text className="bg-light border-0 rounded-start-3">
                                                                    <FaEnvelope className="text-secondary" />
                                                                </InputGroup.Text>
                                                                <Form.Control
                                                                    type="email"
                                                                    placeholder="yourcode@fci.zu.edu.eg"
                                                                    className="py-3 px-3 bg-light border-0 rounded-end-3 shadow-none"
                                                                    value={forgotEmail}
                                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                                    required
                                                                />
                                                            </InputGroup>
                                                            <Button
                                                                type="submit"
                                                                className="w-100 py-3 fw-bold shadow-sm border-0"
                                                                style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
                                                                disabled={loading}
                                                            >
                                                                {loading ? <Spinner size="sm" /> : "Send Reset Code"}
                                                            </Button>
                                                        </Form>
                                                    )}

                                                    {forgotStep === 2 && (
                                                        <Form onSubmit={handleForgotVerifyCode}>
                                                            <InputGroup className="mb-4">
                                                                <InputGroup.Text className="bg-light border-0 rounded-start-3">
                                                                    <FaKey className="text-secondary" />
                                                                </InputGroup.Text>
                                                                <Form.Control
                                                                    placeholder="0000"
                                                                    className="py-3 text-center fw-bold fs-4 bg-light border-0 rounded-end-3 shadow-none"
                                                                    style={{ letterSpacing: '8px' }}
                                                                    value={forgotCode}
                                                                    onChange={(e) => setForgotCode(e.target.value)}
                                                                    required
                                                                />
                                                            </InputGroup>
                                                            <Button
                                                                type="submit"
                                                                className="w-100 py-3 fw-bold shadow-sm border-0"
                                                                style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
                                                                disabled={loading}
                                                            >
                                                                {loading ? <Spinner size="sm" /> : "Verify Code"}
                                                            </Button>
                                                        </Form>
                                                    )}

                                                    {forgotStep === 3 && (
                                                        <Form onSubmit={handleForgotResetPassword}>
                                                            <PasswordField
                                                                name="newPassword"
                                                                placeholder="New Password (min 6 characters)"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                show={showNewPassword}
                                                                onToggle={() => setShowNewPassword(!showNewPassword)}
                                                                className="mb-3"
                                                            />
                                                            <PasswordField
                                                                name="confirmNewPassword"
                                                                placeholder="Confirm New Password"
                                                                value={confirmNewPassword}
                                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                                show={showConfirmNewPassword}
                                                                onToggle={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                                className="mb-2"
                                                            />
                                                            {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                                                                <small className="text-danger d-block mb-3 fw-semibold">⚠ Passwords do not match</small>
                                                            )}
                                                            {newPassword && confirmNewPassword && newPassword === confirmNewPassword && (
                                                                <small className="text-success d-block mb-3 fw-semibold">✓ Passwords match</small>
                                                            )}
                                                            <Button
                                                                type="submit"
                                                                className="w-100 py-3 fw-bold shadow-sm border-0"
                                                                style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
                                                                disabled={loading}
                                                            >
                                                                {loading ? <Spinner size="sm" /> : "Reset Password"}
                                                            </Button>
                                                        </Form>
                                                    )}

                                                    <Button
                                                        variant="link"
                                                        className="w-100 mt-3 text-secondary text-decoration-none small d-flex align-items-center justify-content-center gap-2"
                                                        onClick={exitForgotMode}
                                                    >
                                                        <FaArrowLeft size={12} /> Back to Sign In
                                                    </Button>
                                                </>
                                            )}
                                        </motion.div>

                                    ) : !showVerify ? (
                                        /* ========== AUTH FORM (LOGIN / REGISTER) ========== */
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

                                                {/* Password with eye toggle */}
                                                <PasswordField
                                                    name="password"
                                                    placeholder="Password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    show={showPassword}
                                                    onToggle={() => setShowPassword(!showPassword)}
                                                    className={isLogin ? "mb-2" : "mb-3"}
                                                />

                                                {/* Confirm Password (Register only) */}
                                                {!isLogin && (
                                                    <>
                                                        <PasswordField
                                                            name="confirmPassword"
                                                            placeholder="Confirm Password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            show={showConfirmPassword}
                                                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="mb-2"
                                                        />
                                                        {formData.password && confirmPassword && formData.password !== confirmPassword && (
                                                            <small className="text-danger d-block mb-3 fw-semibold">⚠ Passwords do not match</small>
                                                        )}
                                                        {formData.password && confirmPassword && formData.password === confirmPassword && (
                                                            <small className="text-success d-block mb-3 fw-semibold">✓ Passwords match</small>
                                                        )}
                                                    </>
                                                )}

                                                {/* Forgot Password link (Login only) */}
                                                {isLogin && (
                                                    <div className="text-end mb-3">
                                                        <Button
                                                            variant="link"
                                                            className="p-0 text-decoration-none small fw-semibold"
                                                            style={{ color: '#4F46E5' }}
                                                            onClick={() => { setForgotMode(true); setError(''); }}
                                                        >
                                                            Forgot Password?
                                                        </Button>
                                                    </div>
                                                )}

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
                                        /* ========== EMAIL VERIFICATION ========== */
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
