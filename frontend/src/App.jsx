import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LiveSimulation from './pages/LiveSimulation';
import SpectrumExplorer from './pages/SpectrumExplorer';
import SchedulerPage from './pages/Scheduler';
import Experiments from './pages/Experiments';
import RunDetail from './pages/RunDetail';
import Analytics from './pages/Analytics';
import ModelLab from './pages/ModelLab';
import DatasetManager from './pages/DatasetManager';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index          element={<Dashboard />} />
            <Route path="simulation" element={<LiveSimulation />} />
            <Route path="spectrum"   element={<SpectrumExplorer />} />
            <Route path="scheduler"  element={<SchedulerPage />} />
            <Route path="experiments" element={<Experiments />} />
            <Route path="runs"       element={<RunDetail />} />
            <Route path="analytics"  element={<Analytics />} />
            <Route path="models"     element={<ModelLab />} />
            <Route path="datasets"   element={<DatasetManager />} />
            <Route path="settings"   element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
