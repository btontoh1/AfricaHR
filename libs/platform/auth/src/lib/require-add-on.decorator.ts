import { SetMetadata } from '@nestjs/common';
import { AddOnModule } from '@prisma/client';

export const ADD_ON_METADATA_KEY = 'requiredAddOn';

export const RequireAddOn = (addOn: AddOnModule) => SetMetadata(ADD_ON_METADATA_KEY, addOn);
