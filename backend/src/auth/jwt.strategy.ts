import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Ce qu'on a mis dans le jeton lors de sa création (payload)
export interface JwtPayload {
  sub: string; // id de l'utilisateur
  telephone: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Lit le jeton depuis l'en-tête "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // rejette les jetons expirés
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // La valeur retournée ici est injectée dans req.user sur les routes protégées
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      telephone: payload.telephone,
      role: payload.role,
    };
  }
}