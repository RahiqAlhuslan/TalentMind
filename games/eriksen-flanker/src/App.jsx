import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import PracticePage from './pages/PracticePage';
import TestPage from './pages/TestPage';
import ThankYouPage from './pages/ThankYouPage';
import HRDashboard from './pages/HRDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/test" element={<TestPage />} />
                <Route path="/complete" element={<ThankYouPage />} />
                <Route path="/hr" element={<HRDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
