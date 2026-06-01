import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Badge, Button } from 'react-bootstrap';
import { FaBook, FaClock, FaChartLine, FaSignOutAlt, FaUserGraduate } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';

import MyCourses from '../components/student/MyCourses';
import CurrentlyExams from '../components/student/CurrentlyExams';
import GradesProgress from '../components/student/GradesProgress';

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [liveExamsCount, setLiveExamsCount] = useState(0);
    const navigate = useNavigate();

    const savedUser = JSON.parse(localStorage.getItem('user'));

    const user = {
        name: savedUser?.fullName || "Student Name",
        userId: savedUser?.userId || savedUser?.UserId,
        role: "STUDENT"
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    useEffect(() => {
        if (user.userId) {
            studentService.getAvailableExams(user.userId)
                .then(exams => {
                    setLiveExamsCount(exams.length || 0);
                })
                .catch(err => console.error("Error loading live exams count:", err));
        }
    }, [user.userId, activeTab]);

    const getInitials = (name) => {
        if (!name) return 'ST';
        return name
            .split(' ')
            .filter(Boolean)
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'courses': return <MyCourses />;
            case 'exams':   return <CurrentlyExams />;
            case 'grades':  return <GradesProgress />;
            default:        return <MyCourses />;
        }
    };

    return (
        <Container fluid className="p-0 overflow-hidden" style={{ height: '100vh', backgroundColor: '#f8f9fa' }}>
            <Row className="g-0 h-100">

                <Col md={3} lg={2} className="d-flex flex-column shadow-lg" style={{ background: 'linear-gradient(180deg, #1E1B4B 0%, #0F0E17 100%)', zIndex: 10 }}>
                    <div className="text-center py-5 border-bottom border-secondary-subtle" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>

                        <div className="mx-auto mb-3 shadow d-flex align-items-center justify-content-center bg-primary text-white rounded-circle border border-2 border-white-50"
                             style={{ width: '75px', height: '75px', fontSize: '1.4rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}>
                            {getInitials(user.name)}
                        </div>
                        <h6 className="fw-bold mb-1 px-3 text-white text-truncate text-capitalize" title={user.name}>{user.name}</h6>

                        <Badge
                            bg="light"
                            text="primary"
                            className="text-uppercase fw-bold px-3 py-1 mt-1 shadow-sm border border-light-subtle"
                            style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#4F46E5 !important' }}
                        >
                            <FaUserGraduate className="me-1" /> {user.role}
                        </Badge>
                    </div>


                    <Nav className="flex-column p-3 gap-2 flex-grow-1">
                        <Nav.Link
                            onClick={() => setActiveTab('courses')}
                            className={`rounded-4 p-3 d-flex align-items-center border-0 transition-all ${activeTab === 'courses' ? 'bg-primary text-white shadow fw-bold' : 'text-white-50 hover-sidebar-link'}`}
                            style={activeTab === 'courses' ? { backgroundColor: '#4F46E5' } : {}}
                        >
                            <FaBook className="me-3 fs-5" /> My Courses
                        </Nav.Link>

                        <Nav.Link
                            onClick={() => setActiveTab('exams')}
                            className={`rounded-4 p-3 d-flex align-items-center justify-content-between border-0 transition-all ${activeTab === 'exams' ? 'bg-primary text-white shadow fw-bold' : 'text-white-50 hover-sidebar-link'}`}
                            style={activeTab === 'exams' ? { backgroundColor: '#4F46E5' } : {}}
                        >
                            <div className="d-flex align-items-center">
                                <FaClock className="me-3 fs-5" /> Currently Exams
                            </div>
                            {liveExamsCount > 0 && (
                                <Badge pill bg={activeTab === 'exams' ? 'light' : 'danger'} text={activeTab === 'exams' ? 'primary' : 'white'} className="shadow-sm">
                                    {liveExamsCount}
                                </Badge>
                            )}
                        </Nav.Link>

                        <Nav.Link
                            onClick={() => setActiveTab('grades')}
                            className={`rounded-4 p-3 d-flex align-items-center border-0 transition-all ${activeTab === 'grades' ? 'bg-primary text-white shadow fw-bold' : 'text-white-50 hover-sidebar-link'}`}
                            style={activeTab === 'grades' ? { backgroundColor: '#4F46E5' } : {}}
                        >
                            <FaChartLine className="me-3 fs-5" /> Grades & Progress
                        </Nav.Link>
                    </Nav>


                    <div className="p-3"></div>
                </Col>


                <Col md={9} lg={10} className="overflow-auto bg-light d-flex flex-column">

                    <div className="bg-white px-5 py-4 shadow-sm border-bottom d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="fw-bold mb-0 text-dark">
                                {getGreeting()}, <span className="text-primary text-capitalize">{user.name.split(' ')[0]}!</span>
                            </h4>
                            <span className="text-secondary small fw-semibold">Ready to excel in your academic exams today?</span>
                        </div>
                        <Badge bg="primary-light" className="text-primary border border-primary-subtle rounded-pill px-3 py-2 fw-bold" style={{ backgroundColor: '#EEF2F6', color: '#4F46E5' }}>
                            🏫 FCI_Zagazig Portal
                        </Badge>
                    </div>

                    <div className="p-4 flex-grow-1">
                        <div className="h-100 bg-white shadow-sm rounded-5 p-2 border border-light-subtle">
                            {renderContent()}
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default StudentDashboard;
