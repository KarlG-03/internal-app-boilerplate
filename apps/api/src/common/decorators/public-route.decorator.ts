import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../metadata';

export const PublicRoute = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(IS_PUBLIC_KEY, true);
