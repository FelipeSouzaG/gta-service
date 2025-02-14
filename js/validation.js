export function formatPhoneInput(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    e.target.value = value;
  });
}

export function formatPhoneValue(value) {
  value = value.replace(/\D/g, '');
  if (value.length > 10) {
    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (value.length > 6) {
    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  }
  return value;
}

export function validatePhone(phone) {
  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits.length === 10 || phoneDigits.length === 11;
}

const lowercasePrefixes = ['e', 'da', 'de', 'di', 'do', 'dos', 'du'];

export function formatName(name) {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (lowercasePrefixes.includes(word) && index !== 0) {
        return word;
      } else if (word.length > 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else if (word.length === 1) {
        return word.toUpperCase();
      } else {
        return '';
      }
    })
    .filter((word) => word !== '')
    .join(' ');
}

export function validateName(name) {
  const formattedName = name.trim();
  if (/\s{2,}/.test(formattedName)) {
    return false;
  }
  const words = formattedName.split(/\s+/);
  if (words.length < 2) {
    return false;
  }
  return words.every((word, index) => {
    const lowercaseWord = word.toLowerCase();
    if (/^(.)\1/.test(lowercaseWord)) {
      return false;
    }
    if (lowercasePrefixes.includes(lowercaseWord)) {
      return index !== words.length - 1;
    }
    if (/([a-z])\1{2,}/.test(lowercaseWord)) {
      return false;
    }
    return word.length >= 2;
  });
}

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return regex.test(email.trim());
}

export function validatePassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(
    password
  );
}

export function formatRegister(value) {
  value = value.replace(/\D/g, '');

  if (value.length <= 11) {
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }
  } else {
    if (value.length > 12) {
      value = value.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
        '$1.$2.$3/$4-$5'
      );
    } else if (value.length > 8) {
      value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    }
  }
  return value;
}

export function formatPostalCode(value) {
  // Remove todos os caracteres não numéricos
  value = value.replace(/\D/g, '');

  // Aplica o formato xx.xxx-xxx
  if (value.length > 5) {
    value = value.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2-$3');
  } else if (value.length > 2) {
    value = value.replace(/(\d{2})(\d{0,3})/, '$1.$2');
  }

  return value;
}

export const normalizeRegister = (value) => value.replace(/\D/g, '');

export const validateRegister = (v) => {
  const normalizedValue = normalizeRegister(v);
  const cpfRegex = /^\d{11}$/;
  const cnpjRegex = /^\d{14}$/;

  if (cpfRegex.test(normalizedValue)) return isValidCPF(normalizedValue);
  if (cnpjRegex.test(normalizedValue)) return isValidCNPJ(normalizedValue);
  return false;
};

const isValidCPF = (cpf) => {
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const numbers = cpf.split('').map(Number);
  const sum1 = numbers
    .slice(0, 9)
    .reduce((acc, num, i) => acc + num * (10 - i), 0);
  const sum2 = numbers
    .slice(0, 10)
    .reduce((acc, num, i) => acc + num * (11 - i), 0);

  const firstCheck = ((sum1 * 10) % 11) % 10;
  const secondCheck = ((sum2 * 10) % 11) % 10;

  return firstCheck === numbers[9] && secondCheck === numbers[10];
};

const isValidCNPJ = (cnpj) => {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const numbers = cnpj.split('').map(Number);
  const sum1 = numbers
    .slice(0, 12)
    .reduce(
      (acc, num, i) => acc + num * [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i],
      0
    );
  const sum2 = numbers
    .slice(0, 13)
    .reduce(
      (acc, num, i) => acc + num * [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2][i],
      0
    );

  const firstCheck = ((sum1 * 10) % 11) % 10;
  const secondCheck = ((sum2 * 10) % 11) % 10;

  return firstCheck === numbers[12] && secondCheck === numbers[13];
};

function validateField(inputElement, validateFn, formatFn) {
  const value = inputElement.value.trim();

  // Aplicar formatação se formatFn for fornecida
  if (formatFn) {
    inputElement.value = formatFn(value);
  }

  // Validar o valor
  const valid = validateFn(inputElement.value);

  // Atualizar as classes com base no resultado da validação
  if (valid) {
    inputElement.classList.add('valid');
    inputElement.classList.remove('invalid');
  } else {
    inputElement.classList.add('invalid');
    inputElement.classList.remove('valid');
  }

  // Se o campo estiver vazio, redefinir as classes
  if (value === '') {
    inputElement.classList.remove('valid');
    inputElement.classList.remove('invalid');
    inputElement.classList.add('form-group-input');
  }
}

// Adicionar ouvintes de evento genéricos
export function setupValidation(inputElement, validateFn, formatFn = null) {
  inputElement.addEventListener('input', () => {
    validateField(inputElement, validateFn, formatFn);
  });

  if (formatFn) {
    inputElement.addEventListener('input', (e) => {
      e.target.value = formatFn(e.target.value);
    });
  }
}

export const normalizeDate = (dateString) => {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (isNaN(date)) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};
