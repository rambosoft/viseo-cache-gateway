import type { AccessContext } from "../../core/access/models";

export interface PrimaryServerPort {
  validateToken(token: string): Promise<AccessContext>;
}
