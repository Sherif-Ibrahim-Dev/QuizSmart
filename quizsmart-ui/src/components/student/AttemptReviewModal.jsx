import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaAward, FaInfoCircle } from 'react-icons/fa';
import studentService from '../../services/studentService';

const AttemptReviewModal = ({ show, onHide, attemptId, examTitle }) => {
    const [loading, setLoading] = useState(true);
    const [reviewData, setReviewData] = useState(null);

    useEffect(() => {
        if (show && attemptId) {
            setLoading(true);
            studentService.getAttemptReview(attemptId)
                .then(data => {
                    setReviewData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error loading attempt review", err);
                    setLoading(false);
                });
        }
    }, [show, attemptId]);

    return (
        <Modal show={show} onHide={onHide} centered size="lg" className="rounded-5">
            <Modal.Header closeButton className="border-0 px-4 pt-4">
                <Modal.Title className="fw-bold text-dark">Attempt Review</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4">
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="text-muted mt-3 small">Loading exam attempt review details...</p>
                    </div>
                ) : reviewData ? (
                    <div>
                        <h5 className="fw-bold mb-1 text-primary">{examTitle}</h5>
                        <p className="text-muted small mb-4">Detailed breakdown of your submitted answers</p>

                        <Card className="border-0 bg-light p-4 rounded-4 mb-4 shadow-sm">
                            <Row className="align-items-center text-center text-md-start">
                                <Col md={8}>
                                    <div className="d-flex align-items-center gap-3 justify-content-center justify-content-md-start">
                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '56px', height: '56px', fontSize: '24px' }}>
                                            <FaAward />
                                        </div>
                                        <div>
                                            <h6 className="text-secondary mb-0 fw-bold">FINAL ACADEMIC SCORE</h6>
                                            <h2 className="fw-bold text-dark mb-0">{reviewData.finalScore} Marks</h2>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <Badge bg="info" className="px-3 py-2 rounded-pill small">
                                        Completed Evaluation
                                    </Badge>
                                </Col>
                            </Row>
                        </Card>

                        <h6 className="fw-bold text-secondary mb-3">Questions Breakdown:</h6>
                        <div className="d-flex flex-column gap-3" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                            {reviewData.answers && reviewData.answers.length > 0 ? (
                                reviewData.answers.map((ans, idx) => {
                                    const isCorrect = ans.isCorrect;
                                    let borderCol = '#E2E8F0';
                                    let statusIcon = <FaHourglassHalf className="text-warning" />;
                                    let badgeBg = 'warning';
                                    let statusText = 'Pending Correction';

                                    if (isCorrect === true) {
                                        borderCol = '#10B981';
                                        statusIcon = <FaCheckCircle className="text-success" />;
                                        badgeBg = 'success';
                                        statusText = 'Correct Answer';
                                    } else if (isCorrect === false) {
                                        borderCol = '#EF4444';
                                        statusIcon = <FaTimesCircle className="text-danger" />;
                                        badgeBg = 'danger';
                                        statusText = 'Incorrect Answer';
                                    }

                                    return (
                                        <Card
                                            key={idx}
                                            className="border-2 rounded-4 shadow-sm overflow-hidden bg-white"
                                            style={{ borderColor: borderCol }}
                                        >
                                            <Card.Body className="p-4">
                                                <div className="d-flex justify-content-between align-items-start mb-3 gap-3">
                                                    <h6 className="fw-bold text-dark mb-0" style={{ lineHeight: '1.4' }}>
                                                        Q{idx + 1}: {ans.questionText || "Question text omitted."}
                                                    </h6>
                                                    <div className="d-flex gap-2 align-items-center flex-wrap justify-content-end">
                                                        <Badge bg={badgeBg} className="rounded-pill px-2 py-1 text-capitalize">
                                                            {statusText}
                                                        </Badge>
                                                        <Badge bg="dark" className="rounded-pill px-2 py-1 text-capitalize">
                                                            {ans.qType === "Written"
                                                                ? (ans.isCorrect === null ? `Grade: Pending / ${ans.maxMarks}` : `Grade: ${ans.writtenMark} / ${ans.maxMarks}`)
                                                                : `Grade: ${ans.isCorrect ? ans.maxMarks : 0} / ${ans.maxMarks}`
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 d-flex align-items-center gap-3 border border-light">
                                                    {statusIcon}
                                                    <div>
                                                        <small className="text-muted d-block fw-bold small">YOUR RESPONSE:</small>
                                                        <span className="fw-semibold text-dark">{ans.studentAnswer || "No answer provided"}</span>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    );
                                })
                            ) : (
                                <p className="text-muted text-center py-3">No question submission history available.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted">
                        <FaInfoCircle size={32} className="mb-2" />
                        <p className="fw-bold">No Review Data</p>
                        <span>Unable to fetch attempt detail from the server.</span>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 px-4 pb-4">
                <Button variant="primary" className="rounded-pill px-4 shadow" onClick={onHide} style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}>
                    Close Review
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AttemptReviewModal;
