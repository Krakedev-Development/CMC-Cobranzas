/**
 * Validador oficial del algoritmo del Registro Civil Ecuatoriano (Módulo 10)
 * para cédulas de identidad de personas naturales.
 */

export interface CedulaValidationResult {
  isValid: boolean;
  province?: string;
  error?: string;
}

export const ECUADOR_PROVINCES: Record<string, string> = {
  '01': 'Azuay',
  '02': 'Bolívar',
  '03': 'Cañar',
  '04': 'Carchi',
  '05': 'Cotopaxi',
  '06': 'Chimborazo',
  '07': 'El Oro',
  '08': 'Esmeraldas',
  '09': 'Guayas',
  '10': 'Imbabura',
  '11': 'Loja',
  '12': 'Los Ríos',
  '13': 'Manabí',
  '14': 'Morona Santiago',
  '15': 'Napo',
  '16': 'Pastaza',
  '17': 'Pichincha',
  '18': 'Tungurahua',
  '19': 'Zamora Chinchipe',
  '20': 'Galápagos',
  '21': 'Sucumbíos',
  '22': 'Orellana',
  '23': 'Santo Domingo de los Tsáchilas',
  '24': 'Santa Elena',
  '30': 'Ecuatorianos en el Exterior',
};

export function validateEcuadorianCedula(cedulaInput: string): CedulaValidationResult {
  const cedula = (cedulaInput || '').trim();

  if (!/^\d{10}$/.test(cedula)) {
    return {
      isValid: false,
      error: 'La cédula debe contener exactamente 10 dígitos numéricos.',
    };
  }

  const provinceCode = cedula.substring(0, 2);
  const province = ECUADOR_PROVINCES[provinceCode];
  if (!province) {
    return {
      isValid: false,
      error: `Código de provincia inválido (${provinceCode}). Debe estar entre 01 y 24.`,
    };
  }

  const thirdDigit = parseInt(cedula.charAt(2), 10);
  if (thirdDigit >= 6) {
    return {
      isValid: false,
      province,
      error: 'El tercer dígito debe ser menor a 6 para personas naturales.',
    };
  }

  const digits = cedula.split('').map((d) => parseInt(d, 10));
  const verifier = digits[9];
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let product = digits[i] * coefficients[i];
    if (product >= 10) product -= 9;
    sum += product;
  }

  const calculatedVerifier = (10 - (sum % 10)) % 10;

  if (calculatedVerifier !== verifier) {
    return {
      isValid: false,
      province,
      error: 'Dígito verificador incorrecto (no coincide con el algoritmo del Registro Civil).',
    };
  }

  return {
    isValid: true,
    province,
  };
}

export function validateEcuadorianPhone(phoneInput: string): { isValid: boolean; error?: string } {
  const clean = (phoneInput || '').replace(/\D/g, '');
  if (!clean) return { isValid: true };
  if (!/^09\d{8}$/.test(clean)) {
    return {
      isValid: false,
      error: 'El número móvil debe iniciar con 09 y tener 10 dígitos (ej: 0991234567).',
    };
  }
  return { isValid: true };
}
