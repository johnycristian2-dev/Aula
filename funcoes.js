function nomeCompleto(nome, sobrenome) {
  return `${String(nome).trim()} ${String(sobrenome).trim()}`.trim()
}

function calcularIdade(anoNascimento, dataReferencia = new Date()) {
  const ano = Number(anoNascimento)

  if (!Number.isInteger(ano) || ano <= 0) {
    throw new Error('Ano de nascimento inválido.')
  }

  const idade = dataReferencia.getFullYear() - ano
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
    throw new Error('Dia ou mês inválido.')
  }

  const diaAtual = dataReferencia.getDate()
  const mesAtual = dataReferencia.getMonth() + 1

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
    throw new Error('Dia ou mês inválido.')
  }

  const hoje = new Date(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
  )

  let proximoAniversario = new Date(hoje.getFullYear(), mesNasc - 1, diaNasc)

  if (proximoAniversario < hoje) {
    proximoAniversario = new Date(hoje.getFullYear() + 1, mesNasc - 1, diaNasc)
  }

  const umDiaEmMs = 1000 * 60 * 60 * 24
  return Math.round((proximoAniversario - hoje) / umDiaEmMs)
}

function mensagem(nome, anoNascimento, dataReferencia = new Date()) {
  const idade = calcularIdade(anoNascimento, dataReferencia)
  return `Olá ${String(nome).trim()}, você tem ${idade} anos.`
}

function anosParaCem(nome, anoNascimento, dataReferencia = new Date()) {
  const idade = calcularIdade(anoNascimento, dataReferencia)
  const restante = 100 - idade
  const nomePessoa = String(nome).trim()

  if (restante <= 0) {
    return `${nomePessoa}, você já completou 100 anos.`
  }

  return `${nomePessoa}, faltam ${restante} anos para completar 100 anos.`
}
