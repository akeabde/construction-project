// Extraire un message clair depuis un objet erreur JS.
export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

// Formater un nombre en prix MAD.
export const formatPriceMad = (value: number) => `${value.toFixed(2)} MAD`;
