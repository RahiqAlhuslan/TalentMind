import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CandidateView from './views/CandidateView';
import HRDashboard from './views/HRDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/game" replace />} />
                <Route path="/game" element={<CandidateView />} />
                <Route path="/hr-dashboard" element={<HRDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
