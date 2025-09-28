// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return formatTime(dateString);
  } else if (diffInHours < 48) {
    return 'Yesterday ' + formatTime(dateString);
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

export function validateAge(age: number): boolean {
  return age >= 6 && age <= 18;
}

export function validateGrade(grade: number): boolean {
  return grade >= 6 && grade <= 12;
}

export function validateEducationBoard(board: string): boolean {
  const validBoards = ['CBSE', 'ICSE', 'IB', 'STATE_BOARD', 'OTHER'];
  return validBoards.includes(board);
}

export function generateTempId(): string {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}