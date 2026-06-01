import axios from 'axios';

const API_URL = 'https://localhost:7194/api/Questions';

const getQuestionsByCourse = async (courseId) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await axios.get(`${API_URL}/course/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const addQuestion = async (formData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await axios.post(`${API_URL}/add`, formData, {
        headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

const uploadExcel = async (file) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/upload-excel`, formData, {
        headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

const updateQuestion = async (id, formData) => {
    const user = JSON.parse(localStorage.getItem('user'));

    return await axios.put(`${API_URL}/${id}`, formData, {
        headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
        }
    });
};

const deleteQuestion = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
};

export default {
    getQuestionsByCourse,
    addQuestion,
    uploadExcel,
    updateQuestion,
    deleteQuestion
};
