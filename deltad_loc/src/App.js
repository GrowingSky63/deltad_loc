import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/pt-br';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TiposPeca from './pages/TiposPeca';
import Pecas from './pages/Pecas';
// Import outras páginas aqui quando estiverem prontas

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tipos-peca" element={<TiposPeca />} />
              <Route path="/pecas" element={<Pecas />} />
              {/* Adicionar outras rotas aqui */}
              <Route path="/clientes" element={<div>Página de Clientes em desenvolvimento...</div>} />
              <Route path="/locacoes" element={<div>Página de Locações em desenvolvimento...</div>} />
              <Route path="/movimentacoes" element={<div>Página de Movimentações em desenvolvimento...</div>} />
            </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
