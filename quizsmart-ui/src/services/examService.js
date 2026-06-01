import axios from 'axios';

const API_URL = "https://localhost:7194/api";

const getAuthHeader = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            };
        } catch (err) {
            console.error("Auth Header Error: Failed to parse user data.");
        }
    }
    return {};
};

const examService = {
    getInstructorCourses: async () => {
        const response = await axios.get(`${API_URL}/Courses/my-teaching-courses`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getQuestionsByCourse: async (courseId) => {
        const response = await axios.get(`${API_URL}/Questions/course/${courseId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    createExam: async (examData) => {
        const response = await axios.post(`${API_URL}/Exams/create`, examData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    getMyExams: async () => {
        const response = await axios.get(`${API_URL}/Exams/my-exams`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

getExamResults: async (examId) => {
    const response = await axios.get(`${API_URL}/Exams/${examId}/export-results`, {
        headers: getAuthHeader()
    });
    return response.data;
},

    deleteExam: async (examId) => {
        const response = await axios.delete(`${API_URL}/Exams/${examId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },
updateExam: async (examId, examData) => {
    const response = await axios.put(`${API_URL}/Exams/${examId}`, examData, {
        headers: getAuthHeader()
    });
    return response.data;
},

getPendingWritten: async (examId) => {
    const response = await axios.get(`${API_URL}/StudentAttempts/pending-written/${examId}`, {
        headers: getAuthHeader()
    });
    return response.data;
},

submitWrittenGrade: async (answerId, score) => {
    const response = await axios.post(`${API_URL}/InstructorDashboard/grade-written-question`, null, {
        params: { answerId, teacherScore: score },
        headers: getAuthHeader()
    });
    return response.data;
},

getExamGeneralStats: async (examId) => {
    const response = await axios.get(`${API_URL}/InstructorDashboard/exam-stats/${examId}`, {
        headers: getAuthHeader()
    });
    return response.data;
},

getTopStudents: async (examId) => {
    const response = await axios.get(`${API_URL}/InstructorDashboard/leaderboard/${examId}`, {
        headers: getAuthHeader()
    });
    return response.data;
},

getQuestionsAnalysis: async (examId) => {
    const response = await axios.get(`${API_URL}/InstructorDashboard/questions-analysis/${examId}`, {
        headers: getAuthHeader()
    });
    return response.data;
}
};

export default examService;
