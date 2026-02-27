import React, { useState, useEffect, useRef } from 'react';
import { C } from './styles';

const QUESTIONS = [
    "Which is better: KNN or SVM?",
    "Why is Random Forest performing better?",
    "Explain this decision boundary.",
    "Which model should I use for large data?",
    "What is overfitting?",
    "How to tune hyperparameters?"
];

const RESPONSES = {
    "knn vs svm": "KNN is simple and good for local patterns but slows down drastically as your dataset grows. SVM is much better for complex boundaries with higher dimensions using kernels, though it's harder to tune.",
    "random forest": "Random Forest is an ensemble of many Decision Trees. It's usually better because it averages out the errors of individual trees, making it much more robust to noise and less likely to overfit.",
    "decision boundary": "A decision boundary is the 'line' or surface a model draws to separate different classes. A smooth line usually generalizes well, while a wiggly, complex line might be overfitting the noise.",
    "large data": "For very large datasets, you want models with low training complexity. Naive Bayes, Linear/Logistic Regression, or Neural Networks (with GPUs) are usually the best. Stay away from KNN or vanilla SVM!",
    "overfitting": "Overfitting happens when a model learns the 'noise' in your training data instead of the pattern. It performs great on training data but fails on new, unseen data.",
    "hyperparameters": "Hyperparameters are settings you choose *before* training (like 'K' in KNN or 'depth' in Trees). Tuning them is like finding the 'sweet spot' for your model's complexity."
};

export default function MLAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: "Hello! I'm your AI ML Assistant. I can help you choose algorithms or explain what you're seeing in the visualizations. What's on your mind?" }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text = input) => {
        if (!text.trim()) return;

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setInput("");
        setIsTyping(true);

        // Mock AI logic
        setTimeout(() => {
            let reply = "That's a great question! While I'm still learning, I can tell you that understanding the trade-offs between speed, accuracy, and complexity is key to mastering ML.";

            const query = text.toLowerCase();
            if (query.includes("knn") || query.includes("svm")) reply = RESPONSES["knn vs svm"];
            else if (query.includes("forest")) reply = RESPONSES["random forest"];
            else if (query.includes("boundary")) reply = RESPONSES["decision boundary"];
            else if (query.includes("large") || query.includes("scale")) reply = RESPONSES["large data"];
            else if (query.includes("overfit")) reply = RESPONSES["overfitting"];
            else if (query.includes("hyperparameter") || query.includes("tune")) reply = RESPONSES["hyperparameters"];

            setMessages(m => [...m, { role: 'assistant', text: reply }]);
            setIsTyping(false);
        }, 1200);
    };

    return (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
            {/* Chat Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: 70, right: 0,
                    width: 360, height: 500,
                    background: '#0B1220', border: '1px solid #1F2937',
                    borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    animation: 'fadeInUp 0.3s ease'
                }}>
                    {/* Header */}
                    <div style={{ padding: '16px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>ML Assistant</div>
                            <div style={{ fontSize: 10, opacity: 0.8 }}>Online • Expert Brain</div>
                        </div>
                        <div style={{ flex: 1 }} />
                        <div onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', opacity: 0.7 }}>✕</div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '10px 14px',
                                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                background: m.role === 'user' ? '#7C3AED' : '#1F2937',
                                color: 'white',
                                fontSize: 13,
                                lineHeight: 1.5,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {m.text}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', background: '#1F2937', color: 'white', fontSize: 13, display: 'flex', gap: 4 }}>
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6B7280', animation: 'pulse 1s infinite' }} />
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6B7280', animation: 'pulse 1s infinite 0.25s' }} />
                                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6B7280', animation: 'pulse 1s infinite 0.5s' }} />
                            </div>
                        )}
                    </div>

                    {/* Suggestions */}
                    <div style={{ padding: '8px 16px', display: 'flex', gap: 6, overflowX: 'auto', borderTop: '1px solid #1F2937' }}>
                        {QUESTIONS.slice(0, 3).map((q, i) => (
                            <div key={i} onClick={() => handleSend(q)} style={{
                                padding: '6px 10px', borderRadius: 20, border: '1px solid #7C3AED40', background: '#7C3AED10',
                                color: '#8B5CF6', fontSize: 10, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s'
                            }}>
                                {q}
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div style={{ padding: '16px', borderTop: '1px solid #1F2937', display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            placeholder="Ask anything about ML..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            style={{
                                flex: 1, background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: '8px 12px',
                                color: 'white', fontSize: 13, outline: 'none'
                            }}
                        />
                        <button onClick={() => handleSend()} style={{
                            width: 36, height: 36, borderRadius: 8, background: '#7C3AED', border: 'none', color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            ➞
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button onClick={() => setIsOpen(!isOpen)} style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none', color: 'white', fontSize: 24, cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                {isOpen ? '▼' : '💬'}
            </button>

            <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.5); opacity: 1; } }
      `}</style>
        </div>
    );
}
