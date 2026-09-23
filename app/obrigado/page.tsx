import Link from 'next/link';

export const metadata = { title: 'Cadastro enviado — Ferrasoldas' };

export default function PaginaObrigado() {
  return (
    <main className="pagina">
      <section className="confirmacao">
        <h1>Cadastro enviado</h1>
        <p>
          O financeiro da Ferrasoldas recebeu seus dados e vai entrar em contato
          pelo e-mail que você informou.
        </p>
        <p>
          Precisa corrigir alguma informação?{' '}
          <Link href="/">Preencher o formulário de novo</Link>.
        </p>
      </section>
    </main>
  );
}
