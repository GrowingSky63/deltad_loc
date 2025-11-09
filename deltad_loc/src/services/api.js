import axios from 'axios';

// Configuração base do axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para enviar cookies de sessão
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login se não autenticado
      window.location.href = '/api-auth/login/';
    }
    return Promise.reject(error);
  }
);

// Serviços para cada modelo
export const tiposPecaService = {
  getAll: (params = {}) => api.get('/tipos-peca/', { params }),
  getById: (id) => api.get(`/tipos-peca/${id}/`),
  create: (data) => api.post('/tipos-peca/', data),
  update: (id, data) => api.put(`/tipos-peca/${id}/`, data),
  delete: (id) => api.delete(`/tipos-peca/${id}/`),
  getEstatisticas: () => api.get('/tipos-peca/estatisticas/'),
};

export const pecasService = {
  getAll: (params = {}) => api.get('/pecas/', { params }),
  getById: (id) => api.get(`/pecas/${id}/`),
  create: (data) => api.post('/pecas/', data),
  update: (id, data) => api.put(`/pecas/${id}/`, data),
  delete: (id) => api.delete(`/pecas/${id}/`),
  getBaixoEstoque: () => api.get('/pecas/estoque_baixo/'),
  getRelatorioEstoque: () => api.get('/pecas/relatorio_estoque/'),
  ajustarEstoque: (id, data) => api.post(`/pecas/${id}/ajustar_estoque/`, data),
};

export const clientesService = {
  getAll: (params = {}) => api.get('/clientes/', { params }),
  getById: (id) => api.get(`/clientes/${id}/`),
  create: (data) => api.post('/clientes/', data),
  update: (id, data) => api.put(`/clientes/${id}/`, data),
  delete: (id) => api.delete(`/clientes/${id}/`),
  getInadimplentes: () => api.get('/clientes/inadimplentes/'),
  getHistoricoLocacoes: (id) => api.get(`/clientes/${id}/historico_locacoes/`),
};

export const locacoesService = {
  getAll: (params = {}) => api.get('/locacoes/', { params }),
  getById: (id) => api.get(`/locacoes/${id}/`),
  create: (data) => api.post('/locacoes/', data),
  update: (id, data) => api.put(`/locacoes/${id}/`, data),
  delete: (id) => api.delete(`/locacoes/${id}/`),
  getAtivas: () => api.get('/locacoes/ativas/'),
  getVencidas: () => api.get('/locacoes/vencidas/'),
  finalizar: (id, data) => api.post(`/locacoes/${id}/finalizar/`, data),
  getRelatorioFinanceiro: (params = {}) => api.get('/locacoes/relatorio_financeiro/', { params }),
};

export const itensLocacaoService = {
  getAll: (params = {}) => api.get('/itens-locacao/', { params }),
  getById: (id) => api.get(`/itens-locacao/${id}/`),
  create: (data) => api.post('/itens-locacao/', data),
  update: (id, data) => api.put(`/itens-locacao/${id}/`, data),
  delete: (id) => api.delete(`/itens-locacao/${id}/`),
};

export const movimentacoesService = {
  getAll: (params = {}) => api.get('/movimentacoes/', { params }),
  getById: (id) => api.get(`/movimentacoes/${id}/`),
  create: (data) => api.post('/movimentacoes/', data),
  update: (id, data) => api.put(`/movimentacoes/${id}/`, data),
  delete: (id) => api.delete(`/movimentacoes/${id}/`),
  getRelatorio: (params = {}) => api.get('/movimentacoes/relatorio_movimentacoes/', { params }),
};

export default api;