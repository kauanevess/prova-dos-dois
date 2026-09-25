function JogadorCard({ letra, nome, descricao, onClick }) {
  return (
    <button className="jogador-card" onClick={onClick}>
      <span className="jogador-letra">{letra}</span>

      <span className="jogador-info">
        <strong>{nome}</strong>
        <small>{descricao}</small>
      </span>

      <span className="jogador-seta">→</span>
    </button>
  );
}

export default JogadorCard;