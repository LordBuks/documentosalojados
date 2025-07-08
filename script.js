import { db } from "./firebase-init.js";
import { doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initAuth, requireAuth, createLogoutButton, showUserInfo, onAuthChange } from "./auth.js";

// Inicializar autenticação e área do usuário
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  requireAuth();
  

});

// Categorias disponíveis
const categorias = ['Sub-14', 'Sub-15', 'Sub-16', 'Sub-17', 'Sub-20'];

// Autorizações disponíveis com ícones e cores
const autorizacoes = [
  {
    sigla: 'Hospedagem',
    titulo: 'Hospedagem',
    descricao: 'Autorização para hospedagem no alojamento',
    icone: 'fas fa-home',
    classe: 'hospedagem'
  },
  {
    sigla: 'Matricula',
    titulo: 'Matrícula',
    descricao: 'Autorização para matrícula escolar',
    icone: 'fas fa-graduation-cap',
    classe: 'matricula'
  },
  {
    sigla: 'Saidas',
    titulo: 'Saídas',
    descricao: 'Autorização para saídas do alojamento',
    icone: 'fas fa-door-open',
    classe: 'saidas'
  },
  {
    sigla: 'Imagem',
    titulo: 'Imagem',
    descricao: 'Termo de consentimento para uso de imagens',
    icone: 'fas fa-camera',
    classe: 'imagem'
  },
  {
    sigla: 'Regras',
    titulo: 'Regras',
    descricao: 'Termo de ciência das normas internas',
    icone: 'fas fa-clipboard-list',
    classe: 'regras'
  }
];

let quartoAtual = null;
let atletas = {};

// Função para criar/carregar um quarto
async function criarQuarto() {
  const numeroQuarto = document.getElementById("numeroQuarto").value;
  
  if (!numeroQuarto) {
    alert("Por favor, insira o número do quarto.");
    return;
  }

  quartoAtual = numeroQuarto;
  
  // Carregar dados existentes ou criar novo quarto do Firestore
  const quartoRef = doc(db, "quartos", quartoAtual);
  const docSnap = await getDoc(quartoRef);

  if (docSnap.exists()) {
    atletas[quartoAtual] = docSnap.data().atletas;
  } else {
    atletas[quartoAtual] = [];
    // Criar 3 atletas vazios para o quarto
    for (let i = 1; i <= 3; i++) {
      atletas[quartoAtual].push({
        id: `${quartoAtual}_${i}`,
        nome: "",
        categoria: "",
        quarto: quartoAtual,
        posicao: i,
        autorizacoes: {}
      });
    }
    await salvarDados(); // Salvar o novo quarto no Firestore
  }

  renderizarAtletas();
}

// Função para renderizar os atletas na tela
function renderizarAtletas() {
  const container = document.getElementById('atletasContainer');
  container.innerHTML = '';

  if (!quartoAtual || !atletas[quartoAtual]) {
    return;
  }

  atletas[quartoAtual].forEach((atleta, index) => {
    const atletaCard = criarCardAtleta(atleta, index);
    container.appendChild(atletaCard);
  });
}

