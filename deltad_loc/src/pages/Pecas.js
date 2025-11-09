import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fab,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { pecasService, tiposPecaService } from '../services/api';
import { formatCurrency, debounce } from '../utils/helpers';
import Loading from '../components/Loading';

const Pecas = () => {
  const [pecas, setPecas] = useState([]);
  const [tiposPeca, setTiposPeca] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ajusteEstoqueOpen, setAjusteEstoqueOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    tipo_peca: '',
    codigo: '',
    quantidade_total: '',
    observacoes: '',
  });
  
  const [ajusteData, setAjusteData] = useState({
    quantidade_total: '',
    motivo: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadPecas();
    loadTiposPeca();
  }, []);

  useEffect(() => {
    const delayedSearch = debounce(() => {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm;
      if (tipoFilter) params.tipo_peca = tipoFilter;
      loadPecas(params);
    }, 500);

    delayedSearch();
  }, [searchTerm, tipoFilter]);

  const loadPecas = async (params = {}) => {
    try {
      setLoading(true);
      const response = await pecasService.getAll(params);
      setPecas(response.data.results || response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar peças', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTiposPeca = async () => {
    try {
      const response = await tiposPecaService.getAll();
      setTiposPeca(response.data.results || response.data);
    } catch (error) {
      console.error('Erro ao carregar tipos de peça:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (peca = null) => {
    if (peca) {
      setEditingPeca(peca);
      setFormData({
        tipo_peca: peca.tipo_peca.toString(),
        codigo: peca.codigo,
        quantidade_total: peca.quantidade_total.toString(),
        observacoes: peca.observacoes || '',
      });
    } else {
      setEditingPeca(null);
      setFormData({
        tipo_peca: '',
        codigo: '',
        quantidade_total: '',
        observacoes: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPeca(null);
    setFormErrors({});
  };

  const handleOpenAjusteEstoque = (peca) => {
    setEditingPeca(peca);
    setAjusteData({
      quantidade_total: peca.quantidade_total.toString(),
      motivo: '',
    });
    setAjusteEstoqueOpen(true);
  };

  const handleCloseAjusteEstoque = () => {
    setAjusteEstoqueOpen(false);
    setEditingPeca(null);
    setAjusteData({
      quantidade_total: '',
      motivo: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.tipo_peca) {
      errors.tipo_peca = 'Tipo de peça é obrigatório';
    }

    if (!formData.codigo.trim()) {
      errors.codigo = 'Código é obrigatório';
    }

    if (!formData.quantidade_total || parseInt(formData.quantidade_total) < 0) {
      errors.quantidade_total = 'Quantidade deve ser um número válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        tipo_peca: parseInt(formData.tipo_peca),
        codigo: formData.codigo,
        quantidade_total: parseInt(formData.quantidade_total),
        quantidade_disponivel: parseInt(formData.quantidade_total),
        quantidade_locada: 0,
        observacoes: formData.observacoes,
      };

      if (editingPeca) {
        // Para edição, manter as quantidades locadas
        data.quantidade_locada = editingPeca.quantidade_locada;
        data.quantidade_disponivel = data.quantidade_total - editingPeca.quantidade_locada;
        await pecasService.update(editingPeca.id, data);
        showSnackbar('Peça atualizada com sucesso!');
      } else {
        await pecasService.create(data);
        showSnackbar('Peça criada com sucesso!');
      }

      handleCloseDialog();
      loadPecas();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          Object.values(error.response?.data || {}).join(', ') ||
                          'Erro ao salvar peça';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleAjusteEstoque = async () => {
    if (!ajusteData.quantidade_total || !ajusteData.motivo.trim()) {
      showSnackbar('Quantidade total e motivo são obrigatórios', 'error');
      return;
    }

    try {
      await pecasService.ajustarEstoque(editingPeca.id, {
        quantidade_total: parseInt(ajusteData.quantidade_total),
        motivo: ajusteData.motivo,
      });

      showSnackbar('Estoque ajustado com sucesso!');
      handleCloseAjusteEstoque();
      loadPecas();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao ajustar estoque';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (peca) => {
    if (peca.quantidade_locada > 0) {
      showSnackbar('Não é possível excluir peça com quantidade locada', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a peça "${peca.codigo}"?`)) {
      try {
        await pecasService.delete(peca.id);
        showSnackbar('Peça excluída com sucesso!');
        loadPecas();
      } catch (error) {
        const errorMessage = error.response?.data?.detail || 'Erro ao excluir peça';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const getStatusColor = (peca) => {
    if (peca.quantidade_disponivel === 0) return 'error';
    if (peca.quantidade_disponivel <= 5) return 'warning';
    return 'success';
  };

  const getStatusLabel = (peca) => {
    if (peca.quantidade_disponivel === 0) return 'Sem Estoque';
    if (peca.quantidade_disponivel <= 5) return 'Estoque Baixo';
    return 'Disponível';
  };

  if (loading && pecas.length === 0) {
    return <Loading message="Carregando peças..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Controle de Peças
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Peça
        </Button>
      </Box>

      {/* Filtros */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por código, tipo ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filtrar por Tipo</InputLabel>
              <Select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                label="Filtrar por Tipo"
              >
                <MenuItem value="">Todos os tipos</MenuItem>
                {tiposPeca.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TuneIcon />}
              onClick={() => {
                setSearchTerm('');
                setTipoFilter('');
              }}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de peças */}
      {pecas.length === 0 && !loading ? (
        <Alert severity="info">
          Nenhuma peça encontrada. Clique em "Nova Peça" para criar a primeira.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {pecas.map((peca) => (
            <Grid item xs={12} sm={6} md={4} key={peca.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6">
                      {peca.codigo}
                    </Typography>
                    <Chip
                      label={getStatusLabel(peca)}
                      color={getStatusColor(peca)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {peca.tipo_peca_nome}
                  </Typography>
                  
                  <Typography variant="body2" color="primary.main" fontWeight="bold" mb={2}>
                    {formatCurrency(peca.tipo_peca_valor)}/período
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Total:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {peca.quantidade_total}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Disponível:</Typography>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={peca.quantidade_disponivel > 0 ? 'success.main' : 'error.main'}
                    >
                      {peca.quantidade_disponivel}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2">Locada:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {peca.quantidade_locada}
                    </Typography>
                  </Box>

                  {peca.observacoes && (
                    <Typography variant="caption" color="text.secondary">
                      {peca.observacoes}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions>
                  <Tooltip title="Editar">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(peca)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Ajustar Estoque">
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleOpenAjusteEstoque(peca)}
                    >
                      <InventoryIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Excluir">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(peca)}
                      disabled={peca.quantidade_locada > 0}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB para dispositivos móveis */}
      <Fab
        color="primary"
        aria-label="adicionar"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Dialog de criação/edição */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingPeca ? 'Editar Peça' : 'Nova Peça'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.tipo_peca}>
                <InputLabel>Tipo de Peça *</InputLabel>
                <Select
                  value={formData.tipo_peca}
                  onChange={(e) => handleInputChange('tipo_peca', e.target.value)}
                  label="Tipo de Peça *"
                >
                  {tiposPeca.map((tipo) => (
                    <MenuItem key={tipo.id} value={tipo.id}>
                      {tipo.nome} - {formatCurrency(tipo.valor_locacao)}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.tipo_peca && (
                  <Typography variant="caption" color="error">
                    {formErrors.tipo_peca}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código *"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                error={!!formErrors.codigo}
                helperText={formErrors.codigo}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantidade Total *"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.quantidade_total}
                onChange={(e) => handleInputChange('quantidade_total', e.target.value)}
                error={!!formErrors.quantidade_total}
                helperText={formErrors.quantidade_total}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPeca ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de ajuste de estoque */}
      <Dialog 
        open={ajusteEstoqueOpen} 
        onClose={handleCloseAjusteEstoque}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Ajustar Estoque - {editingPeca?.codigo}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Quantidade atual: {editingPeca?.quantidade_total} | 
            Locada: {editingPeca?.quantidade_locada} | 
            Disponível: {editingPeca?.quantidade_disponivel}
          </Alert>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nova Quantidade Total *"
                type="number"
                inputProps={{ min: editingPeca?.quantidade_locada || 0 }}
                value={ajusteData.quantidade_total}
                onChange={(e) => setAjusteData({ ...ajusteData, quantidade_total: e.target.value })}
                helperText={`Mínimo: ${editingPeca?.quantidade_locada || 0} (quantidade locada)`}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo do Ajuste *"
                multiline
                rows={3}
                value={ajusteData.motivo}
                onChange={(e) => setAjusteData({ ...ajusteData, motivo: e.target.value })}
                placeholder="Ex: Entrada de mercadoria, ajuste de inventário, etc."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAjusteEstoque}>
            Cancelar
          </Button>
          <Button onClick={handleAjusteEstoque} variant="contained">
            Ajustar Estoque
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Pecas;