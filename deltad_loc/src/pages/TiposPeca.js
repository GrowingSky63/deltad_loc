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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { tiposPecaService } from '../services/api';
import { formatCurrency, debounce } from '../utils/helpers';
import Loading from '../components/Loading';

const TiposPeca = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_locacao: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadTipos();
  }, []);

  useEffect(() => {
    const delayedSearch = debounce(() => {
      if (searchTerm.trim()) {
        loadTipos({ search: searchTerm });
      } else {
        loadTipos();
      }
    }, 500);

    delayedSearch();
  }, [searchTerm]);

  const loadTipos = async (params = {}) => {
    try {
      setLoading(true);
      const response = await tiposPecaService.getAll(params);
      setTipos(response.data.results || response.data);
    } catch (error) {
      showSnackbar('Erro ao carregar tipos de peças', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (tipo = null) => {
    if (tipo) {
      setEditingTipo(tipo);
      setFormData({
        nome: tipo.nome,
        descricao: tipo.descricao || '',
        valor_locacao: tipo.valor_locacao.toString(),
      });
    } else {
      setEditingTipo(null);
      setFormData({
        nome: '',
        descricao: '',
        valor_locacao: '',
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTipo(null);
    setFormData({
      nome: '',
      descricao: '',
      valor_locacao: '',
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (!formData.valor_locacao || parseFloat(formData.valor_locacao) <= 0) {
      errors.valor_locacao = 'Valor de locação deve ser maior que zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao,
        valor_locacao: parseFloat(formData.valor_locacao),
      };

      if (editingTipo) {
        await tiposPecaService.update(editingTipo.id, data);
        showSnackbar('Tipo de peça atualizado com sucesso!');
      } else {
        await tiposPecaService.create(data);
        showSnackbar('Tipo de peça criado com sucesso!');
      }

      handleCloseDialog();
      loadTipos();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          Object.values(error.response?.data || {}).join(', ') ||
                          'Erro ao salvar tipo de peça';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (tipo) => {
    if (window.confirm(`Tem certeza que deseja excluir o tipo "${tipo.nome}"?`)) {
      try {
        await tiposPecaService.delete(tipo.id);
        showSnackbar('Tipo de peça excluído com sucesso!');
        loadTipos();
      } catch (error) {
        const errorMessage = error.response?.data?.detail || 'Erro ao excluir tipo de peça';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  if (loading && tipos.length === 0) {
    return <Loading message="Carregando tipos de peças..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Tipos de Peças
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Tipo
        </Button>
      </Box>

      {/* Campo de busca */}
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar tipos de peças..."
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
      </Box>

      {/* Grid de tipos de peças */}
      {tipos.length === 0 && !loading ? (
        <Alert severity="info">
          Nenhum tipo de peça encontrado. Clique em "Novo Tipo" para criar o primeiro.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {tipos.map((tipo) => (
            <Grid item xs={12} sm={6} md={4} key={tipo.id}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {tipo.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {tipo.descricao || 'Sem descrição'}
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {formatCurrency(tipo.valor_locacao)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    por período de locação
                  </Typography>
                </CardContent>
                <CardActions>
                  <Tooltip title="Editar">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(tipo)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDelete(tipo)}
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
          {editingTipo ? 'Editar Tipo de Peça' : 'Novo Tipo de Peça'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Valor de Locação *"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.valor_locacao}
                onChange={(e) => handleInputChange('valor_locacao', e.target.value)}
                error={!!formErrors.valor_locacao}
                helperText={formErrors.valor_locacao}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTipo ? 'Atualizar' : 'Criar'}
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

export default TiposPeca;