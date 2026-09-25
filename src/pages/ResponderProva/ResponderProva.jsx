import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./ResponderProva.css";

function ResponderProva() {
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");

  const outroJogador =
    jogador === "kaua" ? "giovanna" : "kaua";

  const nome =
    jogador === "kaua" ? "Kauã" : "Giovanna";

  const nomeOutro =
    outroJogador === "kaua" ? "Kauã" : "Giovanna";

  const [indice, setIndice] = useState(0);
  const [erro, setErro] = useState("");
  const [iniciou, setIniciou] = useState(false);

  const [questoes, setQuestoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [entregando, setEntregando] = useState(false);

  const [respostas, setRespostas] = useState(() => {
    if (!jogador) {
      return Array(15).fill(null);
    }

    const salvas = localStorage.getItem(
      `respostas-${jogador}`
    );

    if (salvas) {
      try {
        const respostasSalvas = JSON.parse(salvas);

        if (
          Array.isArray(respostasSalvas) &&
          respostasSalvas.length === 15
        ) {
          return respostasSalvas;
        }
      } catch {
        // usa respostas vazias
      }
    }

    return Array(15).fill(null);
  });

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/", {
        replace: true,
      });

      return;
    }

    async function buscarProva() {
      setCarregando(true);
      setErro("");

      const { data, error } = await supabase
        .from("perguntas")
        .select(
          "id, numero, pergunta, tipo, alternativas"
        )
        .eq("partida_id", partidaId)
        .eq("autor", outroJogador)
        .order("numero", {
          ascending: true,
        });

      if (error) {
        console.error(error);

        setErro(
          "não consegui carregar a prova."
        );

        setCarregando(false);
        return;
      }

      setQuestoes(data || []);
      setCarregando(false);
    }

    buscarProva();
  }, [
    jogador,
    partidaId,
    outroJogador,
    navigate,
  ]);

  useEffect(() => {
    if (jogador) {
      localStorage.setItem(
        `respostas-${jogador}`,
        JSON.stringify(respostas)
      );
    }
  }, [respostas, jogador]);

  if (!jogador || !partidaId) {
    return null;
  }

  if (carregando) {
    return (
      <main className="responder-prova">
        <section className="folha-responder sem-prova">
          <span className="etiqueta">
            carregando
          </span>

          <h1>
            preparando
            <br />
            sua prova.
          </h1>

          <p>
            buscando as perguntas de{" "}
            <strong>{nomeOutro}</strong>...
          </p>
        </section>
      </main>
    );
  }

  if (questoes.length !== 15) {
    return (
      <main className="responder-prova">
        <section className="folha-responder sem-prova">
          <span className="etiqueta">
            prova indisponível
          </span>

          <h1>
            ainda não
            <br />
            dá pra começar.
          </h1>

          <p>
            a prova de <strong>{nomeOutro}</strong>{" "}
            ainda não está completa.
          </p>

          {erro && (
            <div className="erro-responder">
              <strong>!</strong>
              {erro}
            </div>
          )}

          <button
            type="button"
            className="botao-principal"
            onClick={() =>
              navigate("/aguardando")
            }
          >
            voltar
          </button>
        </section>
      </main>
    );
  }

  const questao = questoes[indice];
  const respostaAtual = respostas[indice];

  function responder(valor) {
    setErro("");

    setRespostas((anteriores) =>
      anteriores.map((resposta, i) =>
        i === indice ? valor : resposta
      )
    );
  }

  function respostaValida() {
    if (questao.tipo === "multipla") {
      return typeof respostaAtual === "number";
    }

    if (questao.tipo === "vf") {
      return (
        respostaAtual === true ||
        respostaAtual === false
      );
    }

    if (questao.tipo === "aberta") {
      return (
        typeof respostaAtual === "string" &&
        respostaAtual.trim() !== ""
      );
    }

    return false;
  }

  function proximaQuestao() {
    if (!respostaValida()) {
      setErro(
        "responda a questão antes de continuar."
      );

      return;
    }

    setErro("");

    if (indice < 14) {
      setIndice((atual) => atual + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    entregarProva();
  }

  function questaoAnterior() {
    if (indice === 0) return;

    setErro("");
    setIndice((atual) => atual - 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function entregarProva() {
    if (entregando) return;

    const todasRespondidas = questoes.every(
      (_, i) => {
        const resposta = respostas[i];

        if (questoes[i].tipo === "multipla") {
          return typeof resposta === "number";
        }

        if (questoes[i].tipo === "vf") {
          return (
            resposta === true ||
            resposta === false
          );
        }

        if (questoes[i].tipo === "aberta") {
          return (
            typeof resposta === "string" &&
            resposta.trim() !== ""
          );
        }

        return false;
      }
    );

    if (!todasRespondidas) {
      setErro(
        "ainda existem questões sem resposta."
      );

      return;
    }

    const confirmar = window.confirm(
      "entregar a prova? depois disso suas respostas ficarão salvas para a correção."
    );

    if (!confirmar) return;

    setEntregando(true);
    setErro("");

    try {
      const respostasParaSalvar =
        respostas.map((resposta, index) => ({
          partida_id: partidaId,
          jogador,
          numero: index + 1,
          resposta,
        }));

      const { error: erroRespostas } =
        await supabase
          .from("respostas")
          .upsert(respostasParaSalvar, {
            onConflict:
              "partida_id,jogador,numero",
          });

      if (erroRespostas) {
        throw erroRespostas;
      }

      const { error: erroJogador } =
        await supabase
          .from("jogadores")
          .update({
            prova_respondida: true,
          })
          .eq("partida_id", partidaId)
          .eq("jogador", jogador);

      if (erroJogador) {
        throw erroJogador;
      }

      localStorage.setItem(
        `respostas-${jogador}`,
        JSON.stringify(respostas)
      );

      localStorage.setItem(
        `prova-respondida-${jogador}`,
        "true"
      );

      navigate("/aguardando");
    } catch (error) {
      console.error(error);

      setErro(
        "não consegui entregar a prova. tenta novamente."
      );
    } finally {
      setEntregando(false);
    }
  }

  function irParaQuestao(numero) {
    setErro("");
    setIndice(numero);
  }

  if (!iniciou) {
    return (
      <main className="responder-prova">
        <section className="folha-responder introducao-responder">
          <span className="etiqueta">
            chegou a sua vez
          </span>

          <h1>
            {nome},
            <br />
            sem colar.
          </h1>

          <p>
            <strong>{nomeOutro}</strong> preparou
            15 perguntas para você.
          </p>

          <div className="info-prova">
            <div>
              <strong>15</strong>
              <span>questões</span>
            </div>

            <div>
              <strong>01</strong>
              <span>chance</span>
            </div>

            <div>
              <strong>0</strong>
              <span>consultas</span>
            </div>
          </div>

          <div className="aviso-responder">
            <strong>importante</strong>

            <p>
              suas respostas serão guardadas
              exatamente como você deixar. a
              correção acontece depois.
            </p>
          </div>

          <button
            type="button"
            className="botao-principal"
            onClick={() => setIniciou(true)}
          >
            começar a prova →
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="responder-prova">
      <section className="folha-responder">
        <header className="cabecalho-responder">
          <div>
            <span className="etiqueta">
              prova de {nomeOutro}
            </span>

            <h2>
              questão{" "}
              {String(indice + 1).padStart(
                2,
                "0"
              )}
            </h2>
          </div>

          <span className="contador-responder">
            {String(indice + 1).padStart(
              2,
              "0"
            )}{" "}
            / 15
          </span>
        </header>

        <div className="barra-responder">
          <div
            className="barra-responder-preenchida"
            style={{
              width: `${
                ((indice + 1) / 15) * 100
              }%`,
            }}
          />
        </div>

        <div className="atalhos-responder">
          {questoes.map((_, i) => {
            const atual = i === indice;

            const respondida =
              respostas[i] !== null &&
              respostas[i] !== "";

            let classe = "atalho-responder";

            if (atual) {
              classe += " atual";
            } else if (respondida) {
              classe += " respondida";
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

        <div className="questao-responder">
          <span className="numero-grande">
            {String(indice + 1).padStart(
              2,
              "0"
            )}
          </span>

          <p className="pergunta-responder">
            {questao.pergunta}
          </p>

          {questao.tipo === "multipla" && (
            <div className="alternativas-responder">
              {questao.alternativas.map(
                (alternativa, index) => (
                  <button
                    key={index}
                    type="button"
                    className={
                      respostaAtual === index
                        ? "alternativa-responder selecionada"
                        : "alternativa-responder"
                    }
                    onClick={() =>
                      responder(index)
                    }
                  >
                    <span>
                      {String.fromCharCode(
                        65 + index
                      )}
                    </span>

                    {alternativa}
                  </button>
                )
              )}
            </div>
          )}

          {questao.tipo === "vf" && (
            <div className="vf-responder">
              <button
                type="button"
                className={
                  respostaAtual === true
                    ? "opcao-vf selecionada"
                    : "opcao-vf"
                }
                onClick={() =>
                  responder(true)
                }
              >
                <strong>V</strong>
                verdadeiro
              </button>

              <button
                type="button"
                className={
                  respostaAtual === false
                    ? "opcao-vf selecionada"
                    : "opcao-vf"
                }
                onClick={() =>
                  responder(false)
                }
              >
                <strong>F</strong>
                falso
              </button>
            </div>
          )}

          {questao.tipo === "aberta" && (
            <div className="aberta-responder">
              <label>sua resposta</label>

              <textarea
                placeholder="escreva sua resposta..."
                value={respostaAtual ?? ""}
                onChange={(e) =>
                  responder(e.target.value)
                }
                maxLength={500}
              />

              <span>
                {(respostaAtual ?? "").length}
                /500
              </span>
            </div>
          )}
        </div>

        {erro && (
          <div className="erro-responder">
            <strong>!</strong>
            {erro}
          </div>
        )}

        <div className="navegacao-responder">
          <button
            type="button"
            className="botao-voltar-responder"
            onClick={questaoAnterior}
            disabled={indice === 0}
          >
            ← anterior
          </button>

          <button
            type="button"
            className="botao-principal"
            onClick={proximaQuestao}
            disabled={entregando}
          >
            {entregando
              ? "entregando..."
              : indice === 14
                ? "entregar prova →"
                : "próxima questão →"}
          </button>
        </div>

        <p className="salvamento-responder">
          respostas salvas automaticamente
        </p>
      </section>
    </main>
  );
}

export default ResponderProva;