#!/usr/bin/env python
"""
Script para fazer build do React e configurar deploy
"""
import os
import subprocess
import sys
import shutil

def run_command(command, cwd=None):
    """Executar comando e retornar resultado"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, 
                              capture_output=True, text=True, check=True)
        print(f"✅ {command}")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao executar: {command}")
        print(f"Erro: {e.stderr}")
        return False

def build_react():
    """Fazer build do projeto React"""
    print("🔨 Fazendo build do projeto React...")
    
    react_dir = "deltad_loc"
    
    if not os.path.exists(react_dir):
        print(f"❌ Diretório {react_dir} não encontrado!")
        return False
    
    # Instalar dependências se necessário
    if not os.path.exists(os.path.join(react_dir, "node_modules")):
        print("📦 Instalando dependências do React...")
        if not run_command("npm install", cwd=react_dir):
            return False
    
    # Fazer build
    print("🏗️ Construindo aplicação React...")
    if not run_command("npm run build", cwd=react_dir):
        return False
    
    return True

def configure_django():
    """Configurar Django para servir o build do React"""
    print("⚙️ Configurando Django...")
    
    # Copiar arquivos estáticos se necessário
    build_dir = os.path.join("deltad_loc", "build")
    static_dir = "staticfiles"
    
    if os.path.exists(build_dir):
        print("📁 Build do React encontrado")
        
        # Criar diretório de arquivos estáticos se não existir
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)
        
        # Coletar arquivos estáticos do Django
        if not run_command("python manage.py collectstatic --noinput"):
            return False
    else:
        print("❌ Build do React não encontrado!")
        return False
    
    return True

def create_env_file():
    """Criar arquivo .env com configurações"""
    env_content = """# Configurações do ambiente
REACT_APP_API_URL=http://localhost:8000/api
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
"""
    
    with open('.env.example', 'w') as f:
        f.write(env_content)
    
    print("✅ Arquivo .env.example criado")

def main():
    """Executar processo de build completo"""
    print("🚀 Iniciando processo de build e deploy...")
    print("="*50)
    
    # Build do React
    if not build_react():
        print("❌ Falha no build do React")
        sys.exit(1)
    
    # Configurar Django
    if not configure_django():
        print("❌ Falha na configuração do Django")
        sys.exit(1)
    
    # Criar arquivo .env de exemplo
    create_env_file()
    
    print("\n" + "="*50)
    print("✅ Build concluído com sucesso!")
    print("="*50)
    print("🌐 Para iniciar o servidor completo:")
    print("   python manage.py runserver")
    print("")
    print("📱 A aplicação React será servida em:")
    print("   http://localhost:8000/")
    print("")
    print("🔧 Admin Django disponível em:")
    print("   http://localhost:8000/admin/")
    print("")
    print("📡 API disponível em:")
    print("   http://localhost:8000/api/")
    print("="*50)

if __name__ == '__main__':
    main()