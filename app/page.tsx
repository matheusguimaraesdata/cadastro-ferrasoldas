import Image from 'next/image';

import FormularioCadastro from '@/components/FormularioCadastro';

export default function PaginaCadastro() {
  return (
    <main className="pagina">
      <header className="cabecalho">
        <div className="logo-ferrasoldas">
          <Image
            src="/logo-ferrasoldas.png"
            alt="Ferrasoldas Comércio e Representações Ltda."
            className="logo-ferrasoldas__imagem"
            width={240}
            height={80}
            priority
          />
        </div>

        <h1>Cadastro de Cliente</h1>

        <p>
          Preencha os dados abaixo para abertura do cadastro comercial. As
          informações serão encaminhadas ao setor financeiro da Ferrasoldas.
        </p>
      </header>

      <FormularioCadastro />
    </main>
  );
}