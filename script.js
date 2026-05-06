// ============================================================
// LIONS TRANSPORTES — script.js  (versão premium)
// Fórmula: Total = Preço Base + (Passageiros - 1) × R$ 40
// ============================================================

// ---- TABELA DE PREÇOS ----------------------------------------
// Para alterar um preço: mude o número depois dos dois-pontos.
// Para adicionar uma cidade:
//   1. Adicione uma linha aqui (ex: "Nova Cidade": 200,)
//   2. Adicione também no <select> do index.html
// --------------------------------------------------------------
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

// Taxa por passageiro adicional (a partir do 2º)
const TAXA_EXTRA = 40;

// ---- HELPER: formata número como moeda brasileira ------------
// Exemplo: 260 → "R$ 260,00"
function brl(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// ---- CONTADOR DE PASSAGEIROS --------------------------------
// Chamado pelos botões + e − no HTML
function alterarPessoas(delta) {
  const input = document.getElementById("pessoas");
  let val = parseInt(input.value) || 1;
  val = Math.max(1, Math.min(20, val + delta));  // limita entre 1 e 20
  input.value = val;

  // Pequena animação no número ao mudar
  input.style.transform = "scale(1.15)";
  setTimeout(() => { input.style.transform = "scale(1)"; }, 150);
}

// ---- FUNÇÃO PRINCIPAL: CALCULAR -----------------------------
function calcular() {
  const selectDestino = document.getElementById("destino");
  const inputPessoas  = document.getElementById("pessoas");
  const divResultado  = document.getElementById("resultado");
  const divErro       = document.getElementById("erro");

  // Lê os valores do formulário
  const destinoKey = selectDestino.value;
  const pessoas    = parseInt(inputPessoas.value) || 1;

  // Reseta estado anterior
  divResultado.style.display = "none";
  divErro.style.display      = "none";

  // Validação: destino é obrigatório
  if (!destinoKey) {
    divErro.style.display = "block";
    // Remove e readiciona a classe para re-disparar a animação
    divErro.style.animation = "none";
    void divErro.offsetHeight;
    divErro.style.animation = "";
    return;
  }

  // Busca o preço base na tabela
  const base = PRECOS[destinoKey];

  if (base === undefined) {
    divErro.textContent = "⚠ Destino não encontrado na tabela de preços.";
    divErro.style.display = "block";
    return;
  }

  // Aplica a fórmula:
  //   extra = (pessoas - 1) × 40
  //   total = base + extra
  const extra = (pessoas - 1) * TAXA_EXTRA;
  const total = base + extra;

  // Preenche os campos do resultado
  document.getElementById("rBase").textContent  = brl(base);
  document.getElementById("rExtra").textContent =
    pessoas > 1
      ? `${pessoas - 1} × ${brl(TAXA_EXTRA)} = ${brl(extra)}`
      : "—";
  document.getElementById("rTotal").textContent = brl(total);

  // Mostra o resultado com animação
  divResultado.style.display      = "flex";
  divResultado.style.animation    = "none";   // reseta para re-animar
  void divResultado.offsetHeight;             // força reflow
  divResultado.style.animation    = "";

  // Scroll suave para o resultado no mobile
  divResultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- TABELA EXPANSÍVEL --------------------------------------
function toggleTabela() {
  const inner  = document.getElementById("tabela-inner");
  const arrow  = document.getElementById("tab-arrow");
  const btn    = document.querySelector(".tabela-toggle-btn");
  const isOpen = inner.style.display === "block";

  // Alterna estado
  inner.style.display = isOpen ? "none" : "block";
  arrow.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
  btn.setAttribute("aria-expanded", String(!isOpen));
}

// ---- CONSTRÓI A TABELA AO CARREGAR A PÁGINA ----------------
// Lê de PRECOS (mesma fonte do cálculo) — nunca há inconsistência
document.addEventListener("DOMContentLoaded", function () {
  const tbody = document.getElementById("tabela-body");

  // Ordena os destinos em ordem alfabética
  const destinos = Object.keys(PRECOS).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  destinos.forEach(function (dest) {
    const base  = PRECOS[dest];
    const p2    = base + TAXA_EXTRA;            // 2 passageiros
    const p3    = base + TAXA_EXTRA * 2;        // 3 passageiros

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dest}</td>
      <td class="price-cell">${brl(base)}</td>
      <td>${brl(p2)}</td>
      <td>${brl(p3)}</td>
    `;
    tbody.appendChild(tr);
  });

  // ---- INTERSECTION OBSERVER — anima elementos ao rolar -----
  // Elementos com classe .reveal aparecem quando entram na tela
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);  // anima só uma vez
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
});
