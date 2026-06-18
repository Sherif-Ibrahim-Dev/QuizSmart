import React from 'react';
import { Card, Form, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaFlag, FaCamera, FaCheckCircle, FaExclamationTriangle, FaTrash } from 'react-icons/fa';

const QuestionRenderer = ({
    question,
    answerState,
    onAnswerChange,
    onFlagToggle,
    videoRef,
    startCamera,
    takePhoto,
    cameraActive,
    capturedImage,
    clearCapturedImage
}) => {
    const { qId, qText, qType, optionA, optionB, optionC, optionD, marks, imagePath } = question;
    const chosenOption = answerState?.chosenOption || '';
    const isFlagged = answerState?.isFlagged || false;

    const handleSelectOption = (optionValue) => {
        onAnswerChange(qId, optionValue);
    };

    return (
        <Card className="border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
            <div className="d-flex justify-content-between align-items-start mb-4 gap-3">
                <div>
                    <Badge bg="indigo-light" className="mb-2 px-3 py-2 rounded-pill text-indigo" style={{ backgroundColor: '#EEF2F6', color: '#4F46E5', fontWeight: 'bold' }}>
                        {qType}
                    </Badge>
                    <span className="ms-2 text-muted fw-bold small">{marks} {marks === 1 ? 'Mark' : 'Marks'}</span>
                </div>
                <Button
                    variant={isFlagged ? 'warning' : 'outline-secondary'}
                    onClick={() => onFlagToggle(qId)}
                    className="rounded-pill d-flex align-items-center gap-2 px-3 transition-all"
                    size="sm"
                >
                    <FaFlag />
                    <span>{isFlagged ? 'Flagged' : 'Flag for Review'}</span>
                </Button>
            </div>


            <h3 className="fw-bold mb-4 text-dark" style={{ lineHeight: '1.4' }}>
                {qText}
            </h3>


            {imagePath && (
                <div className="mb-4 text-center">
                    <img
                        src={`https://localhost:7194${imagePath}`}
                        alt="Question Visual Aid"
                        className="img-fluid rounded-4 shadow-sm border"
                        style={{ maxHeight: '250px', objectFit: 'contain' }}
                    />
                </div>
            )}


            <div className="mt-4">
                {qType === 'MCQ' && (
                    <div className="d-flex flex-column gap-3">
                        {[
                            { label: 'A', text: optionA },
                            { label: 'B', text: optionB },
                            { label: 'C', text: optionC },
                            { label: 'D', text: optionD }
                        ].map((opt) => {
                            if (!opt.text) return null;
                            const isSelected = chosenOption.trim().toLowerCase() === opt.text.trim().toLowerCase();
                            return (
                                <div
                                    key={opt.label}
                                    onClick={() => handleSelectOption(opt.text)}
                                    className={`p-3 rounded-4 border transition-all cursor-pointer d-flex align-items-center gap-3 ${isSelected ? 'border-primary bg-primary-light-10' : 'border-light hover-bg'}`}
                                    style={{
                                        borderWidth: '2px',
                                        backgroundColor: isSelected ? '#EEF2F6' : '#fff',
                                        borderColor: isSelected ? '#4F46E5' : '#E2E8F0'
                                    }}
                                >
                                    <div
                                        className={`d-flex align-items-center justify-content-center fw-bold rounded-circle`}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            backgroundColor: isSelected ? '#4F46E5' : '#EEF2F6',
                                            color: isSelected ? '#fff' : '#4F46E5'
                                        }}
                                    >
                                        {opt.label}
                                    </div>
                                    <span className="fw-semibold text-dark flex-grow-1">{opt.text}</span>
                                    {isSelected && <FaCheckCircle className="text-primary fs-5" />}
                                </div>
                            );
                        })}
                    </div>
                )}

                {qType === 'TrueFalse' && (
                    <Row className="g-4">
                        {['True', 'False'].map((val) => {
                            const isSelected = chosenOption.trim().toLowerCase() === val.toLowerCase();
                            return (
                                <Col key={val} xs={6}>
                                    <Card
                                        onClick={() => handleSelectOption(val)}
                                        className="text-center p-4 rounded-4 cursor-pointer transition-all border-2"
                                        style={{
                                            backgroundColor: isSelected ? (val === 'True' ? '#ECFDF5' : '#FEF2F2') : '#fff',
                                            borderColor: isSelected ? (val === 'True' ? '#10B981' : '#EF4444') : '#E2E8F0',
                                            borderWidth: '2px'
                                        }}
                                    >
                                        <h4 className={`fw-bold mb-0 ${isSelected ? (val === 'True' ? 'text-success' : 'text-danger') : 'text-secondary'}`}>
                                            {val}
                                        </h4>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}

                {qType === 'Written' && (
                    <div className="d-flex flex-column gap-4">
                        <Form.Group>
                            <Form.Label className="fw-bold text-secondary mb-2">Type your written answer:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                className="rounded-4 p-3 shadow-sm border-2 border-light"
                                placeholder="Write your solution explanation here..."
                                value={chosenOption}
                                onChange={(e) => handleSelectOption(e.target.value)}
                            />
                        </Form.Group>


                        <Card className="border-0 bg-light rounded-4 p-4 text-center">
                            <h6 className="fw-bold mb-3 text-secondary d-flex align-items-center justify-content-center gap-2">
                                <FaCamera /> Upload Handwriting Photo (Optional / Additional proof)
                            </h6>

                            {capturedImage ? (
                                <div className="position-relative d-inline-block mx-auto mb-3" style={{ maxWidth: '400px' }}>
                                    <img
                                        src={capturedImage}
                                        alt="Captured Solution"
                                        className="rounded-4 img-fluid shadow-sm border"
                                    />
                                    <Button
                                        variant="danger"
                                        className="position-absolute rounded-circle shadow-sm"
                                        style={{ top: '10px', right: '10px', width: '36px', height: '36px', padding: '0' }}
                                        onClick={clearCapturedImage}
                                    >
                                        <FaTrash size={14} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-100 mx-auto" style={{ maxWidth: '400px' }}>
                                    {cameraActive ? (
                                        <div className="rounded-4 overflow-hidden shadow-sm border mb-3 bg-dark">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                className="w-100"
                                                style={{ maxHeight: '250px' }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-5 border border-dashed rounded-4 mb-3 d-flex flex-column align-items-center justify-content-center bg-white">
                                            <FaCamera size={36} className="text-muted mb-2 opacity-50" />
                                            <span className="small text-muted">Use camera to capture physical paperwork</span>
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 justify-content-center">
                                        {!cameraActive ? (
                                            <Button variant="outline-primary" size="sm" className="rounded-pill px-4" onClick={startCamera}>
                                                Start Camera
                                            </Button>
                                        ) : (
                                            <Button variant="success" size="sm" className="rounded-pill px-4" onClick={takePhoto}>
                                                Capture Solution
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Removed visible anti-cheat warning per request */}
                        </Card>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default QuestionRenderer;
