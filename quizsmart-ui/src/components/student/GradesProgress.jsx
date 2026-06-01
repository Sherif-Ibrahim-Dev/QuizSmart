import React, { useState, useEffect } from 'react';
import { Table, Badge, Card, Button, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaChevronRight, FaLock, FaBookOpen } from 'react-icons/fa';
import studentService from '../../services/studentService';
import StatsCards from './StatsCards';
import AttemptReviewModal from './AttemptReviewModal';

const GradesProgress = () => {
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedAttemptId, setSelectedAttemptId] = useState(null);
    const [selectedExamTitle, setSelectedExamTitle] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (user?.userId) {
            loadData();
        }
    }, [user?.userId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const historyData = await studentService.getHistory(user.userId);
            setHistory(historyData || []);

            const statsData = await studentService.getStudentStats(user.userId);
            setStats(statsData);
        } catch (err) {
            console.error("Error loading academics data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (attemptId, examTitle) => {
        setSelectedAttemptId(attemptId);
        setSelectedExamTitle(examTitle);
        setShowReviewModal(true);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    return (
        <div className="p-4 animate__animated animate__fadeIn">
            <div className="mb-4">
                <h3 className="fw-bold mb-1 text-dark">Academics & Analytics</h3>
                <p className="text-secondary small mb-0">Monitor your exam scores, overall stats, and trace detailed reviews</p>
            </div>


            <StatsCards stats={stats} />

            <h5 className="fw-bold text-secondary mb-3 mt-4">Grading & Attempt Logs</h5>
            <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                {history.length > 0 ? (
                    <Table hover responsive className="mb-0 align-middle">
                        <thead className="bg-light">
                            <tr className="text-secondary small fw-bold">
                                <th className="ps-4">Exam Title</th>
                                <th>Date Submitted</th>
                                <th>Achieved Score</th>
                                <th>Result Status</th>
                                <th className="text-center pe-4">Review Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(item => {
                                const percent = item.total > 0 ? (item.score / item.total) * 100 : 0;
                                let badgeBg = 'success';
                                let badgeText = 'Passed';

                                if (percent < 50) {
                                    badgeBg = 'danger';
                                    badgeText = 'Failed';
                                } else if (percent < 65) {
                                    badgeBg = 'warning';
                                    badgeText = 'Passed';
                                }

                                return (
                                    <tr key={item.attemptId} className="transition-all hover-bg">
                                        <td className="ps-4 fw-bold text-dark">{item.examTitle}</td>
                                        <td>
                                            <span className="d-flex align-items-center gap-2 small text-secondary">
                                                <FaCalendarAlt /> {new Date(item.date).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="fw-bold text-dark">{item.score} / {item.total}</td>
                                        <td>
                                            <Badge bg={badgeBg} className="rounded-pill px-3 py-2 small">
                                                {badgeText}
                                            </Badge>
                                        </td>
                                        <td className="text-center pe-4">
                                            {item.canReview ? (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-1 mx-auto"
                                                    onClick={() => handleViewDetails(item.attemptId, item.examTitle)}
                                                    style={{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' }}
                                                >
                                                    View Details <FaChevronRight size={10} />
                                                </Button>
                                            ) : (
                                                <span className="small text-muted d-flex align-items-center justify-content-center gap-2">
                                                    <FaLock /> Sealed Review
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                ) : (
                    <div className="text-center py-5 text-muted">
                        <FaBookOpen size={48} className="opacity-25 mb-3" />
                        <p className="fw-bold text-dark">No Finished Attempts Yet</p>
                        <span className="small text-secondary">Once you take and complete exams, your scores and review logs will appear here.</span>
                    </div>
                )}
            </Card>


            <AttemptReviewModal
                show={showReviewModal}
                onHide={() => setShowReviewModal(false)}
                attemptId={selectedAttemptId}
                examTitle={selectedExamTitle}
            />
        </div>
    );
};

export default GradesProgress;
