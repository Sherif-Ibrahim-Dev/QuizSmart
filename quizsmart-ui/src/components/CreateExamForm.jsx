import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Badge, Table, Modal, ListGroup } from 'react-bootstrap';
import {
    FaTrash, FaEdit, FaCheckCircle, FaInfoCircle, FaCalculator,
    FaRandom, FaListUl, FaCalendarAlt, FaEye, FaCheckSquare, FaSquare, FaTools
} from 'react-icons/fa';
import examService from '../services/examService';
import questionService from '../services/questionService';
import courseService from '../services/courseService';

const CreateExamForm = () => {
    const [courses, setCourses] = useState([]);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [isRandomMode, setIsRandomMode] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);

    const [examData, setExamData] = useState({
        title: '', courseId: '', durationInMinutes: 60,
        startTime: '', endTime: '', passingMark: 50,
        randomQuestionsCount: 0, shuffleQuestions: true, shuffleOptions: true
    });

    const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

    useEffect(() => {
        const loadCourses = async () => {
            try {
                const data = await courseService.getInstructorCourses();
                setCourses(data || []);
            } catch (err) {
                console.error("Error fetching courses in Exam Page:", err);
            }
        };
        loadCourses();
    }, []);

    const handleCourseChange = async (e) => {
        const cId = e.target.value;
        setSelectedCourseId(cId);
        setExamData(prev => ({...prev, courseId: cId}));
        setSelectedQuestions([]);
        setExamData(prev => ({...prev, courseId: cId, randomQuestionsCount: 0}));
        if (cId) {
            const questions = await questionService.getQuestionsByCourse(cId);
            setBankQuestions(questions || []);
        } else {
            setBankQuestions([]);
        }
    };

    const handleRandomCountChange = (val) => {
        const parsed = parseInt(val) || 0;
        const maxAllowed = bankQuestions.length;
        const count = Math.min(Math.max(0, parsed), maxAllowed);
        setExamData({...examData, randomQuestionsCount: count});
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            await questionService.updateQuestion(editingQuestion.qId, editingQuestion);

            setSelectedQuestions(selectedQuestions.map(q =>
                q.qId === editingQuestion.qId ? editingQuestion : q
            ));
            setBankQuestions(bankQuestions.map(q =>
                q.qId === editingQuestion.qId ? editingQuestion : q
            ));

            setShowEditModal(false);
            alert("Success: Question updated and synced!");
        } catch (err) {
            console.error("Update Error:", err.response?.data);
            alert("Failed to sync changes. Check console.");
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!examData.title || !selectedCourseId) {
            alert("Required: Exam title and course selection are mandatory.");
            return;
        }

        if (isRandomMode && examData.randomQuestionsCount <= 0) {
            alert("Please enter a valid number of random questions (greater than 0).");
            return;
        }

        if (isRandomMode && examData.randomQuestionsCount > bankQuestions.length) {
            alert(`Cannot exceed the number of questions in the bank (${bankQuestions.length}).`);
            return;
        }

        const payload = {
            Title: examData.title.trim(),
            CourseId: parseInt(selectedCourseId),
            DurationInMinutes: parseInt(examData.durationInMinutes) || 60,
            StartTime: examData.startTime ? new Date(examData.startTime).toISOString() : null,
            EndTime: examData.endTime ? new Date(examData.endTime).toISOString() : null,
            PassingMark: parseInt(examData.passingMark) || 50,
            TotalMarks: totalMarks,
            IsRandom: isRandomMode,
            RandomQuestionsCount: isRandomMode ? parseInt(examData.randomQuestionsCount) : 0,
            QuestionIds: isRandomMode ? [] : selectedQuestions.map(q => q.qId),
            ShuffleQuestions: !!examData.shuffleQuestions,
            ShuffleOptions: !!examData.shuffleOptions,
            IsPublished: true
        };

        setIsSubmitting(true);
        try {
            await examService.createExam(payload);
            alert("Success: Exam has been published.");
        } catch (error) {
            console.error("Submission Error Details:", error.response?.data);
            const serverMsg = error.response?.data?.errors
                              ? JSON.stringify(error.response.data.errors)
                              : "Check console for details.";
            alert("Error: Failed to publish exam. " + serverMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate__animated animate__fadeIn">

            <div className="d-flex justify-content-between align-items-center mb-4 bg-white p-3 rounded-4 shadow-sm border-start border-5" style={{ borderColor: '#4F46E5' }}>
                <div>
                    <h4 className="fw-bold text-dark mb-0">Exam Builder Pro</h4>
                    <small className="text-muted">Status: {isRandomMode ? 'Random Mode' : 'Manual Mode'}</small>
                </div>
                <Button className="rounded-pill px-4 fw-bold shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }} onClick={() => setShowReviewModal(true)}>
                    <FaEye className="me-2" /> Review & Preview
                </Button>
            </div>


            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body className="p-4">
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold small text-secondary">Exam Title</Form.Label>
                        <Form.Control className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" type="text" placeholder="e.g. Midterm Database 2026" onChange={e => setExamData({...examData, title: e.target.value})} />
                    </Form.Group>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Label className="fw-bold small text-secondary">Course Selection</Form.Label>
                            <Form.Select className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" value={selectedCourseId} onChange={handleCourseChange}>
                                <option value="">-- Choose Academic Course --</option>
                                {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}><Form.Label className="fw-bold small text-secondary">Duration (Min)</Form.Label><Form.Control className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" type="number" min="1" defaultValue="60" onChange={e => setExamData({...examData, durationInMinutes: e.target.value})} /></Col>
                        <Col md={3}><Form.Label className="fw-bold small text-secondary">Passing Mark</Form.Label><Form.Control className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" type="number" min="1" defaultValue="50" onChange={e => setExamData({...examData, passingMark: e.target.value})} /></Col>
                    </Row>
                    <Row className="g-3 mt-2">
                        <Col md={6}>
                            <Form.Label className="fw-bold small text-secondary"><FaCalendarAlt className="me-1" /> Start Window</Form.Label>
                            <Form.Control className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" type="datetime-local" value={examData.startTime} onChange={e => setExamData({...examData, startTime: e.target.value})} />
                        </Col>
                        <Col md={6}>
                            <Form.Label className="fw-bold small text-secondary"><FaCalendarAlt className="me-1" /> End Window</Form.Label>
                            <Form.Control className="exam-input bg-light border-0 p-3 rounded-3 shadow-none" type="datetime-local" value={examData.endTime} onChange={e => setExamData({...examData, endTime: e.target.value})} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4">

                <Col lg={isRandomMode ? 12 : 7}>
                    <Card className={`shadow-sm rounded-4 h-100 transition-3s ${!isRandomMode ? 'ring-active border-0' : 'border-0 opacity-50'}`}>
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white rounded-top-4">
                            <div className="d-flex align-items-center cursor-pointer" onClick={() => setIsRandomMode(false)}>
                                {!isRandomMode ? <FaCheckSquare className="fs-4 me-2" style={{ color: '#4F46E5' }}/> : <FaSquare className="text-light border rounded fs-4 me-2"/>}
                                <h6 className="fw-bold mb-0">Manual Selection</h6>
                            </div>
                            {!isRandomMode && <Badge className="rounded-pill px-3 py-2" style={{ backgroundColor: '#4F46E5' }}> {totalMarks} Marks </Badge>}
                        </div>
                        <Card.Body className={isRandomMode ? "pe-none" : ""}>
                            <div className="table-responsive scroll-custom" style={{maxHeight: '350px'}}>
                                <Table hover className="small align-middle">
                                    <thead><tr className="text-secondary"><th>Question Text</th><th>Marks</th><th className="text-end">Action</th></tr></thead>
                                    <tbody>
                                        {bankQuestions.map(q => (
                                            <tr key={q.qId}>
                                                <td className="fw-medium">{q.qText}</td>
                                                <td><Badge bg="light" text="dark" className="border">{q.marks}M</Badge></td>
                                                <td className="text-end">
                                                    <Button
                                                        variant={selectedQuestions.find(s => s.qId === q.qId) ? "success" : "outline-primary"}
                                                        size="sm" className="rounded-pill px-3 shadow-sm"
                                                        onClick={() => setSelectedQuestions([...selectedQuestions, q])}
                                                        disabled={selectedQuestions.find(s => s.qId === q.qId)}
                                                        style={!selectedQuestions.find(s => s.qId === q.qId) ? { borderColor: '#4F46E5', color: '#4F46E5' } : {}}
                                                    >
                                                        {selectedQuestions.find(s => s.qId === q.qId) ? '✓ Added' : '+ Add'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>


                <Col lg={isRandomMode ? 12 : 5}>
                    <Card className={`shadow-sm rounded-4 h-100 transition-3s ${isRandomMode ? 'ring-random border-0' : 'border-0 opacity-50'}`}>
                        <div className="p-3 border-bottom d-flex align-items-center bg-white rounded-top-4 cursor-pointer" onClick={() => setIsRandomMode(true)}>
                            {isRandomMode ? <FaCheckSquare className="text-info fs-4 me-2"/> : <FaSquare className="text-light border rounded fs-4 me-2"/>}
                            <h6 className="fw-bold mb-0">Random AI Generation</h6>
                        </div>
                        <Card.Body className={!isRandomMode ? "pe-none" : ""}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold">
                                    Questions Count

                                    {selectedCourseId && bankQuestions.length > 0 && (
                                        <span className="ms-2 text-muted fw-normal" style={{ fontSize: '0.78rem' }}>
                                            (max: {bankQuestions.length} available)
                                        </span>
                                    )}
                                </Form.Label>
                                <Form.Control
                                    className="bg-light border-0 p-3 shadow-none rounded-3"
                                    type="number"
                                    min="0"
                                    max={bankQuestions.length || undefined}
                                    value={examData.randomQuestionsCount}
                                    onChange={e => handleRandomCountChange(e.target.value)}
                                />

                                {bankQuestions.length > 0 && examData.randomQuestionsCount >= bankQuestions.length && (
                                    <small className="text-warning fw-semibold mt-1 d-block">
                                        ⚠ Reached maximum available questions in the bank.
                                    </small>
                                )}
                                {bankQuestions.length === 0 && selectedCourseId && (
                                    <small className="text-danger fw-semibold mt-1 d-block">
                                        ⚠ No questions found in this course's bank yet.
                                    </small>
                                )}
                            </Form.Group>
                            <div className="p-3 bg-light rounded-4 border border-dashed">
                                <Form.Check type="switch" label="Shuffle Questions Order" checked={examData.shuffleQuestions} onChange={e => setExamData({...examData, shuffleQuestions: e.target.checked})} className="mb-2 small fw-bold" />
                                <Form.Check type="switch" label="Shuffle Answer Options" checked={examData.shuffleOptions} onChange={e => setExamData({...examData, shuffleOptions: e.target.checked})} className="small fw-bold" />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>


            {!isRandomMode && selectedQuestions.length > 0 && (
                <Card className="border-0 shadow-sm rounded-4 mt-4 animate__animated animate__fadeInUp">
                    <Card.Body className="p-3 d-flex justify-content-between align-items-center bg-white rounded-4">
                        <div className="d-flex gap-2 overflow-auto py-1 scroll-none" style={{maxWidth: '75%'}}>
                            {selectedQuestions.map((q, idx) => (
                                <Badge key={q.qId} bg="light" text="dark" className="p-2 border rounded-3 d-flex align-items-center shadow-sm hover-danger transition-3s">
                                    <span className="me-2 fw-bold" style={{ color: '#4F46E5' }}>Q{idx+1}</span>
                                    <FaTrash className="text-danger cursor-pointer" onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.qId !== q.qId))} />
                                </Badge>
                            ))}
                        </div>
                        <div className="text-end">
                            <h6 className="fw-bold mb-0" style={{ color: '#4F46E5' }}>{totalMarks} Total Marks</h6>
                        </div>
                    </Card.Body>
                </Card>
            )}

            <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-100 mt-4 py-3 rounded-pill fw-bold shadow-lg border-0 btn-publish"
            >
                {isSubmitting ? "PROCESSING..." : "FINALIZE & PUBLISH EXAM"}
            </Button>



            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered size="lg" className="rounded-5">
                <Modal.Header closeButton className="border-0 px-4 pt-4"><Modal.Title className="fw-bold">Exam Final Review</Modal.Title></Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <div className="bg-light p-3 rounded-4 mb-4 d-flex justify-content-between align-items-center border">
                        <div><small className="text-muted d-block text-uppercase" style={{fontSize: '10px'}}>Exam Title</small><span className="fw-bold" style={{ color: '#4F46E5' }}>{examData.title || 'Untitled'}</span></div>
                        <div><small className="text-muted d-block text-uppercase" style={{fontSize: '10px'}}>Total Score</small><Badge className="fs-6" style={{ backgroundColor: '#4F46E5' }}>{isRandomMode ? 'AI Calculated' : totalMarks + ' Marks'}</Badge></div>
                    </div>
                    <h6 className="fw-bold mb-3">Questions in this Exam:</h6>
                    <ListGroup variant="flush" className="rounded-4 overflow-hidden border">
                        {isRandomMode ? (
                            <ListGroup.Item className="text-center py-4 text-muted small"><FaRandom className="me-2"/>Questions will be picked randomly upon student entry. ({examData.randomQuestionsCount} questions)</ListGroup.Item>
                        ) : (
                            selectedQuestions.map((q, idx) => (
                                <ListGroup.Item key={q.qId} className="d-flex justify-content-between align-items-center py-3 hvr-light">
                                    <div className="small"><span className="fw-bold text-secondary me-2">{idx + 1}.</span> {q.qText}</div>
                                    <div className="d-flex gap-3 align-items-center">
                                        <Badge bg="light" text="dark" className="border">{q.marks}M</Badge>
                                        <FaEdit className="text-warning cursor-pointer" onClick={() => { setEditingQuestion(q); setShowEditModal(true); }} />
                                        <FaTrash className="text-danger cursor-pointer" onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.qId !== q.qId))} />
                                    </div>
                                </ListGroup.Item>
                            ))
                        )}
                    </ListGroup>
                </Modal.Body>
                <Modal.Footer className="border-0"><Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowReviewModal(false)}>Back to Edit</Button></Modal.Footer>
            </Modal>


            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="rounded-4">
                <Modal.Header closeButton className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold" style={{ color: '#4F46E5' }}>Quick Edit Question</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    {editingQuestion && (
                        <Form onSubmit={handleUpdateQuestion}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">Question Text</Form.Label>
                                <Form.Control
                                    as="textarea" rows={3} className="custom-input rounded-3 shadow-none"
                                    value={editingQuestion.qText}
                                    onChange={e => setEditingQuestion({...editingQuestion, qText: e.target.value})}
                                />
                            </Form.Group>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Label className="fw-bold small">Difficulty</Form.Label>
                                    <Form.Select className="custom-select rounded-3 shadow-none" value={editingQuestion.difficulty} onChange={e => setEditingQuestion({...editingQuestion, difficulty: e.target.value})}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </Form.Select>
                                </Col>
                                <Col md={6}>
                                    <Form.Label className="fw-bold small">Marks</Form.Label>
                                    <Form.Control type="number" className="custom-input rounded-3 shadow-none" value={editingQuestion.marks} onChange={e => setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value)})} />
                                </Col>
                            </Row>
                            {editingQuestion.qType === 'MCQ' && (
                                <div className="p-3 bg-light rounded-4 mb-3 border">
                                    <h6 className="fw-bold mb-3 small text-primary">Edit Choices</h6>
                                    <Row className="g-2">
                                        <Col md={6}><Form.Control className="custom-input rounded-3 shadow-sm border-0" value={editingQuestion.optionA || ''} onChange={e => setEditingQuestion({...editingQuestion, optionA: e.target.value})} placeholder="Option A" /></Col>
                                        <Col md={6}><Form.Control className="custom-input rounded-3 shadow-sm border-0" value={editingQuestion.optionB || ''} onChange={e => setEditingQuestion({...editingQuestion, optionB: e.target.value})} placeholder="Option B" /></Col>
                                        <Col md={6}><Form.Control className="custom-input rounded-3 shadow-sm border-0" value={editingQuestion.optionC || ''} onChange={e => setEditingQuestion({...editingQuestion, optionC: e.target.value})} placeholder="Option C" /></Col>
                                        <Col md={6}><Form.Control className="custom-input rounded-3 shadow-sm border-0" value={editingQuestion.optionD || ''} onChange={e => setEditingQuestion({...editingQuestion, optionD: e.target.value})} placeholder="Option D" /></Col>
                                    </Row>
                                </div>
                            )}
                            {editingQuestion.qType === 'MCQ' && (
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold small text-danger">
                                        Correct Answer <span className="text-muted fw-normal">(select the correct option)</span>
                                    </Form.Label>
                                    <Form.Select className="custom-input rounded-3 shadow-none" value={editingQuestion.correctAns} onChange={e => setEditingQuestion({...editingQuestion, correctAns: e.target.value})}>
                                        <option value="">-- Choose Correct Option --</option>
                                        {editingQuestion.optionA && <option value="a">A: {editingQuestion.optionA}</option>}
                                        {editingQuestion.optionB && <option value="b">B: {editingQuestion.optionB}</option>}
                                        {editingQuestion.optionC && <option value="c">C: {editingQuestion.optionC}</option>}
                                        {editingQuestion.optionD && <option value="d">D: {editingQuestion.optionD}</option>}
                                    </Form.Select>
                                </Form.Group>
                            )}
                            <Button type="submit" className="w-100 py-2 rounded-pill fw-bold shadow-sm" style={{backgroundColor: '#ffc107', border: 'none', color: '#000'}}>
                                Update & Sync
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

            <style>{`
                .transition-3s { transition: all 0.3s ease; }


                .exam-input { border: 1.5px solid transparent !important; transition: border-color 0.2s ease, box-shadow 0.2s ease !important; }
                .exam-input:focus { border-color: #4F46E5 !important; box-shadow: 0 0 0 3.5px rgba(79, 70, 229, 0.12) !important; background-color: #fff !important; outline: none !important; }


                .ring-active { border: 2px solid #4F46E5 !important; }
                .ring-random { border: 2px solid #0dcaf0 !important; }

                .cursor-pointer { cursor: pointer; }
                .pe-none { pointer-events: none; }
                .scroll-custom::-webkit-scrollbar { width: 6px; }
                .scroll-custom::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 10px; }
                .btn-publish { background: linear-gradient(135deg, #4F46E5 0%, #818CF8 100%); }
                .hover-danger:hover { background-color: #fff5f5 !important; border-color: #feb2b2 !important; }
                .hvr-light:hover { background-color: #f8f9fa; }
                .scroll-none::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default CreateExamForm;
