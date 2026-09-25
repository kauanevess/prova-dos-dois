import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QuestaoForm from "../../components/QuestaoForm";
import "./CriarProva.css";

const criarQuestaoVazia = () => ({
  pergunta: "",
  tipo: "",
  alternativas: ["", "", "", ""],
});

function CriarProva() {
  const location = useLocation();
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");
  const indiceEditar = location.state?.indiceEditar;

  const [iniciou, setIniciou] = useState(
    indiceEditar !== undefined
  );

  const [indice, setIndice] = useState(
    indiceEditar ?? 0
  );

  const [erro, setErro] = useState("");

  const [questoes, setQuestoes] = useState(() => {
    if (!jogador) {
      return Array.from(
        { length: 15 },
        criarQuestaoVazia
      );
    }

    const salvas = localStorage.getItem(
      `prova-${jogador}`
    );

    if (salvas) {
      try {
        return JSON.parse(salvas);
      } catch {
        return Array.from(
          { length: 15 },
          criarQuestaoVazia
        );
      }
    }

    return Array.from(
      { length: 15 },
      criarQuestaoVazia
    );
  });

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/");
    }
  }, [jogador, partidaId, navigate]);

  useEffect(() => {
    if (jogador) {
      localStorage.setItem(
        `prova-${jogador}`,
        JSON.stringify(questoes)
      );
    }
  }, [questoes, jogador]);

  if (!jogador || !partidaId) {
    return null;
  }

  const nome =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  const outro =
    jogador === "kaua" ? "Giovanna" : "Kauã";

  function atualizarQuestao(novaQuestao) {
    setErro("");

    setQuestoes((questoesAnteriores) =>
      questoesAnteriores.map((questao, i) =>
        i === indice ? novaQuestao : questao
      )
    );
  }

  function validarQuestao() {
    const q = questoes[indice];

    if (!q.pergunta.trim()) {
      return "escreva a pergunta antes de continuar.";
    }

    if (!q.tipo) {
      return "escolha o tipo da questão.";
    }

    if (q.tipo === "multipla") {
      if (!Array.isArray(q.alternativas)) {
        return "adicione as alternativas da questão.";
      }

      const temAlternativaVazia =
        q.alternativas.some(
          (alternativa) => !alternativa.trim()
        );

      if (temAlternativaVazia) {
        return "preencha todas as alternativas.";
      }

      if (q.alternativas.length < 2) {
        return "adicione pelo menos duas alternativas.";
      }
    }

    return null;
  }

  function proximaQuestao() {
    const mensagemErro = validarQuestao();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    setErro("");

    if (indice < 14) {
      setIndice((indiceAtual) =>
        indiceAtual + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    navigate("/revisar");
  }

  function questaoAnterior() {
    if (indice === 0) return;

    setErro("");

    setIndice((indiceAtual) =>
      indiceAtual - 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function irParaQuestao(numeroQuestao) {
    setErro("");
    setIndice(numeroQuestao);
  }

  if (!iniciou) {
    return (
      <main className="criar-prova">
        <section className="folha-criar introducao">
          <span className="etiqueta">
            antes de começar
          </span>

          <h1>
            {nome},
            <br />
            sua vez.
          </h1>

          <p>
            você vai preparar a prova que{" "}
            <strong>{outro}</strong> terá que
            responder.
          </p>

          <div className="regras">
            <div>
              <strong>15</strong>
              <span>perguntas</span>
            </div>

            <div>
              <strong>03</strong>
              <span>tipos de questão</span>
            </div>

            <div>
              <strong>0</strong>
              <span>ajudinhas</span>
            </div>
          </div>

          <div className="tipos-introducao">
            <p>
              você pode criar questões de:
            </p>

            <span>múltipla escolha</span>
            <span>verdadeiro ou falso</span>
            <span>resposta aberta</span>
          </div>

          <p className="aviso">
            {outro} não vai ver nenhuma pergunta
            enquanto você estiver montando a prova.
          </p>

          <button
            type="button"
            className="botao-principal"
            onClick={() => setIniciou(true)}
          >
            começar a montar →
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="criar-prova">
      <section className="folha-criar">
        <header className="cabecalho-questao">
          <div>
            <span className="etiqueta">
              prova para {outro}
            </span>

            <h2>
              questão{" "}
              {String(indice + 1).padStart(
                2,
                "0"
              )}
            </h2>
          </div>

          <span className="contador">
            {String(indice + 1).padStart(
              2,
              "0"
            )}{" "}
            / 15
          </span>
        </header>

        <div className="barra">
          <div
            className="barra-preenchida"
            style={{
              width: `${
                ((indice + 1) / 15) * 100
              }%`,
            }}
          />
        </div>

        <div className="atalhos-questoes">
          {questoes.map((questao, i) => {
            const atual = i === indice;

            const preenchida =
              questao.pergunta.trim() !== "" &&
              questao.tipo !== "";

            let classe = "atalho-questao";

            if (atual) {
              classe += " atual";
            } else if (preenchida) {
              classe += " preenchida";
            }

            return (
              <button
                key={i}
                type="button"
                className={classe}
                onClick={() =>
                  irParaQuestao(i)
                }
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <QuestaoForm
          questao={questoes[indice]}
          onChange={atualizarQuestao}
        />

        {erro && (
          <div className="mensagem-erro">
            <span>!</span>
            {erro}
          </div>
        )}

        <div className="navegacao">
          <button
            type="button"
            className="botao-voltar"
            onClick={questaoAnterior}
            disabled={indice === 0}
          >
            ← anterior
          </button>

          <button
            type="button"
            className="botao-principal"
            onClick={proximaQuestao}
          >
            {indice === 14
              ? "revisar prova →"
              : "próxima questão →"}
          </button>
        </div>

        <p className="salvamento">
          rascunho salvo automaticamente
        </p>
      </section>
    </main>
  );
}

export default CriarProva;