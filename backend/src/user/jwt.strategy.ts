import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: '87f0ff6df87bee9fc5f2bc480668d1ee',
    });
  }

  async validate(payload: any) {
   
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}