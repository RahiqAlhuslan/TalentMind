export default function ProtectedRoute({ token, children }) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') !== token) {
        return (
            <>
                <div className="scene-bg" />
                <div className="access-denied">
                    <div className="access-denied-card glass">
                        <div className="access-denied-icon">🔒</div>
                        <div className="access-denied-title">Access Denied</div>
                        <div className="access-denied-sub">
                            You need a valid access token to view this page.
                        </div>
                    </div>
                </div>
            </>
        );
    }
    return children;
}
