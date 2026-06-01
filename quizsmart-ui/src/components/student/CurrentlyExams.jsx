import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Badge } from 'react-bootstrap';
import { FaClock, FaCalendarTimes, FaExclamationTriangle, FaSignInAlt, FaPlay, FaDoorOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import studentService from '../../services/studentService';

const CurrentlyExams = () => {
    const [liveExams, setLiveExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user?.userId) {
            studentService.getAvailableExams(user.userId).then(setLiveExams).catch(console.error);
        }
    }, [user?.userId]);

    const handleEnterExamClick = (exam) => {
        setSelectedExam(exam);
        setShowConfirmModal(true);
    };

    const handleConfirmEntry = () => {
        setShowConfirmModal(false);
        navigate(`/exam/${selectedExam.examId}`);
    };

    const formatEndTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 animate__animated animate__fadeIn">
            <div className="mb-4">
                <h3 className="fw-bold mb-1 text-dark">Available & Active Exams</h3>
                <p className="text-secondary small mb-0">Select an exam to begin. Please read all rules before entering.</p>
            </div>

            <Row className="g-4">
                {liveExams.length > 0 ? liveExams.map(exam => {
                    const isResume = exam.hasStarted;
                    return (
                        <Col md={6} key={exam.examId}>
                            <Card className={`border-0 shadow-sm rounded-4 bg-white overflow-hidden transition-all hover-shadow border-start border-5 ${isResume ? 'border-success' : 'border-danger'}`}>
                                <Card.Body className="p-4 d-flex justify-content-between align-items-center">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <h5 className="fw-bold mb-0 text-dark">{exam.title}</h5>
                                            {isResume && (
                                                <Badge bg="success" className="rounded-pill px-2 py-1 small animate__animated animate__flash animate__infinite">
                                                    In Progress
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="d-flex flex-column gap-1 text-secondary small fw-semibold">
                                            <span className="d-flex align-items-center gap-2">
                                                <FaClock className="text-primary" /> Duration: {exam.durationInMinutes} mins
                                            </span>
                                            <span className="d-flex align-items-center gap-2">
                                                <FaCalendarTimes className="text-danger" /> Window Closes: {formatEndTime(exam.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant={isResume ? 'success' : 'danger'}
                                        className="rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                                        onClick={() => handleEnterExamClick(exam)}
                                    >
                                        {isResume ? (
                                            <>
                                                <FaPlay /> Resume
                                            </>
                                        ) : (
                                            <>
                                                <FaSignInAlt /> Enter
                                            </>
                                        )}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                }) : (
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm rounded-5 py-5 text-center bg-white">
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                                <FaDoorOpen size={64} className="text-muted mb-3 opacity-25" />
                                <h4 className="fw-bold text-dark">No Active Exams</h4>
                                <p className="text-secondary mb-0 max-w-400">There are no exams currently active for your enrolled courses. Keep studying! 🔥</p>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>


            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered className="rounded-4">
                <Modal.Header closeButton className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold text-danger d-flex align-items-center gap-2">
                        <FaExclamationTriangle /> Security Rules Warning
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    {selectedExam && (
                        <>
                            <p className="text-dark fw-bold mb-3">
                                You are about to enter: <span className="text-primary">{selectedExam.title}</span>
                            </p>
                            <Card className="border-0 bg-light p-3 rounded-4 mb-3">
                                <h6 className="fw-bold text-secondary mb-2">Exam Integrity Guidelines:</h6>
                                <ul className="small text-secondary mb-0 ps-3">
                                    <li className="mb-2"><strong>Focus Mode:</strong> Do NOT close, refresh, or switch tabs. Any tab-switching will trigger a cheat warning. The 2nd warning will automatically lock the exam.</li>
                                    <li className="mb-2"><strong>Time Limit:</strong> You have {selectedExam.durationInMinutes} minutes. If the timer runs out, your exam will auto-submit immediately.</li>
                                    <li className="mb-2"><strong>Right-Click Blocked:</strong> Context menu, copy, paste, and text selection are fully disabled to protect exam content.</li>
                                    <li><strong>Handwriting Captures:</strong> For written tasks, webcam upload captures taken under 60 seconds are automatically zeroed.</li>
                                </ul>
                            </Card>
                            <p className="text-muted small">By clicking 'Start Attempt', your time begins immediately. Make sure you have a stable internet connection and quiet space.</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                    <Button variant="light" className="rounded-pill px-4" onClick={() => setShowConfirmModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant={selectedExam?.hasStarted ? 'success' : 'danger'}
                        className="rounded-pill px-4 shadow"
                        onClick={handleConfirmEntry}
                    >
                        {selectedExam?.hasStarted ? 'Resume Attempt' : 'Start Attempt'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CurrentlyExams;
