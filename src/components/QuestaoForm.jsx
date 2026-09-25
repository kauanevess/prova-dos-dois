function QuestaoForm({ questao, onChange }) {
  function alterar(campo, valor) {
    onChange({
      ...questao,
      [campo]: valor,
    });
  }

  function selecionarTipo(tipo) {
    onChange({
      ...questao,
      tipo,
      alternativas:
        questao.alternativas?.length >= 2
          ? questao.alternativas
          : ["", "", "", ""],
    });
  }

  function alterarAlternativa(index, valor) {
    const novasAlternativas = [...questao.alternativas];
    novasAlternativas[index] = valor;

    alterar("alternativas", novasAlternativas);
  }

  function adicionarAlternativa() {
    if (questao.alternativas.length >= 5) return;

    alterar("alternativas", [...questao.alternativas, ""]);
  }

  function removerAlternativa(index) {
    if (questao.alternativas.length <= 2) return;

    const novasAlternativas = questao.alternativas.filter(
      (_, i) => i !== index
    );

    alterar("alternativas", novasAlternativas);
  }

  return (
    <div className="questao-form">
      <div className="bloco-form">
        <label className="campo-label">pergunta</label>

        <textarea
          className="campo-pergunta"
          placeholder="escreva sua pergunta..."
          value={questao.pergunta}
          onChange={(e) => alterar("pergunta", e.target.value)}
          maxLength={300}
        />

        <span className="contador-caracteres">
          {questao.pergunta.length}/300
        </span>
      </div>

      <div className="separador" />

      <div className="bloco-form">
        <label className="campo-label">tipo da questão</label>

        <p className="ajuda-campo">
          escolha como essa pergunta deverá ser respondida.
        </p>

        <div className="tipos-resposta">
          <button
            type="button"
            className={
              questao.tipo === "multipla"
                ? "tipo ativo"
                : "tipo"
            }
            onClick={() => selecionarTipo("multipla")}
          >
            <span className="tipo-icone">A B C</span>

            <span className="tipo-texto">
              <strong>múltipla escolha</strong>
              <small>escolha entre alternativas</small>
            </span>
          </button>

          <button
            type="button"
            className={
              questao.tipo === "vf"
                ? "tipo ativo"
                : "tipo"
            }
            onClick={() => selecionarTipo("vf")}
          >
            <span className="tipo-icone">V F</span>

            <span className="tipo-texto">
              <strong>verdadeiro ou falso</strong>
              <small>duas possibilidades</small>
            </span>
          </button>

          <button
            type="button"
            className={
              questao.tipo === "aberta"
                ? "tipo ativo"
                : "tipo"
            }
            onClick={() => selecionarTipo("aberta")}
          >
            <span className="tipo-icone">✎</span>

            <span className="tipo-texto">
              <strong>aberta</strong>
              <small>resposta escrita livremente</small>
            </span>
          </button>
        </div>
      </div>

      {questao.tipo === "multipla" && (
        <div className="configuracao-resposta">
          <div className="configuracao-topo">
            <div>
              <span className="campo-label">alternativas</span>

              <p className="ajuda-campo">
                escreva as opções que vão aparecer na prova.
              </p>
            </div>

            <span className="quantidade-alternativas">
              {questao.alternativas.length}/5
            </span>
          </div>

          <div className="lista-alternativas">
            {questao.alternativas.map((alternativa, index) => (
              <div className="alternativa" key={index}>
                <span className="alternativa-letra">
                  {String.fromCharCode(65 + index)}
                </span>

                <input
                  type="text"
                  placeholder={`alternativa ${String.fromCharCode(
                    65 + index
                  )}`}
                  value={alternativa}
                  onChange={(e) =>
                    alterarAlternativa(index, e.target.value)
                  }
                />

                {questao.alternativas.length > 2 && (
                  <button
                    type="button"
                    className="remover-alternativa"
                    onClick={() => removerAlternativa(index)}
                    title="remover alternativa"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {questao.alternativas.length < 5 && (
            <button
              type="button"
              className="adicionar-alternativa"
              onClick={adicionarAlternativa}
            >
              + adicionar alternativa
            </button>
          )}
        </div>
      )}

      {questao.tipo === "vf" && (
        <div className="configuracao-resposta">
          <div className="aviso-aberta">
            <span className="aviso-simbolo">V/F</span>

            <div>
              <strong>verdadeiro ou falso</strong>

              <p>
                quem responder poderá escolher entre verdadeiro
                ou falso. vocês decidem se acertou durante a
                correção.
              </p>
            </div>
          </div>
        </div>
      )}

      {questao.tipo === "aberta" && (
        <div className="configuracao-resposta">
          <div className="aviso-aberta">
            <span className="aviso-simbolo">✎</span>

            <div>
              <strong>resposta livre</strong>

              <p>
                quem responder poderá escrever livremente. depois,
                durante a correção, você decide se a resposta vale
                o ponto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestaoForm;