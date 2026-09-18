export default function Alerta({
  tipo = 'erro',
  children,
}: {
  tipo?: 'erro' | 'aviso';
  children: React.ReactNode;
}) {
  return (
    <p className={`alerta alerta--${tipo}`} role="alert">
      {children}
    </p>
  );
}
