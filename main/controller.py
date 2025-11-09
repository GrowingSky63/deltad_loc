from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import TipoPeca, Peca, Cliente, Locacao, ItemLocacao, MovimentacaoEstoque
from .serializers import (
    TipoPecaSerializer, PecaSerializer, ClienteSerializer, 
    LocacaoSerializer, LocacaoCreateSerializer, ItemLocacaoSerializer, 
    MovimentacaoEstoqueSerializer
)


class TipoPecaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de peças
    """
    queryset = TipoPeca.objects.all()
    serializer_class = TipoPecaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nome', 'descricao']
    ordering_fields = ['nome', 'valor_locacao', 'created_at']
    ordering = ['nome']

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Retorna estatísticas dos tipos de peças
        """
        total_tipos = self.queryset.count()
        valor_medio = self.queryset.aggregate(
            valor_medio=Sum('valor_locacao')
        )['valor_medio'] or 0
        
        # Tipos mais utilizados
        tipos_populares = TipoPeca.objects.annotate(
            total_pecas=Count('peca'),
            total_locacoes=Count('peca__itemlocacao')
        ).order_by('-total_locacoes')[:5]
        
        return Response({
            'total_tipos': total_tipos,
            'valor_medio': valor_medio / total_tipos if total_tipos > 0 else 0,
            'tipos_populares': TipoPecaSerializer(tipos_populares, many=True).data
        })


class PecaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para peças individuais
    """
    queryset = Peca.objects.select_related('tipo_peca').all()
    serializer_class = PecaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_peca', 'quantidade_disponivel']
    search_fields = ['codigo', 'tipo_peca__nome', 'observacoes']
    ordering_fields = ['codigo', 'quantidade_total', 'quantidade_disponivel', 'created_at']
    ordering = ['tipo_peca__nome', 'codigo']

    @action(detail=False, methods=['get'])
    def estoque_baixo(self, request):
        """
        Retorna peças com estoque baixo (quantidade disponível <= 5)
        """
        pecas_baixo_estoque = self.queryset.filter(quantidade_disponivel__lte=5)
        serializer = self.get_serializer(pecas_baixo_estoque, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def relatorio_estoque(self, request):
        """
        Relatório completo do estoque
        """
        total_pecas = self.queryset.count()
        total_quantidade = self.queryset.aggregate(
            total=Sum('quantidade_total'),
            disponivel=Sum('quantidade_disponivel'),
            locado=Sum('quantidade_locada')
        )
        
        pecas_zeradas = self.queryset.filter(quantidade_disponivel=0).count()
        
        return Response({
            'total_pecas': total_pecas,
            'quantidade_total': total_quantidade['total'] or 0,
            'quantidade_disponivel': total_quantidade['disponivel'] or 0,
            'quantidade_locada': total_quantidade['locado'] or 0,
            'pecas_sem_estoque': pecas_zeradas,
        })

    @action(detail=True, methods=['post'])
    def ajustar_estoque(self, request, pk=None):
        """
        Ajustar manualmente o estoque de uma peça
        """
        peca = self.get_object()
        nova_quantidade = request.data.get('quantidade_total')
        motivo = request.data.get('motivo', 'Ajuste manual')
        
        if nova_quantidade is None:
            return Response(
                {'error': 'Quantidade total é obrigatória'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            nova_quantidade = int(nova_quantidade)
            if nova_quantidade < 0:
                raise ValueError("Quantidade não pode ser negativa")
        except (ValueError, TypeError):
            return Response(
                {'error': 'Quantidade deve ser um número inteiro válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar movimentação de estoque
        diferenca = nova_quantidade - peca.quantidade_total
        if diferenca != 0:
            MovimentacaoEstoque.objects.create(
                peca=peca,
                tipo_movimentacao='E' if diferenca > 0 else 'S',
                quantidade=abs(diferenca),
                motivo=motivo,
                usuario=request.user
            )
        
        # Atualizar estoque
        peca.quantidade_total = nova_quantidade
        peca.quantidade_disponivel = nova_quantidade - peca.quantidade_locada
        peca.save()
        
        return Response(self.get_serializer(peca).data)


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para clientes
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_pessoa', 'status', 'cidade', 'estado']
    search_fields = ['nome', 'cpf_cnpj', 'email', 'telefone']
    ordering_fields = ['nome', 'created_at']
    ordering = ['nome']

    @action(detail=False, methods=['get'])
    def inadimplentes(self, request):
        """
        Retorna clientes inadimplentes
        """
        clientes_inadimplentes = self.queryset.filter(status='I')
        serializer = self.get_serializer(clientes_inadimplentes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def historico_locacoes(self, request, pk=None):
        """
        Histórico de locações do cliente
        """
        cliente = self.get_object()
        locacoes = Locacao.objects.filter(cliente=cliente).order_by('-data_locacao')
        
        # Estatísticas
        total_locacoes = locacoes.count()
        valor_total_gasto = locacoes.aggregate(
            total=Sum('valor_final')
        )['total'] or 0
        
        locacoes_ativas = locacoes.filter(status='A').count()
        
        return Response({
            'total_locacoes': total_locacoes,
            'valor_total_gasto': valor_total_gasto,
            'locacoes_ativas': locacoes_ativas,
            'locacoes': LocacaoSerializer(locacoes[:10], many=True).data  # Últimas 10
        })


class LocacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para locações
    """
    queryset = Locacao.objects.select_related('cliente').prefetch_related('itens__peca__tipo_peca').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'cliente', 'data_locacao']
    search_fields = ['numero_locacao', 'cliente__nome', 'observacoes']
    ordering_fields = ['numero_locacao', 'data_locacao', 'data_previsao_devolucao', 'valor_final']
    ordering = ['-data_locacao', '-numero_locacao']

    def get_serializer_class(self):
        if self.action == 'create':
            return LocacaoCreateSerializer
        return LocacaoSerializer

    @action(detail=False, methods=['get'])
    def ativas(self, request):
        """
        Retorna locações ativas
        """
        locacoes_ativas = self.queryset.filter(status='A')
        serializer = self.get_serializer(locacoes_ativas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def vencidas(self, request):
        """
        Retorna locações com prazo vencido
        """
        hoje = timezone.now().date()
        locacoes_vencidas = self.queryset.filter(
            status='A',
            data_previsao_devolucao__lt=hoje
        )
        serializer = self.get_serializer(locacoes_vencidas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Finalizar uma locação (devolver peças)
        """
        locacao = self.get_object()
        
        if locacao.status != 'A':
            return Response(
                {'error': 'Apenas locações ativas podem ser finalizadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data_devolucao = request.data.get('data_devolucao')
        if data_devolucao:
            try:
                data_devolucao = datetime.strptime(data_devolucao, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de data inválido. Use YYYY-MM-DD'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            data_devolucao = timezone.now().date()
        
        # Devolver peças ao estoque
        for item in locacao.itens.all():
            peca = item.peca
            peca.quantidade_locada -= item.quantidade
            peca.quantidade_disponivel += item.quantidade
            peca.save()
            
            # Registrar movimentação
            MovimentacaoEstoque.objects.create(
                peca=peca,
                tipo_movimentacao='E',
                quantidade=item.quantidade,
                locacao=locacao,
                motivo='Devolução de locação',
                usuario=request.user
            )
        
        # Atualizar status da locação
        locacao.status = 'F'
        locacao.data_devolucao = data_devolucao
        locacao.save()
        
        return Response(self.get_serializer(locacao).data)

    @action(detail=False, methods=['get'])
    def relatorio_financeiro(self, request):
        """
        Relatório financeiro das locações
        """
        periodo = request.query_params.get('periodo', '30')  # dias
        data_inicio = timezone.now().date() - timedelta(days=int(periodo))
        
        locacoes_periodo = self.queryset.filter(data_locacao__gte=data_inicio)
        
        receita_total = locacoes_periodo.aggregate(
            total=Sum('valor_final')
        )['total'] or 0
        
        locacoes_por_status = locacoes_periodo.values('status').annotate(
            count=Count('id'),
            valor=Sum('valor_final')
        )
        
        return Response({
            'periodo_dias': periodo,
            'receita_total': receita_total,
            'total_locacoes': locacoes_periodo.count(),
            'por_status': list(locacoes_por_status)
        })


class ItemLocacaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para itens de locação
    """
    queryset = ItemLocacao.objects.select_related('locacao', 'peca__tipo_peca').all()
    serializer_class = ItemLocacaoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['locacao', 'peca']
    ordering = ['locacao__numero_locacao']


class MovimentacaoEstoqueViewSet(viewsets.ModelViewSet):
    """
    ViewSet para movimentações de estoque
    """
    queryset = MovimentacaoEstoque.objects.select_related('peca__tipo_peca', 'usuario', 'locacao').all()
    serializer_class = MovimentacaoEstoqueSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo_movimentacao', 'peca', 'locacao', 'usuario']
    search_fields = ['motivo', 'observacoes', 'peca__codigo']
    ordering_fields = ['data_movimentacao']
    ordering = ['-data_movimentacao']

    @action(detail=False, methods=['get'])
    def relatorio_movimentacoes(self, request):
        """
        Relatório de movimentações por período
        """
        periodo = request.query_params.get('periodo', '30')  # dias
        data_inicio = timezone.now().date() - timedelta(days=int(periodo))
        
        movimentacoes_periodo = self.queryset.filter(
            data_movimentacao__date__gte=data_inicio
        )
        
        entradas = movimentacoes_periodo.filter(tipo_movimentacao='E').aggregate(
            total=Sum('quantidade')
        )['total'] or 0
        
        saidas = movimentacoes_periodo.filter(tipo_movimentacao='S').aggregate(
            total=Sum('quantidade')
        )['total'] or 0
        
        return Response({
            'periodo_dias': periodo,
            'total_entradas': entradas,
            'total_saidas': saidas,
            'saldo': entradas - saidas,
            'total_movimentacoes': movimentacoes_periodo.count()
        })
