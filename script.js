// Variáveis
const GITHUB_USERNAME = 'johnycristian2-dev'
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`
const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=stars&order=desc&per_page=6`
const FEATURED_API_URL = 'https://backend-node-nmze.onrender.com/featured'
const REGISTER_API_URL = 'https://backend-node-nmze.onrender.com/register'
const FEATURED_CACHE_KEY = 'featured_products_cache_v1'
const FEATURED_CACHE_TTL_MS = 2 * 60 * 1000
const FEATURED_MAX_RETRIES = 5
const FEATURED_FALLBACK_IMAGE = 'images/profile.jpg'

const problematicProducts = [
  {
    id: '111111',
    name: 'Notebook Pro 15',
    price: 3599,
    image: 'images/profile.jpg',
    description: 'Notebook para estudo e produtividade.',
  },
  {
    id: '222222',
    title: 'Mouse Gamer RGB',
    price: 'R$ 199,90',
    image: 'images/profile.jpg',
    description: 'Modelo com sensor de alta precisao.',
  },
  {
    id: '333333',
    name: 'Teclado Mecanico',
    price: 'abc',
    image: '',
  },
  {
    id: null,
    name: 'Monitor 27',
    price: 1499.5,
    photo: 'images/profile.jpg',
  },
  {
    id: '555555',
    name: '',
    value: 89,
    image: 'images/profile.jpg',
  },
  {
    id: '666666',
    name: 'Headset USB',
    value: 249.9,
    thumbnail: 'images/profile.jpg',
    desc: 'Audio estereo com microfone integrado.',
  },
  'item-invalido',
  {
    id: '777777',
    name: 'Webcam Full HD',
    price: 329,
    image: 'images/profile.jpg',
  },
]

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parsePreco(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : NaN
  }

  if (typeof valor === 'string') {
    const numerico = valor.replace(/[^\d,.-]/g, '').replace(',', '.')
    const convertido = Number(numerico)
    return Number.isFinite(convertido) ? convertido : NaN
  }

  return NaN
}

function obterPrimeiroTexto(produto, chaves) {
  for (const chave of chaves) {
    const valor = produto[chave]
    if (typeof valor === 'string' && valor.trim()) {
      return valor.trim()
    }
  }
  return ''
}

function normalizarProduto(produto, index) {
  if (!produto || typeof produto !== 'object' || Array.isArray(produto)) {
    return null
  }

  const nome = obterPrimeiroTexto(produto, ['name', 'title', 'produto'])
  const preco = parsePreco(produto.price ?? produto.preco ?? produto.value)

  if (!nome || !Number.isFinite(preco) || preco < 0) {
    return null
  }

  const idBruto = produto.id ?? produto._id ?? produto.sku ?? `item-${index}`
  const id = String(idBruto)

  const imagem =
    obterPrimeiroTexto(produto, ['image', 'thumbnail', 'photo']) ||
    FEATURED_FALLBACK_IMAGE

  const descricao =
    obterPrimeiroTexto(produto, ['description', 'desc']) ||
    'Produto disponivel na vitrine de destaque.'

  return {
    id,
    name: nome,
    price: preco,
    image: imagem,
    description: descricao,
  }
}

function normalizarListaProdutos(lista) {
  if (!Array.isArray(lista)) {
    return []
  }

  return lista
    .map((produto, index) => normalizarProduto(produto, index))
    .filter(Boolean)
}

function extrairListaApi(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.value)) {
      return payload.value
    }

    if (Array.isArray(payload.data)) {
      return payload.data
    }

    if (Array.isArray(payload.products)) {
      return payload.products
    }

    if (Array.isArray(payload.featured)) {
      return payload.featured
    }
  }

  return []
}

