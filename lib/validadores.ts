/**
 * Validação de documentos brasileiros por dígito verificador.
 *
 * O CNPJ segue o formato alfanumérico vigente desde julho de 2026
 * (IN RFB 2.229/2024): as 12 primeiras posições aceitam 0-9 e A-Z,
 * as 2 últimas continuam numéricas. O valor de cada caractere no
 * módulo 11 é `ASCII(c) - 48`, o que mantém 0-9 com seus próprios
 * valores e torna o algoritmo retrocompatível com todo CNPJ antigo.
 */

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

const valorCaractere = (c: string): number => c.charCodeAt(0) - 48;

function digitoModulo11(base: string, pesos: readonly number[]): number {
  const soma = base
    .split('')
    .reduce((acc, c, i) => acc + valorCaractere(c) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function limparDocumento(entrada: string): string {
  return entrada.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function validarCnpj(entrada: string): boolean {
  const limpo = limparDocumento(entrada);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(limpo)) return false;
  // Sequências de um caractere só passam no módulo 11 mas não existem na Receita.
  if (/^(.)\1{13}$/.test(limpo)) return false;

  return (
    limpo[12] === String(digitoModulo11(limpo.slice(0, 12), PESOS_DV1)) &&
    limpo[13] === String(digitoModulo11(limpo.slice(0, 13), PESOS_DV2))
  );
}

export function validarCpf(entrada: string): boolean {
  const limpo = entrada.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  const calcular = (quantidade: number): number => {
    let soma = 0;
    for (let i = 0; i < quantidade; i++) {
      soma += Number(limpo[i]) * (quantidade + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return calcular(9) === Number(limpo[9]) && calcular(10) === Number(limpo[10]);
}

/** Aceita CPF (11 dígitos) ou CNPJ (14 posições alfanuméricas). */
export function validarCpfOuCnpj(entrada: string): boolean {
  const limpo = limparDocumento(entrada);
  if (limpo.length === 11) return validarCpf(limpo);
  if (limpo.length === 14) return validarCnpj(limpo);
  return false;
}

export function tipoDocumento(entrada: string): 'CPF' | 'CNPJ' | null {
  const limpo = limparDocumento(entrada);
  if (limpo.length === 11 && validarCpf(limpo)) return 'CPF';
  if (limpo.length === 14 && validarCnpj(limpo)) return 'CNPJ';
  return null;
}

/** Aceita fixo com DDD (10 dígitos) ou celular com DDD (11 dígitos). */
export function validarTelefone(entrada: string): boolean {
  const numeros = entrada.replace(/\D/g, '');
  if (numeros.length !== 10 && numeros.length !== 11) return false;
  const ddd = Number(numeros.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (numeros.length === 11 && numeros[2] !== '9') return false;
  return true;
}

export function validarCep(entrada: string): boolean {
  return /^\d{8}$/.test(entrada.replace(/\D/g, ''));
}

/**
 * Conta quantas referências comerciais com telefone foram informadas.
 * Cada linha não vazia que contenha um número de contato com pelo
 * menos 10 dígitos conta como uma referência.
 */
export function contarReferenciasComTelefone(texto: string): number {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.length > 0)
    .filter((linha) => linha.replace(/\D/g, '').length >= 10).length;
}
