let conhecimentoETPC = [];

// Lista de palavras irrelevantes para ignorar na pesquisa
const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'em', 'para', 'que', 'qual', 'quais', 'onde', 'como', 'existe', 'ha', 'tem'];

// Palavras-chave associadas a assuntos exteriores à escola
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

  // Processar resposta localmente sem qualquer API
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

// Função para remover acentos e converter para minúsculas
function normalizarTexto(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '');
}

// 2. Lógica de Pesquisa no JSON
function processarPergunta(perguntaUtilizador) {
  const perguntaLimpa = normalizarTexto(perguntaUtilizador);
  const palavras = perguntaLimpa.split(' ').filter(p => p.length > 1 && !stopWords.includes(p));

  // Regra 1: Verificar se a pergunta é sobre assuntos exteriores
  const ehForaDeAmbito = palavras.some(palavra => temasForaAmbito.includes(palavra));
  if (ehForaDeAmbito) {
    return "Apenas posso responder a questões relacionadas com a ETPC e o seu site oficial.";
  }

  let melhorCorrespondencia = null;
  let pontuacaoMaxima = 0;

  // Regra 2: Pontuar cada item da base de dados com base nas palavras coincidentes
  conhecimentoETPC.forEach(item => {
    let pontuacao = 0;
    const textoItem = normalizarTexto(`${item.titulo} ${item.conteudo} ${(item.palavras_chave || []).join(' ')}`);

    palavras.forEach(palavra => {
      if (textoItem.includes(palavra)) {
        pontuacao += 1;
        // Bónus se a palavra estiver explicitamente nas palavras-chave do item
        if ((item.palavras_chave || []).map(normalizarTexto).includes(palavra)) {
          pontuacao += 2;
        }
      }
    });

    if (pontuacao > pontuacaoMaxima) {
      pontuacaoMaxima = pontuacao;
      melhorCorrespondencia = item;
    }
  });

  // Regra 3: Se houver correspondência com pontuação mínima
  if (melhorCorrespondencia && pontuacaoMaxima > 0) {
    return `${melhorCorrespondencia.conteudo}\n\nFonte: ${melhorCorrespondencia.url}`;
  }

  // Regra 4: Se não encontrar informação suficiente no JSON
  return "Não disponho de informação suficiente no site da ETPC para responder a essa questão.";
}