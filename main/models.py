from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from decimal import Decimal


class TipoPeca(models.Model):
    """
    Modelo para tipos de peças/andaimes disponíveis para locação
    """
    nome = models.CharField(max_length=100, verbose_name="Nome da Peça")
    descricao = models.TextField(blank=True, null=True, verbose_name="Descrição")
    valor_locacao = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Valor de Locação"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tipo de Peça"
        verbose_name_plural = "Tipos de Peças"
        ordering = ['nome']

    def __str__(self):
        return f"{self.nome} - R$ {self.valor_locacao}"


class Peca(models.Model):
    """
    Modelo para controle individual de peças em estoque
    """
    tipo_peca = models.ForeignKey(TipoPeca, on_delete=models.CASCADE, verbose_name="Tipo de Peça")
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código da Peça")
    quantidade_total = models.PositiveIntegerField(default=0, verbose_name="Quantidade Total")
    quantidade_disponivel = models.PositiveIntegerField(default=0, verbose_name="Quantidade Disponível")
    quantidade_locada = models.PositiveIntegerField(default=0, verbose_name="Quantidade Locada")
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Peça"
        verbose_name_plural = "Peças"
        ordering = ['tipo_peca__nome', 'codigo']

    def __str__(self):
        return f"{self.codigo} - {self.tipo_peca.nome} (Disp: {self.quantidade_disponivel})"

    def save(self, *args, **kwargs):
        # Garantir que quantidade_locada + quantidade_disponivel = quantidade_total
        if self.quantidade_total and self.quantidade_locada:
            self.quantidade_disponivel = self.quantidade_total - self.quantidade_locada
        super().save(*args, **kwargs)


class Cliente(models.Model):
    """
    Modelo para registro de clientes
    """
    TIPO_PESSOA_CHOICES = [
        ('F', 'Pessoa Física'),
        ('J', 'Pessoa Jurídica'),
    ]
    
    STATUS_CHOICES = [
        ('A', 'Ativo'),
        ('I', 'Inadimplente'),
    ]

    nome = models.CharField(max_length=200, verbose_name="Nome/Razão Social")
    tipo_pessoa = models.CharField(max_length=1, choices=TIPO_PESSOA_CHOICES, default='F', verbose_name="Tipo de Pessoa")
    cpf_cnpj = models.CharField(max_length=18, unique=True, verbose_name="CPF/CNPJ")
    email = models.EmailField(blank=True, null=True, verbose_name="E-mail")
    telefone = models.CharField(max_length=20, verbose_name="Telefone")
    endereco = models.TextField(verbose_name="Endereço")
    cidade = models.CharField(max_length=100, verbose_name="Cidade")
    estado = models.CharField(max_length=2, verbose_name="Estado")
    cep = models.CharField(max_length=10, verbose_name="CEP")
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='A', verbose_name="Status")
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['nome']

    def __str__(self):
        return f"{self.nome} - {self.cpf_cnpj}"


class Locacao(models.Model):
    """
    Modelo principal para controle de locações
    """
    STATUS_CHOICES = [
        ('P', 'Pendente'),
        ('A', 'Ativa'),
        ('F', 'Finalizada'),
        ('C', 'Cancelada'),
    ]

    numero_locacao = models.IntegerField(unique=True, verbose_name="Número da Locação")
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, verbose_name="Cliente")
    data_locacao = models.DateField(verbose_name="Data de Locação")
    data_previsao_devolucao = models.DateField(verbose_name="Data Prevista para Devolução")
    data_devolucao = models.DateField(blank=True, null=True, verbose_name="Data de Devolução")
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='P', verbose_name="Status")
    valor_total = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Valor Total"
    )
    desconto = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Desconto"
    )
    valor_final = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        verbose_name="Valor Final"
    )
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Locação"
        verbose_name_plural = "Locações"
        ordering = ['-data_locacao', '-numero_locacao']

    def __str__(self):
        return f"Locação {self.numero_locacao} - {self.cliente.nome}"

    def save(self, *args, **kwargs):
        # Calcular valor final
        self.valor_final = self.valor_total - self.desconto
        super().save(*args, **kwargs)


class ItemLocacao(models.Model):
    """
    Modelo para itens específicos de cada locação (relacionamento Many-to-Many personalizado)
    """
    locacao = models.ForeignKey(Locacao, on_delete=models.CASCADE, related_name='itens', verbose_name="Locação")
    peca = models.ForeignKey(Peca, on_delete=models.CASCADE, verbose_name="Peça")
    quantidade = models.PositiveIntegerField(verbose_name="Quantidade")
    valor_total_item = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        verbose_name="Valor Total do Item"
    )
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")

    class Meta:
        verbose_name = "Item de Locação"
        verbose_name_plural = "Itens de Locação"
        unique_together = ['locacao', 'peca']

    def __str__(self):
        return f"{self.locacao.numero_locacao} - {self.peca.tipo_peca.nome} (Qtd: {self.quantidade})"

    def save(self, *args, **kwargs):
        # Calcular valor total do item
        self.valor_total_item = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)


class MovimentacaoEstoque(models.Model):
    """
    Modelo para registro de entrada e saída de peças no estoque
    """
    TIPO_MOVIMENTACAO_CHOICES = [
        ('E', 'Entrada'),
        ('S', 'Saída')
    ]

    MOTIVO_CHOICES = [
        ('LO', 'Locação'),
        ('AJ', 'Ajuste'),
        ('SI', 'Sinistro'),
        ('MA', 'Manutenção')
    ]

    peca = models.ForeignKey(Peca, on_delete=models.CASCADE, verbose_name="Peça")
    tipo_movimentacao = models.CharField(max_length=1, choices=TIPO_MOVIMENTACAO_CHOICES, verbose_name="Tipo de Movimentação")
    quantidade = models.IntegerField(verbose_name="Quantidade")  # Pode ser negativa para saídas
    data_movimentacao = models.DateTimeField(auto_now_add=True, verbose_name="Data da Movimentação")
    locacao = models.ForeignKey(Locacao, on_delete=models.CASCADE, blank=True, null=True, verbose_name="Locação Relacionada")
    motivo = models.CharField(max_length=200, verbose_name="Motivo da Movimentação")
    observacoes = models.TextField(blank=True, null=True, verbose_name="Observações")
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="Usuário")

    class Meta:
        verbose_name = "Movimentação de Estoque"
        verbose_name_plural = "Movimentações de Estoque"
        ordering = ['-data_movimentacao']

    def __str__(self):
        return f"{self.peca.codigo} - {self.tipo_movimentacao} ({self.quantidade})"
