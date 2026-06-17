import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, Table, Button, Badge, Spinner, Modal, Form, Row, Col, Alert } from 'react-bootstrap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import examService from '../services/examService';
import {
    FaSync, FaTrash, FaChartBar, FaFileExcel, FaTrophy,
    FaUsers, FaStar, FaPercentage, FaCheckCircle, FaTimesCircle, FaHourglassHalf
} from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const wrapText = (text, maxLength = 50) => {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + ' ' + word).trim().length <= maxLength) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
};

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
                // X-axis: "Q(1)", "Q(2)", ... for a clean histogram look
                const labels = analysis.map((_, idx) => `Q(${idx + 1})`);
                // Handle both PascalCase (from .NET) and camelCase
                const correctCounts = analysis.map(item => item.CorrectCount ?? item.correctCount ?? 0);

                // Map to indices and correct counts to find the lowest two
                const items = analysis.map((item, idx) => ({
                    idx,
                    correctCount: item.CorrectCount ?? item.correctCount ?? 0
                }));

                // Sort ascending to find the smallest correct counts
                const sorted = [...items].sort((a, b) => a.correctCount - b.correctCount);
                // Get the indices of the two lowest questions
                const lowestIndices = sorted.slice(0, 2).map(x => x.idx);

                // Build dynamic background and border colors
                const backgroundColors = analysis.map((_, idx) => 
                    lowestIndices.includes(idx)
                        ? 'rgba(239, 68, 68, 0.85)'  // Red for lowest 2
                        : 'rgba(16, 185, 129, 0.85)' // Emerald for others
                );
                
                const borderColors = analysis.map((_, idx) => 
                    lowestIndices.includes(idx)
                        ? 'rgba(185, 28, 28, 1)'
                        : 'rgba(5, 150, 105, 1)'
                );

                setAnalytics({
                    labels,
                    datasets: [
                        {
                            label: 'Correct Answers',
                            data: correctCounts,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1.5,
                            borderRadius: 6,
                            borderSkipped: false,
                        }
                    ]
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

    // ── Shared helper: apply full cell styles to a worksheet ─────────────────────
    const applyExcelStyles = (ws, headers, rowCount) => {
        const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Header style: indigo background (#4F46E5), white bold text, centered, bordered
        const headerStyle = {
            font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
            fill:      { fgColor: { rgb: '4F46E5' }, patternType: 'solid' },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                top:    { style: 'thin', color: { rgb: 'FFFFFF' } },
                bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
                left:   { style: 'thin', color: { rgb: 'FFFFFF' } },
                right:  { style: 'thin', color: { rgb: 'FFFFFF' } },
            }
        };

        // Data cell style: light border, readable font
        const getCellStyle = (rowIdx) => ({
            font:      { sz: 10, name: 'Calibri' },
            fill:      { fgColor: { rgb: rowIdx % 2 === 0 ? 'F5F3FF' : 'FFFFFF' }, patternType: 'solid' },
            alignment: { vertical: 'center', wrapText: false },
            border: {
                top:    { style: 'hair', color: { rgb: 'C4B5FD' } },
                bottom: { style: 'hair', color: { rgb: 'C4B5FD' } },
                left:   { style: 'hair', color: { rgb: 'C4B5FD' } },
                right:  { style: 'hair', color: { rgb: 'C4B5FD' } },
            }
        });

        // Apply header styles (row 1)
        headers.forEach((_, colIdx) => {
            const cellRef = `${colLetters[colIdx]}1`;
            if (ws[cellRef]) ws[cellRef].s = headerStyle;
        });

        // Apply data row styles
        for (let r = 0; r < rowCount; r++) {
            headers.forEach((_, colIdx) => {
                const cellRef = `${colLetters[colIdx]}${r + 2}`;
                if (ws[cellRef]) ws[cellRef].s = getCellStyle(r);
            });
        }

        // Set row height for header
        ws['!rows'] = [{ hpt: 22 }, ...Array(rowCount).fill({ hpt: 18 })];
    };

    const handleExportExcel = async (examId, examTitle) => {
        try {
            const data = await examService.getExamResults(examId);

            // ── 1. Build the data rows ─────────────────────────────────────────────
            const headers = ["Student Name", "Email", "Score", "Total Marks", "Percentage", "Status", "Submission Date"];

            const rows = data.map(item => ({
                "Student Name":    item.studentName  ?? '',
                "Email":           item.email        ?? '',
                "Score":           item.score        ?? 0,
                "Total Marks":     item.totalMarks   ?? 0,
                "Percentage":      item.percentage   ?? 0,
                "Status":          item.status       ?? '',
                "Submission Date": item.date         ?? ''
            }));

            // ── 2. Create workbook & worksheet ────────────────────────────────────
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

            // ── 3. Dynamic column widths ──────────────────────────────────────────
            const colWidths = headers.map(h => ({ wch: h.length }));
            rows.forEach(row => {
                headers.forEach((h, i) => {
                    const cellVal = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
                    if (cellVal.length > colWidths[i].wch) colWidths[i].wch = cellVal.length;
                });
            });
            ws['!cols'] = colWidths.map(c => ({ wch: Math.min(c.wch + 6, 50) }));

            // ── 4. Freeze header row ──────────────────────────────────────────────
            ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

            // ── 5. Percentage column format ───────────────────────────────────────
            rows.forEach((_, rowIdx) => {
                const cellRef = `E${rowIdx + 2}`;
                if (ws[cellRef]) ws[cellRef].z = '0"%"';
            });

            // ── 6. Apply colors & borders ─────────────────────────────────────────
            applyExcelStyles(ws, headers, rows.length);

            // ── 7. Save file ──────────────────────────────────────────────────────
            const safeTitle = examTitle.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
            XLSX.utils.book_append_sheet(wb, ws, 'Results');
            XLSX.writeFile(wb, `Results_${safeTitle}.xlsx`);

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
                                        <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
                                            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 border-bottom pb-3">
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark d-flex align-items-center">
                                                        <FaChartBar className="text-primary me-2" />
                                                        Correct Answers per Question
                                                    </h6>
                                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        Number of students who answered each question correctly
                                                    </small>
                                                </div>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <span className="d-flex align-items-center gap-1.5 px-2 py-1 bg-light rounded-3 border" style={{ fontSize: '0.7rem' }}>
                                                        <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'rgba(16, 185, 129, 0.85)' }}></span>
                                                        <span className="text-dark fw-medium">Normal</span>
                                                    </span>
                                                    <span className="d-flex align-items-center gap-1.5 px-2 py-1 bg-light rounded-3 border" style={{ fontSize: '0.7rem' }}>
                                                        <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, backgroundColor: 'rgba(239, 68, 68, 0.85)' }}></span>
                                                        <span className="text-dark fw-medium">Lowest 2</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </Card.Header>
                                        <Card.Body className="px-4 pb-4">
                                            {analytics ? (
                                                <>
                                                    <div style={{ height: '300px' }}>
                                                        <Bar
                                                            data={analytics}
                                                            options={{
                                                                maintainAspectRatio: false,
                                                                responsive: true,
                                                                plugins: {
                                                                    legend: {
                                                                        display: false
                                                                    },
                                                                    tooltip: {
                                                                        backgroundColor: 'rgba(17, 24, 39, 0.92)',
                                                                        titleFont: { size: 12, weight: 'bold' },
                                                                        bodyFont: { size: 11 },
                                                                        padding: 10,
                                                                        cornerRadius: 8,
                                                                        callbacks: {
                                                                            title: (tooltipItems) => {
                                                                                if (!tooltipItems || tooltipItems.length === 0) return '';
                                                                                const idx = tooltipItems[0].dataIndex;
                                                                                const qText = questionsAnalysis[idx]?.QuestionText ?? questionsAnalysis[idx]?.questionText ?? '';
                                                                                return [`Question Q(${idx + 1}):`, ...wrapText(qText, 55)];
                                                                            },
                                                                            label: (ctx) => ` Correct Answers: ${ctx.raw} student(s)`
                                                                        }
                                                                    },
                                                                    datalabels: { display: false }
                                                                },
                                                                scales: {
                                                                    x: {
                                                                        grid: { display: false },
                                                                        ticks: {
                                                                            font: { size: 10, family: 'Inter, sans-serif' },
                                                                            color: '#6B7280',
                                                                            maxRotation: 30
                                                                        },
                                                                        title: {
                                                                            display: true,
                                                                            text: 'Question Number',
                                                                            font: { size: 11, weight: '600' },
                                                                            color: '#6B7280',
                                                                            padding: { top: 8 }
                                                                        }
                                                                    },
                                                                    y: {
                                                                        beginAtZero: true,
                                                                        grid: { color: 'rgba(156,163,175,0.2)', drawBorder: false },
                                                                        ticks: {
                                                                            stepSize: 1,
                                                                            font: { size: 10, family: 'Inter, sans-serif' },
                                                                            color: '#6B7280'
                                                                        },
                                                                        title: {
                                                                            display: true,
                                                                            text: 'Number of Students',
                                                                            font: { size: 11, weight: '600' },
                                                                            color: '#6B7280',
                                                                            padding: { bottom: 8 }
                                                                        }
                                                                    }
                                                                },
                                                                barPercentage: 0.65,
                                                                categoryPercentage: 0.75,
                                                                animation: { duration: 600, easing: 'easeOutQuart' }
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Most Missed Questions Section */}
                                                    {questionsAnalysis.length > 0 && (() => {
                                                        const mostMissed = questionsAnalysis
                                                            .map((q, idx) => ({
                                                                ...q,
                                                                originalIndex: idx + 1,
                                                                // Handle both PascalCase (.NET) and camelCase
                                                                _wrongCount: q.WrongCount ?? q.wrongCount ?? 0,
                                                                _questionText: q.QuestionText ?? q.questionText ?? ''
                                                            }))
                                                            .filter(q => q._wrongCount > 0)
                                                            .sort((a, b) => b._wrongCount - a._wrongCount)
                                                            .slice(0, 2);

                                                        if (mostMissed.length === 0) return null;

                                                        return (
                                                            <div className="mt-4 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                                                                <h6 className="fw-bold text-danger mb-3" style={{ fontSize: '0.85rem' }}>
                                                                    <FaTimesCircle className="me-2" />
                                                                    Most Missed Questions
                                                                </h6>
                                                                {mostMissed.map((q, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="d-flex align-items-start mb-2 p-2 rounded-3"
                                                                        style={{ backgroundColor: i === 0 ? '#FEF2F2' : '#FFF7ED', border: `1px solid ${i === 0 ? '#FECACA' : '#FED7AA'}` }}
                                                                    >
                                                                        <Badge
                                                                            bg={i === 0 ? 'danger' : 'warning'}
                                                                            className="me-2 mt-1"
                                                                            style={{ fontSize: '0.7rem', minWidth: '42px' }}
                                                                        >
                                                                            Q({q.originalIndex})
                                                                        </Badge>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <p className="mb-0 text-dark" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                                                {q._questionText && q._questionText.length > 100
                                                                                    ? q._questionText.substring(0, 100) + '...'
                                                                                    : q._questionText}
                                                                            </p>
                                                                            <small className="text-danger fw-bold">
                                                                                {q._wrongCount} student{q._wrongCount !== 1 ? 's' : ''} answered incorrectly
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </>
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
