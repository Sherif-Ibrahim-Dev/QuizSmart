import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaGraduationCap, FaChartLine, FaTrophy } from 'react-icons/fa';
import { motion } from 'framer-motion';

const StatsCards = ({ stats }) => {
    const defaultStats = {
        totalExamsTaken: stats?.totalExamsTaken || 0,
        averageScore: stats?.averageScore || 0,
        highestScore: stats?.highestScore || 0
    };

    const cardsData = [
        {
            title: "Total Exams Taken",
            value: defaultStats.totalExamsTaken,
            suffix: " Exams",
            color: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
            icon: <FaGraduationCap size={28} />
        },
        {
            title: "Average Grade",
            value: defaultStats.averageScore,
            suffix: " Marks",
            color: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
            icon: <FaChartLine size={28} />
        },
        {
            title: "Highest Achievement",
            value: defaultStats.highestScore,
            suffix: " Marks",
            color: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            icon: <FaTrophy size={28} />
        }
    ];

    return (
        <Row className="mb-4 g-4">
            {cardsData.map((card, idx) => (
                <Col md={4} key={idx}>
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                        <Card
                            className="border-0 shadow-sm rounded-4 text-white overflow-hidden"
                            style={{ background: card.color, minHeight: '130px' }}
                        >
                            <Card.Body className="p-4 d-flex align-items-center justify-content-between relative">
                                <div>
                                    <h6 className="opacity-75 small fw-bold text-uppercase mb-2">{card.title}</h6>
                                    <h2 className="fw-bold mb-0">
                                        {card.value}
                                        <span className="fs-5 fw-normal opacity-75">{card.suffix}</span>
                                    </h2>
                                </div>
                                <div className="opacity-25" style={{ transform: 'scale(1.3)' }}>
                                    {card.icon}
                                </div>
                            </Card.Body>
                        </Card>
                    </motion.div>
                </Col>
            ))}
        </Row>
    );
};

export default StatsCards;
