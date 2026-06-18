
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Container, Nav, Card, Button, Badge, Row, Col, Modal, Form, Dropdown, Table } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBook, FaDatabase, FaPlusCircle, FaChartBar, FaPenNib,
    FaSignOutAlt, FaBars, FaEllipsisV, FaTrash, FaDownload, FaFileDownload, FaFileExcel, FaUpload
} from 'react-icons/fa';
import authService from '../services/authService';
import courseService from '../services/courseService';
import questionService from '../services/questionService';
import { useNavigate } from 'react-router-dom';
import CreateExamForm from '../components/CreateExamForm';
import ExamStatus from '../components/ExamStatus';
import PendingCorrections from '../components/PendingCorrections';

const InstructorDashboard = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('stats');
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState({ fullName: 'Instructor', userId: null });

    const [courses, setCourses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState({
        courseName: '', courseCode: '', description: '', creditHours: 2, academicYear: 1, semester: 1
    });
    const [newCourse, setNewCourse] = useState({
        courseName: '', courseCode: '', description: '', creditHours: 2, academicYear: 1, semester: 1
    });

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [questions, setQuestions] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [manualQuestion, setManualQuestion] = useState({
        qText: '', qType: 'MCQ', difficulty: 'Medium', correctAns: '',
        optionA: '', optionB: '', optionC: '', optionD: '', marks: 1
    });

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
    }, []);

    useEffect(() => {
        if (activeTab === 'courses') loadCourses();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'bank' && selectedCourseId) {
            loadQuestions(selectedCourseId);
            loadExcelHistory(selectedCourseId);
        }
    }, [selectedCourseId, activeTab]);

    const loadCourses = async () => {
        try {
            const data = await courseService.getInstructorCourses();
            setCourses(data);
        } catch (error) { console.error("Error loading courses", error); }
    };

    const loadQuestions = async (courseId) => {
        try {
            const data = await questionService.getQuestionsByCourse(courseId);
            setQuestions(data);
        } catch (error) { console.error("Error loading questions", error); }
    };

    const loadExcelHistory = async (courseId) => {
        try {
            setUploadedFiles([]);
        } catch (error) { console.error("Error loading history", error); }
    };

    const applyTemplateStyles = (ws, headers, rowCount) => {
        const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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

        const getDataStyle = (rowIdx) => ({
            font:      { sz: 10, name: 'Calibri', color: { rgb: '6B7280' }, italic: true },
            fill:      { fgColor: { rgb: rowIdx % 2 === 0 ? 'F5F3FF' : 'FFFFFF' }, patternType: 'solid' },
            alignment: { vertical: 'center' },
            border: {
                top:    { style: 'hair', color: { rgb: 'C4B5FD' } },
                bottom: { style: 'hair', color: { rgb: 'C4B5FD' } },
                left:   { style: 'hair', color: { rgb: 'C4B5FD' } },
                right:  { style: 'hair', color: { rgb: 'C4B5FD' } },
            }
        });

        headers.forEach((_, colIdx) => {
            const cellRef = `${colLetters[colIdx]}1`;
            if (ws[cellRef]) ws[cellRef].s = headerStyle;
        });

        for (let r = 0; r < rowCount; r++) {
            headers.forEach((_, colIdx) => {
                const cellRef = `${colLetters[colIdx]}${r + 2}`;
                if (ws[cellRef]) ws[cellRef].s = getDataStyle(r);
            });
        }

        ws['!rows'] = [{ hpt: 22 }, ...Array(rowCount).fill({ hpt: 18 })];
    };

    const handleDownloadTemplate = () => {
        const headers = [
            "CourseCode", "QuestionText", "Type", "Difficulty", "CorrectAnswer",
            "OptionA", "OptionB", "OptionC", "OptionD", "Marks"
        ];

        // Sample data rows demonstrating all question types
        const sampleData = [
            {
                "CourseCode": "CS101",
                "QuestionText": "What is the time complexity of binary search?",
                "Type": "MCQ",
                "Difficulty": "Medium",
                "CorrectAnswer": "b",
                "OptionA": "O(n)",
                "OptionB": "O(log n)",
                "OptionC": "O(n²)",
                "OptionD": "O(1)",
                "Marks": 2
            },
            {
                "CourseCode": "CS101",
                "QuestionText": "Explain the concept of polymorphism in OOP.",
                "Type": "Written",
                "Difficulty": "Hard",
                "CorrectAnswer": "",
                "OptionA": "",
                "OptionB": "",
                "OptionC": "",
                "OptionD": "",
                "Marks": 5
            },
            {
                "CourseCode": "CS101",
                "QuestionText": "An array is a linear data structure.",
                "Type": "TrueFalse",
                "Difficulty": "Easy",
                "CorrectAnswer": "True",
                "OptionA": "",
                "OptionB": "",
                "OptionC": "",
                "OptionD": "",
                "Marks": 1
            }
        ];

        // Add 2 empty rows for the instructor to fill in
        for (let i = 0; i < 2; i++) {
            const row = {};
            headers.forEach(h => { row[h] = ''; });
            sampleData.push(row);
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

        // Dynamic column widths
        const colWidths = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
        ws['!cols'] = colWidths;

        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

        // Apply styles
        applyTemplateStyles(ws, headers, sampleData.length);

        // Add instructions sheet
        const instructionsData = [
            { "Column": "CourseCode", "Description": "Course code (e.g. CS101). Case-insensitive — 'cs101', 'CS101', 'Cs101' all work. Must match an existing course." },
            { "Column": "QuestionText", "Description": "The question text (required)." },
            { "Column": "Type", "Description": "MCQ, Written, or TrueFalse. Case-insensitive — 'mcq', 'MCQ', 'Mcq' all work." },
            { "Column": "Difficulty", "Description": "Easy, Medium, or Hard. Case-insensitive — 'easy', 'EASY', 'EaSy' all work." },
            { "Column": "CorrectAnswer", "Description": "For MCQ: a, b, c, or d. For TrueFalse: True/False. For Written: leave empty." },
            { "Column": "OptionA-D", "Description": "MCQ choices. Leave empty for Written questions. Auto-filled for TrueFalse." },
            { "Column": "Marks", "Description": "Points for this question (default: 1)." },
        ];
        const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
        wsInstructions['!cols'] = [{ wch: 18 }, { wch: 80 }];

        XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
        XLSX.writeFile(wb, 'QuizSmart_Questions_Template.xlsx');
    };

    const handleDeleteQuestion = async (id) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            try {
                await questionService.deleteQuestion(id);
                setQuestions(questions.filter(q => q.qId !== id));
                alert("Question deleted successfully!");
            } catch (error) {
                console.error("Delete failed", error);
                alert("Error deleting question.");
            }
        }
    };

    const handleEditQuestionClick = (question) => {
        setEditingQuestion({ ...question });
        setShowEditQuestionModal(true);
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        if (!editingQuestion) return;

        try {
            const formData = new FormData();
            formData.append('CourseId', editingQuestion.courseId);
            formData.append('QText', editingQuestion.qText);
            formData.append('QType', editingQuestion.qType);
            formData.append('CorrectAns', editingQuestion.correctAns);
            formData.append('Difficulty', editingQuestion.difficulty || "Medium");
            formData.append('Marks', editingQuestion.marks || 1);

            if (editingQuestion.qType === 'MCQ') {
                if (editingQuestion.optionA) formData.append('OptionA', editingQuestion.optionA);
                if (editingQuestion.optionB) formData.append('OptionB', editingQuestion.optionB);
                if (editingQuestion.optionC) formData.append('OptionC', editingQuestion.optionC);
                if (editingQuestion.optionD) formData.append('OptionD', editingQuestion.optionD);
            }

            if (imageFile) {
                formData.append('imageFile', imageFile);
            }

            await questionService.updateQuestion(editingQuestion.qId, formData);

            setShowEditQuestionModal(false);
            setImageFile(null);
            loadQuestions(selectedCourseId);
            alert("Question updated successfully!");
        } catch (error) {
            console.error("Update failed:", error);
            const errorMsg = error.response?.data?.message || "Failed to update question.";
            alert(errorMsg);
        }
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        try {
            await courseService.createCourse({ ...newCourse, instructorId: user.userId });
            setShowModal(false); loadCourses(); alert("Course Created!");
        } catch (error) { alert("Failed to add."); }
    };

    const handleEditCourseOpen = (course) => {
        setSelectedCourse(course);
        setShowUpdateModal(true);
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            await courseService.updateCourse(selectedCourse.courseId, selectedCourse);
            setShowUpdateModal(false); loadCourses(); alert("Course Updated!");
        } catch (error) { alert("Update failed."); }
    };

    const handleDeleteCourse = async (id) => {
        if (window.confirm("Delete permanently?")) {
            try { await courseService.deleteCourse(id); loadCourses(); }
            catch (error) { alert("Delete failed."); }
        }
    };

    const handleExcelUpload = async (file) => {
        if (!file) return;
        try {
            const result = await questionService.uploadExcel(file);
            let msg = result?.message || "Excel data imported successfully!";

            // Show skipped details if any rows were skipped
            if (result?.skipped > 0 && result?.skippedDetails?.length > 0) {
                const skippedInfo = result.skippedDetails.join('\n');
                msg += `\n\n⚠️ Skipped rows:\n${skippedInfo}`;
            }

            alert(`✅ ${msg}`);
            loadQuestions(selectedCourseId);
            loadExcelHistory(selectedCourseId);
        } catch (error) {
            const errData = error.response?.data;
            let errMsg = errData?.message || "Upload failed. Please check your file format.";

            // Show skipped details on error too (e.g., all rows were invalid)
            if (errData?.skippedDetails?.length > 0) {
                const skippedInfo = errData.skippedDetails.join('\n');
                errMsg += `\n\n⚠️ Skipped rows:\n${skippedInfo}`;
            }

            alert(`❌ ${errMsg}`);
        }
        const fileInput = document.getElementById('excelFile');
        if (fileInput) fileInput.value = '';
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('courseId', selectedCourseId);
        if (imageFile) formData.append('imageFile', imageFile);
        Object.keys(manualQuestion).forEach(key => formData.append(key, manualQuestion[key]));
        try {
            await questionService.addQuestion(formData);
            setShowQuestionModal(false); loadQuestions(selectedCourseId); alert("Saved!");
        } catch (error) { alert("Error."); }
    };

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    const getMCQOptions = (q) => {
        const opts = [];
        if (q.optionA) opts.push({ value: 'a', label: 'A' });
        if (q.optionB) opts.push({ value: 'b', label: 'B' });
        if (q.optionC) opts.push({ value: 'c', label: 'C' });
        if (q.optionD) opts.push({ value: 'd', label: 'D' });
        if (opts.length === 0) {
            opts.push(
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D' }
            );
        }
        return opts;
    };

    const menuItems = [
        { id: 'stats', label: 'Exam Status', icon: <FaChartBar /> },
        { id: 'courses', label: 'My Courses', icon: <FaBook /> },
        { id: 'bank', label: 'Question Bank', icon: <FaDatabase /> },
        { id: 'create', label: 'Create New Exam', icon: <FaPlusCircle /> },
        { id: 'pending', label: 'Pending Written Q', icon: <FaPenNib />, badge: 0 },
    ];

    return (
        <div className="d-flex" style={{ backgroundColor: 'var(--bg-canvas)', minHeight: '100vh' }}>


            <motion.div
                initial={false}
                animate={{ width: isSidebarOpen ? '280px' : '80px' }}
                className="d-flex flex-column shadow-lg"
                style={{
                    position: 'fixed', height: '100vh', zIndex: 1000,
                    background: 'linear-gradient(180deg, #1E1B4B 0%, #0F0E17 100%)',
                    overflow: 'hidden'
                }}
            >

                <div className="text-center py-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div
                        className="mx-auto mb-3 d-flex align-items-center justify-content-center text-white rounded-circle border border-2 shadow"
                        style={{
                            width: isSidebarOpen ? '75px' : '45px',
                            height: isSidebarOpen ? '75px' : '45px',
                            fontSize: isSidebarOpen ? '1.4rem' : '1rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                        }}
                    >
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'I'}
                    </div>
                    {isSidebarOpen && (
                        <div>
                            <h6 className="fw-bold mb-1 px-3 text-white text-truncate text-capitalize">{user.fullName}</h6>
                            <Badge
                                bg="light" text="dark"
                                className="text-uppercase fw-bold px-3 py-1 mt-1 shadow-sm"
                                style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#4F46E5' }}
                            >
                                Instructor
                            </Badge>
                        </div>
                    )}
                </div>


                <Nav className="flex-column p-3 flex-grow-1 gap-1">
                    {menuItems.map((item) => (
                        <Nav.Link
                            key={item.id}
                            className={`d-flex align-items-center p-3 rounded-4 instr-nav-link ${activeTab === item.id ? 'instr-nav-active' : 'instr-nav-inactive'}`}
                            onClick={() => setActiveTab(item.id)}
                            style={activeTab === item.id ? { backgroundColor: '#4F46E5' } : {}}
                        >
                            <span className="fs-5">{item.icon}</span>
                            {isSidebarOpen && <span className="fw-semibold ms-3">{item.label}</span>}
                        </Nav.Link>
                    ))}
                </Nav>


                <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Button
                        variant="link"
                        onClick={handleLogout}
                        className="text-danger w-100 text-decoration-none d-flex align-items-center p-2 rounded-4 hover-bg-danger-light"
                    >
                        <FaSignOutAlt className="fs-5" />
                        {isSidebarOpen && <span className="fw-bold ms-3">Logout</span>}
                    </Button>
                </div>
            </motion.div>


            <div className="flex-grow-1" style={{ marginLeft: isSidebarOpen ? '280px' : '80px', transition: 'margin 0.3s' }}>

                <div className="bg-white p-3 shadow-sm d-flex justify-content-between align-items-center px-4 sticky-top">
                    <Button
                        variant="light"
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="rounded-circle border shadow-sm"
                        style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <FaBars />
                    </Button>
                    <h5
                        className="fw-bold mb-0 px-4 py-2 rounded-pill shadow-sm"
                        style={{ fontSize: '0.9rem', color: '#4F46E5', backgroundColor: '#EEF2FF' }}
                    >
                        {menuItems.find(i => i.id === activeTab)?.label}
                    </h5>
                </div>

                <Container fluid className="p-4">
                    <AnimatePresence mode="wait">


                    {activeTab === 'create' && (
                        <motion.div key="create" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <CreateExamForm />
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div key="stats" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <ExamStatus />
                        </motion.div>
                    )}

                    {activeTab === 'pending' && (
                        <motion.div key="pending" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <PendingCorrections />
                        </motion.div>
                    )}


                    {activeTab === 'courses' && (
                        <motion.div key="courses" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="fw-bold">My Academic Courses</h3>
                                <Button variant="primary" className="rounded-3 shadow-sm" onClick={() => setShowModal(true)} style={{ backgroundColor: '#4F46E5', border: 'none' }}><FaPlusCircle className="me-2" /> Add New Course</Button>
                            </div>
                            <Row>
                                {courses.map(course => (
                                    <Col md={4} key={course.courseId} className="mb-4">
                                        <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden position-relative">
                                            <div className="p-2 d-flex justify-content-end" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)' }}>
                                                <Dropdown align="end">
                                                    <Dropdown.Toggle as="div" className="text-white px-2 no-caret cursor-pointer"><FaEllipsisV /></Dropdown.Toggle>
                                                    <Dropdown.Menu className="shadow border-0 rounded-3">
                                                        <Dropdown.Item onClick={() => handleEditCourseOpen(course)} className="update-item py-2">Update Details</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleDeleteCourse(course.courseId)} className="delete-item py-2">Delete Course</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                            <Card.Body>
                                                <Badge bg="light" text="primary" className="mb-2 border" style={{ color: '#4F46E5' }}>{course.courseCode}</Badge>
                                                <Card.Title className="fw-bold">{course.courseName}</Card.Title>
                                                <Card.Text className="text-muted small" style={{ height: '40px', overflow: 'hidden' }}>{course.description}</Card.Text>
                                                <hr />
                                                <div className="d-flex justify-content-between small text-secondary fw-bold">
                                                    <span>{course.creditHours} Credits</span>
                                                    <span>Year {course.academicYear} - Sem {course.semester}</span>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </motion.div>
                    )}


                    {activeTab === 'bank' && (
                        <motion.div key="bank" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="border-0 shadow-sm p-4 rounded-4 mb-4">
                                <Row className="align-items-center">
                                    <Col md={4}><h3 className="fw-bold mb-0">Question Bank</h3></Col>
                                    <Col md={4}>
                                        <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="rounded-3 shadow-sm" style={{ borderColor: '#4F46E5' }}>
                                            <option value="">Select a Course...</option>
                                            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.courseName}</option>)}
                                        </Form.Select>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        <Button variant="outline-success" className="me-2 rounded-3 fw-bold shadow-sm" onClick={() => document.getElementById('excelFile').click()}>
                                            <FaDownload className="me-2" /> Import Excel
                                        </Button>
                                        <input type="file" id="excelFile" hidden accept=".csv,.xlsx,.xls" onChange={(e) => handleExcelUpload(e.target.files[0])} />
                                        <Button variant="primary" className="rounded-3 fw-bold shadow-sm" onClick={() => setShowQuestionModal(true)} disabled={!selectedCourseId} style={{ backgroundColor: '#4F46E5', border: 'none' }}>
                                            <FaPlusCircle className="me-2" /> Add Question
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>

                            {selectedCourseId ? (
                                <>
                                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
                                        <Table hover responsive className="mb-0 align-middle">
                                            <thead className="bg-light"><tr><th className="ps-4">Question Text</th><th>Type</th><th>Difficulty</th><th>Marks</th><th className="text-center">Actions</th></tr></thead>
                                            <tbody>
                                                {questions.map(q => (
                                                    <tr key={q.qId}>
                                                        <td className="ps-4 fw-semibold text-truncate" style={{ maxWidth: '300px' }}>{q.qText}</td>
                                                        <td><Badge bg="info" text="dark">{q.qType}</Badge></td>
                                                        <td><Badge bg={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>{q.difficulty}</Badge></td>
                                                        <td>{q.marks}</td>
                                                        <td className="text-center">
                                                            <Button variant="link" className="text-primary p-0 me-3" onClick={() => { setEditingQuestion(q); setShowEditQuestionModal(true); }}><FaPenNib /></Button>
                                                            <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteQuestion(q.qId)}><FaTrash /></Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card>

                                    <Card className="border-0 shadow-sm rounded-4 bg-white mt-4">
                                        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                            <h5 className="fw-bold mb-0 text-dark"><FaFileExcel className="text-success me-2" /> Excel Import History</h5>
                                            <Button variant="link" className="fw-bold text-decoration-none p-0" style={{ color: '#4F46E5' }} onClick={handleDownloadTemplate}>
                                                <FaFileDownload className="me-1" /> Download Excel Template
                                            </Button>
                                        </Card.Header>
                                        <Card.Body className="px-4 pb-4">
                                            {uploadedFiles.length === 0 ? (
                                                <div className="text-center py-4 border rounded-4 bg-light border-dashed">
                                                    <p className="text-muted mb-0 small">No excel files uploaded yet for this course.</p>
                                                </div>
                                            ) : (
                                                <Table hover responsive className="small mb-0">
                                                    <thead><tr><th>File Name</th><th>Date</th><th>Status</th></tr></thead>
                                                    <tbody>{uploadedFiles.map((f, i) => <tr key={i}><td>{f.name}</td><td>{f.date}</td><td><Badge bg="success">Success</Badge></td></tr>)}</tbody>
                                                </Table>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </>
                            ) : (
                                <div className="text-center p-5 bg-white rounded-5 shadow-sm"><FaDatabase size={50} className="text-muted mb-3 opacity-25" /><h5>Please select a course to view questions.</h5></div>
                            )}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </Container>
            </div>


            <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="rounded-5">
                <Modal.Header closeButton className="border-0 px-4 pt-4"><Modal.Title className="fw-bold">Create New Course</Modal.Title></Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Form onSubmit={handleAddCourse}>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Full Name</Form.Label><Form.Control type="text" required onChange={(e) => setNewCourse({...newCourse, courseName: e.target.value})} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Code</Form.Label><Form.Control type="text" required onChange={(e) => setNewCourse({...newCourse, courseCode: e.target.value})} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label className="small fw-bold">Description</Form.Label><Form.Control as="textarea" rows={2} onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} /></Form.Group>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Hours</Form.Label><Form.Select onChange={(e) => setNewCourse({...newCourse, creditHours: parseInt(e.target.value)})}><option value="2">2 Hours</option><option value="3">3 Hours</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Year</Form.Label><Form.Select onChange={(e) => setNewCourse({...newCourse, academicYear: parseInt(e.target.value)})}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Semester</Form.Label><Form.Select onChange={(e) => setNewCourse({...newCourse, semester: parseInt(e.target.value)})}><option value="1">1st Semester</option><option value="2">2nd Semester</option></Form.Select></Form.Group></Col>
                        </Row>
                        <div className="text-end mt-4"><Button type="submit" className="px-5 rounded-pill shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>Create Course</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>


            <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered size="lg" className="rounded-5">
                <Modal.Header closeButton className="border-0 px-4 pt-4"><Modal.Title className="fw-bold" style={{ color: '#4F46E5' }}>Update Course</Modal.Title></Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Form onSubmit={handleUpdateCourse}>
                        <Row>
                            <Col md={8}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Course Full Name</Form.Label><Form.Control type="text" value={selectedCourse.courseName} required onChange={(e) => setSelectedCourse({...selectedCourse, courseName: e.target.value})} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Course Code</Form.Label><Form.Control type="text" value={selectedCourse.courseCode} required onChange={(e) => setSelectedCourse({...selectedCourse, courseCode: e.target.value})} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3"><Form.Label className="small fw-bold">Description</Form.Label><Form.Control as="textarea" rows={2} value={selectedCourse.description} onChange={(e) => setSelectedCourse({...selectedCourse, description: e.target.value})} /></Form.Group>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Credit Hours</Form.Label><Form.Select value={selectedCourse.creditHours} onChange={(e) => setSelectedCourse({...selectedCourse, creditHours: parseInt(e.target.value)})}><option value="2">2 Hours</option><option value="3">3 Hours</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Academic Year</Form.Label><Form.Select value={selectedCourse.academicYear} onChange={(e) => setSelectedCourse({...selectedCourse, academicYear: parseInt(e.target.value)})}><option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Semester</Form.Label><Form.Select value={selectedCourse.semester} onChange={(e) => setSelectedCourse({...selectedCourse, semester: parseInt(e.target.value)})}><option value="1">1st Semester</option><option value="2">2nd Semester</option></Form.Select></Form.Group></Col>
                        </Row>
                        <div className="text-end mt-4"><Button variant="warning" type="submit" className="px-5 rounded-pill fw-bold shadow-sm">Update Now</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>


            <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} centered size="lg">
                <Modal.Header closeButton className="border-0 px-4 pt-4"><Modal.Title className="fw-bold">Add Question</Modal.Title></Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Form onSubmit={handleAddQuestion}>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold small">Question Text</Form.Label><Form.Control as="textarea" rows={2} required onChange={e => setManualQuestion({...manualQuestion, qText: e.target.value})} /></Form.Group>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Type</Form.Label><Form.Select value={manualQuestion.qType} onChange={e => setManualQuestion({...manualQuestion, qType: e.target.value, correctAns: ''})}><option value="MCQ">MCQ</option><option value="Written">Written</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Difficulty</Form.Label><Form.Select onChange={e => setManualQuestion({...manualQuestion, difficulty: e.target.value})}><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></Form.Select></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label className="small fw-bold">Marks</Form.Label><Form.Control type="number" min="1" defaultValue="1" onChange={e => setManualQuestion({...manualQuestion, marks: parseInt(e.target.value)})} /></Form.Group></Col>
                        </Row>

                        {manualQuestion.qType === 'Written' && (
                            <Form.Group className="mb-3 p-3 bg-light rounded-4 border border-dashed text-center">
                                <Form.Label className="fw-bold small text-primary d-block mb-2"><FaUpload /> Upload Image (Optional)</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                            </Form.Group>
                        )}

                        {manualQuestion.qType === 'MCQ' && (
                            <div className="p-3 bg-light rounded-4 mb-3 border">
                                <Row>
                                    <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Option A</Form.Label><Form.Control size="sm" required onChange={e => setManualQuestion({...manualQuestion, optionA: e.target.value})} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Option B</Form.Label><Form.Control size="sm" required onChange={e => setManualQuestion({...manualQuestion, optionB: e.target.value})} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Option C</Form.Label><Form.Control size="sm" onChange={e => setManualQuestion({...manualQuestion, optionC: e.target.value})} /></Form.Group></Col>
                                    <Col md={6}><Form.Group className="mb-2"><Form.Label className="small fw-bold">Option D</Form.Label><Form.Control size="sm" onChange={e => setManualQuestion({...manualQuestion, optionD: e.target.value})} /></Form.Group></Col>
                                </Row>
                            </div>
                        )}


                        {manualQuestion.qType === 'MCQ' && (
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small text-danger">
                                    Correct Answer <span className="text-muted fw-normal">(select the correct option)</span>
                                </Form.Label>
                                <Form.Select
                                    required
                                    value={manualQuestion.correctAns}
                                    onChange={e => setManualQuestion({...manualQuestion, correctAns: e.target.value})}
                                    className="rounded-3"
                                >
                                    <option value="">-- Choose Correct Option --</option>
                                    {manualQuestion.optionA && <option value="a">A: {manualQuestion.optionA}</option>}
                                    {manualQuestion.optionB && <option value="b">B: {manualQuestion.optionB}</option>}
                                    {manualQuestion.optionC && <option value="c">C: {manualQuestion.optionC}</option>}
                                    {manualQuestion.optionD && <option value="d">D: {manualQuestion.optionD}</option>}
                                </Form.Select>
                            </Form.Group>
                        )}

                        <div className="text-end mt-4"><Button type="submit" className="px-5 rounded-pill shadow-sm" style={{ backgroundColor: '#4F46E5', border: 'none' }}>Save to Bank</Button></div>
                    </Form>
                </Modal.Body>
            </Modal>


            {editingQuestion && (
                <Modal show={showEditQuestionModal} onHide={() => setShowEditQuestionModal(false)} centered size="lg">
                    <Modal.Header closeButton className="border-0 px-4 pt-4">
                        <Modal.Title className="fw-bold" style={{ color: '#4F46E5' }}>Edit Question Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="px-4 pb-4">
                        <Form onSubmit={handleUpdateQuestion}>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold small">Question Text</Form.Label>
                                <Form.Control
                                    as="textarea" rows={2}
                                    value={editingQuestion.qText}
                                    required
                                    onChange={e => setEditingQuestion({...editingQuestion, qText: e.target.value})}
                                />
                            </Form.Group>

                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Difficulty</Form.Label>
                                        <Form.Select
                                            value={editingQuestion.difficulty}
                                            onChange={e => setEditingQuestion({...editingQuestion, difficulty: e.target.value})}
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold">Marks</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={editingQuestion.marks}
                                            required
                                            onChange={e => setEditingQuestion({...editingQuestion, marks: parseInt(e.target.value)})}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            {editingQuestion.qType === 'Written' && (
                                <Form.Group className="mb-3 p-3 bg-light rounded-4 border border-dashed text-center">
                                    <Form.Label className="fw-bold small text-primary d-block mb-2">
                                        <FaUpload /> Change Question Image (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                    />
                                </Form.Group>
                            )}

                            {editingQuestion.qType === 'MCQ' && (
                                <div className="p-3 bg-light rounded-4 mb-3 border">
                                    <h6 className="fw-bold mb-3 small text-primary">Edit Choices</h6>
                                    <Row>
                                        <Col md={6}><Form.Control className="mb-2" value={editingQuestion.optionA || ''} placeholder="Option A" onChange={e => setEditingQuestion({...editingQuestion, optionA: e.target.value})} /></Col>
                                        <Col md={6}><Form.Control className="mb-2" value={editingQuestion.optionB || ''} placeholder="Option B" onChange={e => setEditingQuestion({...editingQuestion, optionB: e.target.value})} /></Col>
                                        <Col md={6}><Form.Control className="mb-2" value={editingQuestion.optionC || ''} placeholder="Option C" onChange={e => setEditingQuestion({...editingQuestion, optionC: e.target.value})} /></Col>
                                        <Col md={6}><Form.Control className="mb-2" value={editingQuestion.optionD || ''} placeholder="Option D" onChange={e => setEditingQuestion({...editingQuestion, optionD: e.target.value})} /></Col>
                                    </Row>
                                </div>
                            )}


                            {editingQuestion.qType === 'MCQ' && (
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small text-danger">
                                        Correct Answer <span className="text-muted fw-normal">(select the correct option)</span>
                                    </Form.Label>
                                    <Form.Select
                                        required
                                        value={editingQuestion.correctAns}
                                        onChange={e => setEditingQuestion({...editingQuestion, correctAns: e.target.value})}
                                        className="rounded-3"
                                    >
                                        <option value="">-- Choose Correct Option --</option>
                                        {editingQuestion.optionA && <option value="a">A: {editingQuestion.optionA}</option>}
                                        {editingQuestion.optionB && <option value="b">B: {editingQuestion.optionB}</option>}
                                        {editingQuestion.optionC && <option value="c">C: {editingQuestion.optionC}</option>}
                                        {editingQuestion.optionD && <option value="d">D: {editingQuestion.optionD}</option>}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            <div className="text-end mt-4">
                                <Button variant="light" className="me-2 rounded-pill" onClick={() => setShowEditQuestionModal(false)}>Cancel</Button>
                                <Button variant="warning" type="submit" className="px-5 shadow-sm rounded-pill fw-bold">Update Question</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            )}

            <style>{`
                .no-caret::after { display: none !important; }
                .cursor-pointer { cursor: pointer; }
                .update-item:hover { background-color: #ffc107 !important; color: #000 !important; font-weight: bold; }
                .delete-item:hover { background-color: #dc3545 !important; color: #fff !important; font-weight: bold; }
                .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .table-hover tbody tr:hover { background-color: #f1f4f9; }
                .instr-nav-link { transition: all 0.2s ease-in-out; }
                .instr-nav-active { color: #fff !important; font-weight: 700; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); }
                .instr-nav-inactive { color: rgba(255,255,255,0.55) !important; }
                .instr-nav-inactive:hover { color: #fff !important; background-color: rgba(255,255,255,0.08) !important; transform: translateX(4px); }
            `}</style>
        </div>
    );
};

export default InstructorDashboard;
