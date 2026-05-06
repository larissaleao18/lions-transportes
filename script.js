// ============================================================
// LIONS TRANSPORTES — script.js v3
// - Preço por destino (fixo, não muda com número de passageiros)
// - Múltiplos destinos quando passageiros têm destinos diferentes
// - 5+ passageiros → aviso + redirect WhatsApp
// ============================================================

// ---- TABELA DE PREÇOS ----------------------------------------
// O preço é FIXO por destino — não muda com número de passageiros.
// Para alterar: mude o número depois dos dois-pontos.
const PRECOS = {
  "Extrema":               60,
  "Extrema Rural":         75,
  "Vargem":                80,
  "Itapeva":               80,
  "Itapeva Rural":        110,
  "Toledo":               110,
  "Joanópolis":           130,
  "Munhoz":               150,
  "Bragança":             150,
  "Piracaia":             160,
  "Pinhalzinho":          170,
  "Atibaia":              180,
  "Camanducaia":          130,
  "Cambuí":               150,
  "Cambuí Córrego":       170,
  "Aeroporto Campinas":   550,
  "Aeroporto Guarulhos":  460,
  "Aeroporto Congonhas":  560,
};

// WhatsApp da empresa (somente números, com DDI)
const WHATSAPP = "5511986347192";

// Estado da aplicação
let mesmoDestino = true;   // todos vão para o mesmo lugar?
let numPessoas   = 1;

// ---- HELPERS ----
function brl(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// Monta o HTML de um <select> de destino
function selectDestinoHTML(id, label) {
  const opts = Object.keys(PRECOS)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map(d => `<option value="${d}">${d}</option>`)
    .join("");

  return `
    <div class="destino-field">
      <span class="destino-label">${label}</span>
      <div class="select-wrap">
        <select id="${id}" class="select">
          <option value="">— Selecione o destino —</option>
          ${opts}
        </select>
        <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  `;
}

// Renderiza os campos de destino conforme o estado atual
function renderizarDestinos() {
  const container = document.getElementById("destinos-container");

  if (numPessoas === 0) {
    container.innerHTML = "";
    return;
  }

  if (mesmoDestino || numPessoas === 1) {
    // Um só campo de destino
    container.innerHTML = selectDestinoHTML("destino-0", "Destino");
  } else {
    // Um campo por passageiro
    let html = "";
    for (let i = 0; i < numPessoas; i++) {
      html += selectDestinoHTML(`destino-${i}`, `Destino do Passageiro ${i + 1}`);
    }
    container.innerHTML = html;
  }
}

// ---- ALTERAR NÚMERO DE PASSAGEIROS ----
function alterarPessoas(delta) {
  const input = document.getElementById("pessoas");
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(20, val + delta));
  input.value = val;
  numPessoas = val;

  // Animação no número
  input.style.transform = "scale(1.15)";
  setTimeout(() => { input.style.transform = "scale(1)"; }, 150);

  // Atualiza hint
  const hint = document.getElementById("counter-hint");
  hint.textContent = val === 1 ? "1 passageiro" : `${val} passageiros`;

  // Mostra/esconde pergunta "mesmo destino?"
  const fieldMesmo = document.getElementById("field-mesmo-destino");
  fieldMesmo.style.display = val > 1 ? "flex" : "none";

  // Se voltou para 1, reseta para mesmo destino
  if (val === 1) {
    mesmoDestino = true;
    setToggleAtivo(true);
  }

  // Esconde resultado/aviso ao mudar passageiros
  esconderResultados();

  // Se 5+, mostra aviso imediatamente
  if (val >= 5) {
    mostrarAvisoGrupo();
    document.getElementById("destinos-container").innerHTML = "";
    return;
  }

  renderizarDestinos();
}

// ---- TOGGLE MESMO DESTINO ----
function setMesmoDestino(valor) {
  mesmoDestino = valor;
  setToggleAtivo(valor);
  esconderResultados();
  renderizarDestinos();
}

function setToggleAtivo(sim) {
  document.getElementById("btn-sim").classList.toggle("active", sim);
  document.getElementById("btn-nao").classList.toggle("active", !sim);
}

// ---- ESCONDER RESULTADOS ----
function esconderResultados() {
  document.getElementById("resultado").style.display   = "none";
  document.getElementById("aviso-grupo").style.display = "none";
  document.getElementById("erro").style.display        = "none";
}

