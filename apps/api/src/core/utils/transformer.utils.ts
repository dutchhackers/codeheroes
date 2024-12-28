import { ClassConstructor, plainToInstance } from 'class-transformer';

export const transformTo = <T>(cls: ClassConstructor<T>, plain: any): T => {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  });
};

export const transformArrayTo = <T>(
  cls: ClassConstructor<T>,
  plain: any[]
): T[] => {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true,
    enableImplicitConversion: true,
  });
};
