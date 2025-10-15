import { JwtPayload } from "../core/auth/auth.types";  

declare global {
  namespace Fastify {
    interface Request {
      user?: JwtPayload;  
    }
  }
}
