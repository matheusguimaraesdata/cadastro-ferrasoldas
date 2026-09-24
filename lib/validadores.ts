const PESOS_DV1 = [
  5,
  4,
  3,
  2,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
];

const PESOS_DV2 = [
  6,
  5,
  4,
  3,
  2,
  9,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
];

const valorCaractere = (
  caractere: string,
): number =>
  caractere.charCodeAt(0) - 48;

function digitoModulo11(
  base: string,
  pesos: readonly number[],
): number {
  const soma = base
    .split('')
    .reduce(
      (acumulado, caractere, indice) =>
        acumulado +
        valorCaractere(caractere) *
          pesos[indice],
      0,
    );

  const resto = soma % 11;

  return resto < 2 ? 0 : 11 - resto;
}

export function limparDocumento(
  entrada: string,
): string {
  return entrada
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

export function validarCnpj(
  entrada: string,
): boolean {
  const limpo = limparDocumento(entrada);

  if (
    !/^[0-9A-Z]{12}[0-9]{2}$/.test(
      limpo,
    )
  ) {
    return false;
  }

  if (/^(.)\1{13}$/.test(limpo)) {
    return false;
  }

  const primeiroDigito =
    digitoModulo11(
      limpo.slice(0, 12),
      PESOS_DV1,
    );

  const segundoDigito =
    digitoModulo11(
      limpo.slice(0, 13),
      PESOS_DV2,
    );

  return (
    limpo[12] ===
      String(primeiroDigito) &&
    limpo[13] ===
      String(segundoDigito)
  );
}

export function validarCpf(
  entrada: string,
): boolean {
  const limpo = entrada.replace(
    /\D/g,
    '',
  );

  if (limpo.length !== 11) {
    return false;
  }

  if (/^(\d)\1{10}$/.test(limpo)) {
    return false;
  }

  const calcularDigito = (
    quantidade: number,
  ): number => {
    let soma = 0;

    for (
      let indice = 0;
      indice < quantidade;
      indice += 1
    ) {
      soma +=
        Number(limpo[indice]) *
        (quantidade + 1 - indice);
    }

    const resto = (soma * 10) % 11;

    return resto === 10 ? 0 : resto;
  };

  return (
    calcularDigito(9) ===
      Number(limpo[9]) &&
    calcularDigito(10) ===
      Number(limpo[10])
  );
}

export function validarCpfOuCnpj(
  entrada: string,
): boolean {
  const limpo = limparDocumento(entrada);

  if (limpo.length === 11) {
    return validarCpf(limpo);
  }

  if (limpo.length === 14) {
    return validarCnpj(limpo);
  }

  return false;
}

export function tipoDocumento(
  entrada: string,
): 'CPF' | 'CNPJ' | null {
  const limpo = limparDocumento(entrada);

  if (
    limpo.length === 11 &&
    validarCpf(limpo)
  ) {
    return 'CPF';
  }

  if (
    limpo.length === 14 &&
    validarCnpj(limpo)
  ) {
    return 'CNPJ';
  }

  return null;
}

export function validarTelefone(
  entrada: string,
): boolean {
  const numeros = entrada.replace(
    /\D/g,
    '',
  );

  if (
    numeros.length !== 10 &&
    numeros.length !== 11
  ) {
    return false;
  }

  const ddd = Number(
    numeros.slice(0, 2),
  );

  if (ddd < 11 || ddd > 99) {
    return false;
  }

  if (
    numeros.length === 11 &&
    numeros[2] !== '9'
  ) {
    return false;
  }

  return true;
}

export function validarCep(
  entrada: string,
): boolean {
  return /^\d{8}$/.test(
    entrada.replace(/\D/g, ''),
  );
}

export function contarReferenciasComTelefone(
  texto: string,
): number {
  return texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(
      (linha) => linha.length > 0,
    )
    .filter(
      (linha) =>
        linha.replace(/\D/g, '').length >=
        10,
    ).length;
}