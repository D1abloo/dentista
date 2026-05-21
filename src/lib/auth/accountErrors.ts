export class AccountNotActivatedError extends Error {
  constructor() {
    super('Activa tu cuenta desde el enlace del correo antes de iniciar sesión.');
    this.name = 'AccountNotActivatedError';
  }
}