// ---- MOSTRAR AVISO GRUPO ----
function mostrarAvisoGrupo() {
  esconderResultados();
  const aviso = document.getElementById("aviso-grupo");
  aviso.style.display = "flex";
  aviso.style.animation = "none";
  void aviso.offsetHeight;
  aviso.style.animation = "";
  aviso.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- CALCULAR ----
function calcular() {
  esconderResultados();

  // Bloqueia se 5+ passageiros
  if (numPessoas >= 5) {
    mostrarAvisoGrupo();
    return;
  }

  const erroEl = document.getElementById("erro");

  // Coleta os destinos selecionados
  let destinos = [];

  if (mesmoDestino || numPessoas === 1) {
    const sel = document.getElementById("destino-0");
    if (!sel || !sel.value) {
      mostrarErro("Por favor, selecione o destino antes de calcular.");
      return;
    }
    // Mesmo destino para todos
    for (let i = 0; i < numPessoas; i++) {
      destinos.push(sel.value);
    }
  } else {
    // Destinos individuais
    for (let i = 0; i < numPessoas; i++) {
      const sel = document.getElementById(`destino-${i}`);
      if (!sel || !sel.value) {
        mostrarErro(`Por favor, selecione o destino do Passageiro ${i + 1}.`);
        return;
      }
      destinos.push(sel.value);
    }
  }

  // Calcula total:
  // - Se mesmo destino → preço único (não multiplica por passageiros)
  // - Se destinos diferentes → soma os preços de cada destino
  let total = 0;

  if (mesmoDestino || numPessoas === 1) {
    total = PRECOS[destinos[0]];
  } else {
    // Soma todos os destinos (corridas separadas)
    destinos.forEach(d => { total += PRECOS[d]; });
  }

  // Monta a lista de destinos no resultado
  const listaEl = document.getElementById("res-destinos-lista");

  if (mesmoDestino || numPessoas === 1) {
    const label = numPessoas === 1
      ? "1 passageiro"
      : `${numPessoas} passageiros`;
    listaEl.innerHTML = `
      <div class="res-destino-item">
        <span class="res-destino-passageiro">${label}</span>
        <span class="res-destino-nome">${destinos[0]}</span>
      </div>
    `;
  } else {
    listaEl.innerHTML = destinos.map((d, i) => `
      <div class="res-destino-item">
        <span class="res-destino-passageiro">Passageiro ${i + 1}</span>
        <span class="res-destino-nome">${d}</span>
      </div>
    `).join("");
  }

  // Exibe o total
  document.getElementById("rTotal").textContent = brl(total);

  // Mostra resultado
  const resEl = document.getElementById("resultado");
  resEl.style.display = "flex";
  resEl.style.animation = "none";
  void resEl.offsetHeight;
  resEl.style.animation = "";
  resEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- ERRO ----
function mostrarErro(msg) {
  const erroEl = document.getElementById("erro");
  erroEl.textContent = "⚠ " + msg;
  erroEl.style.display = "block";
  erroEl.style.animation = "none";
  void erroEl.offsetHeight;
  erroEl.style.animation = "";
}

// ---- WHATSAPP (do resultado) ----
function abrirWhatsApp() {
  // Coleta os dados para a mensagem
  const pessoas = numPessoas;
  const totalEl = document.getElementById("rTotal").textContent;

  // Monta lista de destinos para a mensagem
  let destinosMsg = "";
  if (mesmoDestino || pessoas === 1) {
    const sel = document.getElementById("destino-0");
    destinosMsg = sel ? sel.value : "—";
  } else {
    const lista = [];
    for (let i = 0; i < pessoas; i++) {
      const sel = document.getElementById(`destino-${i}`);
      if (sel) lista.push(`Passageiro ${i+1}: ${sel.value}`);
    }
    destinosMsg = lista.join(", ");
  }

  const msg = `Olá! Gostaria de solicitar uma corrida.\n\n` +
    `📍 Origem: Extrema, MG\n` +
    `🎯 Destino(s): ${destinosMsg}\n` +
    `👥 Passageiros: ${pessoas}\n` +
    `💰 Valor estimado: ${totalEl}\n\n` +
    `Podem confirmar disponibilidade?`;

  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ---- WHATSAPP (grupo grande) ----
function abrirWhatsAppGrupo() {
  const msg = `Olá! Preciso de transporte para ${numPessoas} passageiros saindo de Extrema, MG. Podem me passar uma proposta?`;
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ---- INICIALIZAÇÃO ----
document.addEventListener("DOMContentLoaded", function () {
  numPessoas = 1;
  mesmoDestino = true;
  renderizarDestinos();
});
