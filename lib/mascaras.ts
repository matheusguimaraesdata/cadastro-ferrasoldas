/** Formatação em tempo real dos campos. Máscara não valida nada — só apresenta. */

export function mascararCpfOuCnpj(entrada: string): string {
  const limpo = entrada.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
  const pareceCpf = limpo.length <= 11 && /^\d*$/.test(limpo);

  if (pareceCpf) {
    return limpo
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  }

  // CNPJ: 12 posições alfanuméricas + 2 dígitos verificadores.
  return limpo
    .replace(/^(.{2})(.)/, '$1.$2')
    .replace(/^(.{2})\.(.{3})(.)/, '$1.$2.$3')
    .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, '$1.$2.$3/$4')
    .replace(/^(.{2})\.(.{3})\.(.{3})\/(.{4})(.)/, '$1.$2.$3/$4-$5');
}

export function mascararTelefone(entrada: string): string {
  const n = entrada.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n.replace(/^(\d{0,2})/, '($1');
  if (n.length <= 6) return n.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
  if (n.length <= 10) return n.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return n.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export function mascararCep(entrada: string): string {
  const n = entrada.replace(/\D/g, '').slice(0, 8);
  return n.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function mascararMoeda(entrada: string): string {
  const centavos = entrada.replace(/\D/g, '').slice(0, 12);
  if (!centavos) return '';
  const valor = Number(centavos) / 100;
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function mascararEstado(entrada: string): string {
  return entrada.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2);
}
