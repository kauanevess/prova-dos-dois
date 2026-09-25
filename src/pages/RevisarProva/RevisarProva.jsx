import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./RevisarProva.css";

function RevisarProva() {
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");

  const [questoes, setQuestoes] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [lacrando, setLacrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/", { replace: true });
      return;
    }

    const salvas = localStorage.getItem(
      `prova-${jogador}`
    );

    if (!salvas) {
      navigate("/", { replace: true });
      return;
    }

    try {
      setQuestoes(JSON.parse(salvas));
    } catch {
      navigate("/", { replace: true });
    }
  }, [jogador, partidaId, navigate]);

  if (!jogador || !partidaId) {
    return null;
  }

  const nome =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  const outro =
    jogador === "kaua" ? "Giovanna" : "Kauã";

  function nomeTipo(tipo) {
    if (tipo === "multipla") {
      return "múltipla escolha";
    }

    if (tipo === "vf") {
      return "verdadeiro ou falso";
    }

    if (tipo === "aberta") {
      return "resposta aberta";
    }

    return "";
  }

  function editarQuestao(indice) {
    navigate("/criar", {
      state: {
        indiceEditar: indice,
      },
    });
  }

  function voltarParaCriacao() {
    navigate("/criar", {
      state: {
        indiceEditar: 14,
      },
    });
  }

  async function lacrarProva() {
    if (lacrando) return;

    setLacrando(true);
    setErro("");

    try {
      if (questoes.length !== 15) {
        throw new Error(
          "a prova precisa ter 15 questões."
        );
      }

      const perguntasParaSalvar =
        questoes.map((questao, index) => ({
          partida_id: partidaId,
          autor: jogador,
          numero: index + 1,
          pergunta: questao.pergunta,
          tipo: questao.tipo,
          alternativas:
            questao.tipo === "multipla"
              ? questao.alternativas
              : null,
        }));

      const { error: erroPerguntas } =
        await supabase
          .from("perguntas")
          .upsert(perguntasParaSalvar, {
            onConflict:
              "partida_id,autor,numero",
          });

      if (erroPerguntas) {
        throw erroPerguntas;
      }

      const { error: erroJogador } =
        await supabase
          .from("jogadores")
          .update({
            prova_lacrada: true,
          })
          .eq("partida_id", partidaId)
          .eq("jogador", jogador);

      if (erroJogador) {
        throw erroJogador;
      }

      localStorage.setItem(
        `prova-${jogador}-lacrada`,
        "true"
      );

      setConfirmando(false);

      navigate("/aguardando");
    } catch (error) {
      console.error(error);

      setErro(
        "não consegui lacrar a prova. tenta novamente."
      );

      setConfirmando(false);
    } finally {
      setLacrando(false);
    }
  }

  return (
    <main className="revisar-prova">
      <section className="folha-revisao">
        <header className="revisao-topo">
          <div>
            <span className="revisao-etiqueta">
              prova de {nome}
            </span>

            <h1>
              última
              <br />
              conferida.
            </h1>

            <p>
              essas são as 15 perguntas que{" "}
              {outro} vai responder. confere tudo
              antes de entregar.
            </p>
          </div>

          <div className="revisao-status">
            <strong>{questoes.length}</strong>
            <span>/ 15</span>
          </div>
        </header>

        <div className="revisao-aviso">
          <span>!</span>

          <p>
            depois que a prova for lacrada, ela
            não poderá ser alterada.
          </p>
        </div>

        {erro && (
          <div className="mensagem-erro">
            <span>!</span>
            {erro}
          </div>
        )}

        <div className="lista-revisao">
          {questoes.map((questao, index) => (
            <article
              className="questao-revisao"
              key={index}
            >
              <div className="questao-numero">
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </div>

              <div className="questao-conteudo">
                <div className="questao-cabecalho">
                  <span className="questao-tipo">
                    {nomeTipo(questao.tipo)}
                  </span>

                  <button
                    type="button"
                    className="editar-questao"
                    onClick={() =>
                      editarQuestao(index)
                    }
                  >
                    editar
                  </button>
                </div>

                <h2>{questao.pergunta}</h2>

                {questao.tipo ===
                  "multipla" && (
                  <div className="revisao-alternativas">
                    {questao.alternativas.map(
                      (
                        alternativa,
                        alternativaIndex
                      ) => (
                        <div
                          className="revisao-alternativa"
                          key={alternativaIndex}
                        >
                          <span>
                            {String.fromCharCode(
                              65 +
                                alternativaIndex
                            )}
                          </span>

                          <p>{alternativa}</p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {questao.tipo === "vf" && (
                  <div className="revisao-vf">
                    <span>V</span>
                    <p>verdadeiro</p>

                    <span>F</span>
                    <p>falso</p>
                  </div>
                )}

                {questao.tipo ===
                  "aberta" && (
                  <div className="revisao-aberta">
                    <span>✎</span>

                    <p>
                      resposta livre — você
                      decidirá se vale o ponto
                      durante a correção.
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="revisao-final">
          <div className="revisao-prontas">
            <strong>
              {questoes.length} / 15
            </strong>

            <span>questões prontas</span>
          </div>

          <div className="revisao-botoes">
            <button
              type="button"
              className="revisao-voltar"
              onClick={voltarParaCriacao}
            >
              ← voltar
            </button>

            <button
              type="button"
              className="lacrar-prova"
              onClick={() =>
                setConfirmando(true)
              }
              disabled={lacrando}
            >
              lacrar prova →
            </button>
          </div>
        </div>
      </section>

      {confirmando && (
        <div className="modal-lacrar">
          <div
            className="modal-fundo"
            onClick={() => {
              if (!lacrando) {
                setConfirmando(false);
              }
            }}
          />

          <div className="modal-caixa">
            <span className="modal-mini">
              última chance
            </span>

            <h2>tem certeza?</h2>

            <p>
              depois de lacrar, suas perguntas
              ficam fechadas e você não poderá
              mais alterar a prova.
            </p>

            <div className="modal-acoes">
              <button
                type="button"
                className="modal-cancelar"
                onClick={() =>
                  setConfirmando(false)
                }
                disabled={lacrando}
              >
                deixa eu conferir
              </button>

              <button
                type="button"
                className="modal-confirmar"
                onClick={lacrarProva}
                disabled={lacrando}
              >
                {lacrando
                  ? "lacrando..."
                  : "sim, lacrar →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RevisarProva;