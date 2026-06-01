import axios from 'axios';
import api, { API_BASE_URL } from './apiClient';

const studentService = {

    getAllCourses: async () => {
        const response = await api.get('/Courses');
        return response.data;
    },

    enrollInCourse: async (courseId) => {
        const response = await api.post('/Courses/enroll', { CourseId: courseId });
        return response.data;
    },

    getAvailableExams: async (studentId) => {
        if (!studentId) return [];
        const response = await api.get(`/StudentDashboard/available-exams/${studentId}`);
        return response.data;
    },

    getHistory: async (studentId) => {
        if (!studentId) return [];
        const response = await api.get(`/StudentDashboard/my-history/${studentId}`);
        return response.data;
    },

    getStudentStats: async (studentId) => {
        if (!studentId) return null;
        const response = await api.get(`/StudentDashboard/my-stats/${studentId}`);
        return response.data;
    },

    startAttempt: async (examId) => {
        const response = await api.post('/StudentAttempts/start', { ExamId: examId });
        return response.data;
    },

    getExamQuestions: async (examId) => {
        const response = await api.get(`/Exams/${examId}/questions-for-student`);
        return response.data;
    },

    recordQuestionStartTime: async (answerId) => {
        const response = await api.post(`/StudentAttempts/start-question/${answerId}`);
        return response.data;
    },

    submitAnswer: async (answerData) => {
        const response = await api.post('/StudentAttempts/submit-answer', answerData);
        return response.data;
    },

    submitWrittenAnswer: async (answerId, formData) => {
        const userData = JSON.parse(localStorage.getItem('user'));
        const response = await axios.post(`${API_BASE_URL}/StudentAttempts/submit-written/${answerId}`, formData, {
            headers: {
                'Authorization': `Bearer ${userData?.token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    finishAttempt: async (attemptId) => {
        const response = await api.post(`/StudentAttempts/finish/${attemptId}`);
        return response.data;
    },

    getAttemptReview: async (attemptId) => {
        const response = await api.get(`/StudentAttempts/review/${attemptId}`);
        return response.data;
    },

    getPendingWritten: async (examId) => {
        if (!examId) return [];
        const response = await api.get(`/StudentAttempts/pending-written/${examId}`);
        return response.data;
    },
};

export default studentService;
