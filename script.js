// Variáveis
const GITHUB_USERNAME = 'johnycristian2-dev'
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`
const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=stars&order=desc&per_page=6`

function nomeCompleto(nome, sobrenome) {
  return `${String(nome).trim()} ${String(sobrenome).trim()}`.trim()
}

function calcularIdade(anoNascimento, dataReferencia = new Date()) {
  const ano = Number(anoNascimento)
  if (!Number.isInteger(ano) || ano <= 0) {
    throw new Error('Informe um ano de nascimento válido.')
  }

  const anoAtual = dataReferencia.getFullYear()
  const idade = anoAtual - ano

  return idade >= 0 ? idade : 0
}

function jaFezAniversario(dia, mes, dataReferencia = new Date()) {
  const diaNasc = Number(dia)
  const mesNasc = Number(mes)

  if (
    !Number.isInteger(diaNasc) ||
    !Number.isInteger(mesNasc) ||
    diaNasc < 1 ||
    diaNasc > 31 ||
    mesNasc < 1 ||
    mesNasc > 12
  ) {
    throw new Error('Informe dia e mês válidos para o aniversário.')
  }

  const mesAtual = dataReferencia.getMonth() + 1
  const diaAtual = dataReferencia.getDate()

  return mesAtual > mesNasc || (mesAtual === mesNasc && diaAtual >= diaNasc)
}

function diasParaAniversario(dia, mes, dataReferencia = new Date()) {
  const diaNasc = Number(dia)
  const mesNasc = Number(mes)

  if (
    !Number.isInteger(diaNasc) ||
    !Number.isInteger(mesNasc) ||
    diaNasc < 1 ||
    diaNasc > 31 ||
    mesNasc < 1 ||
    mesNasc > 12
  ) {
    throw new Error('Informe dia e mês válidos para o aniversário.')
  }

  const anoAtual = dataReferencia.getFullYear()
  let proximoAniversario = new Date(anoAtual, mesNasc - 1, diaNasc)

  if (proximoAniversario < dataReferencia) {
    proximoAniversario = new Date(anoAtual + 1, mesNasc - 1, diaNasc)
  }

  const umDiaEmMs = 1000 * 60 * 60 * 24
  const hojeSemHora = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
  )
  const aniversarioSemHora = new Date(
    proximoAniversario.getFullYear(),
    proximoAniversario.getMonth(),
    proximoAniversario.getDate(),
  )

  return Math.round((aniversarioSemHora - hojeSemHora) / umDiaEmMs)
}

function mensagem(nome, anoNascimento, dataReferencia = new Date()) {
  const idade = calcularIdade(anoNascimento, dataReferencia)
  return `Olá ${String(nome).trim()}, você tem ${idade} anos.`
}

function anosParaCem(nome, anoNascimento, dataReferencia = new Date()) {
  const idade = calcularIdade(anoNascimento, dataReferencia)
  const anosRestantes = 100 - idade
  const nomeLimpo = String(nome).trim()

  if (anosRestantes <= 0) {
    return `${nomeLimpo}, você já completou 100 anos.`
  }

  return `${nomeLimpo}, faltam ${anosRestantes} anos para você completar 100 anos.`
}

window.nomeCompleto = nomeCompleto
window.calcularIdade = calcularIdade
window.jaFezAniversario = jaFezAniversario
window.diasParaAniversario = diasParaAniversario
window.mensagem = mensagem
window.anosParaCem = anosParaCem

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

function marcarNavAtivo() {
  const pagina = window.location.pathname.split('/').pop() || 'index.html'
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.classList.remove('active')
    const href = link.getAttribute('href')
    if (href === pagina || (pagina === '' && href === 'index.html')) {
      link.classList.add('active')
    }
  })
}

// Função para carregar dados do perfil do GitHub
async function carregarPerfil() {
  const avatar = document.getElementById('avatar')
  if (!avatar) {
    return
  }

  try {
    const response = await fetch(GITHUB_API_URL)
    const data = await response.json()

    if (response.ok) {
      // Populando os dados do perfil
      avatar.src = data.avatar_url
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
  const container = document.getElementById('repositorios')
  if (!container) {
    return
  }

  try {
    const response = await fetch(GITHUB_REPOS_URL)
    const repositorios = await response.json()

    if (response.ok) {
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
  marcarNavAtivo()

  // Carregar dados do GitHub apenas nas páginas que precisam
  if (document.getElementById('avatar')) {
    carregarPerfil()
    setTimeout(animarNumeros, 500)
  }
  if (document.getElementById('repositorios')) {
    carregarRepositorios()
  }

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
