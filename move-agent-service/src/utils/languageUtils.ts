/**
 * Utilidades para el manejo de idiomas y traducciones
 */

// Tipos de idiomas soportados
export type SupportedLanguage = 'es' | 'en';

// Diccionario de instrucciones de idioma para el modelo
export const languageInstructions: Record<SupportedLanguage, string> = {
  'es': 'DEBES responder en español.',
  'en': 'YOU MUST respond in English.'
};

// Nombres de los idiomas en español
export const languageNames: Record<SupportedLanguage, string> = {
  'es': 'español',
  'en': 'inglés'
};

// Mensajes de error y notificaciones en diferentes idiomas
export const errorMessages: Record<string, Record<SupportedLanguage, string>> = {
  'insufficientFunds': {
    'es': 'No tienes suficientes fondos para enviar {amount} {currency} ({amountInApt} APT). Tu balance actual es {balance} APT.',
    'en': 'You don\'t have enough funds to send {amount} {currency} ({amountInApt} APT). Your current balance is {balance} APT.'
  },
  'walletRequired': {
    'es': 'Para realizar transferencias, necesito que te conectes con tu wallet. Por favor, conecta tu wallet e intenta nuevamente.',
    'en': 'To make transfers, I need you to connect your wallet. Please connect your wallet and try again.'
  },
  'balanceRequired': {
    'es': 'Para consultar tu balance, necesito que te conectes con tu wallet. Por favor, conecta tu wallet e intenta nuevamente.',
    'en': 'To check your balance, I need you to connect your wallet. Please connect your wallet and try again.'
  },
  'transferError': {
    'es': 'No pude completar la transferencia: {message}',
    'en': 'I couldn\'t complete the transfer: {message}'
  },
  'generalError': {
    'es': 'Ocurrió un error al procesar tu solicitud: {message}',
    'en': 'An error occurred while processing your request: {message}'
  },
  'balanceError': {
    'es': 'Ocurrió un error al consultar tu balance: {message}',
    'en': 'An error occurred while checking your balance: {message}'
  },
  'transferSuccess': {
    'es': 'Transacción exitosa! He enviado {amount} {currency} a {recipient}.\n\nHash de la transacción: {txHash}\n\nLa transacción ha sido registrada en la blockchain.',
    'en': 'Transaction successful! I\'ve sent {amount} {currency} to {recipient}.\n\nTransaction hash: {txHash}\n\nThe transaction has been recorded on the blockchain.'
  }
};

/**
 * Obtiene la instrucción de idioma para el modelo
 * @param langCode Código de idioma
 * @returns Instrucción para el modelo
 */
export function getLanguageInstruction(langCode: SupportedLanguage | string): string {
  return (languageInstructions[langCode as SupportedLanguage] || 
    `YOU MUST respond in the same language as the user (${langCode}).`);
}

/**
 * Obtiene el nombre del idioma en español
 * @param langCode Código de idioma
 * @returns Nombre del idioma
 */
export function getLanguageName(langCode: SupportedLanguage | string): string {
  return (languageNames[langCode as SupportedLanguage] || langCode);
}

/**
 * Obtiene un mensaje traducido con variables reemplazadas
 * @param key Clave del mensaje
 * @param langCode Código de idioma
 * @param variables Variables a reemplazar
 * @returns Mensaje traducido
 */
export function getTranslatedMessage(
  key: string, 
  langCode: SupportedLanguage | string, 
  variables: Record<string, string | number> = {}
): string {
  // Obtener el mensaje para el idioma especificado o inglés como fallback
  const messageTemplate = errorMessages[key]?.[langCode as SupportedLanguage] || 
                         errorMessages[key]?.['en'] || 
                         `Message not found: ${key}`;
  
  // Reemplazar variables en el mensaje
  return Object.entries(variables).reduce(
    (message, [varName, varValue]) => {
      return message.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(varValue));
    }, 
    messageTemplate
  );
}