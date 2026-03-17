# 🌐 Site Estático - Johny Cristian Bolis

Site estático moderno e responsivo com integração da API do GitHub para exibir seu perfil, estatísticas e repositórios em tempo real!

## 📋 Características

✅ **Design Moderno** - Interface limpa e profissional com gradientes  
✅ **Responsivo** - Funciona perfeitamente em mobile, tablet e desktop  
✅ **Integração GitHub** - Exibe seu perfil, bio e repositórios automaticamente  
✅ **Animações Suaves** - Transições elegantes e números animados  
✅ **Performance** - Carregamento rápido com otimizações  
✅ **Sem Dependências** - Apenas HTML, CSS e JavaScript puro!

## 📁 Estrutura dos Arquivos

```
Static Site/
├── index.html      # Estrutura HTML principal
├── style.css       # Estilos CSS responsivos
├── script.js       # Lógica JavaScript com integração GitHub
└── README.md       # Este arquivo
```

## 🚀 Como Usar

1. **Abrir o Site**
   - Simplesmente abra o arquivo `index.html` no seu navegador
   - Ou use um servidor local (recomendado)

2. **Com Live Server (VS Code)**
   - Instale a extensão "Live Server"
   - Clique com botão direito em `index.html` → "Open with Live Server"

3. **Com Python**

   ```bash
   # Python 3
   python -m http.server 8000
   # Acesse: http://localhost:8000
   ```

4. **Com Node.js**
   ```bash
   # Se tiver http-server instalado
   http-server
   # Acesse: http://localhost:8080
   ```

## 🎨 Personalização

### Mudar Cores

Abra `style.css` e edite as cores no `:root`:

```css
:root {
  --primary-color: #0066cc; /* Cor principal */
  --secondary-color: #00d4ff; /* Cor secundária */
  --dark-bg: #0a0e27; /* Fundo escuro */
}
```

### Mudar Usuário do GitHub

Abra `script.js` e altere a variável:

```javascript
const GITHUB_USERNAME = 'seu-usuario-aqui'
```

### Adicionar Links de Contato

Edite a seção `footer` em `index.html`:

```html
<a href="mailto:seu-email@exemplo.com" class="footer-link">Email</a>
```

## 📊 O Que o Site Exibe

- ✨ Seu nome e idade
- 🖼️ Foto de perfil do GitHub
- 📝 Bio do GitHub
- 📊 Estatísticas (repositórios, seguidores, seguindo)
- 📦 Seus 6 últimos repositórios com:
  - Nome do projeto
  - Descrição
  - Linguagem de programação
  - Número de estrelas
  - Link direto para o repositório

## 🔄 Atualização Automática

O site busca dados do GitHub automaticamente a cada 5 minutos, mantendo as informações sempre atualizadas!

## 📱 Seções do Site

1. **Navbar** - Navegação sticky com links para seções
2. **Hero Section** - Apresentação com seu nome e idade
3. **Perfil GitHub** - Card com foto, bio e estatísticas
4. **Projetos** - Grid com seus repositórios
5. **Footer** - Links de contato e créditos

## 🌐 Deploy

Você pode fazer deploy em qualquer plataforma:

- **Netlify** - Arrasta e solta os arquivos
- **Vercel** - Conecta seu GitHub ou faz upload
- **GitHub Pages** - Faz push para um repositório
- **Heroku** - Com um simples `Procfile`
- **Firebase Hosting** - Console Firebase

## 📄 Licença

Este projeto é livre para uso pessoal.

## 👤 Autor

**Johny Cristian Bolis** - 20 Anos  
[GitHub](https://github.com/johnycristian2-dev)

---

**Desenvolvido com ❤️**
