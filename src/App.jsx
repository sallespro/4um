import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MarkdownPage from './components/MarkdownPage';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="pages/:slug" element={<MarkdownPage />} />
                    </Route>
                </Routes>
            </Router>
        </QueryClientProvider>
    );
}

export default App;
