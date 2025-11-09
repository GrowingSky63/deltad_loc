#!/usr/bin/env python
"""
Script para configurar e inicializar o sistema de controle de estoque
"""
import os
import sys
import django
from django.core.management import execute_from_command_line
from django.contrib.auth.models import User

# Configurar o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.models import TipoPeca, Peca, Cliente

def create_sample_data():
    """Criar dados de exemplo para testar o sistema"""
    
    print("Criando dados de exemplo...")
    
    # Criar tipos de peças
    tipos_peca = [
        {'nome': 'Andaime Fachadeiro', 'descricao': 'Andaime para fachadas de edifícios', 'valor_locacao': 25.00},
        {'nome': 'Escora Metálica', 'descricao': 'Escora telescópica para construção', 'valor_locacao': 15.00},
        {'nome': 'Prancha de Madeira', 'descricao': 'Prancha de madeira 3m para andaimes', 'valor_locacao': 8.00},
        {'nome': 'Sapata Base', 'descricao': 'Base para sustentação de andaimes', 'valor_locacao': 5.00},
        {'nome': 'Torre de Andaime', 'descricao': 'Torre móvel de andaime', 'valor_locacao': 35.00},
    ]
    
    for tipo_data in tipos_peca:
        tipo, created = TipoPeca.objects.get_or_create(
            nome=tipo_data['nome'],
            defaults=tipo_data
        )
        if created:
            print(f"✓ Tipo de peça criado: {tipo.nome}")
    
    # Criar peças
    pecas_data = [
        {'tipo': 'Andaime Fachadeiro', 'codigo': 'AF001', 'quantidade': 50},
        {'tipo': 'Andaime Fachadeiro', 'codigo': 'AF002', 'quantidade': 30},
        {'tipo': 'Escora Metálica', 'codigo': 'EM001', 'quantidade': 100},
        {'tipo': 'Escora Metálica', 'codigo': 'EM002', 'quantidade': 75},
        {'tipo': 'Prancha de Madeira', 'codigo': 'PM001', 'quantidade': 200},
        {'tipo': 'Prancha de Madeira', 'codigo': 'PM002', 'quantidade': 150},
        {'tipo': 'Sapata Base', 'codigo': 'SB001', 'quantidade': 80},
        {'tipo': 'Torre de Andaime', 'codigo': 'TA001', 'quantidade': 20},
    ]
    
    for peca_data in pecas_data:
        tipo_peca = TipoPeca.objects.get(nome=peca_data['tipo'])
        peca, created = Peca.objects.get_or_create(
            codigo=peca_data['codigo'],
            defaults={
                'tipo_peca': tipo_peca,
                'quantidade_total': peca_data['quantidade'],
                'quantidade_disponivel': peca_data['quantidade'],
                'quantidade_locada': 0,
            }
        )
        if created:
            print(f"✓ Peça criada: {peca.codigo}")
    
    # Criar clientes de exemplo
    clientes_data = [
        {
            'nome': 'João Silva Construções',
            'tipo_pessoa': 'F',
            'cpf_cnpj': '12345678901',
            'email': 'joao@email.com',
            'telefone': '(11) 98765-4321',
            'endereco': 'Rua das Flores, 123',
            'cidade': 'São Paulo',
            'estado': 'SP',
            'cep': '01234-567',
        },
        {
            'nome': 'Construtora ABC Ltda',
            'tipo_pessoa': 'J',
            'cpf_cnpj': '12345678000123',
            'email': 'contato@abc.com.br',
            'telefone': '(11) 3456-7890',
            'endereco': 'Av. Paulista, 1000',
            'cidade': 'São Paulo',
            'estado': 'SP',
            'cep': '01310-100',
        },
    ]
    
    for cliente_data in clientes_data:
        cliente, created = Cliente.objects.get_or_create(
            cpf_cnpj=cliente_data['cpf_cnpj'],
            defaults=cliente_data
        )
        if created:
            print(f"✓ Cliente criado: {cliente.nome}")
    
    print("✅ Dados de exemplo criados com sucesso!")

def create_superuser():
    """Criar superusuário se não existir"""
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@localhost', 'admin123')
        print("✅ Superusuário criado - Login: admin | Senha: admin123")
    else:
        print("ℹ️ Superusuário já existe")

def main():
    """Executar configuração principal"""
    print("🚀 Configurando sistema de controle de estoque...")
    
    # Executar migrações
    print("\n📦 Executando migrações...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Criar superusuário
    print("\n👤 Configurando usuário administrador...")
    create_superuser()
    
    # Criar dados de exemplo
    print("\n📋 Criando dados de exemplo...")
    create_sample_data()
    
    print("\n" + "="*50)
    print("✅ Sistema configurado com sucesso!")
    print("="*50)
    print("🌐 Para iniciar o servidor Django:")
    print("   python manage.py runserver")
    print("")
    print("🔧 Para acessar o admin:")
    print("   http://localhost:8000/admin/")
    print("   Login: admin | Senha: admin123")
    print("")
    print("🚀 Para iniciar o frontend React:")
    print("   cd deltad_loc")
    print("   npm start")
    print("")
    print("📱 API endpoints disponíveis em:")
    print("   http://localhost:8000/api/")
    print("="*50)

if __name__ == '__main__':
    main()