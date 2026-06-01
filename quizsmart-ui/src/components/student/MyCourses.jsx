import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaBookOpen, FaFolderOpen, FaCheckCircle, FaStar } from 'react-icons/fa';
import studentService from '../../services/studentService';

const MyCourses = () => {
    const [showModal, setShowModal] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData?.userId || userData?.UserId;

    useEffect(() => {
        if (userId) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const courses = await studentService.getAllCourses();
            setAllCourses(courses || []);

            if (Array.isArray(courses)) {
                setMyCourses(courses.filter(c => c.isEnrolled));
            }
        } catch (err) {
            console.error("Error loading courses:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId) => {
        try {
            await studentService.enrollInCourse(courseId);
            loadData();
            alert("Successfully enrolled in the course!");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Enrollment failed";
            alert(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    const nonEnrolledCourses = allCourses.filter(c => !c.isEnrolled);

    return (
        <div className="p-4 animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1 text-dark">My Academic Courses</h3>
                    <p className="text-secondary small mb-0">Track your academic progress and registered courses</p>
                </div>
                <Button
                    variant="primary"
                    className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
                    onClick={() => setShowModal(true)}
                    style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
                >
                    <FaPlus /> Enroll in Course
                </Button>
            </div>

            <Row className="g-4">
                {myCourses.length > 0 ? myCourses.map((course, idx) => {
                    const gradientIndex = idx % 3;
                    const gradients = [
                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                        'linear-gradient(135deg, #135058 0%, #f107a3 100%)'
                    ];
                    const bgStyles = [
                        { bg: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)', text: '#fff' },
                        { bg: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)', text: '#fff' },
                        { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: '#fff' }
                    ];
                    const design = bgStyles[gradientIndex];

                    return (
                        <Col md={4} key={course.courseId}>
                            <Card className="border-0 shadow-sm rounded-4 h-100 overflow-hidden hover-lift transition-all">
                                <div style={{ background: design.bg, height: '140px' }} className="p-4 d-flex flex-column justify-content-between">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <Badge bg="white" text="dark" className="rounded-pill px-3 py-1 fw-bold border">
                                            {course.courseCode}
                                        </Badge>
                                        <FaStar className="text-warning" />
                                    </div>
                                    <div className="text-white">
                                        <small className="opacity-75">Course</small>
                                        <h5 className="fw-bold mb-0 text-truncate">{course.courseName}</h5>
                                    </div>
                                </div>
                                <Card.Body className="p-4">
                                    <p className="text-secondary small mb-3" style={{ height: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {course.description || "No course description available."}
                                    </p>
                                    <div className="d-flex justify-content-between text-muted small fw-bold pt-3 border-top">
                                        <span>📚 {course.creditHours} Credits</span>
                                        <span>Year {course.academicYear} - Sem {course.semester}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                }) : (
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm rounded-5 py-5 text-center bg-white">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <FaFolderOpen size={64} className="text-muted mb-3 opacity-25" />
                                <h4 className="fw-bold text-dark">No Enrolled Courses</h4>
                                <p className="text-secondary mb-4 max-w-400">You are not enrolled in any subjects yet. Click the enrollment button to join academic courses.</p>
                                <Button
                                    variant="outline-primary"
                                    className="rounded-pill px-4 fw-bold"
                                    onClick={() => setShowModal(true)}
                                >
                                    Register Now
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>


            <Modal show={showModal} onHide={() => setShowModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold text-dark">Academic Course Catalog</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    {nonEnrolledCourses.length > 0 ? nonEnrolledCourses.map(c => (
                        <div key={c.courseId} className="d-flex justify-content-between align-items-center p-3 mb-2 bg-light rounded-4 border border-light transition-all hover-shadow">
                            <div>
                                <Badge bg="light" text="primary" className="mb-1 border border-primary-subtle">{c.courseCode}</Badge>
                                <h6 className="fw-bold mb-0 text-dark">{c.courseName}</h6>
                                <small className="text-muted">{c.creditHours} hours • Year {c.academicYear} • Sem {c.semester}</small>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                className="rounded-pill px-4 fw-bold shadow-sm"
                                onClick={() => handleEnroll(c.courseId)}
                                style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
                            >
                                Join
                            </Button>
                        </div>
                    )) : (
                        <div className="text-center py-4 text-muted">
                            <FaCheckCircle className="text-success mb-2" size={32} />
                            <p className="fw-bold mb-0">Excellent!</p>
                            <span className="small text-secondary">You are enrolled in all available courses.</span>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MyCourses;
