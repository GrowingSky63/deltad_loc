from rest_framework import serializers
from .models import TipoPeca, Peca, Cliente, Locacao, ItemLocacao, MovimentacaoEstoque
from django.contrib.auth.models import User


class TipoPecaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPeca
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PecaSerializer(serializers.ModelSerializer):
    tipo_peca_nome = serializers.CharField(source='tipo_peca.nome', read_only=True)
    tipo_peca_valor = serializers.DecimalField(source='tipo_peca.valor_locacao', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Peca
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        """
        Validar que quantidade_disponivel + quantidade_locada = quantidade_total
        """
        quantidade_total = data.get('quantidade_total', 0)
        quantidade_locada = data.get('quantidade_locada', 0)
        quantidade_disponivel = data.get('quantidade_disponivel', 0)
        
        if quantidade_total != (quantidade_locada + quantidade_disponivel):
            data['quantidade_disponivel'] = quantidade_total - quantidade_locada
            
        return data


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

    def validate_cpf_cnpj(self, value):
        """
        Validação básica de CPF/CNPJ (apenas formato)
        """
        # Remove caracteres especiais
        cpf_cnpj = ''.join(filter(str.isdigit, value))
        
        if len(cpf_cnpj) not in [11, 14]:
            raise serializers.ValidationError("CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.")
        
        return value


class ItemLocacaoSerializer(serializers.ModelSerializer):
    peca_codigo = serializers.CharField(source='peca.codigo', read_only=True)
    peca_nome = serializers.CharField(source='peca.tipo_peca.nome', read_only=True)
    valor_unitario = serializers.DecimalField(source='peca.tipo_peca.valor_locacao', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ItemLocacao
        fields = '__all__'

    def validate(self, data):
        """
        Validar disponibilidade de estoque
        """
        peca = data.get('peca')
        quantidade = data.get('quantidade', 0)
        
        if peca and quantidade > peca.quantidade_disponivel:
            raise serializers.ValidationError(
                f"Quantidade solicitada ({quantidade}) excede a disponível ({peca.quantidade_disponivel}) para a peça {peca.codigo}."
            )
        
        return data


class LocacaoSerializer(serializers.ModelSerializer):
    cliente_nome = serializers.CharField(source='cliente.nome', read_only=True)
    cliente_cpf_cnpj = serializers.CharField(source='cliente.cpf_cnpj', read_only=True)
    itens = ItemLocacaoSerializer(many=True, read_only=True)
    total_itens = serializers.SerializerMethodField()
    
    class Meta:
        model = Locacao
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'valor_final')

    def get_total_itens(self, obj):
        return obj.itens.count()

    def validate(self, data):
        """
        Validar datas de locação
        """
        data_locacao = data.get('data_locacao')
        data_previsao_devolucao = data.get('data_previsao_devolucao')
        
        if data_locacao and data_previsao_devolucao:
            if data_previsao_devolucao < data_locacao:
                raise serializers.ValidationError(
                    "Data de previsão de devolução não pode ser anterior à data de locação."
                )
        
        return data


class LocacaoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer específico para criação de locações com itens
    """
    itens = ItemLocacaoSerializer(many=True, write_only=True)
    
    class Meta:
        model = Locacao
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'valor_final', 'valor_total')

    def create(self, validated_data):
        itens_data = validated_data.pop('itens', [])
        locacao = Locacao.objects.create(**validated_data)
        
        valor_total = 0
        for item_data in itens_data:
            peca = item_data['peca']
            quantidade = item_data['quantidade']
            valor_total_item = quantidade * peca.tipo_peca.valor_locacao
            
            ItemLocacao.objects.create(
                locacao=locacao,
                peca=peca,
                quantidade=quantidade,
                valor_total_item=valor_total_item,
                observacoes=item_data.get('observacoes', '')
            )
            
            # Atualizar estoque
            peca.quantidade_locada += quantidade
            peca.quantidade_disponivel -= quantidade
            peca.save()
            
            valor_total += valor_total_item
        
        # Atualizar valor total da locação
        locacao.valor_total = valor_total
        locacao.save()
        
        return locacao


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    peca_codigo = serializers.CharField(source='peca.codigo', read_only=True)
    peca_nome = serializers.CharField(source='peca.tipo_peca.nome', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    locacao_numero = serializers.IntegerField(source='locacao.numero_locacao', read_only=True)
    
    class Meta:
        model = MovimentacaoEstoque
        fields = '__all__'
        read_only_fields = ('data_movimentacao',)

    def create(self, validated_data):
        # Adicionar usuário atual
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['usuario'] = request.user
        
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para usuários (para dropdowns e informações básicas)
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email')
        read_only_fields = ('id',)