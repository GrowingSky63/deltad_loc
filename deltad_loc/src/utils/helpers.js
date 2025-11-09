import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

// Formatação de datas
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

// Formatação de moeda
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Validação de CPF
export const validateCPF = (cpf) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação do algoritmo do CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  
  if (digit1 !== parseInt(cleanCPF[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  
  return digit2 === parseInt(cleanCPF[10]);
};

// Validação de CNPJ
export const validateCNPJ = (cnpj) => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
  
  // Validação do algoritmo do CNPJ
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i];
  }
  let digit1 = sum % 11;
  digit1 = digit1 < 2 ? 0 : 11 - digit1;
  
  if (digit1 !== parseInt(cleanCNPJ[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i];
  }
  let digit2 = sum % 11;
  digit2 = digit2 < 2 ? 0 : 11 - digit2;
  
  return digit2 === parseInt(cleanCNPJ[13]);
};

// Formatação de CPF/CNPJ
export const formatCPF = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Formatação automática de CPF/CNPJ
export const formatCPFCNPJ = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length <= 11) {
    return formatCPF(cleanValue);
  } else {
    return formatCNPJ(cleanValue);
  }
};

// Formatação de telefone
export const formatPhone = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  
  if (cleanValue.length === 10) {
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }
  
  return value;
};

// Formatação de CEP
export const formatCEP = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Status de locação
export const getStatusLabel = (status) => {
  const statusMap = {
    'P': 'Pendente',
    'A': 'Ativa',
    'F': 'Finalizada',
    'C': 'Cancelada',
  };
  return statusMap[status] || status;
};

// Cores para status
export const getStatusColor = (status) => {
  const colorMap = {
    'P': 'warning',
    'A': 'success',
    'F': 'info',
    'C': 'error',
  };
  return colorMap[status] || 'default';
};

// Tipo de pessoa
export const getTipoPessoaLabel = (tipo) => {
  const tipoMap = {
    'F': 'Pessoa Física',
    'J': 'Pessoa Jurídica',
  };
  return tipoMap[tipo] || tipo;
};

// Status do cliente
export const getClienteStatusLabel = (status) => {
  const statusMap = {
    'A': 'Ativo',
    'I': 'Inadimplente',
  };
  return statusMap[status] || status;
};

// Cores para status do cliente
export const getClienteStatusColor = (status) => {
  const colorMap = {
    'A': 'success',
    'I': 'error',
  };
  return colorMap[status] || 'default';
};

// Tipo de movimentação
export const getTipoMovimentacaoLabel = (tipo) => {
  const tipoMap = {
    'E': 'Entrada',
    'S': 'Saída',
  };
  return tipoMap[tipo] || tipo;
};

// Cores para tipo de movimentação
export const getTipoMovimentacaoColor = (tipo) => {
  const colorMap = {
    'E': 'success',
    'S': 'error',
  };
  return colorMap[tipo] || 'default';
};

// Função para debounce (para pesquisas)
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};