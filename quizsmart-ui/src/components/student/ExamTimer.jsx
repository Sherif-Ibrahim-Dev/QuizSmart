import React, { useState, useEffect } from 'react';
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

    // Style variables based on time urgency
    let bgGradient = 'linear-gradient(135deg, #0f172a, #1e293b)';
    let borderColor = 'rgba(255, 255, 255, 0.1)';
    let accentColor = '#38bdf8'; // sky blue
    let glowShadow = '0 0 10px rgba(56, 189, 248, 0.15)';
    let pulseAnimation = '';

    if (timeLeft < 60) {
        // Under 1 minute - urgent coral red pulsing
        bgGradient = 'linear-gradient(135deg, #7f1d1d, #ef4444)';
        borderColor = 'rgba(239, 68, 68, 0.4)';
        accentColor = '#fef08a'; // yellow highlight
        glowShadow = '0 0 15px rgba(239, 68, 68, 0.6)';
        pulseAnimation = 'animate__animated animate__pulse animate__infinite';
    } else if (timeLeft < 300) {
        // Under 5 minutes - warning amber
        bgGradient = 'linear-gradient(135deg, #78350f, #f59e0b)';
        borderColor = 'rgba(245, 158, 11, 0.4)';
        accentColor = '#ffffff';
        glowShadow = '0 0 12px rgba(245, 158, 11, 0.4)';
    } else {
        // Normal state - sleek, glowing forest/emerald green
        bgGradient = 'linear-gradient(135deg, #022c22, #059669)';
        borderColor = 'rgba(16, 185, 129, 0.3)';
        accentColor = '#a7f3d0'; // light green accent
        glowShadow = '0 0 12px rgba(16, 185, 129, 0.25)';
    }

    return (
        <>
            {/* Inject a small keyframe animation block for pulsing clock */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-clock {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .timer-clock-icon {
                    animation: pulse-clock 2s infinite ease-in-out;
                }
            `}} />

            <div
                className={`d-inline-flex align-items-center gap-3 px-4 py-2 rounded-pill text-white shadow border ${pulseAnimation}`}
                style={{
                    background: bgGradient,
                    borderColor: borderColor,
                    boxShadow: glowShadow,
                    transition: 'all 0.5s ease',
                    minWidth: '220px',
                    justifyContent: 'center',
                    userSelect: 'none'
                }}
            >
                <div className="d-flex align-items-center justify-content-center">
                    <FaClock 
                        className="timer-clock-icon"
                        style={{ 
                            color: accentColor,
                            fontSize: '1.1rem'
                        }} 
                    />
                </div>
                
                <div className="d-flex align-items-center gap-2">
                    <span 
                        style={{ 
                            fontSize: '0.85rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            fontWeight: '700',
                            opacity: 0.95
                        }}
                    >
                        Time Left:
                    </span>
                    <span
                        style={{
                            fontFamily: "'SFMono-Regular', Consolas, 'Fira Code', 'Courier New', monospace",
                            fontSize: '1.25rem',
                            fontWeight: '800',
                            color: accentColor,
                            letterSpacing: '0.5px',
                            minWidth: '75px',
                            textAlign: 'center',
                            textShadow: '0 0 8px rgba(255,255,255,0.1)'
                        }}
                    >
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>
        </>
    );
};

export default ExamTimer;