// Função para criar o card de um atleta
function criarCardAtleta(atleta, index) {
  const card = document.createElement('div');
  card.className = 'atleta-card';
  
  card.innerHTML = `
    <div class="atleta-header">
      <i class="fas fa-user-circle" style="margin-right: 10px;"></i>
      Atleta ${atleta.posicao} - Quarto ${atleta.quarto}
    </div>
    
    <div class="atleta-content">
      <div class="form-row">
        <label>Nome do Atleta:</label>
        <input type="text" id="nome_${atleta.id}" value="${atleta.nome}" 
               onchange="atualizarAtleta('${atleta.id}', 'nome', this.value)" 
               placeholder="Digite o nome do atleta">
      </div>
      
      <div class="form-row">
        <label>Categoria:</label>
        <select id="categoria_${atleta.id}" 
                onchange="atualizarAtleta('${atleta.id}', 'categoria', this.value)">
          <option value="">Selecione a categoria</option>
          ${categorias.map(cat => 
            `<option value="${cat}" ${atleta.categoria === cat ? 'selected' : ''}>${cat}</option>`
          ).join('')}
        </select>
      </div>
      
      <div style="margin-top: 25px;">
        <h4 style="color: #dc3545; margin-bottom: 20px; text-align: center; font-size: 1.1rem;">
          <i class="fas fa-clipboard-check" style="margin-right: 8px;"></i>
          Autorizações Pendentes
        </h4>
        <div class="autorizacoes-grid">
          ${autorizacoes.map(auth => `
            <div class="autorizacao-card ${auth.classe} ${atleta.autorizacoes[auth.sigla] ? 'checked' : ''}" 
                 onclick="toggleAutorizacao('${atleta.id}', '${auth.sigla}')">
              <div class="autorizacao-icon">
                <i class="${auth.icone}"></i>
              </div>
              <div class="autorizacao-title">${auth.titulo}</div>
              <div class="autorizacao-description">${auth.descricao}</div>
              <div class="checkbox-container">
                <div class="custom-checkbox">
                  <input type="checkbox" id="${auth.sigla}_${atleta.id}" 
                         ${atleta.autorizacoes[auth.sigla] ? 'checked' : ''}
                         onchange="atualizarAutorizacao('${atleta.id}', '${auth.sigla}', this.checked)">
                </div>
                <label class="checkbox-label" for="${auth.sigla}_${atleta.id}">
                  ${atleta.autorizacoes[auth.sigla] ? 'Pendente' : 'Autorizado'}
                </label>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="individual-print-btn">
        <button onclick="imprimirAtleta('${atleta.id}')" class="btn btn-warning">
          <i class="fas fa-file-pdf"></i> Imprimir PDF Individual
        </button>
      </div>
    </div>
  `;
  
  return card;
}

// Função para alternar autorização ao clicar no card
function toggleAutorizacao(atletaId, autorizacao) {
  if (!quartoAtual || !atletas[quartoAtual]) return;
  
  const atleta = atletas[quartoAtual].find(a => a.id === atletaId);
  if (atleta) {
    const novoEstado = !atleta.autorizacoes[autorizacao];
    if (novoEstado) {
      atleta.autorizacoes[autorizacao] = true;
    } else {
      delete atleta.autorizacoes[autorizacao];
    }
    
    // Atualizar checkbox
    const checkbox = document.getElementById(`${autorizacao}_${atletaId}`);
    if (checkbox) {
      checkbox.checked = novoEstado;
    }
    
    // Atualizar visual do card
    const card = checkbox.closest('.autorizacao-card');
    if (card) {
      if (novoEstado) {
        card.classList.add('checked');
      } else {
        card.classList.remove('checked');
      }
      
      // Atualizar label
      const label = card.querySelector('.checkbox-label');
      if (label) {
        label.textContent = novoEstado ? 'Pendente' : 'Autorizado';
      }
    }
    
    salvarDados();
  }
}

// Função para atualizar dados do atleta
function atualizarAtleta(atletaId, campo, valor) {
  if (!quartoAtual || !atletas[quartoAtual]) return;
  
  const atleta = atletas[quartoAtual].find(a => a.id === atletaId);
  if (atleta) {
    atleta[campo] = valor;
    salvarDados();
  }
}

// Função para atualizar autorização via checkbox
function atualizarAutorizacao(atletaId, autorizacao, marcado) {
  if (!quartoAtual || !atletas[quartoAtual]) return;
  
  const atleta = atletas[quartoAtual].find(a => a.id === atletaId);
  if (atleta) {
    if (marcado) {
      atleta.autorizacoes[autorizacao] = true;
    } else {
      delete atleta.autorizacoes[autorizacao];
    }
    
    // Atualizar visual do card
    const checkbox = document.getElementById(`${autorizacao}_${atletaId}`);
    const card = checkbox.closest('.autorizacao-card');
    if (card) {
      if (marcado) {
        card.classList.add('checked');
      } else {
        card.classList.remove('checked');
      }
      
      // Atualizar label
      const label = card.querySelector('.checkbox-label');
      if (label) {
        label.textContent = marcado ? 'Pendente' : 'Autorizado';
      }
    }
    
    salvarDados();
  }
}

// Função para salvar dados no Firestore
async function salvarDados() {
  if (!quartoAtual) return;
  try {
    const quartoRef = doc(db, "quartos", quartoAtual);
    await setDoc(quartoRef, { atletas: atletas[quartoAtual] });
    console.log("Dados salvos com sucesso no Firestore!");
  } catch (e) {
    console.error("Erro ao salvar dados no Firestore:", e);
    alert("Erro ao salvar dados. Verifique a conexão com o Firebase.");
  }
}

// Função para salvar todos os atletas
async function salvarTodos() {
  if (!quartoAtual || !atletas[quartoAtual]) {
    alert("Nenhum quarto carregado para salvar.");
    return;
  }
  
  await salvarDados();
  alert("Dados salvos com sucesso!");
}

// Função para limpar tudo
async function limparTudo() {
  if (confirm("Tem certeza que deseja limpar todos os dados do quarto atual? Esta ação não pode ser desfeita.")) {
    if (quartoAtual) {
      try {
        await deleteDoc(doc(db, "quartos", quartoAtual));
        console.log("Dados do quarto atual removidos do Firestore!");
      } catch (e) {
        console.error("Erro ao remover dados do Firestore:", e);
        alert("Erro ao remover dados do Firestore.");
      }
    }
    atletas = {};
    quartoAtual = null;
    document.getElementById("numeroQuarto").value = "";
    document.getElementById("atletasContainer").innerHTML = "";
    alert("Todos os dados do quarto atual foram limpos!");
  }
}

// Função para imprimir atleta individual
function imprimirAtleta(atletaId) {
  if (!quartoAtual || !atletas[quartoAtual]) return;
  
  const atleta = atletas[quartoAtual].find(a => a.id === atletaId);
  if (!atleta || !atleta.nome) {
    alert('Por favor, preencha o nome do atleta antes de imprimir.');
    return;
  }
  
  gerarPDFAtleta(atleta);
}

// Função para imprimir todos os PDFs
function imprimirTodos() {
  if (!quartoAtual || !atletas[quartoAtual]) {
    alert('Nenhum quarto carregado para imprimir.');
    return;
  }
  
  const atletasComNome = atletas[quartoAtual].filter(a => a.nome.trim() !== '');
  
  if (atletasComNome.length === 0) {
    alert('Nenhum atleta com nome preenchido para imprimir.');
    return;
  }
  
  atletasComNome.forEach((atleta, index) => {
    setTimeout(() => {
      gerarPDFAtleta(atleta);
    }, index * 1000); // Delay de 1 segundo entre cada impressão
  });
}

// Função para gerar PDF do atleta
function gerarPDFAtleta(atleta) {
  const printArea = document.getElementById('printArea');
  
  const autorizacoesMarcadas = Object.keys(atleta.autorizacoes).filter(auth => atleta.autorizacoes[auth]);
  
  printArea.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://i.imgur.com/odzcc03.png" alt="Logo SC Internacional" style="height: 80px; margin-bottom: 15px;">
        <h1 style="color: #dc3545; margin: 0;">Sistema de Cadastro de Autorizações</h1>
        <h2 style="color: #666; margin: 5px 0;">Atletas Menores Alojados</h2>
      </div>
      
      <div style="border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #dc3545; margin-top: 0;">Dados do Atleta</h3>
        <p><strong>Nome:</strong> ${atleta.nome}</p>
        <p><strong>Categoria:</strong> ${atleta.categoria}</p>
        <p><strong>Quarto:</strong> ${atleta.quarto}</p>
        <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      </div>
      
      <div style="border: 2px solid #dc3545; border-radius: 8px; padding: 20px;">
        <h3 style="color: #dc3545; margin-top: 0;">Autorizações de Alojamento Pendentes</h3>
        ${autorizacoesMarcadas.length > 0 ? 
          autorizacoesMarcadas.map(sigla => {
            const auth = autorizacoes.find(a => a.sigla === sigla);
            return `
              <div style="margin-bottom: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #dc3545; border-radius: 4px;">
                <strong style="color: #dc3545;">${auth.titulo}:</strong> ${auth.descricao}
              </div>
            `;
          }).join('') : 
          '<p style="color: #666; font-style: italic;">O atleta possui todas autorizações.</p>'
        }
      </div>
      
      <div style="margin-top: 30px; text-align: center;">
        <img src="https://i.imgur.com/HIsH9X5.png" alt="Logo SC Internacional" style="height: 60px; margin-bottom: 10px;">
        <p style="font-size: 0.9rem; margin: 5px 0;"><strong>Gerenciamento de Autorizações das Categorias de Base</strong></p>
        <p style="font-size: 0.9rem; margin: 5px 0;">Departamento de Serviço Social</p>
      </div>
    </div>
  `;
  
  printArea.style.display = 'block';
  window.print();
  printArea.style.display = 'none';
}

