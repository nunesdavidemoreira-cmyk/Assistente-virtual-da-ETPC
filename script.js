let conhecimentoETPC = [];

// Palavras a ignorar na pesquisa
const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'em', 'para', 'que', 'qual', 'quais', 'onde', 'como', 'existe', 'ha', 'tem', 'sobre', 'mais', 'queria', 'saber', 'ver', 'me', 'e'];
// Palavras-chave associadas a assuntos fora do âmbito da escola
const temasForaAmbito = ['futebol', 'politica', 'receita', 'jogo', 'tempo', 'meteo', 'filme', 'musica', 'presidente', 'carro'];

// 1. Carregar a Base de Dados JSON
fetch('conhecimento.json')
  .then(response => response.json())
  .then(data => { conhecimentoETPC = data; })
  .catch(err => console.error('Erro ao carregar a base de dados:', err));

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = userInput.value.trim();
  if (!question) return;

  appendMessage(question, 'user');
  userInput.value = '';

  const responseText = processarPergunta(question);
  appendMessage(responseText, 'bot');
});

function appendMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = sender === 'user' 
    ? 'bg-blue-900 text-white p-3 rounded-2xl rounded-tr-none ml-auto text-right shadow-sm max-w-[85%]'
    : 'bg-white text-gray-800 p-3 rounded-2xl rounded-tl-none mr-auto text-left border border-gray-200 shadow-sm max-w-[85%]';
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgDiv;
}

function normalizarTexto(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '');
}

function processarPergunta(perguntaUtilizador) {
  const perguntaLimpa = normalizarTexto(perguntaUtilizador);
  // Aceita palavras com 2 ou mais letras para capturar siglas como PAP
  const palavras = perguntaLimpa.split(' ').filter(p => p.length >= 2 && !stopWords.includes(p));

  // 1. Verificar se é assunto fora de âmbito
  const ehForaDeAmbito = palavras.some(palavra => temasForaAmbito.includes(palavra));
  if (ehForaDeAmbito) {
    return "Apenas posso responder a questões relacionadas com a ETPC e o seu site oficial.";
  }

  // 2. Se a pergunta for geral sobre "cursos"
  if (palavras.includes('curso') || palavras.includes('cursos') || palavras.includes('oferta')) {
    const cursos = conhecimentoETPC.filter(item => item.id.startsWith('curso'));
    if (cursos.length > 0) {
      let respostaCursos = "A ETPC oferece os seguintes Cursos Profissionais de Nível 4:\n\n";
      cursos.forEach(c => {
        respostaCursos += `• ${c.titulo}: ${c.conteudo}\n\n`;
      });
      return respostaCursos.trim();
    }
  }

  // 3. Pesquisa avançada por relevância de palavras-chave
  let melhorCorrespondencia = null;
  let pontuacaoMaxima = 0;

  conhecimentoETPC.forEach(item => {
    let pontuacao = 0;
    const palavrasChaveItem = (item.palavras_chave || []).map(normalizarTexto);
    const tituloItem = normalizarTexto(item.titulo);
    const conteudoItem = normalizarTexto(item.conteudo);

    palavras.forEach(palavra => {
      if (palavrasChaveItem.includes(palavra)) {
        pontuacao += 10; // Prioridade máxima quando coincide com a sigla/palavra-chave exata
      }
      if (tituloItem.includes(palavra)) {
        pontuacao += 4;
      }
      if (conteudoItem.includes(palavra)) {
        pontuacao += 1;
      }
    });

    if (pontuacao > pontuacaoMaxima) {
      pontuacaoMaxima = pontuacao;
      melhorCorrespondencia = item;
    }
  });

  // 4. Retornar resposta encontrada
  if (melhorCorrespondencia && pontuacaoMaxima > 0) {
    return melhorCorrespondencia.conteudo;
  }

  return "Não disponho de informação suficiente no site da ETPC para responder a essa questão.";
}
