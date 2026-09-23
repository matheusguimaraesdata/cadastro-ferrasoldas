export default function Botao({
  enviando,
  children,
}: {
  enviando: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="submit" className="botao" disabled={enviando}>
      {enviando ? 'Enviando…' : children}
    </button>
  );
}
