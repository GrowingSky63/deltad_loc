from django.contrib import admin
from .models import TipoPeca, Peca, Cliente, Locacao, ItemLocacao, MovimentacaoEstoque


@admin.register(TipoPeca)
class TipoPecaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'valor_locacao', 'created_at']
    list_filter = ['created_at']
    search_fields = ['nome', 'descricao']
    ordering = ['nome']


@admin.register(Peca)
class PecaAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'tipo_peca', 'quantidade_total', 'quantidade_disponivel', 'quantidade_locada']
    list_filter = ['tipo_peca', 'created_at']
    search_fields = ['codigo', 'tipo_peca__nome']
    ordering = ['tipo_peca__nome', 'codigo']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['nome', 'cpf_cnpj', 'tipo_pessoa', 'status', 'cidade', 'estado']
    list_filter = ['tipo_pessoa', 'status', 'estado', 'created_at']
    search_fields = ['nome', 'cpf_cnpj', 'email', 'telefone']
    ordering = ['nome']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Locacao)
class LocacaoAdmin(admin.ModelAdmin):
    list_display = ['numero_locacao', 'cliente', 'data_locacao', 'data_previsao_devolucao', 'status', 'valor_final']
    list_filter = ['status', 'data_locacao', 'created_at']
    search_fields = ['numero_locacao', 'cliente__nome']
    ordering = ['-data_locacao', '-numero_locacao']
    readonly_fields = ['created_at', 'updated_at', 'valor_final']


@admin.register(ItemLocacao)
class ItemLocacaoAdmin(admin.ModelAdmin):
    list_display = ['locacao', 'peca', 'quantidade', 'valor_total_item']
    list_filter = ['locacao__status']
    search_fields = ['locacao__numero_locacao', 'peca__codigo']
    ordering = ['locacao__numero_locacao']


@admin.register(MovimentacaoEstoque)
class MovimentacaoEstoqueAdmin(admin.ModelAdmin):
    list_display = ['peca', 'tipo_movimentacao', 'quantidade', 'data_movimentacao', 'usuario']
    list_filter = ['tipo_movimentacao', 'data_movimentacao']
    search_fields = ['peca__codigo', 'motivo']
    ordering = ['-data_movimentacao']
    readonly_fields = ['data_movimentacao']