function lerCacheDestaque() {
  try {
    const bruto = localStorage.getItem(FEATURED_CACHE_KEY)
    if (!bruto) {
      return []
    }

    const cache = JSON.parse(bruto)
    const agora = Date.now()

    if (!cache || cache.expiresAt <= agora || !Array.isArray(cache.items)) {
      localStorage.removeItem(FEATURED_CACHE_KEY)
      return []
    }

    return normalizarListaProdutos(cache.items)
  } catch (error) {
    console.warn('Falha ao ler cache de produtos em destaque:', error)
    return []
  }
}

function salvarCacheDestaque(items) {
  try {
    const payload = {
      items,
      savedAt: Date.now(),
      expiresAt: Date.now() + FEATURED_CACHE_TTL_MS,
    }
    localStorage.setItem(FEATURED_CACHE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('Falha ao salvar cache de produtos em destaque:', error)
  }
}

function formatarPrecoBRL(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor)
}

async function buscarProdutosDestaqueComRetry(maxTentativas, onTentativa) {
  let ultimoErro = new Error('Nao foi possivel carregar os produtos.')

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa += 1) {
    try {
      if (typeof onTentativa === 'function') {
        onTentativa(tentativa, maxTentativas)
      }

      const response = await fetch(FEATURED_API_URL)

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`)
      }

      const payload = await response.json()
      const lista = extrairListaApi(payload)
      const normalizados = normalizarListaProdutos(lista)

      if (normalizados.length === 0) {
        throw new Error('API retornou lista vazia ou invalida.')
      }

      return normalizados
    } catch (error) {
      ultimoErro = error
      if (tentativa < maxTentativas) {
        await esperar(350 * tentativa)
      }
    }
  }

  throw ultimoErro
}

function inicializarSecaoDestaque() {
  const grid = document.getElementById('featuredGrid')
  const status = document.getElementById('featuredStatus')
  const contador = document.getElementById('featuredCount')
  const filtroNome = document.getElementById('featuredNameFilter')
  const filtroPreco = document.getElementById('featuredPriceFilter')

  if (!grid || !status || !contador || !filtroNome || !filtroPreco) {
    return
  }

  const state = {
    baseItems: [],
    filteredItems: [],
    source: 'mock',
  }

  function atualizarStatus(mensagem, tipo = 'info') {
    status.className = `featured-status is-${tipo}`
    status.textContent = mensagem
  }

  function faixaPrecoValida(preco, faixa) {
    if (faixa === 'all') {
      return true
    }

    if (faixa === '0-199') {
      return preco <= 199
    }

    if (faixa === '200-799') {
      return preco >= 200 && preco <= 799
    }

    if (faixa === '800+') {
      return preco >= 800
    }

    return true
  }

  function renderizarProdutos() {
    contador.textContent = `${state.filteredItems.length} produto(s) exibido(s) • Fonte: ${state.source.toUpperCase()}`

    if (state.filteredItems.length === 0) {
      grid.innerHTML = `
        <article class="featured-empty">
          <h3>Nenhum produto encontrado</h3>
          <p>Ajuste os filtros para visualizar outros itens.</p>
        </article>
      `
      return
    }

    const html = state.filteredItems
      .map(
        (item) => `
          <article class="featured-card">
            <img
              class="featured-card-image"
              src="${item.image}"
              alt="${item.name}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${FEATURED_FALLBACK_IMAGE}'"
            />
            <div class="featured-card-content">
              <h3>${item.name}</h3>
              <p class="featured-card-description">${item.description}</p>
              <p class="featured-card-price">${formatarPrecoBRL(item.price)}</p>
            </div>
          </article>
        `,
      )
      .join('')

    grid.innerHTML = html
  }

  function aplicarFiltros() {
    const termo = filtroNome.value.trim().toLowerCase()
    const faixa = filtroPreco.value

    state.filteredItems = state.baseItems.filter((item) => {
      const bateNome = !termo || item.name.toLowerCase().includes(termo)
      const batePreco = faixaPrecoValida(item.price, faixa)
      return bateNome && batePreco
    })

    renderizarProdutos()
  }

  function usarMockComAviso(mensagem) {
    state.baseItems = normalizarListaProdutos(problematicProducts)
    state.source = 'mock'
    aplicarFiltros()
    atualizarStatus(mensagem, 'warning')
  }

  async function carregarProdutos() {
    grid.innerHTML =
      '<p class="featured-loading">Carregando produtos em destaque...</p>'
    atualizarStatus('Inicializando busca de dados...', 'info')

    const cache = lerCacheDestaque()
    if (cache.length > 0) {
      state.baseItems = cache
      state.source = 'localstorage'
      aplicarFiltros()
      atualizarStatus(
        'Dados carregados do LocalStorage (cache valido por 2 minutos).',
        'success',
      )
      return
    }

    try {
      const produtosApi = await buscarProdutosDestaqueComRetry(
        FEATURED_MAX_RETRIES,
        (tentativa, total) => {
          atualizarStatus(`Buscando API (${tentativa}/${total})...`, 'info')
        },
      )

      state.baseItems = produtosApi
      state.source = 'api'
      salvarCacheDestaque(produtosApi)
      aplicarFiltros()
      atualizarStatus('Produtos carregados com sucesso pela API.', 'success')
    } catch (error) {
      console.error('Falha ao carregar API de produtos em destaque:', error)
      usarMockComAviso(
        `Nao foi possivel usar a API apos 5 tentativas (${error.message}). Exibindo dados do MOCK tratado.`,
      )
    }
  }

  filtroNome.addEventListener('input', aplicarFiltros)
  filtroPreco.addEventListener('change', aplicarFiltros)

  carregarProdutos()
}

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

function formatarTelefone(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11)

  if (digitos.length <= 2) {
    return digitos
  }

  if (digitos.length <= 7) {
    return `${digitos.slice(0, 2)} ${digitos.slice(2)}`
  }

  return `${digitos.slice(0, 2)} ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

function formatarCep(valor) {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 8)

  if (digitos.length <= 5) {
    return digitos
  }

  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validarDadosCadastro(dados) {
  const erros = {}
  const nomePalavras = dados.nome.split(/\s+/).filter(Boolean)

  if (nomePalavras.length < 2) {
    erros.nome = 'Informe nome e sobrenome.'
  }

  if (!/^\d{2}\s\d{5}-\d{4}$/.test(dados.telefone)) {
    erros.telefone = 'Use o formato 00 00000-0000.'
  }

  if (!/^\d{5}-\d{3}$/.test(dados.cep)) {
    erros.cep = 'Use o formato 00000-000.'
  }

  if (!validarEmail(dados.email)) {
    erros.email = 'Informe um email valido.'
  }

  if (dados.senha.length < 6) {
    erros.senha = 'A senha deve ter pelo menos 6 caracteres.'
  }

  if (dados.confirmarSenha.length < 6) {
    erros.confirmarSenha = 'Confirme a senha com pelo menos 6 caracteres.'
  } else if (dados.senha !== dados.confirmarSenha) {
    erros.confirmarSenha = 'As senhas precisam ser iguais.'
  }

  return erros
}

function preencherErroCampo(campo, mensagem) {
  const grupo = campo.closest('.form-group')
  const erro = document.getElementById(`${campo.id}Erro`)

  if (grupo) {
    grupo.classList.toggle('is-invalid', Boolean(mensagem))
  }

  if (erro) {
    erro.textContent = mensagem || ''
  }
}

function mostrarFeedbackFormulario(mensagem, tipo) {
  const feedback = document.getElementById('formFeedback')

  if (!feedback) {
    return
  }

  feedback.className = `form-feedback is-visible is-${tipo}`
  feedback.textContent = mensagem
}

function limparFeedbackFormulario() {
  const feedback = document.getElementById('formFeedback')

  if (!feedback) {
    return
  }

  feedback.className = 'form-feedback'
  feedback.textContent = ''
}

function renderizarResultadoCadastro(html) {
  const container = document.getElementById('resultadoConteudo')

  if (container) {
    container.innerHTML = html
  }
}

function inicializarFormularioCadastro() {
  const form = document.getElementById('cadastroForm')

  if (!form) {
    return
  }

  const telefone = document.getElementById('telefone')
  const cep = document.getElementById('cep')

  if (telefone) {
    telefone.addEventListener('input', () => {
      telefone.value = formatarTelefone(telefone.value)
      preencherErroCampo(telefone, '')
    })
  }

  if (cep) {
    cep.addEventListener('input', () => {
      cep.value = formatarCep(cep.value)
      preencherErroCampo(cep, '')
    })
  }

  for (const campo of form.querySelectorAll('input')) {
    campo.addEventListener('input', () => {
      if (campo.id !== 'telefone' && campo.id !== 'cep') {
        preencherErroCampo(campo, '')
      }
      limparFeedbackFormulario()
    })
  }

  form.addEventListener('submit', handleCadastroSubmit)
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  inicializarTema()
  marcarNavAtivo()
  inicializarSecaoDestaque()
  inicializarFormularioCadastro()

  // Carregar dados do GitHub apenas nas páginas que precisam
  if (document.getElementById('avatar')) {
    carregarPerfil()
    setTimeout(animarNumeros, 500)
  }
  if (document.getElementById('repositorios')) {
    carregarRepositorios()
  }

  const botaoTema = document.getElementById('themeToggle')
  if (botaoTema) {
    botaoTema.addEventListener('click', alternarTema)
  }
})

// Função para lidar com o envio do formulário de cadastro
async function handleCadastroSubmit(event) {
  event.preventDefault()

  const form = event.currentTarget
  const btn = form.querySelector('.btn-enviar')
  const btnText = btn.textContent
  const dados = {
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    cep: document.getElementById('cep').value.trim(),
    email: document.getElementById('email').value.trim(),
    senha: document.getElementById('senha').value,
    confirmarSenha: document.getElementById('confirmarSenha').value,
  }

  limparFeedbackFormulario()

  const erros = validarDadosCadastro(dados)
  for (const campo of form.querySelectorAll('input')) {
    const chave =
      campo.id === 'confirmarSenha' ? 'confirmarSenha' : campo.name || campo.id
    preencherErroCampo(campo, erros[chave] || '')
  }

  if (Object.keys(erros).length > 0) {
    mostrarFeedbackFormulario(
      'Corrija os campos destacados antes de enviar o cadastro.',
      'error',
    )
    renderizarResultadoCadastro(
      '<strong>Formulario com erros.</strong><br />Revise os campos marcados e tente novamente.',
    )
    return
  }

  try {
    btn.disabled = true
    btn.textContent = 'Enviando cadastro...'

    const response = await fetch(REGISTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: dados.nome,
        phone: dados.telefone,
        cep: dados.cep,
        email: dados.email,
        password: dados.senha,
        confirmPassword: dados.confirmarSenha,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        payload.message || 'Nao foi possivel concluir o cadastro agora.',
      )
    }

    const brinde = payload.gift || 'brinde surpresa'
    renderizarResultadoCadastro(
      `<strong>Parabens ${dados.nome}</strong>, voce realizou seu cadastro com o email <strong>${dados.email}</strong>, entraremos em contato atraves do seu telefone <strong>${dados.telefone}</strong>, voce ganhou este premio <strong>${brinde}</strong>.`,
    )
    mostrarFeedbackFormulario('Cadastro enviado com sucesso.', 'success')
    form.reset()
  } catch (error) {
    renderizarResultadoCadastro(
      `<strong>Falha no cadastro.</strong><br />${error.message || 'Tente novamente mais tarde.'}`,
    )
    mostrarFeedbackFormulario(
      error.message || 'Nao foi possivel enviar o cadastro.',
      'error',
    )
  } finally {
    btn.textContent = btnText
    btn.disabled = false
  }
}

// Recarregar dados a cada 5 minutos (opcional)
setInterval(
  () => {
    carregarPerfil()
    carregarRepositorios()
  },
  5 * 60 * 1000,
)
