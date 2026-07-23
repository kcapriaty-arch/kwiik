import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard réutilisable : on l'appliquera avec @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}