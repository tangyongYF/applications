import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MergePage from './pages/MergePage';
import SplitPage from './pages/SplitPage';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/merge" replace />} />
          <Route path="/merge" element={<MergePage />} />
          <Route path="/split" element={<SplitPage />} />
          <Route path="*" element={<Navigate to="/merge" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;