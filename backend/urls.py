from django.contrib import admin
from django.urls import path, re_path, include
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from main.views import IndexView
from django.conf import settings
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from main.controller import TipoPecaViewSet, PecaViewSet, ClienteViewSet, LocacaoViewSet, ItemLocacaoViewSet, MovimentacaoEstoqueViewSet

router = DefaultRouter()
router.register(r'tipos-peca', TipoPecaViewSet, basename='tipopeca')
router.register(r'pecas', PecaViewSet, basename='peca')
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'locacoes', LocacaoViewSet, basename='locacao')
router.register(r'itens-locacao', ItemLocacaoViewSet, basename='itemlocacao')
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet, basename='movimentacaoestoque')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('favicon.ico', serve, {'document_root': settings.REACT_APP_DIR, 'path': 'favicon.ico'}),
    path('robots.txt', serve, {'document_root': settings.REACT_APP_DIR, 'path': 'robots.txt'}),
    re_path(r'^.*$', IndexView.as_view(), name='index'),
]
