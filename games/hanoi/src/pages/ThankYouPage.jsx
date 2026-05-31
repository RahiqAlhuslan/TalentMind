import { useNavigate } from 'react-router-dom';

function ThankYouPage() {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div className="thankyou-card glass-card">
                <div className="checkmark-circle">
                    <svg viewBox="0 0 52 52" className="checkmark-svg">
                        <circle cx="26" cy="26" r="25" fill="none" className="checkmark-circle-bg" />
                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className="checkmark-path" />
                    </svg>
                </div>
                <h1>All Done!</h1>
                <p className="thankyou-message">
                    Your results have been submitted successfully.
                </p>
                <p className="thankyou-sub">
                    Thank you for completing the logic puzzle assessment.
                    You may now close this window.
                </p>
                <button className="btn-secondary" onClick={() => navigate('/')}>
                    ← Return to Home
                </button>
            </div>
        </div>
    );
}

export default ThankYouPage;
