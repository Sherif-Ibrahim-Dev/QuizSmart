import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import examService from '../services/examService';
import {
    FaSync, FaTrash, FaChartBar, FaFileExcel, FaTrophy,
    FaUsers, FaStar, FaPercentage, FaCheckCircle, FaTimesCircle, FaHourglassHalf
} from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ExamStatus = () => {
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);
    const [analytics, setAnalytics] = useState(null);

    const [generalStats, setGeneralStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [questionsAnalysis, setQuestionsAnalysis] = useState([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [examToDelete, setExamToDelete] = useState(null);

    const [showRepublishModal, setShowRepublishModal] = useState(false);
    const [examToRepublish, setExamToRepublish] = useState(null);
    const [newDates, setNewDates] = useState({ startTime: '', endTime: '' });

    useEffect(() => {
        loadExams();
    }, []);

    const loadExams = async () => {
        try {
            setIsLoading(true);
            const data = await examService.getMyExams();
            setExams(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewAnalytics = async (exam) => {
        setSelectedExam(exam);
        setLoadingAnalytics(true);
        setGeneralStats(null);
        setLeaderboard([]);
        setQuestionsAnalysis([]);
        setAnalytics(null);

        try {
            const stats = await examService.getExamGeneralStats(exam.examId).catch(() => null);
            setGeneralStats(stats);

            const topStudents = await examService.getTopStudents(exam.examId).catch(() => []);
            setLeaderboard(topStudents || []);

            const analysis = await examService.getQuestionsAnalysis(exam.examId).catch(() => []);
            setQuestionsAnalysis(analysis || []);

            if (analysis && analysis.length > 0) {
                const labels = analysis.map(item =>
                    item.questionText.length > 25 ? item.questionText.substring(0, 25) + '...' : item.questionText
                );
                const correctPercentages = analysis.map(item => {
                    const total = item.correctCount + item.wrongCount;
                    return total > 0 ? Math.round((item.correctCount / total) * 100) : 0;
                });

                setAnalytics({
                    labels: labels,
                    datasets: [{
                        label: 'Correct %',
                        data: correctPercentages,
                        backgroundColor: 'rgba(79, 70, 229, 0.6)',
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 1,
                        borderRadius: 8
                    }]
                });
            }
        } catch (err) {
            console.error("Failed to load real-time analytics", err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleShowDelete = (id) => {
        setExamToDelete(id);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await examService.deleteExam(examToDelete);
            setExams(exams.filter(e => e.examId !== examToDelete));
            setShowDeleteModal(false);
            setExamToDelete(null);
            if (selectedExam && selectedExam.examId === examToDelete) {
                setSelectedExam(null);
                setAnalytics(null);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete the exam.');
        }
    };

    const handleShowRepublish = (exam) => {
        setExamToRepublish(exam);
        const formatLocal = (dateStr) => {
            const d = new Date(dateStr);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        };

        setNewDates({
            startTime: formatLocal(exam.startTime),
            endTime: formatLocal(exam.endTime)
        });
        setShowRepublishModal(true);
    };

    const handleConfirmRepublish = async () => {
        try {
            const updatedData = {
                ...examToRepublish,
                startTime: newDates.startTime,
                endTime: newDates.endTime
            };
            await examService.updateExam(examToRepublish.examId, updatedData);
            alert('Exam dates updated successfully!');
            setShowRepublishModal(false);
            loadExams();
        } catch (err) {
            console.error(err);
            alert('Error updating exam dates.');
        }
    };

    const handleExportExcel = async (examId, examTitle) => {
        try {
            const data = await examService.getExamResults(examId);

            const headers = ["Student Name", "Email", "Score", "Total Marks", "Percentage", "Status", "Date"];

            const rows = data.map(item => [
                `"${item.studentName}"`,
                item.email,
                item.score,
                item.totalMarks,
                `${item.percentage}%`,
                item.status,
                item.date
            ]);

            const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Results_${examTitle.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'No completed attempts found for this exam yet.');
        }
    };

    return (
        <div className="p-3">
            <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Body>
                    <h5 className="fw-bold mb-3 text-dark">Exam Management & Analytics</h5>
                    {isLoading ? (
                        <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
                    ) : (
                        <Table hover responsive className="align-middle">
                            <thead className="table-light small">
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Course</th>
                                    <th>Status</th>
                                    <th>Participants</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.map(exam => {
                                    const now = new Date();
                                    const start = new Date(exam.startTime);
                                    const end = new Date(exam.endTime);
                                    let status = { text: 'Scheduled', color: 'info' };

                                    if (now >= start && now <= end) status = { text: 'Live', color: 'success' };
                                    else if (now > end) status = { text: 'Closed', color: 'secondary' };

                                    return (
                                        <tr key={exam.examId}>
                                            <td className="fw-medium text-dark">{exam.title}</td>
                                            <td><Badge bg="light" text="dark" className="border">{exam.courseName}</Badge></td>
                                            <td><Badge bg={status.color}>{status.text}</Badge></td>
                                            <td className="text-secondary fw-bold">{exam.attemptsCount || 0} students</td>
                                            <td className="text-end">

                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2 rounded-circle"
                                                    onClick={() => handleViewAnalytics(exam)}
                                                    title="View Live Exam Analytics"
                                                    style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <FaChartBar />
                                                </Button>


                                                {(status.text === 'Closed' || exam.attemptsCount > 0) && (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="me-2 rounded-circle"
                                                        title="Export Results to Excel"
                                                        onClick={() => handleExportExcel(exam.examId, exam.title)}
                                                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <FaFileExcel />
                                                    </Button>
                                                )}

                                                {status.text === 'Closed' && (
                                                    <Button
                                                        variant="outline-dark"
                                                        size="sm"
                                                        className="me-2 rounded-circle"
                                                        title="Update Period / Republish"
                                                        onClick={() => handleShowRepublish(exam)}
                                                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <FaSync />
                                                    </Button>
                                                )}

                                                {(status.text === 'Scheduled' || status.text === 'Closed') && (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="rounded-circle"
                                                        title="Delete Exam"
                                                        onClick={() => handleShowDelete(exam.examId)}
                                                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>


            {loadingAnalytics && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="indigo" style={{ color: '#4F46E5' }} />
                    <p className="text-muted mt-2 small">Fetching live exam statistics and performance analysis...</p>
                </div>
            )}


            {!loadingAnalytics && selectedExam && (
                <div className="animate__animated animate__fadeInUp">
                    {generalStats ? (
                        <>

                            <h5 className="fw-bold text-dark mt-4 mb-3">
                                Live Performance Dashboard: <span className="text-primary">{selectedExam.title}</span>
                            </h5>
                            <Row className="g-3 mb-4">
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-primary">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted fw-bold d-block mb-1">Total Participants</small>
                                                <h3 className="fw-black mb-0 text-dark">{generalStats.totalParticipants}</h3>
                                            </div>
                                            <div className="bg-light p-3 rounded-circle text-primary"><FaUsers size={20} /></div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-warning">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted fw-bold d-block mb-1">Class Average Score</small>
                                                <h3 className="fw-black mb-0 text-dark">{generalStats.averageScore} / {selectedExam.totalMarks || 100}</h3>
                                            </div>
                                            <div className="bg-light p-3 rounded-circle text-warning"><FaStar size={20} /></div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-success">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted fw-bold d-block mb-1">Overall Success Rate</small>
                                                <h3 className="fw-black mb-0 text-success">{generalStats.successRate}%</h3>
                                            </div>
                                            <div className="bg-light p-3 rounded-circle text-success"><FaPercentage size={20} /></div>
                                        </div>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4 border-info">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted fw-bold d-block mb-1">Passed vs. Failed</small>
                                                <h5 className="fw-bold mb-0 text-dark">
                                                    <span className="text-success">{generalStats.successCount} Pass</span> - <span className="text-danger">{generalStats.failureCount} Fail</span>
                                                </h5>
                                            </div>
                                            <div className="bg-light p-3 rounded-circle text-info"><FaCheckCircle size={20} /></div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-4 mb-4">

                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm rounded-4 bg-white h-100">
                                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                                            <h6 className="fw-bold mb-0 text-dark"><FaTrophy className="text-warning me-2" /> Top Students Leaderboard (Top 10)</h6>
                                        </Card.Header>
                                        <Card.Body className="px-4 pb-4">
                                            {leaderboard.length === 0 ? (
                                                <p className="text-muted text-center py-4 small">No completed attempts found to generate leaderboard.</p>
                                            ) : (
                                                <Table hover responsive size="sm" className="align-middle mb-0 text-dark small">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Student Name</th>
                                                            <th>Achieved Score</th>
                                                            <th>Time Taken</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {leaderboard.map((student, idx) => (
                                                            <tr key={idx}>
                                                                <td>
                                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                                                </td>
                                                                <td className="fw-bold">{student.studentName}</td>
                                                                <td className="text-primary fw-bold">{student.score} pts</td>
                                                                <td>{student.timeTaken} mins</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>


                                <Col lg={6}>
                                    <Card className="border-0 shadow-sm rounded-4 bg-white h-100">
                                        <Card.Header className="bg-transparent border-0 pt-4 px-4">
                                            <h6 className="fw-bold mb-0 text-dark"><FaChartBar className="text-primary me-2" /> Success Rate per Question</h6>
                                        </Card.Header>
                                        <Card.Body className="px-4 pb-4">
                                            {analytics ? (
                                                <div style={{ height: '280px' }}>
                                                    <Bar
                                                        data={analytics}
                                                        options={{
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: { display: false }
                                                            },
                                                            scales: { y: { beginAtZero: true, max: 100 } }
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-muted text-center py-5 small">Not enough data to generate question chart analysis.</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <Alert variant="warning" className="rounded-4 border-0 shadow-sm text-center p-4">
                            <FaTimesCircle className="mb-2" size={24} />
                            <h5>No statistics available yet</h5>
                            <p className="mb-0 small text-secondary">There are no completed attempts for this exam to display performance analytics.</p>
                        </Alert>
                    )}
                </div>
            )}


            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold text-danger">Confirm Exam Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to permanently delete this exam?
                    <p className="text-muted small mt-2">This will permanently delete all student attempts and grades associated with this exam. Questions in your bank will remain safe.</p>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>Yes, Delete Exam</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showRepublishModal} onHide={() => setShowRepublishModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold text-primary">Update Exam Period</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">New Start Date & Time</Form.Label>
                        <Form.Control type="datetime-local" value={newDates.startTime} onChange={(e) => setNewDates({...newDates, startTime: e.target.value})} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">New End Date & Time</Form.Label>
                        <Form.Control type="datetime-local" value={newDates.endTime} onChange={(e) => setNewDates({...newDates, endTime: e.target.value})} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="light" onClick={() => setShowRepublishModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmRepublish}>Update Dates</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ExamStatus;
