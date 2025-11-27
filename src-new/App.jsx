/**
 * 3GPP KPI Dashboard App
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard, AnalysisResults, Preferences } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="results" element={<AnalysisResults />} />
          <Route path="preferences" element={<Preferences />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;






