import bcrypt from 'bcryptjs';

export const hashPin = async (pin: string): Promise<string> => {
  return bcrypt.hash(pin, 10);
};

export const verifyPin = async (pin: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(pin, hash);
};

export const validatePin = (pin: string): boolean => {
  return /^\d{4,6}$/.test(pin);
};

export const generateQRCode = (phoneId: string, imei: string): string => {
  return JSON.stringify({
    phoneId,
    imei,
    timestamp: Date.now()
  });
};
