import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaUserEdit, FaCheckCircle, FaImage, FaGraduationCap, FaClipboardCheck } from 'react-icons/fa';
import examService from "../services/examService";

const PendingCorrections = ({ examId: propExamId }) => {
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState(propExamId || "");
    const [pendingAnswers, setPendingAnswers] = useState([]);
    const [loadingExams, setLoadingExams] = useState(!propExamId);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [grades, setGrades] = useState({});
    const [submittingIds, setSubmittingIds] = useState({});

    const SERVER_URL = "https://localhost:7194";

    useEffect(() => {
        if (!propExamId) {
            loadInstructorExams();
        } else {
            setSelectedExamId(propExamId);
        }
    }, [propExamId]);

    useEffect(() => {
        if (selectedExamId) {
            loadPending(selectedExamId);
        } else {
            setPendingAnswers([]);
        }
    }, [selectedExamId]);

    const loadInstructorExams = async () => {
        try {
            setLoadingExams(true);
            const data = await examService.getMyExams();
            setExams(data || []);
        } catch (err) {
            console.error("Failed to load instructor exams", err);
        } finally {
            setLoadingExams(false);
        }
    };

    const loadPending = async (id) => {
        try {
            setLoadingAnswers(true);
            const data = await examService.getPendingWritten(id);
            setPendingAnswers(data || []);
            const initialGrades = {};
            data.forEach(ans => {
                initialGrades[ans.ansId] = "";
            });
            setGrades(initialGrades);
        } catch (err) {
            console.error("Failed to load pending corrections", err);
        } finally {
            setLoadingAnswers(false);
        }
    };

    const handleGradeSubmit = async (ansId, maxMarks) => {
        const scoreStr = grades[ansId];
        if (scoreStr === undefined || scoreStr === "") {
            alert("Please enter a grade first!");
            return;
        }

        const score = parseFloat(scoreStr);
        if (isNaN(score) || score < 0) {
            alert("Please enter a valid grade greater than or equal to zero.");
            return;
        }

        if (score > maxMarks) {
            alert(`The maximum grade for this question is ${maxMarks}`);
            return;
        }

        try {
            setSubmittingIds(prev => ({ ...prev, [ansId]: true }));
            await examService.submitWrittenGrade(ansId, score);
            setPendingAnswers(prev => prev.filter(ans => ans.ansId !== ansId));
        } catch (err) {
            alert(err.response?.data?.message || "Error saving grade.");
        } finally {
            setSubmittingIds(prev => ({ ...prev, [ansId]: false }));
        }
    };

    const handleGradeChange = (ansId, value) => {
        setGrades(prev => ({ ...prev, [ansId]: value }));
    };

    if (loadingExams) {
        return (
            <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading exams list...</p>
            </div>
        );
    }

    return (
        <div className="animate__animated animate__fadeIn">

            {!propExamId && (
                <Card className="border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#FFF' }}>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <h5 className="fw-bold mb-1 text-indigo" style={{ color: '#4F46E5' }}>
                                <FaGraduationCap className="me-2" /> Pending Written Corrections
                            </h5>
                            <p className="text-secondary small mb-0">Select an exam below to start grading student answers.</p>
                        </Col>
                        <Col md={6} className="mt-3 mt-md-0">
                            <Form.Select
                                value={selectedExamId}
                                onChange={(e) => setSelectedExamId(e.target.value)}
                                className="rounded-3 p-3 border-0 bg-light shadow-none"
                                style={{ borderRight: '5px solid #4F46E5' }}
                            >
                                <option value="">-- Select an exam to start --</option>
                                {exams.map(e => (
                                    <option key={e.examId} value={e.examId}>
                                        {e.title} ({e.courseName}) {e.hasPendingCorrections ? "⚠️ Requires Grading" : "✅ Graded"}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Card>
            )}


            {loadingAnswers && (
                <div className="text-center p-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading pending answers...</p>
                </div>
            )}


            {!loadingAnswers && selectedExamId && pendingAnswers.length === 0 && (
                <Alert variant="success" className="rounded-4 border-0 shadow-sm text-center p-5">
                    <FaCheckCircle size={40} className="mb-3 text-success" />
                    <h5 className="fw-bold">Excellent! No pending answers</h5>
                    <p className="mb-0 text-muted">All written questions for this exam have been fully graded.</p>
                </Alert>
            )}

            {!loadingAnswers && !selectedExamId && (
                <div className="text-center p-5 bg-white rounded-5 shadow-sm border border-light">
                    <FaClipboardCheck size={50} className="text-muted mb-3 opacity-25" />
                    <h5 className="fw-bold text-dark">Please select an exam from the dropdown above to start reviewing and grading.</h5>
                </div>
            )}

            {!loadingAnswers && selectedExamId && pendingAnswers.length > 0 && (
                <div>
                    <h5 className="fw-bold mb-4 text-primary d-flex align-items-center justify-content-between">
                        <span>Pending Written Solutions ({pendingAnswers.length})</span>
                        <Badge bg="indigo" className="rounded-pill px-3 py-2 fs-6" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                            {exams.find(e => e.examId == selectedExamId)?.title}
                        </Badge>
                    </h5>
                    <Row>
                        {pendingAnswers.map((ans) => {
                            const isSubmitting = submittingIds[ans.ansId];
                            return (
                                <Col md={12} key={ans.ansId} className="mb-4 animate__animated animate__fadeIn">
                                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                                        <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-primary text-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}>
                                                    <FaUserEdit />
                                                </div>
                                                <h6 className="fw-bold mb-0 text-dark">{ans.studentName || "Anonymous Student"}</h6>
                                            </div>
                                            <Badge bg="warning" text="dark" className="rounded-pill px-3 py-2 fw-semibold">Requires Review</Badge>
                                        </Card.Header>

                                        <Card.Body className="px-4 pb-4">
                                            <p className="text-muted small mb-1 text-uppercase fw-bold">Question Text:</p>
                                            <h6 className="mb-4 p-3 bg-light rounded-3 border-start border-primary border-4 text-dark fw-bold">
                                                {ans.questionText}
                                            </h6>

                                            <Row className="g-4">

                                                <Col lg={ans.solutionImagePath ? 6 : 12}>
                                                    <p className="text-muted small mb-1 fw-bold">Student's Written Answer:</p>
                                                    <div className="p-3 border rounded-4 bg-white shadow-inner" style={{ minHeight: '150px', whiteSpace: 'pre-wrap', backgroundColor: '#FAFAFA' }}>
                                                        {ans.chosenOption || <span className="text-danger italic small">No text answer provided.</span>}
                                                    </div>
                                                </Col>


                                                {ans.solutionImagePath && (
                                                    <Col lg={6}>
                                                        <p className="text-muted small mb-1 fw-bold"><FaImage className="me-1"/> Captured Handwriting Solution:</p>
                                                        <div className="border rounded-4 overflow-hidden shadow-sm position-relative group-hover-zoom" style={{ height: '150px', backgroundColor: '#F0F0F0' }}>
                                                            <img
                                                                src={`${SERVER_URL}${ans.solutionImagePath}`}
                                                                alt="Student Solution Capture"
                                                                className="w-100 h-100 object-fit-contain cursor-pointer"
                                                                style={{ cursor: 'zoom-in' }}
                                                                onClick={() => window.open(`${SERVER_URL}${ans.solutionImagePath}`, '_blank')}
                                                            />
                                                        </div>
                                                    </Col>
                                                )}
                                            </Row>


                                            <div className="mt-4 pt-4 border-top d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 bg-light p-3 rounded-4">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-bold text-dark fs-6">Grade Evaluation:</span>
                                                    <Badge bg="dark" className="rounded-pill px-3 py-2 small fw-bold">
                                                        Max Question Marks: {ans.maxMarks} points
                                                    </Badge>
                                                </div>

                                                <div className="d-flex align-items-center gap-3 flex-grow-1 flex-md-grow-0" style={{ maxWidth: '350px' }}>
                                                    <div className="flex-grow-1">
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            max={ans.maxMarks}
                                                            step="0.5"
                                                            placeholder={`Grade (0 - ${ans.maxMarks})`}
                                                            className="rounded-pill p-3 border-0 bg-white shadow-sm"
                                                            value={grades[ans.ansId] || ''}
                                                            onChange={(e) => handleGradeChange(ans.ansId, e.target.value)}
                                                            disabled={isSubmitting}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleGradeSubmit(ans.ansId, ans.maxMarks);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="success"
                                                        className="rounded-pill px-4 py-3 fw-bold text-white shadow-sm hover-grow transition-all d-flex align-items-center gap-2"
                                                        onClick={() => handleGradeSubmit(ans.ansId, ans.maxMarks)}
                                                        disabled={isSubmitting}
                                                        style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                                                    >
                                                        {isSubmitting ? 'Saving Grade...' : 'Done'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </div>
            )}
        </div>
    );
};

export default PendingCorrections;
