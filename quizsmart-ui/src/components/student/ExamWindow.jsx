import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Modal, Spinner, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaChevronLeft, FaChevronRight, FaInfoCircle, FaCamera, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import studentService from '../../services/studentService';
import ExamTimer from './ExamTimer';
import QuestionNavigator from './QuestionNavigator';
import QuestionRenderer from './QuestionRenderer';

const ExamWindow = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answersState, setAnswersState] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [attemptId, setAttemptId] = useState(null);
    const [attemptStartTime, setAttemptStartTime] = useState(null);

    const [cheatWarningCount, setCheatWarningCount] = useState(0);
    const [examLocked, setExamLocked] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImages, setCapturedImages] = useState({});

    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
    const [examFinished, setExamFinished] = useState(false);
    const [finalResult, setFinalResult] = useState(null);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (!user || !examId) {
            navigate('/login');
            return;
        }

        const initializeExam = async () => {
            try {
                const available = await studentService.getAvailableExams(user.userId);
                const activeExam = available.find(e => e.examId === parseInt(examId));

                let currentAttemptId = null;
                let dbStartTime = null;

                if (activeExam && activeExam.hasStarted && activeExam.attemptId) {
                    // Resuming an existing attempt - startTime is when the attempt was first created
                    currentAttemptId = activeExam.attemptId;
                    // Estimate start time from duration and end time remaining
                    dbStartTime = null; // will fall back to current time for resumed attempts
                } else {
                    try {
                        const startRes = await studentService.startAttempt(parseInt(examId));
                        currentAttemptId = startRes.attemptId;
                        // Use real DB start time returned from the server
                        dbStartTime = startRes.startTime || null;
                    } catch (startErr) {
                        console.error("Attempt start failed. Trying to fetch existing details.", startErr);
                        const retryAvailable = await studentService.getAvailableExams(user.userId);
                        const retryActive = retryAvailable.find(e => e.examId === parseInt(examId));
                        if (retryActive && retryActive.attemptId) {
                            currentAttemptId = retryActive.attemptId;
                        } else {
                            throw new Error("Unable to start or resume exam attempt.");
                        }
                    }
                }

                setAttemptId(currentAttemptId);

                const questionsData = await studentService.getExamQuestions(examId);
                setQuestions(questionsData);

                const initialState = {};
                questionsData.forEach(q => {
                    initialState[q.qId] = {
                        ansId: q.ansId,
                        chosenOption: q.chosenOption || '',
                        isFlagged: q.isFlagged || false,
                        questionStartTime: q.questionStartTime ? new Date(q.questionStartTime) : null
                    };
                });
                setAnswersState(initialState);

                // Use real DB startTime for accurate TimeTaken calculation; fallback to now
                setAttemptStartTime(dbStartTime || new Date().toISOString());

                const defaultDuration = activeExam?.durationInMinutes || 60;
                setExam({
                    title: activeExam?.title || "Course Final Exam",
                    durationInMinutes: defaultDuration
                });

                setLoading(false);
            } catch (error) {
                console.error("Failed to initialize exam", error);
                alert("Error entering the exam. Please make sure you are enrolled and the exam is active.");
                navigate('/student-dashboard');
            }
        };


        initializeExam();
    }, [examId]);

    useEffect(() => {
        if (loading || examFinished || examLocked) return;

        const handleVisibilityChange = async () => {
            if (document.hidden) {
                if (cheatWarningCount === 0) {
                    setCheatWarningCount(1);
                    alert("⚠️ WARNING: You left the exam tab! Leaving the tab again will automatically lock your exam and submit with a score of 0.");
                } else {
                    setExamLocked(true);
                    await triggerCheatingFailure();
                }
            }
        };

        const preventRightClick = (e) => e.preventDefault();
        const preventKeyboard = (e) => {
            if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
                e.preventDefault();
                alert("Copy, paste, and cut are disabled during the exam!");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("contextmenu", preventRightClick);
        document.addEventListener("keydown", preventKeyboard);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("contextmenu", preventRightClick);
            document.removeEventListener("keydown", preventKeyboard);
        };
    }, [loading, cheatWarningCount, examFinished, examLocked]);

    const triggerCheatingFailure = async () => {
        try {
            alert("🚨 EXAM LOCKED: Multiple tab switches detected. Your attempt is auto-submitted with 0 marks.");
            await studentService.finishAttempt(attemptId);
            setExamFinished(true);
            setFinalResult({ score: 0, total: 100, message: "Cheating Suspected - Locked" });
        } catch (e) {
            console.error("Error submitting failure", e);
        }
    };

    useEffect(() => {
        if (loading || questions.length === 0 || currentIndex === null) return;

        const currentQ = questions[currentIndex];
        const state = answersState[currentQ.qId];

        if (state && !state.questionStartTime) {
            studentService.recordQuestionStartTime(state.ansId).then((res) => {
                setAnswersState(prev => ({
                    ...prev,
                    [currentQ.qId]: {
                        ...prev[currentQ.qId],
                        questionStartTime: res.startTime ? new Date(res.startTime) : new Date()
                    }
                }));
            }).catch(err => {
                console.error("Failed to record start time", err);
                setAnswersState(prev => ({
                    ...prev,
                    [currentQ.qId]: {
                        ...prev[currentQ.qId],
                        questionStartTime: new Date()
                    }
                }));
            });
        }
    }, [currentIndex, loading]);

    const handleAnswerChange = async (qId, value) => {
        setAnswersState(prev => ({
            ...prev,
            [qId]: {
                ...prev[qId],
                chosenOption: value
            }
        }));

        const currentQ = questions.find(q => q.qId === qId);
        if (currentQ && currentQ.qType !== 'Written') {
            try {
                await studentService.submitAnswer({
                    attemptId: attemptId,
                    qId: qId,
                    chosenOption: value
                });
            } catch (err) {
                console.error("Failed to auto-submit answer to server", err);
            }
        }
    };

    const handleFlagToggle = async (qId) => {
        const targetState = !answersState[qId]?.isFlagged;
        setAnswersState(prev => ({
            ...prev,
            [qId]: {
                ...prev[qId],
                isFlagged: targetState
            }
        }));

        try {
            const ansId = answersState[qId].ansId;
            const apiClient = (await import('../../services/apiClient')).default;
            await apiClient.post(`/StudentAttempts/toggle-flag?answerId=${ansId}&flagStatus=${targetState}`);
        } catch (err) {
            console.error("Failed to toggle flag on server", err);
        }
    };

    const startCamera = async () => {
        try {
            // Try rear camera first (for mobile users photographing handwritten solutions)
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
            } catch {
                // Fallback to any available camera (desktop users)
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setCameraActive(true);
        } catch (err) {
            console.error("Failed to open camera", err);
            alert("Camera access is required for written questions!");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const takePhoto = () => {
        const currentQ = questions[currentIndex];
        const state = answersState[currentQ.qId];

        if (state.questionStartTime) {
            const timeDiffSec = (new Date().getTime() - new Date(state.questionStartTime).getTime()) / 1000;
            if (timeDiffSec < 60) {
                alert(`⚠️ ANTI-CHEAT ALERT:\nYou cannot upload a solution in less than 60 seconds. You have spent ${Math.floor(timeDiffSec)} seconds on this question. Please spend at least 1 minute working before uploading.`);
                return;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImages(prev => ({
            ...prev,
            [currentQ.qId]: dataUrl
        }));

        canvas.toBlob(async (blob) => {
            const file = new File([blob], `solution_${currentQ.qId}.jpg`, { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('imageFile', file);
            formData.append('textAnswer', state.chosenOption || '');

            try {
                await studentService.submitWrittenAnswer(state.ansId, formData);
                alert("Solution photo captured & synced with server!");
                stopCamera();
            } catch (err) {
                console.error("Failed to upload solutions photo", err);
                alert("Failed to sync photo to server. Please try again.");
            }
        }, 'image/jpeg', 0.85);
    };

    const clearCapturedImage = async () => {
        const currentQ = questions[currentIndex];
        const state = answersState[currentQ.qId];

        setCapturedImages(prev => ({
            ...prev,
            [currentQ.qId]: null
        }));

        const formData = new FormData();
        formData.append('textAnswer', state.chosenOption || '');

        try {
            await studentService.submitWrittenAnswer(state.ansId, formData);
        } catch (err) {
            console.error("Failed to clear photo on server", err);
        }
    };

    const handleNext = async () => {
        const currentQ = questions[currentIndex];
        if (currentQ.qType === 'Written') {
            await syncWrittenTextAnswer(currentQ.qId);
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = async () => {
        const currentQ = questions[currentIndex];
        if (currentQ.qType === 'Written') {
            await syncWrittenTextAnswer(currentQ.qId);
        }

        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const syncWrittenTextAnswer = async (qId) => {
        const state = answersState[qId];
        const formData = new FormData();
        formData.append('textAnswer', state.chosenOption || '');
        try {
            await studentService.submitWrittenAnswer(state.ansId, formData);
        } catch (err) {
            console.error("Failed to sync written text answer", err);
        }
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        setShowConfirmSubmit(false);

        const currentQ = questions[currentIndex];
        if (currentQ.qType === 'Written') {
            await syncWrittenTextAnswer(currentQ.qId);
        }

        try {
            const result = await studentService.finishAttempt(attemptId);
            setFinalResult({
                score: result.score,
                total: questions.reduce((sum, q) => sum + q.marks, 0),
                message: "Exam Finished successfully!"
            });
            setExamFinished(true);
        } catch (err) {
            console.error("Failed to submit exam", err);
            alert("Error submitting. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTimeUp = async () => {
        alert("⏱️ TIME IS UP! Your exam is being automatically submitted.");
        await handleFinalSubmit();
    };

    if (loading) {
        return (
            <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
                <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} className="mb-4" />
                <h4 className="fw-bold text-secondary">Securing connection & launching exam environment...</h4>
            </Container>
        );
    }

    if (examFinished) {
        return (
            <Container className="py-5 max-w-600">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-5 bg-white shadow rounded-5 mt-5">
                    <div className="bg-success text-white rounded-circle mx-auto d-flex align-items-center justify-content-center mb-4 shadow" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                        🎉
                    </div>
                    <h2 className="fw-bold mb-3">Congratulations!</h2>
                    <p className="text-secondary lead mb-4">You have successfully submitted the exam: <br/><strong className="text-dark">{exam.title}</strong></p>

                    {finalResult && (
                        <Card className="border-0 bg-light p-4 rounded-4 mb-4 text-center">
                            <h5 className="text-secondary mb-1">MOCK EVALUATION (MCQ ONLY)</h5>
                            <h1 className="fw-bold text-primary mb-0">{finalResult.score} / {finalResult.total}</h1>
                            <small className="text-muted">Written questions are pending manual correction by the instructor.</small>
                        </Card>
                    )}

                    <Button variant="primary" className="px-5 py-3 rounded-pill fw-bold" onClick={() => navigate('/student-dashboard')}>
                        Return to Dashboard
                    </Button>
                </motion.div>
            </Container>
        );
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswerState = answersState[currentQuestion.qId];

    const totalQuestions = questions.length;
    const answeredCount = Object.values(answersState).filter(a => a.chosenOption !== null && a.chosenOption !== undefined && a.chosenOption !== '').length;

    return (
        <div className="bg-light w-100 py-4" style={{ minHeight: '100vh' }}>
            <Container>

                <Row className="mb-4 align-items-center bg-white p-3 shadow-sm rounded-4 mx-1">
                    <Col xs={12} md={6}>
                        <h4 className="fw-bold mb-1 text-dark text-truncate">{exam.title}</h4>
                        <span className="text-muted fw-semibold small">FCI_Zagazig University Testing Service</span>
                    </Col>
                    <Col xs={12} md={6} className="d-flex justify-content-md-end mt-2 mt-md-0">
                        <ExamTimer
                            startTime={attemptStartTime}
                            durationInMinutes={exam.durationInMinutes}
                            onTimeUp={handleTimeUp}
                        />
                    </Col>
                </Row>


                <Row className="g-4">

                    <Col xs={12} lg={3} className="order-2 order-lg-1">
                        <QuestionNavigator
                            questions={questions}
                            currentIndex={currentIndex}
                            onSelectQuestion={(idx) => setCurrentIndex(idx)}
                            answersState={answersState}
                        />


                        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white mt-4">
                            <h6 className="fw-bold text-dark mb-2"><FaInfoCircle className="text-primary me-2" /> Anti-Cheat Mode Active</h6>
                            <ul className="small text-secondary mb-0 ps-3">
                                <li>Leaving full screen or switching browser tabs is strictly logged.</li>
                                <li>Right click and keyboard copy shortcuts are blocked.</li>
                                <li>Timer auto-submits your answers if time runs out.</li>
                            </ul>
                        </Card>
                    </Col>


                    <Col xs={12} lg={9} className="order-1 order-lg-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <QuestionRenderer
                                    question={currentQuestion}
                                    answerState={currentAnswerState}
                                    onAnswerChange={handleAnswerChange}
                                    onFlagToggle={handleFlagToggle}
                                    videoRef={videoRef}
                                    startCamera={startCamera}
                                    takePhoto={takePhoto}
                                    cameraActive={cameraActive}
                                    capturedImage={capturedImages[currentQuestion.qId]}
                                    clearCapturedImage={clearCapturedImage}
                                />
                            </motion.div>
                        </AnimatePresence>


                        <div className="d-flex justify-content-between mt-4">
                            <Button
                                variant="outline-primary"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                            >
                                <FaChevronLeft /> Back
                            </Button>

                            {currentIndex === questions.length - 1 ? (
                                <Button
                                    variant="success"
                                    onClick={() => setShowConfirmSubmit(true)}
                                    className="rounded-pill px-5 py-2 fw-bold d-flex align-items-center gap-2 shadow"
                                >
                                    Finish & Submit <FaPaperPlane />
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    onClick={handleNext}
                                    className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                                >
                                    Next <FaChevronRight />
                                </Button>
                            )}
                        </div>
                    </Col>
                </Row>
            </Container>


            <Modal show={showConfirmSubmit} onHide={() => !submitting && setShowConfirmSubmit(false)} centered className="rounded-5">
                <Modal.Header closeButton={!submitting} className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold">Submit Your Exam?</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4">
                    <p className="text-secondary">Are you sure you want to finish and submit your exam? Double check your flagged questions before submitting.</p>

                    <Card className="border-0 bg-light p-3 rounded-4 mb-3">
                        <Row className="text-center small fw-bold">
                            <Col xs={6} className="border-end">
                                <h4 className="fw-bold mb-0 text-dark">{totalQuestions}</h4>
                                <span className="text-muted">Total Questions</span>
                            </Col>
                            <Col xs={6}>
                                <h4 className="fw-bold mb-0 text-success">{answeredCount}</h4>
                                <span className="text-muted">Answered</span>
                            </Col>
                        </Row>
                    </Card>

                    {answeredCount < totalQuestions && (
                        <div className="alert alert-warning rounded-4 d-flex align-items-center gap-3">
                            <FaExclamationTriangle size={24} />
                            <span><strong>Warning:</strong> You have {totalQuestions - answeredCount} unanswered questions!</span>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4">
                    <Button variant="light" onClick={() => setShowConfirmSubmit(false)} disabled={submitting} className="rounded-pill px-4">
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleFinalSubmit} disabled={submitting} className="rounded-pill px-4 shadow">
                        {submitting ? <Spinner animation="border" size="sm" /> : 'Yes, Submit Exam'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ExamWindow;
