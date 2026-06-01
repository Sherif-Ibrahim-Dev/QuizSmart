import React, { useState, useEffect } from 'react';
import { Badge } from 'react-bootstrap';
import { FaClock } from 'react-icons/fa';

const ExamTimer = ({ startTime, durationInMinutes, onTimeUp }) => {
    const calculateSecondsLeft = () => {
        const start = new Date(startTime).getTime();
        const durationMs = durationInMinutes * 60 * 1000;
        const end = start + durationMs;
        const now = new Date().getTime();
        return Math.max(0, Math.floor((end - now) / 1000));
    };

    const [timeLeft, setTimeLeft] = useState(calculateSecondsLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const left = calculateSecondsLeft();
            setTimeLeft(left);
            if (left <= 0) {
                clearInterval(timer);
                if (onTimeUp) onTimeUp();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, durationInMinutes]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let badgeBg = 'success';
    let isUrgent = false;

    if (timeLeft < 60) {
        badgeBg = 'danger';
        isUrgent = true;
    } else if (timeLeft < 300) {
        badgeBg = 'warning';
    }

    return (
        <Badge
            bg={badgeBg}
            className={`fs-6 px-3 py-2 d-flex align-items-center gap-2 rounded-pill shadow-sm border border-white-50 ${isUrgent ? 'animate__animated animate__flash animate__infinite' : ''}`}
        >
            <FaClock />
            <span>Time Left: {formatTime(timeLeft)}</span>
        </Badge>
    );
};

export default ExamTimer;
