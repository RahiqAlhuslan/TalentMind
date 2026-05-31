import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import GamePage from './pages/GamePage';
import ThankYouPage from './pages/ThankYouPage';
import HRDashboard from './pages/HRDashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/thankyou" element={<ThankYouPage />} />
                <Route path="/hr" element={<HRDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
