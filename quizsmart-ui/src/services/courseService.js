import axios from 'axios';

const API_URL = 'https://localhost:7194/api/Courses';

const getInstructorCourses = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await axios.get(`${API_URL}/my-teaching-courses`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const createCourse = async (courseData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await axios.post(API_URL, courseData, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const updateCourse = async (id, courseData) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const response = await axios.put(`${API_URL}/${id}`, courseData, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
    return response.data;
};

const deleteCourse = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
    });
};

export default {
    getInstructorCourses,
    createCourse,
    updateCourse,
    deleteCourse
};