// Tornar as funções globais para que sejam acessíveis pelo HTML
window.criarQuarto = criarQuarto;
window.salvarTodos = salvarTodos;
window.limparTudo = limparTudo;
window.imprimirTodos = imprimirTodos;
window.imprimirAtleta = imprimirAtleta;
window.toggleAutorizacao = toggleAutorizacao;
window.atualizarAtleta = atualizarAtleta;
window.atualizarAutorizacao = atualizarAutorizacao;

// Event listeners para os botões
document.addEventListener('DOMContentLoaded', async function() {
  // Inicializar autenticação
  await initAuth();
  
  // Verificar se o usuário está autenticado
  requireAuth();
  

  
  document.getElementById('btnCriarQuarto').addEventListener('click', criarQuarto);
  document.getElementById('btnSalvarTodos').addEventListener('click', salvarTodos);
  document.getElementById('btnLimparTudo').addEventListener('click', limparTudo);
  document.getElementById('btnImprimirTodos').addEventListener('click', imprimirTodos);
  
  // Permitir criar quarto ao pressionar Enter no campo de número
  document.getElementById('numeroQuarto').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      criarQuarto();
    }
  });
});



  // Adicionar elementos de usuário e logout ao cabeçalho
  onAuthChange(user => {
    const headerUserArea = document.getElementById('headerUserArea');
    if (headerUserArea) {
      headerUserArea.innerHTML = ''; // Limpar conteúdo existente
      if (user) {
        showUserInfo(headerUserArea);
        createLogoutButton(headerUserArea);
      }
    }
  });


