import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaFlag } from 'react-icons/fa';

const QuestionNavigator = ({ questions, currentIndex, onSelectQuestion, answersState }) => {
    return (
        <Card className="border-0 shadow-sm rounded-4 p-3 bg-white">
            <h5 className="fw-bold mb-3 text-secondary text-center">Questions Grid</h5>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
                {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const state = answersState[q.qId] || {};
                    const isAnswered = state.chosenOption !== null && state.chosenOption !== undefined && state.chosenOption !== '';
                    const isFlagged = state.isFlagged;

                    let btnVariant = 'light';
                    let textClass = 'text-dark';
                    let borderStyle = '1px solid #dee2e6';

                    if (isAnswered) {
                        btnVariant = 'success';
                        textClass = 'text-white';
                        borderStyle = 'none';
                    }

                    if (isFlagged) {
                        btnVariant = 'warning';
                        textClass = 'text-dark';
                        borderStyle = 'none';
                    }

                    if (isCurrent) {
                        borderStyle = '3px solid #4F46E5';
                    }

                    return (
                        <Button
                            key={q.qId}
                            variant={btnVariant}
                            className={`position-relative d-flex align-items-center justify-content-center fw-bold transition-all`}
                            style={{
                                width: '45px',
                                height: '45px',
                                borderRadius: '12px',
                                border: borderStyle,
                                transform: isCurrent ? 'scale(1.1)' : 'scale(1)'
                            }}
                            onClick={() => onSelectQuestion(idx)}
                        >
                            {idx + 1}
                            {isFlagged && (
                                <FaFlag
                                    className="position-absolute text-danger"
                                    style={{
                                        top: '-4px',
                                        right: '-4px',
                                        fontSize: '10px'
                                    }}
                                />
                            )}
                        </Button>
                    );
                })}
            </div>


            <hr />
            <div className="d-flex flex-column gap-2 small text-secondary mt-2 ps-2">
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1' }}></div>
                    <span>Unanswered</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#10B981' }}></div>
                    <span>Answered</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: '#F59E0B' }}></div>
                    <span>Flagged</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', border: '2px solid #4F46E5' }}></div>
                    <span>Current Question</span>
                </div>
            </div>
        </Card>
    );
};

export default QuestionNavigator;
