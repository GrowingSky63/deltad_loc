import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  pecasService,
  clientesService,
  locacoesService,
  tiposPecaService,
} from '../services/api';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import Loading from '../components/Loading';

const StatCard = ({ title, value, icon, color = 'primary', trend = null }) => (
  <Card elevation={2}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div" color={color}>
            {value}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              {trend > 0 ? (
                <TrendingUpIcon color="success" fontSize="small" />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" />
              )}
              <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                {Math.abs(trend)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    estoque: null,
    locacoes: null,
    clientes: null,
    tipos: null,
    baixoEstoque: null,
    vencidas: null,
    relatorioFinanceiro: null,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        estoqueData,
        locacoesAtivas,
        clientesData,
        tiposData,
        baixoEstoque,
        vencidas,
        relatorioFinanceiro,
      ] = await Promise.all([
        pecasService.getRelatorioEstoque(),
        locacoesService.getAtivas(),
        clientesService.getAll(),
        tiposPecaService.getEstatisticas(),
        pecasService.getBaixoEstoque(),
        locacoesService.getVencidas(),
        locacoesService.getRelatorioFinanceiro({ periodo: '30' }),
      ]);

      setData({
        estoque: estoqueData.data,
        locacoes: locacoesAtivas.data,
        clientes: clientesData.data,
        tipos: tiposData.data,
        baixoEstoque: baixoEstoque.data,
        vencidas: vencidas.data,
        relatorioFinanceiro: relatorioFinanceiro.data,
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Carregando dashboard..." />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      
      {/* Cards de estatísticas principais */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Peças"
            value={data.estoque?.total_pecas || 0}
            icon={<InventoryIcon fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Locações Ativas"
            value={data.locacoes?.length || 0}
            icon={<AssignmentIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Clientes"
            value={data.clientes?.count || 0}
            icon={<PeopleIcon fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Receita (30 dias)"
            value={formatCurrency(data.relatorioFinanceiro?.receita_total)}
            icon={<TrendingUpIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Segunda linha de estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quantidade Disponível"
            value={data.estoque?.quantidade_disponivel || 0}
            icon={<InventoryIcon fontSize="large" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Quantidade Locada"
            value={data.estoque?.quantidade_locada || 0}
            icon={<AssignmentIcon fontSize="large" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Peças sem Estoque"
            value={data.estoque?.pecas_sem_estoque || 0}
            icon={<WarningIcon fontSize="large" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Locações Vencidas"
            value={data.vencidas?.length || 0}
            icon={<WarningIcon fontSize="large" />}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Alertas de estoque baixo */}
        {data.baixoEstoque && data.baixoEstoque.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="error">
                ⚠️ Peças com Estoque Baixo
              </Typography>
              <List dense>
                {data.baixoEstoque.slice(0, 5).map((peca) => (
                  <ListItem key={peca.id} divider>
                    <ListItemIcon>
                      <WarningIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${peca.codigo} - ${peca.tipo_peca_nome}`}
                      secondary={`Disponível: ${peca.quantidade_disponivel}`}
                    />
                  </ListItem>
                ))}
              </List>
              {data.baixoEstoque.length > 5 && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  ... e mais {data.baixoEstoque.length - 5} peças
                </Typography>
              )}
            </Paper>
          </Grid>
        )}

        {/* Locações vencidas */}
        {data.vencidas && data.vencidas.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="error">
                📅 Locações Vencidas
              </Typography>
              <List dense>
                {data.vencidas.slice(0, 5).map((locacao) => (
                  <ListItem key={locacao.id} divider>
                    <ListItemText
                      primary={`Locação ${locacao.numero_locacao} - ${locacao.cliente_nome}`}
                      secondary={`Vencimento: ${formatDate(locacao.data_previsao_devolucao)}`}
                    />
                    <Chip
                      label={getStatusColor(locacao.status)}
                      color="error"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
              {data.vencidas.length > 5 && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  ... e mais {data.vencidas.length - 5} locações
                </Typography>
              )}
            </Paper>
          </Grid>
        )}

        {/* Resumo financeiro */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              💰 Resumo Financeiro (30 dias)
            </Typography>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Receita Total
              </Typography>
              <Typography variant="h5" color="success.main">
                {formatCurrency(data.relatorioFinanceiro?.receita_total)}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Total de Locações
              </Typography>
              <Typography variant="h6">
                {data.relatorioFinanceiro?.total_locacoes || 0}
              </Typography>
            </Box>
            {data.relatorioFinanceiro?.por_status?.map((status) => (
              <Box key={status.status} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  Status {status.status}: {status.count} locações
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(status.valor)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Tipos de peças mais populares */}
        {data.tipos?.tipos_populares && data.tipos.tipos_populares.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                🏆 Tipos Mais Locados
              </Typography>
              <List dense>
                {data.tipos.tipos_populares.slice(0, 5).map((tipo, index) => (
                  <ListItem key={tipo.id} divider>
                    <ListItemText
                      primary={`${index + 1}º ${tipo.nome}`}
                      secondary={`${formatCurrency(tipo.valor_locacao)} - ${tipo.total_locacoes || 0} locações`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Alertas gerais */}
      {(!data.baixoEstoque || data.baixoEstoque.length === 0) &&
       (!data.vencidas || data.vencidas.length === 0) && (
        <Alert severity="success" sx={{ mt: 3 }}>
          ✅ Tudo funcionando perfeitamente! Não há alertas no momento.
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;