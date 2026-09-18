import FormularioCadastro from '@/components/FormularioCadastro';

export default function PaginaCadastro() {
  return (
    <main className="pagina">
      <header className="cabecalho">
        <p className="cabecalho__marca">Ferrasoldas</p>
        <h1 className="cabecalho__titulo">Cadastro de cliente</h1>
        <p className="cabecalho__descricao">
          Preencha os dados abaixo para abrir seu cadastro com CNPJ ou CPF. O
          financeiro recebe o formulário assim que você enviar.
        </p>
      </header>
      <FormularioCadastro />
    </main>
  );
}
