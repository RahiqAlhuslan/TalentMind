import { useEffect, useState } from 'react';

/**
 * ThankYouPage — Displays completion screen and game outcomes.
 */
export default function ThankYouPage() {
    const [metrics, setMetrics] = useState(null);
    const name = sessionStorage.getItem('candidateName') || 'there';

    useEffect(() => {
        const trialsStr = sessionStorage.getItem('standaloneTrials');
        if (trialsStr) {
            try {
                const trials = JSON.parse(trialsStr);
                let correct = 0;
                const rt = { congruent: [], incongruent: [] };
                
                trials.forEach(t => {
                    if (t.isCorrect) {
                        correct++;
                        if (t.isCongruent) rt.congruent.push(t.reactionTimeMs);
                        else rt.incongruent.push(t.reactionTimeMs);
                    }
                });

                const getMean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
                const congMean = getMean(rt.congruent);
                const incongMean = getMean(rt.incongruent);

                setMetrics({
                    accuracy: (correct / trials.length) * 100,
                    congMean,
                    incongMean,
                    flankerEffect: incongMean - congMean
                });
            } catch (e) {
                console.error("Failed calculating metrics", e);
            }
        }

        // Clean up session data
        return () => {
            sessionStorage.removeItem('flankerSessionId');
            sessionStorage.removeItem('candidateName');
            sessionStorage.removeItem('standaloneTrials');
        };
    }, []);

    return (
        <div className="page-container welcome-page">
            <div className="welcome-card glass-card thankyou-card" style={{ maxWidth: '600px' }}>
                <div className="welcome-icon thankyou-icon">🎉</div>
                <h1>All Done!</h1>
                <p className="welcome-subtitle">
                    Thank you, <strong>{name}</strong>! Your game is complete.
                </p>
                
                {metrics ? (
                    <div className="instructions-box" style={{ marginTop: '20px', textAlign: 'left' }}>
                        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px', marginBottom: '15px' }}>
                            Your Results
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="metric-item">
                                <strong style={{color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem'}}>Accuracy:</strong>
                                <span style={{fontSize: '1.2rem', fontWeight: '600'}}>{metrics.accuracy.toFixed(1)}%</span>
                            </div>
                            <div className="metric-item">
                                <strong style={{color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem'}}>Flanker Effect:</strong>
                                <span style={{fontSize: '1.2rem', fontWeight: '600'}}>{Math.round(metrics.flankerEffect)} ms</span>
                            </div>
                            <div className="metric-item">
                                <strong style={{color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem'}}>Congruent RT:</strong>
                                <span style={{fontSize: '1.2rem'}}>{Math.round(metrics.congMean)} ms</span>
                            </div>
                            <div className="metric-item">
                                <strong style={{color: 'var(--text-muted)', display: 'block', fontSize: '0.85rem'}}>Incongruent RT:</strong>
                                <span style={{fontSize: '1.2rem'}}>{Math.round(metrics.incongMean)} ms</span>
                            </div>
                        </div>
                        <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'20px'}}>
                            * Flanker effect measures cognitive interference: how much slower you are when distracting arrows point the wrong way.
                        </p>
                    </div>
                ) : (
                    <div className="thankyou-detail" style={{ marginTop: '20px' }}>
                        <p>Your responses have been saved.</p>
                    </div>
                )}
                
                <div className="thankyou-detail" style={{ marginTop: '30px' }}>
                    <p>You may close this window now.</p>
                    <p className="hint-text">If you have any questions, please contact your HR representative.</p>
                </div>
            </div>
        </div>
    );
}
