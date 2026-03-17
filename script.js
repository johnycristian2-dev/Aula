// Variáveis
const GITHUB_USERNAME = 'johnycristian2-dev'
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`
const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=stars&order=desc&per_page=6`

function aplicarTema(tema) {
  const botaoTema = document.getElementById('themeToggle')
  const modoEscuro = tema === 'dark'

  document.body.classList.toggle('dark-mode', modoEscuro)

  if (botaoTema) {
    botaoTema.textContent = modoEscuro ? 'Modo claro' : 'Modo escuro'
  }
}

function inicializarTema() {
  const temaSalvo = localStorage.getItem('theme')
  const prefereEscuro =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  const temaInicial = temaSalvo || (prefereEscuro ? 'dark' : 'light')

  aplicarTema(temaInicial)
}

function alternarTema() {
  const modoEscuroAtivo = document.body.classList.contains('dark-mode')
  const novoTema = modoEscuroAtivo ? 'light' : 'dark'

  localStorage.setItem('theme', novoTema)
  aplicarTema(novoTema)
}

// Função para carregar dados do perfil do GitHub
async function carregarPerfil() {
  try {
    const response = await fetch(GITHUB_API_URL)
    const data = await response.json()

    if (response.ok) {
      // Populando os dados do perfil
      document.getElementById('avatar').src = data.avatar_url
      document.getElementById('github-name').textContent =
        data.name || data.login
      document.getElementById('github-bio').textContent =
        data.bio || 'Desenvolvedor apaixonado por código!'
      document.getElementById('repos').textContent = data.public_repos
      document.getElementById('followers').textContent = data.followers
      document.getElementById('following').textContent = data.following
    } else {
      console.error('Erro ao carregar perfil:', data.message)
    }
  } catch (error) {
    console.error('Erro na requisição do perfil:', error)
  }
}

// Função para carregar repositórios
async function carregarRepositorios() {
  try {
    const response = await fetch(GITHUB_REPOS_URL)
    const repositorios = await response.json()

    if (response.ok) {
      const container = document.getElementById('repositorios')
      container.innerHTML = '' // Limpar conteúdo anterior

      if (repositorios.length === 0) {
        container.innerHTML =
          '<p class="loading">Nenhum repositório público encontrado</p>'
        return
      }

      repositorios.forEach((repo) => {
        const repoCard = criarCartaoRepositorio(repo)
        container.appendChild(repoCard)
      })
    } else {
      console.error('Erro ao carregar repositórios:', repositorios.message)
    }
  } catch (error) {
    console.error('Erro na requisição de repositórios:', error)
  }
}

// Função para criar cartão de repositório
function criarCartaoRepositorio(repo) {
  const card = document.createElement('div')
  card.className = 'repo-card'

  const descricao = repo.description || 'Sem descrição'
  const linguagem = repo.language || 'N/A'
  const stars = repo.stargazers_count

  card.innerHTML = `
        <h3>📦 ${repo.name}</h3>
        <p>${descricao}</p>
        <div class="repo-footer">
            <span class="repo-language">
                ${linguagem !== 'N/A' ? `<span>${linguagem}</span>` : '<span>Misc</span>'}
            </span>
            <span class="repo-stars">⭐ ${stars}</span>
            <a href="${repo.html_url}" target="_blank" class="repo-link">Ver Projeto →</a>
        </div>
    `

  return card
}

// Função para animar os números
function animarNumeros() {
  const elementos = document.querySelectorAll('.stat-value')

  elementos.forEach((elemento) => {
    const valorFinal = parseInt(elemento.textContent)
    let valorAtual = 0
    const incremento = Math.ceil(valorFinal / 30)

    const intervalo = setInterval(() => {
      valorAtual += incremento
      if (valorAtual >= valorFinal) {
        elemento.textContent = valorFinal
        clearInterval(intervalo)
      } else {
        elemento.textContent = valorAtual
      }
    }, 30)
  })
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  inicializarTema()
  carregarPerfil()
  carregarRepositorios()

  // Animar números após carregar dados
  setTimeout(animarNumeros, 500)

  // Configurar formulário de contato
  const form = document.getElementById('contatoForm')
  if (form) {
    form.addEventListener('submit', handleFormSubmit)
  }

  const botaoTema = document.getElementById('themeToggle')
  if (botaoTema) {
    botaoTema.addEventListener('click', alternarTema)
  }
})

// Função para lidar com o envio do formulário
function handleFormSubmit(event) {
  event.preventDefault()

  const nome = document.getElementById('nome').value
  const email = document.getElementById('email').value
  const mensagem = document.getElementById('mensagem').value

  if (!nome || !email || !mensagem) {
    alert('Por favor, preencha todos os campos!')
    return
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert('Por favor, insira um email válido!')
    return
  }

  // Simular envio (em produção, isso seria enviado para um servidor)
  console.log('Formulário enviado:', { nome, email, mensagem })

  // Mostrar mensagem de sucesso
  const btn = event.target.querySelector('.btn-enviar')
  const btnText = btn.textContent
  btn.textContent = '✓ Mensagem enviada com sucesso!'
  btn.style.backgroundColor = '#28a745'

  // Resetar formulário
  event.target.reset()

  // Voltar ao estado anterior após 3 segundos
  setTimeout(() => {
    btn.textContent = btnText
    btn.style.backgroundColor = ''
  }, 3000)
}

// Recarregar dados a cada 5 minutos (opcional)
setInterval(
  () => {
    carregarPerfil()
    carregarRepositorios()
  },
  5 * 60 * 1000,
)
