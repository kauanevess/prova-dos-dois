import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import "./Final.css";

const TOTAL_PECAS = 9;

function Final() {
  const navigate = useNavigate();

  const jogador = localStorage.getItem("jogador-atual");
  const partidaId = localStorage.getItem("partida-id");

  const [pecasColocadas, setPecasColocadas] = useState([]);
  const [pecaSelecionada, setPecaSelecionada] = useState(null);
  const [textoAberto, setTextoAberto] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const ehGiovanna = jogador === "giovanna";
  const terminou = pecasColocadas.length === TOTAL_PECAS;

  const ordemPecas = useMemo(
    () => [7, 2, 5, 9, 1, 6, 3, 8, 4],
    []
  );

  useEffect(() => {
    if (!jogador || !partidaId) {
      navigate("/", { replace: true });
      return;
    }

    let ativo = true;

    async function carregarFinal() {
      const { data, error } = await supabase
        .from("final_jogo")
        .select("pecas_colocadas, texto_aberto, concluido")
        .eq("partida_id", partidaId)
        .single();

      if (!ativo) return;

      if (error) {
        console.error(error);
        setErro("não consegui carregar essa última parte.");
        setCarregando(false);
        return;
      }

      setPecasColocadas(
        Array.isArray(data?.pecas_colocadas)
          ? data.pecas_colocadas
          : []
      );

      setTextoAberto(data?.texto_aberto === true);
      setCarregando(false);
    }

    carregarFinal();

    const canal = supabase
      .channel(`final-${partidaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "final_jogo",
          filter: `partida_id=eq.${partidaId}`,
        },
        (payload) => {
          const novo = payload.new;

          if (!novo) return;

          setPecasColocadas(
            Array.isArray(novo.pecas_colocadas)
              ? novo.pecas_colocadas
              : []
          );

          setTextoAberto(novo.texto_aberto === true);
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [jogador, partidaId, navigate]);

  async function encaixarPeca(posicao) {
    if (
      !ehGiovanna ||
      pecaSelecionada === null ||
      salvando ||
      terminou
    ) {
      return;
    }

    if (pecaSelecionada !== posicao) {
      return;
    }

    if (pecasColocadas.includes(posicao)) {
      setPecaSelecionada(null);
      return;
    }

    setSalvando(true);
    setErro("");

    const novasPecas = [...pecasColocadas, posicao].sort(
      (a, b) => a - b
    );

    const terminouAgora = novasPecas.length === TOTAL_PECAS;

    const { error } = await supabase
      .from("final_jogo")
      .update({
        pecas_colocadas: novasPecas,
        concluido: terminouAgora,
        atualizado_em: new Date().toISOString(),
      })
      .eq("partida_id", partidaId);

    if (error) {
      console.error(error);
      setErro("não consegui encaixar essa peça.");
    } else {
      setPecasColocadas(novasPecas);
      setPecaSelecionada(null);
    }

    setSalvando(false);
  }

  async function abrirTexto() {
    if (!ehGiovanna || !terminou || salvando) {
      return;
    }

    setSalvando(true);
    setErro("");

    const { error } = await supabase
      .from("final_jogo")
      .update({
        texto_aberto: true,
        atualizado_em: new Date().toISOString(),
      })
      .eq("partida_id", partidaId);

    if (error) {
      console.error(error);
      setErro("não consegui abrir a última parte.");
    } else {
      setTextoAberto(true);
    }

    setSalvando(false);
  }

  function estiloPeca(numero) {
    const indice = numero - 1;

    const coluna = indice % 3;
    const linha = Math.floor(indice / 3);

    return {
      backgroundImage: 'url("/final/foto.jpg")',
      backgroundSize: "300% 300%",
      backgroundPosition: `${coluna * 50}% ${linha * 50}%`,
    };
  }

  if (carregando) {
    return (
      <main className="pagina-final">
        <section className="final-carregando">
          <span>uma última coisa</span>

          <h1>
            preparando
            <br />
            o final...
          </h1>
        </section>
      </main>
    );
  }

  if (textoAberto) {
    return (
      <main className="pagina-final pagina-texto-aberto">
        <section className="final-texto">
          <div className="final-texto-foto">
            <div className="foto-final-wrapper">
              <img
                src="/final/foto.jpg"
                alt="Kauã e Giovanna"
              />
            </div>
          </div>

          <div className="final-texto-conteudo">
            <span className="final-etiqueta final-animacao etiqueta-animacao">
              pra você
            </span>

            <h1 className="final-animacao titulo-animacao">
              oi minha
              <br />
              princesa,
            </h1>

            <div className="texto-do-kaua">
              <p className="paragrafo-final paragrafo-1">
                eu sei q essa semana vc leu tantos textos meus e deve
                pensar “meu deus eu não aguento mais”, mas essa semana
                eu tô inspirado pra escrever pra vc kkkkk, então pfv
                aguente mais um cadin.
              </p>

              <p className="paragrafo-final paragrafo-2">
                então, eu queria falar que amo esses momentos que a
                gente joga alguma coisa que eu inventei do nada e passa
                o tempo lembrando das coisas, é mt massa isso. eu amo
                poder ver vc rindo das minhas respostas, ou da gente
                tentando jogar enquanto chora junto pq eu tô lendo um
                texto e tentando entender o pq de eu estar chorando e
                rindo ao mesmo tempo.
              </p>

              <p className="paragrafo-final paragrafo-3">
                mas momo, eu jamais me canso de querer fazer as coisas
                por nois. eu amo mt vc, Giovanna. quando vc falou que
                não existe outra pessoa no mundo que me ame igual vc,
                foi a maior verdade já dita em toda face da terra. meus
                planos, meu futuro, meu tudo, é somente com vc ao meu
                lado.
              </p>

              <p className="paragrafo-final paragrafo-4">
                pode se passar 10, 20, 30 anos que eu sempre vou
                continuar falando: eu amo você, Giovanna. amo passar
                meu tempo livre com você, amo rir com vc, amo chorar
                com vc e, principalmente, amo fazer as coisas com vc.
              </p>

              <p className="paragrafo-final paragrafo-5">
                provavelmente quando estivermos juntos eu vou estar
                falando algumas palavras repetidas do meu outro texto
                com as cartas véias kkkkk, mas eu não me canso de falar
                sempre essas mesmas coisas pra você, porque é a pura
                verdade do quão importante oce é pra mim. oce sempre
                vai ser minha luz, minha casa e minha família.
              </p>

              <p className="paragrafo-final paragrafo-6">
                Giovanna Pimentel Pereira, você é a mulher mais linda,
                mais inteligente e mais forte desse mundo. e obrigado
                por me escolher pra ser seu parceiro eternamente.
              </p>
            </div>

            <div className="final-fechamento">
              <span>eu te amo, momo.</span>
              <small>Kauã</small>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pagina-final">
      <section className="final-quebracabeca">
        <header className="final-topo">
          <div>
            <span className="final-etiqueta">
              uma última coisa
            </span>

            <h1>
              {ehGiovanna
                ? "junta pra mim?"
                : "agora é com ela."}
            </h1>
          </div>

          <div className="final-progresso">
            <strong>
              {String(pecasColocadas.length).padStart(2, "0")}
            </strong>

            <span>/ 09</span>
          </div>
        </header>

        <p className="final-instrucao">
          {ehGiovanna
            ? terminou
              ? "acho que agora ficou completo."
              : "escolhe uma peça e tenta descobrir onde ela se encaixa."
            : terminou
              ? "ela terminou."
              : "Giovanna está montando. você só precisa assistir."}
        </p>

        <div
          className={`area-quebracabeca ${
            !ehGiovanna ? "modo-espectador" : ""
          }`}
        >
          <div className="tabuleiro-final">
            {Array.from(
              { length: TOTAL_PECAS },
              (_, index) => {
                const numero = index + 1;

                const colocada =
                  pecasColocadas.includes(numero);

                return (
                  <button
                    type="button"
                    key={numero}
                    className={`espaco-peca ${
                      colocada
                        ? "espaco-preenchido"
                        : ""
                    }`}
                    onClick={() => encaixarPeca(numero)}
                    disabled={
                      !ehGiovanna ||
                      colocada ||
                      terminou
                    }
                  >
                    {colocada && (
                      <span
                        className="imagem-peca encaixada"
                        style={estiloPeca(numero)}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>

          {!terminou && (
            <div className="banco-pecas">
              <div className="banco-topo">
                <span>
                  {ehGiovanna
                    ? "peças"
                    : "peças restantes"}
                </span>

                <strong>
                  {TOTAL_PECAS -
                    pecasColocadas.length}
                </strong>
              </div>

              <div className="pecas-disponiveis">
                {ordemPecas.map((numero) => {
                  if (
                    pecasColocadas.includes(numero)
                  ) {
                    return null;
                  }

                  return (
                    <button
                      type="button"
                      key={numero}
                      className={`peca-solta ${
                        pecaSelecionada === numero
                          ? "peca-selecionada"
                          : ""
                      }`}
                      onClick={() => {
                        if (!ehGiovanna) return;

                        setPecaSelecionada(
                          pecaSelecionada === numero
                            ? null
                            : numero
                        );
                      }}
                      disabled={!ehGiovanna}
                    >
                      <span
                        className="imagem-peca"
                        style={estiloPeca(numero)}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {pecaSelecionada !== null &&
          ehGiovanna &&
          !terminou && (
            <p className="peca-escolhida">
              peça selecionada. agora tenta encaixar.
            </p>
          )}

        {erro && (
          <p className="final-erro">
            {erro}
          </p>
        )}

        {terminou && (
          <div className="final-revelacao">
            <span>completo</span>

            <h2>era isso.</h2>

            {ehGiovanna ? (
              <button
                type="button"
                onClick={abrirTexto}
                disabled={salvando}
              >
                abrir →
              </button>
            ) : (
              <p>
                esperando Giovanna abrir a última
                parte...
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Final;