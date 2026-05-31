export default function ProtectedRoute({ token, children }) {
    if (token !== 'hr-access-2024') {
        return (
            <div className="page-container">
                <div className="welcome-card glass-card" style={{ textAlign: 'center' }}>
                    <div className="welcome-icon">🔒</div>
                    <h1>Access Denied</h1>
                    <p className="welcome-subtitle">
                        Valid HR access token required.
                        <br />
                        Use <code>?token=hr-access-2024</code> to access the dashboard.
                    </p>
                </div>
            </div>
        );
    }
    return children;
}
