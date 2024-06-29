import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserService {
  private users: User[] = [];

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  private isValidCpfFormat(cpf: string): boolean {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
    return cpfRegex.test(cpf);
  }

  private isValidCpfDigits(cpf: string): boolean {
    const cpfWithoutDots = cpf.replace(/[^\d]+/g, '');
    if (cpfWithoutDots.length !== 11) return false;

    const invalidCpfs = [
      '00000000000', '11111111111', '22222222222', '33333333333', '44444444444',
      '55555555555', '66666666666', '77777777777', '88888888888', '99999999999'
    ];

    if (invalidCpfs.includes(cpfWithoutDots)) return false;

    const calculateCpfDigit = (base: string, length: number): number => {
      let sum = 0;
      for (let i = 1; i <= length; i++) {
        sum += parseInt(base.substring(i - 1, i)) * (length + 2 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      return remainder;
    };

    const firstDigit = calculateCpfDigit(cpfWithoutDots, 9);
    const secondDigit = calculateCpfDigit(cpfWithoutDots, 10);

    return firstDigit === parseInt(cpfWithoutDots[9]) && secondDigit === parseInt(cpfWithoutDots[10]);
  }

  private isEmailInUse(email: string): boolean {
    return this.users.some(user => user.email === email);
  }

  private isCpfInUse(cpf: string): boolean {
    return this.users.some(user => user.cpf === cpf);
  }

  private validateUserData(email: string, password: string, superPassword: string | undefined, cpf: string) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('Invalid password');
    }

    if (superPassword && !this.isValidPassword(superPassword)) {
      throw new Error('Invalid super password');
    }

    if (this.isEmailInUse(email)) {
      throw new Error('Email already in use');
    }

    if (this.isCpfInUse(cpf)) {
      throw new Error('CPF already in use');
    }

    if (!this.isValidCpfFormat(cpf) || !this.isValidCpfDigits(cpf)) {
      throw new Error('Invalid CPF');
    }
  }

  createUser(
    name: string,
    email: string,
    password: string,
    cpf: string,
    userType: 'customer' | 'manager' | 'admin',
    superPassword?: string,
  ): User {
    this.validateUserData(email, password, superPassword, cpf);

    const userCode = `${Date.now().toString()}${this.users.length}`;
    const user = new User(
      name,
      email,
      password,
      cpf,
      userType,
      userCode,
      `${this.users.length + 1}`,
      superPassword,
    );

    this.users.push(user);
    return user;
  }

  updateUser(
    id: string,
    name: string,
    email: string,
    password: string,
    cpf: string,
    userType: 'customer' | 'manager' | 'admin',
    superPassword?: string,
  ): User {
    this.validateUserData(email, password, superPassword, cpf);

    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new Error('User not found');
    }

    user.name = name;
    user.email = email;
    user.password = password;
    user.cpf = cpf;
    user.userType = userType;
    if (superPassword) {
      user.superPassword = superPassword;
    }

    return user;
  }

  deleteUser(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }

  getUserById(id: string): User {
    const user = this.users.find((user) => user.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  listUsers(): User[] {
    return this.users;
  }
}
